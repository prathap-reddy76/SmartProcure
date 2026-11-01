import { z } from "zod";
import { ProcurementBookingStatus } from "@prisma/client";

// Procurement Centre
export type CentreAvailabilityStatus = "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";

export type ProcurementCentreSummary = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  operatingStartTime: string | null;
  operatingEndTime: string | null;
  isActive: boolean;
  supportedCrops: string[];
  availabilityStatus?: CentreAvailabilityStatus;
  totalSlotsToday?: number;
  availableSlotsToday?: number;
  nextAvailableSlot?: string | null;
};

export type ProcurementCentreDetail = ProcurementCentreSummary & {
  description: string | null;
};

export type ProcurementCropConfig = {
  id: string;
  cropId: string;
  cropName: string;
  dailyCapacity: number;
  minimumQuantity: number;
  maximumQuantity: number;
  isActive: boolean;
};

// Slot
export type ProcurementSlotData = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
  isFull: boolean;
  isPast: boolean;
};

// Bookings
export type ProcurementBookingSummary = {
  id: string;
  bookingNumber: string;
  tokenNumber: string;
  centreName: string;
  cropName: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  expectedQuantity: number;
  status: ProcurementBookingStatus;
  bookedAt: string;
};

// Form Schemas
export const bookProcurementSlotSchema = z.object({
  centreId: z.string().min(1, "Procurement Centre is required"),
  cropId: z.string().min(1, "Crop is required"),
  slotId: z.string().min(1, "Slot is required"),
  expectedQuantity: z
    .number()
    .positive("Quantity must be greater than 0")
    .max(1000, "Quantity exceeds maximum allowable limit"),
});

export type BookProcurementSlotValues = z.infer<typeof bookProcurementSlotSchema>;
