import { z } from "zod";
import { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export const checkoutSchema = z.object({
  shippingName: z.string().min(1, "Full Name is required").max(100),
  shippingPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .refine((val) => /^[6-9]\d{9}$/.test(val.replace(/[\s-]/g, "")), {
      message: "Please enter a valid 10-digit Indian mobile number",
    }),
  shippingAddress: z.string().min(5, "Detailed street address is required").max(300),
  shippingVillage: z.string().max(100).optional(),
  shippingDistrict: z.string().max(100).optional(),
  shippingState: z.string().max(100).optional(),
  shippingPincode: z
    .string()
    .min(6, "PIN code must be 6 digits")
    .refine((val) => /^\d{6}$/.test(val.trim()), {
      message: "Please enter a valid 6-digit PIN code",
    }),
  paymentMethod: z.enum(["COD", "UPI"]),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export type CheckoutDefaults = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingVillage: string;
  shippingDistrict: string;
  shippingState: string;
  shippingPincode: string;
};

export type OrderItemSnapshot = {
  id: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  quantity: number;
  unit: string | null;
  lineTotal: number;
  shopName: string | null;
};

export type OrderDeliveryInfo = {
  assignmentId: string;
  status: DeliveryStatus;
  deliveryPartnerName: string;
  deliveryPartnerPhone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  lastKnownLat?: number | null;
  lastKnownLon?: number | null;
  lastLocationUpdatedAt?: string | null;
  deliveryCode: string | null;
  deliveryWindow?: string | null;
  estimatedDistanceKm?: number | null;
  deliveryExceptionReason?: string | null;
  rescheduleReason?: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingVillage: string | null;
  shippingDistrict: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemSnapshot[];
  isCancellable: boolean;
  deliveryInfo?: OrderDeliveryInfo | null;
};

export type OrderSummaryCard = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  firstItemName: string;
  deliveryStatus?: DeliveryStatus | null;
  shopName?: string | null;
};
