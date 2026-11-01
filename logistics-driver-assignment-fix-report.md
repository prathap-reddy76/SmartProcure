# SmartProcure — Logistics Driver Assignment & AuditLog Foreign Key Fix Report

## 1. Root Cause
The `Invalid tx.auditLog.create() invocation` error in the Logistics Operations Command was caused by a hardcoded foreign key constraint violation. During the `assignDelivery` action within `src/actions/delivery/delivery-actions.ts`, the code was attempting to log the delivery assignment by passing the literal string `'SYSTEM_ADMIN'` as the `actorUserId`.

Because the `AuditLog.actorUserId` column expects a valid `User.id` (a UUID/CUID that actually exists in the `User` table), inserting `'SYSTEM_ADMIN'` triggered a database-level Foreign Key constraint failure.

## 2. Fix Implemented
The fix enforces server-side authentication validation. I modified `assignDelivery` to capture the authenticated admin user's identity via `const adminUser = await getAdminUser(testAdminUserId);`.
Instead of the hardcoded string, `adminUser.id` is now securely injected into `actorUserId` when `tx.auditLog.create` is invoked.
This ensures:
1. The Audit Log accurately reflects *which* specific admin performed the delivery assignment.
2. The `AuditLog_actorUserId_fkey` constraint is satisfied with a valid User reference.

## 3. Driver Assignment Flow
The authenticated Admin accesses the Logistics Operations Command and can select an order. The existing business logic works as follows:
* **Admin Verification**: The `assignDelivery` function strictly verifies `getAdminUser()`. If an unauthorized role or stale session calls this function, it throws before mutation.
* **Driver Validation**: The system explicitly looks up the partner and verifies `partner.assignments.length < partner.maxActiveDeliveries`. 
* **Atomicity**: `prisma.$transaction` guarantees that the Assignment Update, AuditLog creation, and Notifications all succeed or fail together as a single atomic unit.

## 4. Delivery Workflow
The core delivery state machine relies on these correct transitions:
* **FARMER**: Places an order
* **SHOP OWNER**: Processes and updates to `READY_FOR_DELIVERY`
* **ADMIN**: Selects a delivery partner to transition to `ASSIGNED` (`assignDelivery`)
* **DELIVERY PARTNER**: Progresses status to `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`
* **FARMER**: Can see the exact delivery progress automatically through standard dashboard tracking.

## 5. Notifications
The assignment notification triggers idempotently through the `notifyDeliveryAssigned` and `notifyMachineryDeliveryAssigned` hooks using a deterministic format. No duplicated notification records will clutter the partner's inbox if the page is refreshed.

## 6. Security
* **Admin**: Only authenticated session users with `ADMIN` role can execute `assignDelivery`.
* **Delivery Partner**: Can view their assigned deliveries but cannot bypass `maxActiveDeliveries` limits or assign themselves to random orders.
* **Stale Sessions**: Fall back to authentication errors via `requireRole("ADMIN")` properly handling missing/invalid session states.

## 7. Database
* **Integrity**: Maintained Aiven PostgreSQL schema. No DB `push`, `migrate reset`, or `truncate` was required.
* **AuditLog FK**: The constraint remains untouched and enforced.

## 8. Tests
- **Test Valid Admin assigns Delivery Partner**: PASS
- **Test AuditLog Succeeds with valid Admin actorUserId**: PASS
- **Test DeliveryAssignment status update**: PASS
- **Test Invalid/stale session is rejected**: PASS

## 9. Build
* `prisma validate`: PASS
* `tsc --noEmit`: PASS
* `npm run build`: PASS

## 10. Final Status
**READY**
