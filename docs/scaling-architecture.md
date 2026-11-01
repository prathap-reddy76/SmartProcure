# Scaling Architecture

SmartProcure is designed to scale horizontally across multiple stateless containers/instances.

## 1. Stateless Design
- **Session State:** Managed entirely by NextAuth (JWT cookies). No server-side session affinity is required.
- **Cache:** Utilizes a `CacheProvider` abstraction (`src/lib/cache/index.ts`). Short-lived memory caching is permitted for low-frequency queries (e.g., weather updates), but any distributed locks or long-lived caches should be pointed to a durable Redis instance.
- **Background Jobs:** Utilizes `src/lib/jobs/index.ts`. Fire-and-forget logic is abstracted to allow integration with robust task queues like BullMQ or PG-Boss in production.

## 2. Notification Pub/Sub & SSE
- The `src/lib/notification-events.ts` abstraction implements **PostgreSQL LISTEN/NOTIFY**.
- When an application instance broadcasts a notification via Prisma `$executeRawUnsafe("NOTIFY ...")`, all connected Node instances receive the payload via `pg.Client` and push it to their respective Server-Sent Events (SSE) subscribers.
- **Benefit:** No Redis cluster required; full horizontal scalability for real-time alerts.

## 3. Database Scaling
- SmartProcure relies on a singleton Prisma Client (`src/lib/prisma.ts`).
- **Connection Pooling:** When deploying multiple Next.js instances, connection exhaustion is a primary risk. We require **PgBouncer** (natively supported by Aiven PostgreSQL) or Prisma Accelerate to handle connection multiplexing safely.

## 4. Rate Limiting
- The `src/lib/rate-limit/index.ts` limits requests (like AI chat generation). In a scaled environment, this interface can be mapped to Redis to ensure rate limits are globally respected.
