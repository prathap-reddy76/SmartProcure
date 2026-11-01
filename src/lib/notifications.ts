
import { formatUTCDate } from "@/lib/date-utils";

import { prisma } from "@/lib/prisma"; 
import { NotificationType, Prisma } from "@prisma/client"; 
import { dispatchExternalNotifications } from "@/lib/notifications/providers"; 
import {   publishNotificationEvent,   getNotificationCategory, } from "@/lib/notification-events";  
export interface CreateNotificationParams {   userId: string;   type: NotificationType;   title: string;   message: string;   entityType?: string;   entityId?: string;   targetUrl?: string;   eventKey?: string; }  /**  * Central notification creation service with duplicate protection.  */ 

export async function sendNotification(   params: CreateNotificationParams,   tx?: Prisma.TransactionClient ) {   const db = tx || prisma;   
/* Deduplication check: if eventKey is provided, check if already notified for this user */
   if (params.eventKey) {     const existing = await db.notification.findFirst({       where: {         userId: params.userId,         eventKey: params.eventKey,       },     });     if (existing) {       return existing;     }   }    const notification = await db.notification.create({     data: {       userId: params.userId,       type: params.type,       title: params.title,       message: params.message,       entityType: params.entityType,       entityId: params.entityId,       targetUrl: params.targetUrl,       eventKey: params.eventKey,     },   });   
/* Real-time broadcast to active subscribers */
   try {     publishNotificationEvent(params.userId, {       notificationId: notification.id,       type: notification.type,       category: getNotificationCategory(notification.type),       title: notification.title,       message: notification.message,       entityType: notification.entityType,       entityId: notification.entityId,       targetUrl: notification.targetUrl,       createdAt: notification.createdAt.toISOString(),     });   } catch (err) {     console.error("Failed to publish real-time notification event:", err);   }    return notification; } 
/* ------------------------------------------------------------- */

/* Specialized event dispatchers for consistent message formats */

/* ------------------------------------------------------------- */
  

export async function notifyProcurementBookingCreated({   farmerId,   bookingId,   tokenNumber,   cropName,   centreName,   slotDate,   tx, }: {   farmerId: string;   bookingId: string;   tokenNumber: string;   cropName: string;   centreName: string;   slotDate?: string | Date;   tx?: Prisma.TransactionClient; }) {   const db = tx || prisma;   const dateStr = slotDate ? formatUTCDate(slotDate, "dd MMM") : "";   const dateMsg = dateStr ? ` on ${dateStr}` : "";   
/* 1. Notify Farmer */
   
await sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_BOOKING_CREATED",       title: "Procurement Slot Booked",       message: `Your ${cropName} procurement slot at ${centreName} has been confirmed${dateMsg}. Token: #${tokenNumber}.`,       entityType: "PROCUREMENT_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `procurement:booking:${bookingId}:created:farmer`,     },     tx   );   
/* Fetch Centre to get assigned officer */
   const booking = await db.procurementBooking.findUnique({     where: { id: bookingId },     include: { centre: { include: { officers: true } } }   });    if (booking && booking.centre && booking.centre.officers) {    
/* 2. Notify Assigned Officer(s) */
     for (const officer of booking.centre.officers) {       
await sendNotification(         {           userId: officer.id,           type: "PROCUREMENT_BOOKING_CREATED",           title: "New Procurement Booking",           message: `A new farmer booking has been created for ${cropName} at ${centreName}.`,           entityType: "PROCUREMENT_BOOKING",           entityId: bookingId,           targetUrl: `/procurement-officer/queue`,           eventKey: `procurement:booking:${bookingId}:created:officer:${officer.id}`,         },         tx       );     }   }   
/* 3. Notify Admins */
   const admins = await db.user.findMany({ where: { role: "ADMIN", isActive: true } });   for (const admin of admins) {     
await sendNotification(       {         userId: admin.id,         type: "PROCUREMENT_BOOKING_CREATED",         title: "New Procurement Booking",         message: `A new ${cropName} procurement booking has been created at ${centreName}${dateMsg}.`,         entityType: "PROCUREMENT_BOOKING",         entityId: bookingId,         targetUrl: `/admin/dashboard`,         eventKey: `procurement:booking:${bookingId}:created:admin:${admin.id}`,       },       tx     );   } }  

