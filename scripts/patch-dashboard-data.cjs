const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "actions", "delivery", "delivery-actions.ts");
let content = fs.readFileSync(filePath, "utf8");

const oldPattern = /const defaultMetrics: DeliveryDashboardMetrics = \{[\s\S]*?recentDeliveries,\s+\};\s+\} catch \(error\) \{/;

const newCode = `const defaultMetrics: DeliveryDashboardMetrics = {
    totalAssignedDeliveries: 0,
    pendingDeliveries: 0,
    pickupsAwaitingCollection: 0,
    inProgressDeliveries: 0,
    completedDeliveries: 0,
    availableDeliveries: 0,
    assignedDeliveries: 0,
    pickedUpDeliveries: 0,
    outForDeliveryCount: 0,
    deliveredCount: 0,
    activeDeliveriesCount: 0,
    maxActiveLimit: DEFAULT_MAX_ACTIVE,
    exceptionCount: 0,
    returnedCount: 0,
  };

  try {
    const { partner } = await getAuthorizedDeliveryPartner(testPartnerUserId);

    // 1. Available deliveries: Orders ready without partner assignment + Machinery rental/returns pending
    const availableOrdersCount = await prisma.order.count({
      where: {
        status: "READY_FOR_DELIVERY",
        deliveryAssignment: null,
      },
    });

    const unassignedAssignmentsCount = await prisma.deliveryAssignment.count({
      where: {
        deliveryPartnerId: null,
        status: { in: ["PENDING_ASSIGNMENT", "RETURN_REQUESTED"] },
      },
    });

    const totalAvailable = availableOrdersCount + unassignedAssignmentsCount;

    // 2. Partner's assignments
    const assignments = await prisma.deliveryAssignment.findMany({
      where: { deliveryPartnerId: partner.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    shop: true,
                  },
                },
              },
            },
          },
        },
        machineryBooking: {
          include: {
            machinery: true,
            farmer: { select: { id: true, name: true, phone: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let assignedCount = 0;
    let pickedUpCount = 0;
    let outForDeliveryCount = 0;
    let deliveredCount = 0;
    let exceptionCount = 0;
    let returnedCount = 0;

    for (const a of assignments) {
      if (a.status === "ASSIGNED") assignedCount++;
      else if (a.status === "PICKED_UP") pickedUpCount++;
      else if (a.status === "OUT_FOR_DELIVERY" || a.status === "IN_TRANSIT") outForDeliveryCount++;
      else if (a.status === "DELIVERED") deliveredCount++;
      else if (a.status === "EXCEPTION") exceptionCount++;
      else if (a.status === "RETURNED") returnedCount++;
    }

    const activeCount = assignedCount + pickedUpCount + outForDeliveryCount;

    const recentDeliveries: PartnerDeliverySummary[] = assignments.slice(0, 20).map((a) => {
      const isMachinery = a.deliveryType === "MACHINERY_RENTAL" || a.deliveryType === "MACHINERY_RETURN";
      const booking = a.machineryBooking;
      const order = a.order;

      const orderNumber = isMachinery
        ? booking?.bookingNumber || "MCH-RENTAL"
        : order?.orderNumber || "ORD-UNKNOWN";

      const customerName = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? booking?.owner.name || "Owner" : booking?.farmer.name || "Farmer")
        : order?.shippingName || "Customer";

      const customerPhone = isMachinery
        ? (a.deliveryType === "MACHINERY_RETURN" ? booking?.owner.phone || "N/A" : booking?.farmer.phone || "N/A")
        : order?.shippingPhone || "N/A";

      const deliveryAddress = a.dropAddress || (order ? order.shippingAddress : (booking?.deliveryAddress || "Field Address"));
      const deliveryArea = order
        ? [order.shippingVillage, order.shippingDistrict].filter(Boolean).join(", ") || "Local Area"
        : (booking?.machinery.location || "Local Area");

      const totalAmount = isMachinery
        ? Number(booking?.totalAmount || 0)
        : Number(order?.totalAmount || 0);

      const itemsList = order
        ? order.items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
          }))
        : isMachinery && booking
        ? [{ name: booking.machinery.name, quantity: 1 }]
        : [];

      const itemsSummary = itemsList.map((i) => \`\${i.name} (x\${i.quantity})\`).join(", ");

      const firstShop = order?.items[0]?.product?.shop;
      const pickupAddress = a.pickupAddress || (firstShop ? \`\${firstShop.name}, \${firstShop.address}, \${firstShop.district || ""}\` : (isMachinery ? (booking?.machinery.address || booking?.machinery.location || "Machinery Yard") : "Store Pickup"));

      const itemCount = isMachinery ? 1 : (order ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0);

      return {
        assignmentId: a.id,
        deliveryType: a.deliveryType,
        orderId: a.orderId,
        machineryBookingId: a.machineryBookingId,
        orderNumber,
        status: a.status,
        overallOrderStatus: order?.status || null,
        customerName,
        customerPhone,
        pickupAddress,
        deliveryAddress,
        deliveryArea,
        pincode: order?.shippingPincode || null,
        totalAmount,
        paymentMethod: order?.paymentMethod || "COD",
        paymentStatus: order?.paymentStatus || "PAID",
        deliveryWindow: a.deliveryWindow,
        estimatedDistanceKm: a.estimatedDistanceKm,
        assignedAt: a.assignedAt?.toISOString() || a.createdAt.toISOString(),
        pickedUpAt: a.pickedUpAt?.toISOString() || null,
        outForDeliveryAt: a.outForDeliveryAt?.toISOString() || null,
        deliveredAt: a.deliveredAt?.toISOString() || null,
        itemCount,
        itemsSummary,
        itemsList,
        deliveryExceptionReason: a.deliveryExceptionReason,
      };
    });

    return {
      profile: {
        id: partner.id,
        userId: partner.userId,
        name: partner.user.name || "Delivery Partner",
        email: partner.user.email || "",
        phone: partner.phone || partner.user.phone || null,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        vehicleCapacity: partner.vehicleCapacity,
        serviceArea: partner.serviceArea,
        maxActiveDeliveries: partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
        isAvailable: partner.isAvailable,
        isActive: partner.isActive,
        lastKnownLat: partner.lastKnownLat,
        lastKnownLon: partner.lastKnownLon,
      },
      metrics: {
        totalAssignedDeliveries: assignments.length,
        pendingDeliveries: assignedCount,
        pickupsAwaitingCollection: assignedCount,
        inProgressDeliveries: pickedUpCount + outForDeliveryCount,
        completedDeliveries: deliveredCount + returnedCount,
        availableDeliveries: totalAvailable,
        assignedDeliveries: assignedCount,
        pickedUpDeliveries: pickedUpCount,
        outForDeliveryCount,
        deliveredCount,
        activeDeliveriesCount: activeCount,
        maxActiveLimit: partner.maxActiveDeliveries || DEFAULT_MAX_ACTIVE,
        exceptionCount,
        returnedCount,
      },
      recentDeliveries,
    };
  } catch (error) {`;

if (!oldPattern.test(content)) {
  console.error("Pattern not found in delivery-actions.ts");
  process.exit(1);
}

content = content.replace(oldPattern, newCode);
fs.writeFileSync(filePath, content, "utf8");
console.log("Successfully updated getDeliveryDashboardData in delivery-actions.ts");
