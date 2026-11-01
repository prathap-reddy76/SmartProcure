"use server";

import { requireRole, requireAnyRole } from "@/lib/auth-utils";
import * as analytics from "@/lib/analytics";
import { getPhase42Analytics } from "@/lib/analytics/phase42";
import { AnalyticsPeriod } from "@/lib/analytics";
import { Role } from "@prisma/client";

// --- ADMIN ANALYTICS ---
export async function getAdminAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  await requireRole(Role.ADMIN);
  return analytics.getAdminPlatformOverview(period, customFrom, customTo);
}

// --- PROCUREMENT ANALYTICS ---
export async function getProcurementAnalyticsAction(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string,
  centreId?: string,
  cropId?: string
) {
  await requireAnyRole([Role.ADMIN, Role.PROCUREMENT_OFFICER]);
  return analytics.getProcurementAnalytics(period, customFrom, customTo, centreId, cropId);
}

// --- MARKETPLACE ANALYTICS (SHOP OWNER) ---
export async function getShopAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  const session = await requireRole(Role.SHOP_OWNER);
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // Find shopId for this user
  const { prisma } = await import("@/lib/prisma");
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  
  if (!shop) {
    throw new Error("Shop not found");
  }

  return analytics.getMarketplaceAnalytics(period, customFrom, customTo, shop.id);
}

// --- MARKETPLACE ANALYTICS (ADMIN) ---
export async function getAdminMarketplaceAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  await requireRole(Role.ADMIN);
  return analytics.getMarketplaceAnalytics(period, customFrom, customTo); // No shopId = all shops
}

// --- DELIVERY ANALYTICS ---
export async function getDeliveryAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string, deliveryPartnerId?: string) {
  await requireAnyRole([Role.ADMIN, Role.DELIVERY_PARTNER]);
  return analytics.getDeliveryAnalytics(period, customFrom, customTo, deliveryPartnerId);
}

// --- MACHINERY ANALYTICS (OWNER) ---
export async function getMachineryOwnerAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  const session = await requireRole(Role.MACHINERY_OWNER);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return analytics.getMachineryAnalytics(period, customFrom, customTo, session.user.id);
}

// --- MACHINERY ANALYTICS (ADMIN) ---
export async function getAdminMachineryAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  await requireRole(Role.ADMIN);
  return analytics.getMachineryAnalytics(period, customFrom, customTo); // No ownerId = all
}

// --- FARMER ANALYTICS ---
export async function getFarmerAnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  const session = await requireRole(Role.FARMER);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return analytics.getFarmerAnalytics(period, session.user.id, customFrom, customTo);
}

// --- PHASE 42 ANALYTICS ---
export async function getPhase42AnalyticsAction(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  await requireRole(Role.ADMIN);
  return getPhase42Analytics(period, customFrom, customTo);
}