export async function notifyProcurementArrival({   farmerId,   bookingId,   tokenNumber,   centreName,   tx, }: {   farmerId: string;   bookingId: string;   tokenNumber: string;   centreName: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_ARRIVAL",       title: "Arrival Registered",       message: `Your arrival for Token #${tokenNumber} is verified at ${centreName}. You are now in the waiting queue.`,       entityType: "PROCUREMENT_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `PROC_ARRIVAL:${bookingId}:${farmerId}`,     },     tx   ); }  

export async function notifyProcurementWeighingCompleted({   farmerId,   bookingId,   tokenNumber,   netWeight,   tx, }: {   farmerId: string;   bookingId: string;   tokenNumber: string;   netWeight: number | string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_WEIGHING_COMPLETED",       title: "Weighing Completed",       message: `Token #${tokenNumber} weighing finalized. Recorded Net Weight: ${netWeight} KG. Proceeding to quality inspection.`,       entityType: "PROCUREMENT_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `WEIGHING_COMPLETED:${bookingId}:${farmerId}`,     },     tx   ); }  

export async function notifyProcurementQualityCompleted({   farmerId,   bookingId,   tokenNumber,   cropName,   qualityStatus,   acceptedQuantity,   rejectedQuantity,   tx, }: {   farmerId: string;   bookingId: string;   tokenNumber: string;   cropName: string;   qualityStatus: "PASSED" | "PARTIALLY_ACCEPTED" | "REJECTED";   acceptedQuantity: number | string;   rejectedQuantity: number | string;   tx?: Prisma.TransactionClient; }) {   let outcomeText = `Quality inspection passed for ${cropName} (${acceptedQuantity} KG accepted).`;   if (qualityStatus === "PARTIALLY_ACCEPTED") {     outcomeText = `Partially accepted: ${acceptedQuantity} KG accepted, ${rejectedQuantity} KG rejected.`;   } else if (qualityStatus === "REJECTED") {     outcomeText = `Quality inspection rejected for ${cropName} (${rejectedQuantity} KG rejected).`;   }    
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_QUALITY_COMPLETED",       title: "Quality Inspection Complete",       message: `Token #${tokenNumber}: ${outcomeText}`,       entityType: "PROCUREMENT_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `QUALITY_COMPLETED:${bookingId}:${farmerId}`,     },     tx   ); }  

