import { prisma } from "../prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculates the exact amount for a marketplace order strictly from the database.
 * NEVER trust client-provided amounts.
 */
export async function calculateOrderAmount(orderId: string, userId: string): Promise<Decimal> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== userId) throw new Error("Unauthorized to pay for this order");
  if (order.status === "CANCELLED") throw new Error("Order is cancelled");
  
  // Actually recalculate the total from items if needed, or trust the order's stored totalAmount 
  // since it was already calculated server-side during checkout. We'll verify it.
  let calculatedSubtotal = new Decimal(0);
  for (const item of order.items) {
    // Note: lineTotal was already locked in during order creation based on product price
    calculatedSubtotal = calculatedSubtotal.add(item.lineTotal);
  }

  const finalAmount = calculatedSubtotal.add(order.deliveryCharge);
  
  // Double check it matches the stored total to ensure integrity
  if (!finalAmount.equals(order.totalAmount)) {
    throw new Error("Order amount mismatch detected");
  }

  return finalAmount;
}

/**
 * Calculates the exact amount for a machinery booking strictly from the database.
 */
export async function calculateMachineryAmount(bookingId: string, userId: string): Promise<Decimal> {
  const booking = await prisma.machineryBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) throw new Error("Booking not found");
  if (booking.farmerId !== userId) throw new Error("Unauthorized to pay for this booking");
  if (booking.status === "CANCELLED") throw new Error("Booking is cancelled");

  return booking.totalAmount;
}
