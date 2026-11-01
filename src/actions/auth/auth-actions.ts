"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getDashboardForRole } from "@/lib/auth-utils";

export interface PostLoginResult {
  redirectUrl: string;
  role: string;
  error?: string;
}

export async function getPostLoginRedirect(): Promise<PostLoginResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      redirectUrl: "/login?error=SessionExpired",
      role: "",
      error: "No active authenticated session found.",
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser) {
    return {
      redirectUrl: "/login?error=SessionExpired",
      role: "",
      error: "User record not found.",
    };
  }

  if (!dbUser.isActive && dbUser.role !== "DELIVERY_PARTNER") {
    return {
      redirectUrl: "/login?error=AccountDeactivated",
      role: dbUser.role,
      error: "Account is inactive or suspended.",
    };
  }

  const redirectUrl = getDashboardForRole(dbUser.role);
  return {
    redirectUrl,
    role: dbUser.role,
  };
}

const registerSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(6, "Password does not meet the required format"),
});

export async function registerFarmer(_prevState: unknown, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      return { 
        error: parsed.error.issues[0].message,
      };
    }

    const { name, email, phone, password } = parsed.data;

    // Check for existing user by email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return { error: "An account with this email already exists." };
    }

    // Check for existing user by phone
    const existingPhone = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingPhone) {
      return { error: "An account with this phone number already exists." };
    }

    // Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User and FarmerProfile safely in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: "FARMER",
          isActive: true,
        },
      });

      await tx.farmerProfile.create({
        data: {
          userId: user.id,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred during registration. Please try again." };
  }
}
