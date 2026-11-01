import { OrderStatus, PaymentMethod, PaymentStatus, DeliveryStatus } from "@prisma/client";

export type ShopProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
};

export type ShopDashboardMetrics = {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  newOrders: number;        // Orders in CONFIRMED state with shop's items
  processingOrders: number; // Orders in PROCESSING state with shop's items
  readyOrders: number;      // Orders in READY_FOR_DELIVERY state with shop's items
  deliveredOrders: number;
};

export type SellerOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  quantity: number;
  unit: string | null;
  lineTotal: number;
  status: OrderStatus;
};

export type SellerOrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string;
  overallStatus: OrderStatus;
  shopFulfillmentStatus: OrderStatus;
  itemCount: number;
  shopTotal: number;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: SellerOrderItem[];
};

export type SellerOrderDetail = {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  overallStatus: OrderStatus;
  shopFulfillmentStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingVillage: string | null;
  shippingDistrict: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  shopTotal: number;
  items: SellerOrderItem[];
  canMarkProcessing: boolean;
  canMarkReady: boolean;
  deliveryAssignment?: {
    id: string;
    status: DeliveryStatus;
    deliveryCode?: string | null;
    partnerName: string | null;
    partnerPhone: string | null;
    vehicleType: string | null;
    vehicleNumber: string | null;
    assignedAt: string | null;
    pickedUpAt: string | null;
    outForDeliveryAt: string | null;
    deliveredAt: string | null;
  } | null;
};

export type ShopProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  unit: string | null;
  stock: number;
  isActive: boolean;
  categoryName: string;
  categorySlug: string;
  suitableCrops: string | null;
  variety: string | null;
  packageSize: string | null;
  season: string | null;
  imageUrl: string | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};
