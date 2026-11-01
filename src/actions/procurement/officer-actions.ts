"use server";
import { getTodayAsUTCDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { SessionUser } from "@/types/auth";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}


export async function getOfficerDashboardData(page = 1, limit = 25) {
  const session = await requireRole("PROCUREMENT_OFFICER");
  const user = session.user as SessionUser;

  const officerUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      procurementCentre: true,
    }
  });

  if (!officerUser?.procurementCentre) {
    return { centre: null, stats: null, error: "No procurement centre assigned to your profile." };
  }

  const centre = officerUser.procurementCentre;
  
  // Stats for today
  const today = getTodayAsUTCDate();
  //

  // Group by status for stats to avoid pulling all records into memory
  const statsRaw = await prisma.procurementBooking.groupBy({
    by: ['status'],
    where: {
      centreId: centre.id,
      slot: { date: today }
    },
    _count: { id: true }
  });

  let totalBookings = 0;
  let arrived = 0;
  let waiting = 0;
  let inProgress = 0;
  let weighing = 0;
  let quality = 0;
  let accepted = 0;
  let partiallyAccepted = 0;
  let rejected = 0;
  let cancelled = 0;

  statsRaw.forEach(s => {
    totalBookings += s._count.id;
    if (s.status === "ARRIVED") arrived += s._count.id;
    if (s.status === "WAITING") waiting += s._count.id;
    if (s.status === "IN_PROGRESS") inProgress += s._count.id;
    if (s.status === "WEIGHING" || s.status === "WEIGHING_COMPLETED") weighing += s._count.id;
    if (s.status === "QUALITY_INSPECTION") quality += s._count.id;
    if (s.status === "ACCEPTED") accepted += s._count.id;
    if (s.status === "PARTIALLY_ACCEPTED") partiallyAccepted += s._count.id;
    if (s.status === "REJECTED") rejected += s._count.id;
    if (s.status === "CANCELLED" || s.status === "NO_SHOW") cancelled += s._count.id;
  });

  // Bounded list for the UI
  const skip = (page - 1) * limit;
  const bookings = await prisma.procurementBooking.findMany({
    where: {
      centreId: centre.id,
      slot: { date: today }
    },
    include: {
      crop: true,
      farmer: true,
      slot: true,
    },
    orderBy: [
      { arrivedAt: 'asc' },
      { bookedAt: 'asc' }
    ],
    skip,
    take: limit
  });

  // Upcoming summary for dashboard
  const upcomingRaw = await prisma.procurementBooking.findMany({
    where: {
      centreId: centre.id,
      slot: { date: { gt: today } },
      status: "BOOKED"
    },
    select: {
      slot: { select: { date: true } }
    }
  });

  const summaryMap: Record<string, number> = {};
  upcomingRaw.forEach(b => {
    const dString = b.slot.date.toISOString();
    summaryMap[dString] = (summaryMap[dString] || 0) + 1;
  });

  const upcomingSummary = Object.entries(summaryMap)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(0, 3)
    .map(([dateString, count]) => ({
      date: dateString,
      count
    }));

  return {
    centre: {
      ...centre,
      latitude: toNumberOrNull(centre.latitude),
      longitude: toNumberOrNull(centre.longitude),
      createdAt: centre.createdAt.toISOString(),
      updatedAt: centre.updatedAt.toISOString(),
    },
    stats: {
      totalBookings,
      arrived,
      waiting,
      inProgress,
      weighing,
      quality,
      accepted,
      partiallyAccepted,
      rejected,
      cancelled,
    },
    todayBookings: bookings.map(b => ({
      id: b.id,
      tokenNumber: b.tokenNumber,
      farmerName: b.farmer.name || "Unknown",
      cropName: b.crop.name,
      expectedQuantity: toNumberOrNull(b.expectedQuantity) || 0,
      status: b.status,
      slotStartTime: b.slot.startTime,
      slotEndTime: b.slot.endTime,
      bookedAt: b.bookedAt.toISOString(),
      arrivedAt: b.arrivedAt ? b.arrivedAt.toISOString() : null,
    })),
      pagination: {
        page,
        limit,
        total: totalBookings,
        totalPages: Math.ceil(totalBookings / limit)
      },
      upcomingSummary
    };
}

export async function getOfficerUpcomingBookings(page = 1, limit = 20) {
  try {
    const session = await requireRole("PROCUREMENT_OFFICER");
    const user = session.user as SessionUser;

    const officerUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { procurementCentre: true }
    });

    if (!officerUser?.procurementCentre) {
      return { bookings: [], error: "No procurement centre assigned.", pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }

    const today = getTodayAsUTCDate();
    const skip = (page - 1) * limit;

    const where: any = {
      centreId: officerUser.procurementCentre.id,
      slot: { date: { gt: today } },
      status: "BOOKED"
    };

    const [bookings, total] = await Promise.all([
      prisma.procurementBooking.findMany({
        where,
        include: {
          crop: true,
          farmer: { select: { name: true, phone: true } },
          slot: true
        },
        orderBy: [
          { slot: { date: 'asc' } },
          { slot: { startTime: 'asc' } }
        ],
        skip,
        take: limit
      }),
      prisma.procurementBooking.count({ where })
    ]);

    return {
      bookings: bookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        farmerName: b.farmer.name || "Unknown Farmer",
        farmerPhone: b.farmer.phone || "N/A",
        cropName: b.crop.name,
        expectedQuantity: toNumberOrNull(b.expectedQuantity) || 0,
        date: b.slot.date.toISOString(),
        startTime: b.slot.startTime,
        endTime: b.slot.endTime,
        status: b.status,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    return { bookings: [], error: "Failed to fetch upcoming bookings.", pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }
}
