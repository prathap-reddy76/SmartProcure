import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";

export default async function ShopAdminCompatibilityPage() {
  await requireRole("SHOP_OWNER");
  redirect("/shop/dashboard");
}