export async function notifyProcurementPaymentCreated({   farmerId,   paymentId,   bookingId,   tokenNumber,   netPayableAmount,   tx, }: {   farmerId: string;   paymentId: string;   bookingId: string;   tokenNumber: string;   netPayableAmount: number | string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_PAYMENT_CREATED",       title: "Payment Generated",       message: `A procurement payment of ₹${Number(netPayableAmount).toFixed(2)} is pending approval for Token #${tokenNumber}.`,       entityType: "PROCUREMENT_PAYMENT",       entityId: paymentId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `PAYMENT_CREATED:${paymentId}:${farmerId}`,     },     tx   ); }  

export async function notifyProcurementPaymentPaid({   farmerId,   paymentId,   receiptNumber,   netPayableAmount,   tx, }: {   farmerId: string;   paymentId: string;   receiptNumber: string;   netPayableAmount: number | string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_PAYMENT_PAID",       title: "Payment Successful",       message: `Procurement payment of ₹${Number(netPayableAmount).toFixed(2)} has been successfully paid. Receipt: ${receiptNumber}.`,       entityType: "PROCUREMENT_PAYMENT",       entityId: paymentId,       targetUrl: `/farmer/procurement/payments/${paymentId}`,       eventKey: `PAYMENT_PAID:${paymentId}:${farmerId}`,     },     tx   ); }  

export async function notifyProcurementPaymentFailed({   farmerId,   paymentId,   bookingId,   tx, }: {   farmerId: string;   paymentId: string;   bookingId: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "PROCUREMENT_PAYMENT_FAILED",       title: "Payment Processing Failed",       message: `Payment processing could not be completed for your procurement. An officer will re-attempt processing shortly.`,       entityType: "PROCUREMENT_PAYMENT",       entityId: paymentId,       targetUrl: `/farmer/procurement/bookings/${bookingId}`,       eventKey: `PAYMENT_FAILED:${paymentId}:${farmerId}`,     },     tx   ); } 
/* ------------------------------------------------------------- */

/* Marketplace & Orders */

/* ------------------------------------------------------------- */
  

export async function notifyOrderConfirmed({   farmerId,   orderId,   orderNumber,   totalAmount,   tx, }: {   farmerId: string;   orderId: string;   orderNumber: string;   totalAmount: number | string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "ORDER_CONFIRMED",       title: "Order Confirmed",       message: `Your order #${orderNumber} for ₹${Number(totalAmount).toFixed(2)} has been placed successfully.`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `ORDER_CONFIRMED:${orderId}:${farmerId}`,     },     tx   ); }  

export async function notifyShopNewOrder({   shopOwnerUserId,   orderId,   orderNumber,   totalAmount,   tx, }: {   shopOwnerUserId: string;   orderId: string;   orderNumber: string;   totalAmount: number | string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: shopOwnerUserId,       type: "ORDER_CONFIRMED",       title: "New Order Received",       message: `New order #${orderNumber} received totaling ₹${Number(totalAmount).toFixed(2)}. Prepare items for dispatch.`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/shop/orders/${orderId}`,       eventKey: `SHOP_NEW_ORDER:${orderId}:${shopOwnerUserId}`,     },     tx   ); }  

export async function notifyOrderProcessing({   farmerId,   orderId,   orderNumber,   tx, }: {   farmerId: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "ORDER_PROCESSING",       title: "Order Processing",       message: `Your order #${orderNumber} is now being packed and prepared by the seller.`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `ORDER_PROCESSING:${orderId}:${farmerId}`,     },     tx   ); }  

export async function notifyOrderReadyForDelivery({   farmerId,   orderId,   orderNumber,   tx, }: {   farmerId: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "ORDER_READY_FOR_DELIVERY",       title: "Order Ready for Delivery",       message: `Order #${orderNumber} is packed and waiting for delivery partner pickup.`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `ORDER_READY:${orderId}:${farmerId}`,     },     tx   ); }  

export async function notifyOrderCancelled({   farmerId,   orderId,   orderNumber,   reason,   tx, }: {   farmerId: string;   orderId: string;   orderNumber: string;   reason?: string;   tx?: Prisma.TransactionClient; }) {   const reasonText = reason ? ` Reason: ${reason}` : "";   
return sendNotification(     {       userId: farmerId,       type: "ORDER_CANCELLED",       title: "Order Cancelled",       message: `Order #${orderNumber} was cancelled.${reasonText}`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `ORDER_CANCELLED:${orderId}:${farmerId}`,     },     tx   ); } 
/* ------------------------------------------------------------- */

/* Delivery Logistics */

/* ------------------------------------------------------------- */
  

export async function notifyDeliveryAssigned({   partnerUserId,   farmerId,   shopOwnerId,   orderId,   orderNumber,   tx, }: {   partnerUserId: string;   farmerId?: string;   shopOwnerId?: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {  
/* Notify delivery partner */
   
await sendNotification(     {       userId: partnerUserId,       type: "DELIVERY_ASSIGNED",       title: "Delivery Task Assigned",       message: `Order #${orderNumber} assigned to your route. Please confirm pickup from the seller.`,       entityType: "DELIVERY",       entityId: orderId,       targetUrl: `/delivery/orders/${orderId}`,       eventKey: `DELIVERY_ASSIGNED_PARTNER:${orderId}:${partnerUserId}`,     },     tx   );   
/* Notify customer */
   if (farmerId) {     
await sendNotification(       {         userId: farmerId,         type: "DELIVERY_ASSIGNED",         title: "Delivery Partner Assigned",         message: `A delivery partner has been assigned to deliver Order #${orderNumber}.`,         entityType: "ORDER",         entityId: orderId,         targetUrl: `/farmer/orders/${orderId}`,         eventKey: `DELIVERY_ASSIGNED_FARMER:${orderId}:${farmerId}`,       },       tx     );   }
/* Notify shop owner */
   if (shopOwnerId) {
await sendNotification(       {         userId: shopOwnerId,         type: "DELIVERY_ASSIGNED",         title: "Delivery Partner Dispatched",         message: `Delivery partner has been assigned to pick up Order #${orderNumber}.`,         entityType: "ORDER",         entityId: orderId,         targetUrl: `/shop/orders/${orderId}`,         eventKey: `DELIVERY_ASSIGNED_SHOP:${orderId}:${shopOwnerId}`,       },       tx     );   }
}  

export async function notifyDeliveryReassigned({
  newPartnerUserId,
  previousPartnerUserId,
  farmerId,
  shopOwnerId,
  orderId,
  orderNumber,
  tx,
}: {
  newPartnerUserId: string;
  previousPartnerUserId?: string;
  farmerId?: string;
  shopOwnerId?: string;
  orderId: string;
  orderNumber: string;
  tx?: Prisma.TransactionClient;
}) {
  // 1. Notify new delivery partner
  await sendNotification(
    {
      userId: newPartnerUserId,
      type: "DELIVERY_ASSIGNED",
      title: "Delivery Task Assigned",
      message: `Order #${orderNumber} has been assigned to your route by admin. Please confirm pickup.`,
      entityType: "DELIVERY",
      entityId: orderId,
      targetUrl: `/delivery/orders/${orderId}`,
      eventKey: `DELIVERY_REASSIGNED_NEW:${orderId}:${newPartnerUserId}:${Date.now()}`,
    },
    tx
  );

  // 2. Notify previous partner if different
  if (previousPartnerUserId && previousPartnerUserId !== newPartnerUserId) {
    await sendNotification(
      {
        userId: previousPartnerUserId,
        type: "DELIVERY_CANCELLED",
        title: "Delivery Task Reassigned",
        message: `Order #${orderNumber} has been reassigned to another delivery partner by admin.`,
        entityType: "DELIVERY",
        entityId: orderId,
        targetUrl: `/delivery/orders`,
        eventKey: `DELIVERY_REASSIGNED_OLD:${orderId}:${previousPartnerUserId}:${Date.now()}`,
      },
      tx
    );
  }

  // 3. Notify farmer
  if (farmerId) {
    await sendNotification(
      {
        userId: farmerId,
        type: "DELIVERY_ASSIGNED",
        title: "Delivery Partner Updated",
        message: `Delivery partner for Order #${orderNumber} has been updated.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/farmer/orders/${orderId}`,
        eventKey: `DELIVERY_REASSIGNED_FARMER:${orderId}:${Date.now()}`,
      },
      tx
    );
  }

  // 4. Notify shop owner
  if (shopOwnerId) {
    await sendNotification(
      {
        userId: shopOwnerId,
        type: "DELIVERY_ASSIGNED",
        title: "Delivery Partner Reassigned",
        message: `Delivery partner for Order #${orderNumber} has been updated by administrator.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/shop/orders/${orderId}`,
        eventKey: `DELIVERY_REASSIGNED_SHOP:${orderId}:${Date.now()}`,
      },
      tx
    );
  }
}

export async function notifyDeliveryPendingAssignment({
  shopOwnerId,
  adminUserId,
  orderId,
  orderNumber,
  tx,
}: {
  shopOwnerId?: string;
  adminUserId?: string;
  orderId: string;
  orderNumber: string;
  tx?: Prisma.TransactionClient;
}) {
  if (shopOwnerId) {
    await sendNotification(
      {
        userId: shopOwnerId,
        type: "ORDER_READY_FOR_DELIVERY",
        title: "Delivery Partner Assignment Pending",
        message: `Order #${orderNumber} is packed and ready, but partner assignment is pending as no partners are currently available.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/shop/orders/${orderId}`,
        eventKey: `DELIVERY_PENDING_SHOP:${orderId}:${shopOwnerId}`,
      },
      tx
    );
  }
  if (adminUserId) {
    await sendNotification(
      {
        userId: adminUserId,
        type: "ADMIN_SYSTEM_ALERT",
        title: "Pending Logistics Assignment",
        message: `Order #${orderNumber} requires delivery partner assignment. All active partners are currently occupied or unavailable.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/admin/logistics`,
        eventKey: `DELIVERY_PENDING_ADMIN:${orderId}`,
      },
      tx
    );
  }
}  

export async function notifyDeliveryPickedUp({   farmerId,   shopOwnerId,   orderId,   orderNumber,   tx, }: {   farmerId: string;   shopOwnerId?: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {   
  if (shopOwnerId) {
    await sendNotification(
      {
        userId: shopOwnerId,
        type: "DELIVERY_PICKED_UP",
        title: "Order Picked Up",
        message: `Order #${orderNumber} was picked up from your shop by the assigned delivery partner.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/shop/orders/${orderId}`,
        eventKey: `DELIVERY_PICKED_UP_SHOP:${orderId}:${shopOwnerId}`,
      },
      tx
    );
  }
  return sendNotification(     {       userId: farmerId,       type: "DELIVERY_PICKED_UP",       title: "Order Picked Up",       message: `Order #${orderNumber} was picked up from the store and is heading to dispatch.`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `DELIVERY_PICKED_UP:${orderId}:${farmerId}`,     },     tx   ); 
}  

export async function notifyDeliveryOutForDelivery({   farmerId,   orderId,   orderNumber,   tx, }: {   farmerId: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: farmerId,       type: "DELIVERY_OUT_FOR_DELIVERY",       title: "Out for Delivery",       message: `Order #${orderNumber} is now out for delivery to your registered address!`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `DELIVERY_OUT_FOR_DELIVERY:${orderId}:${farmerId}`,     },     tx   ); }  

export async function notifyDeliveryDelivered({   farmerId,   shopOwnerId,   orderId,   orderNumber,   tx, }: {   farmerId: string;   shopOwnerId?: string;   orderId: string;   orderNumber: string;   tx?: Prisma.TransactionClient; }) {   
  if (shopOwnerId) {
    await sendNotification(
      {
        userId: shopOwnerId,
        type: "DELIVERY_DELIVERED",
        title: "Order Delivered Successfully",
        message: `Order #${orderNumber} has been delivered to the customer.`,
        entityType: "ORDER",
        entityId: orderId,
        targetUrl: `/shop/orders/${orderId}`,
        eventKey: `DELIVERY_DELIVERED_SHOP:${orderId}:${shopOwnerId}`,
      },
      tx
    );
  }
  return sendNotification(     {       userId: farmerId,       type: "DELIVERY_DELIVERED",       title: "Order Delivered",       message: `Order #${orderNumber} has been successfully delivered. Thank you for using SmartProcure!`,       entityType: "ORDER",       entityId: orderId,       targetUrl: `/farmer/orders/${orderId}`,       eventKey: `delivery:${orderId}:delivered`,     },     tx   ); 
}  

export async function notifyDeliveryCancelled({   partnerUserId,   farmerId,   assignmentId,   orderNumber,   reason,   tx, }: {   partnerUserId?: string | null;   farmerId?: string | null;   assignmentId: string;   orderNumber: string;   reason?: string | null;   tx?: Prisma.TransactionClient; }) {   const reasonText = reason ? ` Reason: ${reason}` : "";   if (partnerUserId) {     
await sendNotification(       {         userId: partnerUserId,         type: "DELIVERY_CANCELLED",         title: "Delivery Task Cancelled",         message: `Delivery assignment for #${orderNumber} was cancelled.${reasonText}`,         entityType: "DELIVERY",         entityId: assignmentId,         targetUrl: `/delivery/dashboard`,         eventKey: `delivery:${assignmentId}:cancelled_partner`,       },       tx     );   }   if (farmerId) {     
await sendNotification(       {         userId: farmerId,         type: "DELIVERY_CANCELLED",         title: "Delivery Cancelled",         message: `Delivery for #${orderNumber} was cancelled.${reasonText}`,         entityType: "DELIVERY",         entityId: assignmentId,         targetUrl: `/farmer/orders`,         eventKey: `delivery:${assignmentId}:cancelled`,       },       tx     );   } }  

export async function notifyDeliveryRescheduled({   partnerUserId,   farmerId,   assignmentId,   orderNumber,   newWindow,   tx, }: {   partnerUserId?: string | null;   farmerId?: string | null;   assignmentId: string;   orderNumber: string;   newWindow: string;   tx?: Prisma.TransactionClient; }) {   if (partnerUserId) {     
await sendNotification(       {         userId: partnerUserId,         type: "DELIVERY_RESCHEDULED",         title: "Delivery Rescheduled",         message: `Delivery for #${orderNumber} rescheduled to window ${newWindow}.`,         entityType: "DELIVERY",         entityId: assignmentId,         targetUrl: `/delivery/orders/${assignmentId}`,         eventKey: `delivery:${assignmentId}:rescheduled_partner`,       },       tx     );   }   if (farmerId) {     
await sendNotification(       {         userId: farmerId,         type: "DELIVERY_RESCHEDULED",         title: "Delivery Time Updated",         message: `Your delivery window for #${orderNumber} is now ${newWindow}.`,         entityType: "DELIVERY",         entityId: assignmentId,         targetUrl: `/farmer/orders`,         eventKey: `delivery:${assignmentId}:rescheduled`,       },       tx     );   } }  

export async function notifyDeliveryException({   partnerUserId,   farmerId,   assignmentId,   orderNumber,   reason,   tx, }: {   partnerUserId?: string | null;   farmerId?: string | null;   assignmentId: string;   orderNumber: string;   reason: string;   tx?: Prisma.TransactionClient; }) {   if (farmerId) {     
await sendNotification(       {         userId: farmerId,         type: "DELIVERY_EXCEPTION",         title: "Delivery Exception Reported",         message: `Delivery issue reported for #${orderNumber}: ${reason}. Support is reviewing.`,         entityType: "DELIVERY",         entityId: assignmentId,         targetUrl: `/farmer/orders`,         eventKey: `delivery:${assignmentId}:exception`,       },       tx     );   } }  

export async function notifyMachineryDeliveryAssigned({   partnerUserId,   farmerId,   ownerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   partnerUserId: string;   farmerId: string;   ownerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {  
/* Partner */
   
await sendNotification(     {       userId: partnerUserId,       type: "MACHINERY_DELIVERY_ASSIGNED",       title: "Machinery Transport Assigned",       message: `You have been assigned to transport ${machineName} for booking #${bookingNumber}.`,       entityType: "MACHINERY_DELIVERY",       entityId: assignmentId,       targetUrl: `/delivery/orders/${assignmentId}`,       eventKey: `delivery:${assignmentId}:assigned`,     },     tx   );  
/* Farmer */
   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_DELIVERY_ASSIGNED",       title: "Machinery Delivery Partner Assigned",       message: `A driver has been assigned to transport ${machineName} to your farm.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `delivery:${assignmentId}:assigned_farmer`,     },     tx   );  
/* Owner */
   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_DELIVERY_ASSIGNED",       title: "Delivery Partner Dispatched for Machinery",       message: `Driver assigned to pick up ${machineName} (#${bookingNumber}) from your yard.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `delivery:${assignmentId}:assigned_owner`,     },     tx   ); }  

export async function notifyMachineryDeliveryPickedUp({   farmerId,   ownerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_DELIVERY_PICKED_UP",       title: "Machinery En Route",       message: `${machineName} (#${bookingNumber}) was picked up and is en route to your field.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `delivery:${assignmentId}:picked_up`,     },     tx   ); }  

export async function notifyMachineryDeliveryDelivered({   farmerId,   ownerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_DELIVERY_DELIVERED",       title: "Machinery Delivered",       message: `${machineName} (#${bookingNumber}) was delivered. Your rental is ready to begin!`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `delivery:${assignmentId}:delivered`,     },     tx   );   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_DELIVERY_DELIVERED",       title: "Machinery Delivery Complete",       message: `${machineName} (#${bookingNumber}) was safely delivered to the farmer's location.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `delivery:${assignmentId}:delivered_owner`,     },     tx   ); }  

export async function notifyMachineryReturnRequested({   ownerId,   farmerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   ownerId: string;   farmerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_RETURN_REQUESTED",       title: "Machinery Return Requested",       message: `Farmer has requested pickup return for ${machineName} (#${bookingNumber}).`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `machinery:return:${assignmentId}:requested`,     },     tx   ); }  

export async function notifyMachineryReturnPickedUp({   ownerId,   farmerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   ownerId: string;   farmerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_RETURN_PICKED_UP",       title: "Machinery Return In Transit",       message: `${machineName} (#${bookingNumber}) was picked up from farmer and is in transit back to your yard.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `machinery:return:${assignmentId}:picked_up`,     },     tx   ); }  

export async function notifyMachineryReturnCompleted({   ownerId,   farmerId,   bookingId,   assignmentId,   bookingNumber,   machineName,   tx, }: {   ownerId: string;   farmerId: string;   bookingId: string;   assignmentId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_RETURN_COMPLETED",       title: "Machinery Return Confirmed",       message: `${machineName} (#${bookingNumber}) was received and verified by the owner. Rental finalized!`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:return:${assignmentId}:returned`,     },     tx   );   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_RETURN_COMPLETED",       title: "Machinery Returned to Fleet",       message: `${machineName} (#${bookingNumber}) has been restored to your fleet.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/my-machinery`,       eventKey: `machinery:return:${assignmentId}:returned_owner`,     },     tx   ); } 
/* ------------------------------------------------------------- */

/* Machinery Marketplace & Rentals (Phase 24) */

/* ------------------------------------------------------------- */
  

export async function notifyMachineryBookingCreated({   farmerId,   ownerId,   bookingId,   bookingNumber,   machineName,   totalAmount,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   totalAmount: number | string;   tx?: Prisma.TransactionClient; }) {  
/* Notify Owner of new incoming rental request */
   
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_BOOKING_CREATED",       title: "New Machinery Rental Request",       message: `New rental request #${bookingNumber} received for ${machineName} totaling ₹${Number(totalAmount).toFixed(2)}. Review and approve.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `machinery:booking:${bookingId}:created:owner`,     },     tx   );   
/* Notify Farmer of booking request submission */
   return 
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_CREATED",       title: "Rental Request Submitted",       message: `Your rental request #${bookingNumber} for ${machineName} has been submitted to the owner for approval.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:created:farmer`,     },     tx   ); }  

export async function notifyMachineryBookingApproved({   farmerId,   bookingId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   return 
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_APPROVED",       title: "Rental Request Approved",       message: `Good news! Your rental request #${bookingNumber} for ${machineName} has been approved by the owner.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:approved`,     },     tx   ); }  

export async function notifyMachineryBookingRejected({   farmerId,   bookingId,   bookingNumber,   machineName,   reason,   tx, }: {   farmerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   reason?: string;   tx?: Prisma.TransactionClient; }) {   const reasonText = reason ? ` Reason: ${reason}` : "";   return 
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_REJECTED",       title: "Rental Request Declined",       message: `Rental request #${bookingNumber} for ${machineName} was declined by the owner.${reasonText}`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:rejected`,     },     tx   ); }  

export async function notifyMachineryBookingReady({   farmerId,   bookingId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   return 
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_READY",       title: "Machinery Ready for Dispatch",       message: `${machineName} for booking #${bookingNumber} is prepared and ready for pickup/delivery!`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:ready`,     },     tx   ); }  

export async function notifyMachineryBookingActive({   farmerId,   ownerId,   bookingId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_ACTIVE",       title: "Rental Service Active",       message: `Your rental period for ${machineName} (#${bookingNumber}) is now officially active.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:active:farmer`,     },     tx   );    return 
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_BOOKING_ACTIVE",       title: "Machinery Rental Active",       message: `Rental #${bookingNumber} for ${machineName} has commenced.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `machinery:booking:${bookingId}:active:owner`,     },     tx   ); }  

export async function notifyMachineryBookingCompleted({   farmerId,   ownerId,   bookingId,   bookingNumber,   machineName,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   tx?: Prisma.TransactionClient; }) {   
await sendNotification(     {       userId: farmerId,       type: "MACHINERY_BOOKING_COMPLETED",       title: "Rental Completed",       message: `Rental #${bookingNumber} for ${machineName} is marked complete. Thank you for using SmartProcure!`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/farmer/machinery/bookings/${bookingId}`,       eventKey: `machinery:booking:${bookingId}:completed:farmer`,     },     tx   );    return 
await sendNotification(     {       userId: ownerId,       type: "MACHINERY_BOOKING_COMPLETED",       title: "Rental Completed",       message: `Rental #${bookingNumber} for ${machineName} has been finalized and returned.`,       entityType: "MACHINERY_BOOKING",       entityId: bookingId,       targetUrl: `/machinery/bookings`,       eventKey: `machinery:booking:${bookingId}:completed:owner`,     },     tx   ); }  

export async function notifyMachineryBookingCancelled({   farmerId,   ownerId,   bookingId,   bookingNumber,   machineName,   cancelledBy,   tx, }: {   farmerId: string;   ownerId: string;   bookingId: string;   bookingNumber: string;   machineName: string;   cancelledBy: "FARMER" | "OWNER" | "ADMIN";   tx?: Prisma.TransactionClient; }) {  
/* If cancelled by farmer, notify owner */
   if (cancelledBy === "FARMER") {     
await sendNotification(       {         userId: ownerId,         type: "MACHINERY_BOOKING_CANCELLED",         title: "Rental Booking Cancelled",         message: `Farmer cancelled rental booking #${bookingNumber} for ${machineName}.`,         entityType: "MACHINERY_BOOKING",         entityId: bookingId,         targetUrl: `/machinery/bookings`,         eventKey: `machinery:booking:${bookingId}:cancelled:owner`,       },       tx     );   } else {    
/* If cancelled by owner or admin, notify farmer */
     
await sendNotification(       {         userId: farmerId,         type: "MACHINERY_BOOKING_CANCELLED",         title: "Rental Booking Cancelled",         message: `Booking #${bookingNumber} for ${machineName} was cancelled by the ${cancelledBy.toLowerCase()}.`,         entityType: "MACHINERY_BOOKING",         entityId: bookingId,         targetUrl: `/farmer/machinery/bookings/${bookingId}`,         eventKey: `machinery:booking:${bookingId}:cancelled:farmer`,       },       tx     );   } }  
/* --- ADMIN NOTIFICATIONS --- */
  

export async function notifyAdminPaymentIssue({   adminUserId,   transactionId,   amount,   issueDetails,   tx }: {   adminUserId: string;   transactionId: string;   amount: number;   issueDetails: string;   tx?: Prisma.TransactionClient; }) {   
return sendNotification(     {       userId: adminUserId,       type: "ADMIN_PAYMENT_ISSUE",       title: "Critical Payment Issue",       message: `Transaction ${transactionId} for ₹${amount} encountered an issue: ${issueDetails}`,       entityType: "PaymentTransaction",       entityId: transactionId,       targetUrl: `/admin/finance/payments/${transactionId}`,       eventKey: `ADMIN_PAYMENT_ISSUE:${transactionId}:${adminUserId}`,     },     tx   ); }  

export async function notifyAdminSystemAlert({ adminUserId, alertName, message, tx }: { adminUserId: string; alertName: string; message: string; tx?: Prisma.TransactionClient; }) { 
return sendNotification({ userId: adminUserId, type: "ADMIN_SYSTEM_ALERT", title: `System Alert: ${alertName}`, message, targetUrl: "/admin/settings", eventKey: `ADMIN_SYSTEM_ALERT:${alertName}:${adminUserId}:${Date.now()}` }, tx); }
