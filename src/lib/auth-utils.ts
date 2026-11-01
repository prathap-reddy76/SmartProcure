import { auth } from "./auth";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types/auth";
import { prisma } from "./prisma";

export function normalizeRole(role?: string | null): string | null {
  if (!role) return null;
  const upper = role.toUpperCase().trim();
  if (upper === "PROCUREMENTS_OFFICER" || upper === "PROCUREMENT_OFFICER") {
    return "PROCUREMENT_OFFICER";
  }
  return upper;
}

export function getDashboardForRole(role?: string | null): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case "ADMIN":
      return "/admin/dashboard";
    case "SHOP_OWNER":
      return "/shop/dashboard";
    case "PROCUREMENT_OFFICER":
      return "/procurement-officer/dashboard";
    case "MACHINERY_OWNER":
      return "/machinery/dashboard";
    case "DELIVERY_PARTNER":
      return "/delivery/dashboard";
    case "FARMER":
      return "/farmer/dashboard";
    default:
      // If role is missing or unknown, force them to login/error page rather than defaulting to farmer
      return "/login?error=InvalidRole";
  }
}

export async function requireAuth(unauthRedirect = "/login") {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect(unauthRedirect);
  }

  // Verify the user actually still exists and check active status in database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!dbUser) {
    redirect(`${unauthRedirect}?error=SessionExpired`);
  }

  // Deactivated/suspended accounts must be restricted from standard access.
  // Delivery partners are handled within delivery layout to display the dedicated pending/suspension view.
  if (!dbUser.isActive && dbUser.role !== "DELIVERY_PARTNER") {
    redirect(`${unauthRedirect}?error=AccountDeactivated`);
  }

  // Always enforce the authoritative database role in session object
  (session.user as SessionUser).role = dbUser.role;

  return session;
}

export async function requireRole(role: string, unauthRedirect = "/login") {
  const session = await requireAuth(unauthRedirect);
  const user = session.user as SessionUser;
  
  const userRole = normalizeRole(user.role);
  const targetRole = normalizeRole(role);

  if (!userRole) {
    // Stale session or corrupted token missing the role
    redirect(`${unauthRedirect}?error=SessionExpired`);
  }

  if (userRole !== targetRole) {
    redirect(getDashboardForRole(userRole));
  }
  return session;
}

export async function requireAnyRole(roles: string[], unauthRedirect = "/login") {
  const session = await requireAuth(unauthRedirect);
  const user = session.user as SessionUser;

  const userRole = normalizeRole(user.role);
  const targetRoles = roles.map((r) => normalizeRole(r));

  if (!userRole) {
    redirect(`${unauthRedirect}?error=SessionExpired`);
  }

  if (!targetRoles.includes(userRole)) {
    redirect(getDashboardForRole(userRole));
  }
  return session;
}







