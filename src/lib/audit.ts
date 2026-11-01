import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type AuditAction = 
  | "USER_LOGIN" 
  | "USER_REGISTER" 
  | "ROLE_CHANGE" 
  | "ORDER_CREATE" 
  | "ORDER_STATUS_UPDATE" 
  | "PRODUCT_CREATE" 
  | "PRODUCT_UPDATE" 
  | "PRODUCT_DELETE"
  | "BOOKING_CREATE"
  | "BOOKING_STATUS_UPDATE"
  | "QUALITY_INSPECTED"
  | "PAYMENT_PROCESSED"
  | "DELIVERY_ASSIGNED"
  | "DELIVERY_STATUS_UPDATE"
  | "MACHINERY_BOOKED"
  | "MACHINERY_STATUS_UPDATE"
  | "SETTINGS_UPDATE";

interface AuditLogOptions {
  actorUserId?: string;
  actorRole?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditData(options: AuditLogOptions) {
  try {
    const headersList = await headers();
    
    // Attempt to safely extract IP and UserAgent if available
    let ipAddress = null;
    let userAgent = null;

    try {
      ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
      if (ipAddress) {
        ipAddress = ipAddress.split(",")[0].trim();
      }
      userAgent = headersList.get("user-agent");
    } catch {
      // In some server contexts (like background jobs), headers are not available
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: options.actorUserId,
        actorRole: options.actorRole,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never break the main transaction, so we just log to console
    console.error("Failed to write audit log:", error);
  }
}
