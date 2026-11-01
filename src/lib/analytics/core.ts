import { Prisma } from "@prisma/client";

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "all" | "custom";

export function getAnalyticsDateRange(period: AnalyticsPeriod, customFrom?: string, customTo?: string): DateRange {
  const now = new Date();
  
  switch (period) {
    case "today":
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { from: today, to: now };
    case "7d":
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return { from: sevenDaysAgo, to: now };
    case "30d":
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return { from: thirtyDaysAgo, to: now };
    case "90d":
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return { from: ninetyDaysAgo, to: now };
    case "custom":
      if (customFrom && customTo) {
        const fromDate = new Date(customFrom);
        const toDate = new Date(customTo);
        // Ensure toDate is at the end of the day if it's just a date
        toDate.setHours(23, 59, 59, 999);
        
        if (fromDate <= toDate) {
          return { from: fromDate, to: toDate };
        }
      }
      return {}; // Fallback to all if invalid
    case "all":
    default:
      return {};
  }
}

export function buildDateFilter(dateRange: DateRange, field = "createdAt"): any {
  const filter: any = {};
  if (dateRange.from) {
    filter.gte = dateRange.from;
  }
  if (dateRange.to) {
    filter.lte = dateRange.to;
  }
  
  if (Object.keys(filter).length === 0) {
    return undefined;
  }
  
  return filter;
}

export function serializeDecimal(val: Prisma.Decimal | null | undefined): number {
  if (!val) return 0;
  if (typeof val === "number") return val; if (typeof val === "object" && typeof (val as any).toNumber === "function") return (val as any).toNumber(); return Number(val) || 0;
}
