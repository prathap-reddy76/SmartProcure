"use server";

import crypto from "crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";
import { SessionUser } from "@/types/auth";
import { revalidatePath } from "next/cache";

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type AdminUserStats = {
  total: number;
  active: number;
  inactive: number;
  farmers: number;
  shopOwners: number;
  deliveryPartners: number;
  machineryOwners: number;
  procurementOfficers: number;
  admins: number;
};

export async function getAdminUserStats(): Promise<{ stats: AdminUserStats | null; error?: string }> {
  try {
    await requireRole("ADMIN");

    const [
      total,
      active,
      inactive,
      farmers,
      shopOwners,
      deliveryPartners,
      machineryOwners,
      procurementOfficers,
      admins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: "FARMER" } }),
      prisma.user.count({ where: { role: "SHOP_OWNER" } }),
      prisma.user.count({ where: { role: "DELIVERY_PARTNER" } }),
      prisma.user.count({ where: { role: "MACHINERY_OWNER" } }),
      prisma.user.count({ where: { role: "PROCUREMENT_OFFICER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

    return {
      stats: { total, active, inactive, farmers, shopOwners, deliveryPartners, machineryOwners, procurementOfficers, admins }
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin user stats:", error);
    return { stats: null, error: "Failed to fetch user statistics" };
  }
}

interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  activeStatus?: string;
  sortBy?: "newest" | "oldest" | "name_asc" | "name_desc" | "email_asc";
}

export async function getAdminUsers(params: GetAdminUsersParams) {
  try {
    await requireRole("ADMIN");

    const {
      page = 1,
      limit = 20,
      search,
      role,
      activeStatus,
      sortBy = "newest",
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role as Role;
    if (activeStatus === "active") where.isActive = true;
    else if (activeStatus === "inactive") where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    switch (sortBy) {
      case "oldest": orderBy = { createdAt: "asc" }; break;
      case "name_asc": orderBy = { name: "asc" }; break;
      case "name_desc": orderBy = { name: "desc" }; break;
      case "email_asc": orderBy = { email: "asc" }; break;
    }

    const [rawUsers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const users: AdminUserSummary[] = rawUsers.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      users,
      totalCount,
      pageCount: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin users:", error);
    return { users: [], totalCount: 0, pageCount: 0, error: "Failed to fetch users" };
  }
}

export async function getAdminUserDetail(userId: string) {
  try {
    await requireRole("ADMIN");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            ownedMachinery: true,
            machineryBookings: true, // farmer booked machinery
            receivedBookings: true, // machinery owner received bookings
            procurementBookings: true,
            weighingOperations: true,
            qualityInspections: true,
            paymentTransactions: true,
          }
        },
        shop: { select: { id: true, name: true, shopType: true } },
        deliveryPartner: { select: { id: true, vehicleType: true, vehicleNumber: true } },
        farmerProfile: { select: { id: true, village: true, district: true, state: true } },
        procurementCentre: { select: { id: true, name: true } },
      }
    });

    if (!user) return { user: null, error: "User not found" };

    return { user };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error fetching admin user detail:", error);
    return { user: null, error: "Failed to load user details" };
  }
}

export async function toggleUserStatus(userId: string, newStatus: boolean) {
  try {
    const session = await requireRole("ADMIN");
    const adminUser = session.user as SessionUser;

    if (adminUser.id === userId) {
      return { error: "You cannot deactivate your own admin account." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true }
    });

    if (!targetUser) return { error: "User not found" };

    if (targetUser.role === "ADMIN" && !newStatus) {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return { error: "Cannot deactivate the last active administrator." };
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: newStatus }
      });

      const partner = await tx.deliveryPartner.findUnique({ where: { userId } });
      if (partner) {
        await tx.deliveryPartner.update({
          where: { userId },
          data: { isActive: newStatus }
        });
      }

      await tx.auditLog.create({
        data: {
          action: newStatus ? "ADMIN_USER_ACTIVATED" : "ADMIN_USER_DEACTIVATED",
          actorUserId: adminUser.id,
          actorRole: adminUser.role,
          entityType: "USER",
          entityId: userId,
          metadata: { previousStatus: targetUser.isActive, newStatus }
        }
      });
    });

    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error toggling user status:", error);
    return { error: "Failed to update user status" };
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const session = await requireRole("ADMIN");
    const adminUser = session.user as SessionUser;

    if (adminUser.id === userId) {
      return { error: "You cannot change your own role. Ask another admin." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shop: true,
        deliveryPartner: true,
        _count: {
          select: {
            ownedMachinery: true,
            qualityInspections: true,
            weighingOperations: true,
            orders: true
          }
        }
      }
    });

    if (!targetUser) return { error: "User not found" };

    if (targetUser.role === newRole) {
      return { success: true }; // No change needed
    }

    // Safety constraints to prevent orphaning relationships
    if (targetUser.role === "SHOP_OWNER" && targetUser.shop) {
      return { error: "Cannot change role: User owns an active Shop. The shop must be handled first." };
    }

    if (targetUser.role === "DELIVERY_PARTNER" && targetUser.deliveryPartner) {
      return { error: "Cannot change role: User is registered as a Delivery Partner with vehicle data." };
    }

    if (targetUser.role === "MACHINERY_OWNER" && targetUser._count.ownedMachinery > 0) {
      return { error: "Cannot change role: User has registered Machinery listings." };
    }

    if (targetUser.role === "PROCUREMENT_OFFICER" && (targetUser._count.qualityInspections > 0 || targetUser._count.weighingOperations > 0)) {
      return { error: "Cannot change role: User has existing procurement operations linked to their ID." };
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return { error: "Cannot remove the last active administrator." };
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole }
      });

      await tx.auditLog.create({
        data: {
          action: "ADMIN_USER_ROLE_CHANGED",
          actorUserId: adminUser.id,
          actorRole: adminUser.role,
          entityType: "USER",
          entityId: userId,
          metadata: { previousRole: targetUser.role, newRole }
        }
      });
    });

    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }
}

import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "DELIVERY_PARTNER"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isActive: z.boolean().default(true),
});

export async function createAdminUser(data: z.infer<typeof createUserSchema>) {
  try {
    await requireRole("ADMIN");
    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input" };
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existingUser) {
      return { error: "A user with this email already exists." };
    }
    
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        passwordHash,
        isActive: parsed.data.isActive,
        ...(parsed.data.role === "DELIVERY_PARTNER" ? {
          deliveryPartner: {
            create: {
              phone: parsed.data.phone || null,
              isActive: parsed.data.isActive,
              isAvailable: false,
              maxActiveDeliveries: 3,
            }
          }
        } : {})
      }
    });
    
    revalidatePath("/admin/users");
    
    return { success: true, user: newUser };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error creating user:", error);
    return { error: "Failed to create user." };
  }
}


export async function adminResetUserPassword(
  userId: string,
  newPassword?: string
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const session = await requireRole("ADMIN");
    const adminUser = session.user as SessionUser;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) return { error: "User not found." };

    const passwordToSet = newPassword || crypto.randomBytes(12).toString("hex") + "Aa1!";
    const passwordHash = await bcrypt.hash(passwordToSet, 10);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      await tx.auditLog.create({
        data: {
          action: "ADMIN_PASSWORD_RESET",
          actorUserId: adminUser.id,
          actorRole: adminUser.role,
          entityType: "USER",
          entityId: userId,
          metadata: { targetEmail: targetUser.email },
        },
      });
    });

    return {
      success: true,
      message: "Password updated successfully.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error resetting password:", error);
    return { error: "Failed to reset password." };
  }
}
