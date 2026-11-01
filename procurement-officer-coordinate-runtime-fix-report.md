# SmartProcure — Procurement Officer Coordinate Runtime Fix Report

## Root Cause
A recent serialization fix correctly aimed to prevent `Prisma.Decimal` objects from crossing Next.js Server Action boundaries. However, it incorrectly assumed `centre.latitude` and `centre.longitude` were `Decimal` fields and blindly called `.toNumber()` on them. 

According to the `Prisma` schema, `latitude` and `longitude` are defined as `Float` in the database, meaning Prisma naturally returns them as primitive JavaScript `number`s at runtime. Calling `.toNumber()` on a primitive number resulted in the runtime crash: `centre.latitude.toNumber is not a function`.

## Runtime Type
* `ProcurementCentre.latitude`: `number | null` (from Prisma `Float?`)
* `ProcurementCentre.longitude`: `number | null` (from Prisma `Float?`)
* `ProcurementBooking.expectedQuantity`: `Prisma.Decimal` 

## Fix
A strict and safe normalization helper `toNumberOrNull(value: unknown)` was implemented inside `src/actions/procurement/officer-actions.ts`.

This helper behaves correctly for:
1. `null` or `undefined` (returns `null`)
2. `number` primitives (returns as-is, safely avoiding `.toNumber()` exceptions)
3. `Decimal` objects (safely invokes `.toNumber()` only if it exists in the prototype)
4. Other numeric strings (parsed with `Number(val)`)

This ensures no blind method calls crash the runtime, while still satisfying Next.js Turbopack's strict "Only plain objects can be passed to Client Components" rules for Server Action return values. The identical pattern was also retroactively applied to `src/lib/analytics/core.ts` to prevent future crashes in the analytics dashboards.

## Decimal Audit
I verified the following fields across the codebase:
- `ProcurementBooking.expectedQuantity`: Successfully uses `toNumberOrNull`
- `ProcurementCentre.latitude / longitude`: Successfully uses `toNumberOrNull`
- `ProcurementWeighing.grossWeight / tareWeight`: Properly handled via `Number(val)` in Client Components without crashing.
- `ProcurementPayment.eligibleQuantityKg / netPayableAmount`: Checked via `.map` serialization.

## Security
The `centreId` scoping mechanism remains purely server-side:
`session.user.id -> officerUser.procurementCentre.id -> query`.
The client has no ability to alter the centre scope.

## Database
- Aiven PostgreSQL remains completely unchanged.
- No schema changes or `db push` operations were executed.

## Validation
- `npx prisma validate`: **PASS**
- `npx prisma generate`: **PASS**
- `npm run build`: **PASS**
- `npx tsc --noEmit`: **PASS**

## Runtime
When logged in as `officer@smartprocure.com`:
- `/procurement-officer/dashboard` loads smoothly without `.toNumber is not a function` error.
- `/procurement-officer/bookings/upcoming` loads with safely serialized nested relationships.
- Booking detail renders without hydration/serialization warnings.
- Server console shows no boundary errors.

## Final Status
**READY**
