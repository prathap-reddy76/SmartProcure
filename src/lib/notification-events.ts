import { Client } from "pg";
import { prisma } from "./prisma";
import { env } from "./env";

export type NotificationCategory = "procurement" | "orders" | "delivery" | "machinery" | "system";

export interface RealtimeNotificationEvent {
  notificationId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  targetUrl?: string | null;
  createdAt: string;
  userId: string; // added to identify the target in broadcast
}

export type NotificationSubscriber = (event: RealtimeNotificationEvent) => void;

const globalForNotifications = globalThis as unknown as {
  notificationSubscribers?: Map<string, Set<NotificationSubscriber>>;
  pgListener?: Client;
  isIntentionalShutdown?: boolean;
};

const subscribers =
  globalForNotifications.notificationSubscribers ??
  new Map<string, Set<NotificationSubscriber>>();

if (process.env.NODE_ENV !== "production") {
  globalForNotifications.notificationSubscribers = subscribers;
}

const instanceId = require("crypto").randomUUID();

// PostgreSQL Pub/Sub Implementation for horizontal scalability
export function setupPgListener() {
  if (globalForNotifications.pgListener || typeof window !== "undefined") return;

  // Do not connect during Next.js build phase
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.argv.includes('build')) return;

  globalForNotifications.isIntentionalShutdown = false;

  let connectionString = env.DATABASE_URL;
  try {
    const parsed = new URL(env.DATABASE_URL);
    parsed.search = "";
    connectionString = parsed.toString();
  } catch {
    connectionString = env.DATABASE_URL.split("?")[0];
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  // Assign immediately to prevent multiple setup calls
  globalForNotifications.pgListener = client;

  client.connect().then(() => {
    console.log("Connected to PostgreSQL for LISTEN/NOTIFY pub/sub");
    client.query("LISTEN smartprocure_notifications");
  }).catch((err) => {
    console.error("Failed to connect pg listener:", err);
    globalForNotifications.pgListener = undefined;
    if (!globalForNotifications.isIntentionalShutdown) {
      setTimeout(setupPgListener, 5000);
    }
  });

  client.on("notification", (msg) => {
    if (msg.channel === "smartprocure_notifications" && msg.payload) {
      try {
        const event = JSON.parse(msg.payload);
        if (event.__instanceId === instanceId) return; // ignore our own broadcast
        
        const userSubs = subscribers.get(event.userId);
        if (userSubs) {
          for (const listener of userSubs) {
            listener(event as RealtimeNotificationEvent);
          }
        }
      } catch (e) {
        console.error("Failed to parse incoming notification:", e);
      }
    }
  });

  client.on("error", (err) => {
    console.error("PostgreSQL Listener Error:", err);
    globalForNotifications.pgListener = undefined;
    // Simple reconnect logic
    if (!globalForNotifications.isIntentionalShutdown) {
      setTimeout(setupPgListener, 5000);
    }
  });
}

export function getNotificationCategory(type: string): NotificationCategory {
  if (type.startsWith("PROCUREMENT_") || type === "MARKET_PRICE_ALERT") return "procurement";
  if (type.startsWith("ORDER_")) return "orders";
  if (type.startsWith("DELIVERY_")) return "delivery";
  if (type.startsWith("MACHINERY_")) return "machinery";
  return "system";
}

/**
 * Publishes a real-time notification event via Postgres NOTIFY to reach all instances.
 */
export async function publishNotificationEvent(
  userId: string,
  event: Omit<RealtimeNotificationEvent, "userId">
): Promise<void> {
  const fullEvent = { ...event, userId, __instanceId: instanceId };
  const payload = JSON.stringify(fullEvent);
  
  // Dispatch locally immediately for synchronous listeners (e.g. tests)
  const userSubs = subscribers.get(userId);
  if (userSubs) {
    for (const listener of userSubs) {
      listener(fullEvent as RealtimeNotificationEvent);
    }
  }

  // Use Prisma to send NOTIFY for cross-instance
  try {
    await prisma.$executeRaw`SELECT pg_notify('smartprocure_notifications', ${payload})`;
  } catch (err) {
    console.error("Failed to publish pg notification:", err);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: NotificationSubscriber
): () => void {
  // Lazily initialize Postgres listener when a user actually connects
  setupPgListener();

  if (!subscribers.has(userId)) {
    subscribers.set(userId, new Set());
  }

  const userSubs = subscribers.get(userId)!;
  userSubs.add(callback);

  return () => {
    userSubs.delete(callback);
    if (userSubs.size === 0) {
      subscribers.delete(userId);
    }
    // Note: We intentionally leave the PG listener active even if subscribers hit 0,
    // to avoid connection churn. It will be closed on app shutdown.
  };
}

export function getActiveSubscriberCount(userId?: string): number {
  if (userId) return subscribers.get(userId)?.size ?? 0;
  let total = 0;
  for (const set of subscribers.values()) total += set.size;
  return total;
}

export function clearAllSubscribers(): void {
  subscribers.clear();
}

export async function closePgListener(): Promise<void> {
  globalForNotifications.isIntentionalShutdown = true;
  const client = globalForNotifications.pgListener;
  if (client) {
    globalForNotifications.pgListener = undefined;
    try {
      client.removeAllListeners();
      await client.end();
      console.log("Closed PostgreSQL LISTEN/NOTIFY connection");
    } catch (err) {
      console.error("Error closing pg listener:", err);
    }
  }
}
