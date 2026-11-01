import { auth } from "@/lib/auth";
import { getDashboardForRole, normalizeRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";
import { redirect } from "next/navigation";

export default async function ProcurementRootRedirectPage() {
  const session = await auth();
  const role = normalizeRole((session?.user as SessionUser)?.role);

  if (role === "FARMER") {
    redirect("/farmer/procurement");
  }

  if (role === "PROCUREMENT_OFFICER") {
    redirect("/procurement-officer/dashboard");
  }

  if (role) {
    redirect(getDashboardForRole(role));
  }

  // If unauthenticated or no session, redirect to procurement officer dashboard
  // which will properly enforce authentication via its server layout.
  redirect("/procurement-officer/dashboard");
}
