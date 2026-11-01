"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { ProcurementCentreSummary, ProcurementCentreDetail, ProcurementCropConfig, ProcurementSlotData } from "@/types/procurement";

import { Prisma } from "@prisma/client";
import { getTodayAsUTCDate, parseDateStringAsUTC } from "@/lib/date-utils";

export async function getActiveProcurementCentres(params?: {
  search?: string;
}): Promise<ProcurementCentreSummary[]> {
  await requireRole("FARMER");
  
  const today = getTodayAsUTCDate();

  const whereClause: Prisma.ProcurementCentreWhereInput = {
    isActive: true,
  };

  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { village: { contains: q, mode: "insensitive" } },
      { mandal: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  const centres = await prisma.procurementCentre.findMany({
    where: whereClause,
    include: {
      supportedCrops: {
        where: { isActive: true },
        include: { crop: true }
      },
      slots: {
        where: {
          date: today,
          isActive: true,
        },
        orderBy: { startTime: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return centres.map(c => {
    let availableSlotsToday = 0;
    let nextAvailableSlot: string | null = null;

    for (const slot of c.slots) {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const isPast = currentHour > startH || (currentHour === startH && currentMinute >= startM);
      const hasCapacity = slot.bookedCount < slot.capacity;

      if (hasCapacity) {
        availableSlotsToday += (slot.capacity - slot.bookedCount);
        if (!isPast && !nextAvailableSlot) {
          nextAvailableSlot = slot.startTime;
        }
      }
    }

    let availabilityStatus: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED" = "AVAILABLE";
    if (!c.isActive) {
      availabilityStatus = "CLOSED";
    } else if (c.slots.length > 0 && availableSlotsToday === 0) {
      availabilityStatus = "FULL";
    } else if (availableSlotsToday > 0 && availableSlotsToday <= 5) {
      availabilityStatus = "LIMITED";
    } else if (availableSlotsToday > 5) {
      availabilityStatus = "AVAILABLE";
    }

    return {
      id: c.id,
      name: c.name,
      code: c.code,
      address: c.address,
      village: c.village,
      mandal: c.mandal,
      district: c.district,
      state: c.state,
      pincode: c.pincode,
      latitude: c.latitude,
      longitude: c.longitude,
      contactPhone: c.contactPhone,
      operatingStartTime: c.operatingStartTime,
      operatingEndTime: c.operatingEndTime,
      isActive: c.isActive,
      supportedCrops: c.supportedCrops.map(sc => sc.crop.name),
      availabilityStatus,
      totalSlotsToday: c.slots.length,
      availableSlotsToday,
      nextAvailableSlot,
    };
  });
}

export async function getProcurementCentreDetail(centreId: string): Promise<{ centre: ProcurementCentreDetail | null, crops: ProcurementCropConfig[] }> {
  await requireRole("FARMER");

  const centre = await prisma.procurementCentre.findUnique({
    where: { id: centreId },
    include: {
      supportedCrops: {
        where: { isActive: true },
        include: { crop: true }
      }
    }
  });

  if (!centre) return { centre: null, crops: [] };

  const centreDetail: ProcurementCentreDetail = {
    id: centre.id,
    name: centre.name,
    code: centre.code,
    description: centre.description,
    address: centre.address,
    village: centre.village,
    mandal: centre.mandal,
    district: centre.district,
    state: centre.state,
    pincode: centre.pincode,
    contactPhone: centre.contactPhone,
    latitude: centre.latitude,
    longitude: centre.longitude,
    operatingStartTime: centre.operatingStartTime,
    operatingEndTime: centre.operatingEndTime,
    isActive: centre.isActive,
    supportedCrops: centre.supportedCrops.map(sc => sc.crop.name),
  };

  const crops: ProcurementCropConfig[] = centre.supportedCrops.map(sc => ({
    id: sc.id,
    cropId: sc.cropId,
    cropName: sc.crop.name,
    dailyCapacity: sc.dailyCapacity,
    minimumQuantity: sc.minimumQuantity,
    maximumQuantity: sc.maximumQuantity,
    isActive: sc.isActive,
  }));

  return { centre: centreDetail, crops };
}

export async function getAvailableSlots(centreId: string, dateStr: string): Promise<ProcurementSlotData[]> {
  await requireRole("FARMER");
  
  // dateStr in YYYY-MM-DD
  const dateObj = parseDateStringAsUTC(dateStr);

  const slots = await prisma.procurementSlot.findMany({
    where: {
      centreId,
      date: dateObj,
      isActive: true,
    },
    orderBy: { startTime: "asc" }
  });

  const now = new Date();
  const isToday = getTodayAsUTCDate().getTime() === dateObj.getTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return slots.map(slot => {
    const [startH, startM] = slot.startTime.split(":").map(Number);
    // Determine if slot is in the past (only relevant for today)
    let isPast = false;
    if (isToday) {
      if (currentHour > startH || (currentHour === startH && currentMinute >= startM)) {
        isPast = true;
      }
    } else if (dateObj.getTime() < getTodayAsUTCDate().getTime()) {
      isPast = true; // completely past date
    }

    return {
      id: slot.id,
      date: slot.date.toISOString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      isActive: slot.isActive,
      isFull: slot.bookedCount >= slot.capacity,
      isPast,
    };
  });
}
