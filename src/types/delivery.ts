import { DeliveryStatus, DeliveryType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export type DeliveryPartnerProfile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  vehicleCapacity: string | null;
  serviceArea: string | null;
  maxActiveDeliveries: number;
  isAvailable: boolean;
  isActive: boolean;
  lastKnownLat?: number | null;
  lastKnownLon?: number | null;
};

export type DeliveryDashboardMetrics = {
  totalAssignedDeliveries: number;
  pendingDeliveries: number;
  pickupsAwaitingCollection: number;
  inProgressDeliveries: number;
  completedDeliveries: number;
  availableDeliveries: number;
  assignedDeliveries: number;
  pickedUpDeliveries: number;
  outForDeliveryCount: number;
  deliveredCount: number;
  activeDeliveriesCount: number;
  maxActiveLimit: number;
  exceptionCount?: number;
  returnedCount?: number;
};

export type AvailableDeliverySummary = {
  id: string; // assignmentId or orderId
  assignmentId?: string | null;
  deliveryType: DeliveryType;
  orderId?: string | null;
  machineryBookingId?: string | null;
  orderNumber: string;
  orderDate: string;
  itemCount: number;
  pickupAddress?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  deliveryAddress: string;
  deliveryArea?: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  totalAmount: number;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  itemsSummary: string;
  deliveryWindow?: string | null;
  estimatedDistanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  requiredCapacity?: string | null;
  deliveryNotes?: string | null;
};

export type PartnerDeliverySummary = {
  assignmentId: string;
  deliveryType: DeliveryType;
  orderId?: string | null;
  machineryBookingId?: string | null;
  orderNumber: string;
  status: DeliveryStatus;
  overallOrderStatus?: OrderStatus | null;
  customerName: string;
  customerPhone: string;
  pickupAddress?: string | null;
  deliveryAddress: string;
  deliveryArea: string;
  pincode: string | null;
  totalAmount: number;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  deliveryWindow?: string | null;
  estimatedDistanceKm?: number | null;
  assignedAt: string;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  itemCount: number;
  itemsSummary?: string;
  itemsList?: Array<{ name: string; quantity: number }>;
  deliveryExceptionReason?: string | null;
};

export type PartnerDeliveryDetail = {
  assignmentId: string;
  deliveryType: DeliveryType;
  orderId?: string | null;
  machineryBookingId?: string | null;
  orderNumber: string;
  deliveryStatus: DeliveryStatus;
  overallOrderStatus?: OrderStatus | null;
  customerName: string;
  customerPhone: string;
  pickupAddress?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  shippingAddress: string;
  shippingVillage: string | null;
  shippingDistrict: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  totalAmount: number;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  deliveryCode: string | null;
  deliveryWindow?: string | null;
  scheduledPickupAt?: string | null;
  scheduledDeliveryAt?: string | null;
  estimatedDistanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  deliveryNotes?: string | null;
  recipientName?: string | null;
  proofImageUrl?: string | null;
  deliveryExceptionReason?: string | null;
  rescheduleReason?: string | null;
  assignedAt: string;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unit: string | null;
    shopName: string | null;
    lineTotal: number;
  }[];
  canConfirmPickup: boolean;
  canMarkOutForDelivery: boolean;
  canMarkDelivered: boolean;
  canReportException: boolean;
  canReschedule: boolean;
};

export type AdminLogisticsMetrics = {
  totalDeliveries: number;
  pendingAssignment: number;
  activeInTransit: number;
  deliveredCount: number;
  exceptionsCount: number;
  activePartnersCount: number;
};

export type AdminDeliveryItem = {
  id: string;
  deliveryType: DeliveryType;
  status: DeliveryStatus;
  orderId?: string | null;
  machineryBookingId?: string | null;
  identifier: string; // Order Number or Booking Number
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  deliveryWindow?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  partnerPhone?: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderStatus?: string | null;
  orderDate?: string | null;
  shopName?: string | null;
  estimatedDistanceKm?: number | null;
  deliveryExceptionReason?: string | null;
};

export type AdminPartnerItem = {
  id: string;
  name: string;
  phone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  vehicleCapacity: string | null;
  serviceArea?: string | null;
  isAvailable: boolean;
  isActive: boolean;
  userIsActive?: boolean;
  activeDeliveriesCount: number;
  maxActiveDeliveries: number;
};
