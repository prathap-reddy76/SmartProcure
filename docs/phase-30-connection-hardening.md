# Phase 30 — PostgreSQL Connection Exhaustion & LISTEN/NOTIFY Hardening

## 1. Root Cause
The `Too many database connections opened: FATAL` error occurred during `next build` because the PostgreSQL `LISTEN/NOTIFY` client (`pgListener`) was being initialized at the module scope in `src/lib/notification-events.ts`. Next.js spawns up to 11 concurrent workers during static page generation. Because the module was evaluated in every worker, each worker independently initialized its own Prisma instance (with a default connection pool size of ~17) **plus** a dedicated persistent PostgreSQL socket for listening. This combination (11 * 17 + 11 = 198 connections) rapidly exceeded the Aiven PostgreSQL connection limit reserved for non-superusers.

## 2. Files Changed
- `src/lib/notification-events.ts`

## 3. LISTEN/NOTIFY Lifecycle
- **Initialization**: `setupPgListener()` is now executed *lazily* only when a user actually connects to the SSE stream via `subscribeToUserNotifications()`, rather than blindly at import time.
- **Singleton Behavior**: The module correctly tracks `globalForNotifications.pgListener` to prevent multiple initialization calls within the same Node process, even if multiple users connect concurrently.
- **Reconnect Behavior**: If the PostgreSQL socket drops, it waits 5 seconds and attempts to reconnect, **unless** `isIntentionalShutdown` is true.
- **Shutdown**: The new `closePgListener()` function explicitly sets `isIntentionalShutdown = true`, clears all active reconnect handlers (`client.removeAllListeners()`), and executes `client.end()`. This behaves idempotently.

## 4. Build Worker Behavior
Build workers no longer initialize persistent listeners. The `setupPgListener()` function includes a short-circuit if `process.env.NEXT_PHASE === 'phase-production-build'` or if the command line arguments include `build`. More importantly, because initialization is now lazy, the static generation routes do not trigger the listener anyway since no SSE subscriptions occur during static pre-rendering.

## 5. Prisma Connection Management
`PrismaClient` is correctly singleton-scoped inside `src/lib/prisma.ts` using `globalForPrisma`. However, during `next build`, Next.js intentionally spins up isolated worker processes that do not share globals. Therefore, each worker creates its own Prisma instance. Prisma defaults its connection pool size to `(num_physical_cpus * 2) + 1`. This behavior is expected and safe *provided* no extra rogue connections are held open, which was the case with the module-scoped `pgListener`.

## 6. Aiven Connection Usage
The project currently uses **direct PostgreSQL connections** (`DATABASE_URL` connects directly to port `21161`). PgBouncer (Aiven connection pooling) is not currently configured.

**Expected Connection Usage:**
`Application instance count (e.g., 3) × expected Prisma connections (e.g., 10) + persistent LISTEN connection (1 per instance) = 33 connections.`
**Recommendation:** If the application scales horizontally to >5 instances, it is highly recommended to append `&connection_limit=5` to the `DATABASE_URL` in `.env` to restrict Prisma's default pool size, or to enable PgBouncer in the Aiven console and update the port.

## 7. Multi-Instance Test
Created and executed `scratch/test-multi-instance.ts` simulating two instances:
```text
Starting multi-instance LISTEN/NOTIFY test...
Connected to PostgreSQL for LISTEN/NOTIFY pub/sub
Instance B publishing notification...
Instance A received notification: {
  notificationId: 'notif-test-1',
  ...
  message: 'Hello from Instance B',
}
✅ PASS: Instance A received Instance B notification!
Closed PostgreSQL LISTEN/NOTIFY connection
Cleanup complete.
```

## 8. Connection Cleanup Test
Created and executed `scratch/test-connections.ts` which queried `pg_stat_activity`:
```text
Fetching initial connection count...
Initial connections: 2
Starting listener...
Connected to PostgreSQL for LISTEN/NOTIFY pub/sub
Connections while listening: 3
Stopping listener and cleaning up...
Closed PostgreSQL LISTEN/NOTIFY connection
Connections after cleanup: 2
```

## 9. Cache & Rate Limiting
- **CACHE:**
  - Current implementation: In-memory `Map` with TTL (`src/lib/cache/index.ts`).
  - Production-safe across multiple instances: **NO** (Not shared. Instance A cache != Instance B cache).
- **RATE LIMITING:**
  - Current implementation: In-memory array of timestamps (`src/lib/rate-limit/index.ts`).
  - Production-safe across multiple instances: **NO** (Rate limits are currently bypassed if a user hits a different instance via the load balancer).

*Note: Redis implementation is documented as an upcoming Phase 30 necessity but is currently just a stub.*

## 10. Pagination Audit
Heavy admin queries in the codebase were audited. 
- Most admin listing routes (like `admin/finance/payments`) correctly implement pagination via `take`, `skip`, and Prisma counts.
- `src/actions/admin/admin-analytics.ts` uses time-bounded aggregations (`createdAt: { gte, lte }`) which is safe.
- **Minor Issue:** The initial fetch in `src/actions/delivery.ts` (`getAvailableDeliveries`) queries assignments with `status = 'PENDING'` without a strict limit, which is safe initially but could grow if pending deliveries pile up.

## 11. Test Results
- **TypeScript:** `0 errors` (`npx tsc --noEmit`)
- **Build Result:** `Successful` (0 FATAL connection exhaustion errors)
- **Test Suites:** `15` passed
- **Tests Count:** `54/54` passed
- **Multi-Instance Result:** `PASS`
- **Connection Test Result:** `PASS`

## 12. Remaining Risks
1. **In-Memory Cache/Rate-Limiter:** As noted in Task 9, the current memory-based stubs for rate limiting (especially Gemini AI safety limits) will fail to protect the system properly if deployed to multiple distinct Vercel/Node instances.
2. **Missing PgBouncer Configuration:** Direct connections without a hard `connection_limit` string could still exhaust the DB on heavy scale-out events.

## 13. Phase 30 Completion Status
READY FOR PHASE 31
