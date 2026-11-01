# SmartProcure — Procurement Officer Upcoming Booking Serialization Fix Report

## Root Cause
Next.js Server Actions (functions exported from files with `"use server"`) enforce a strict serialization boundary. Any object returned from these functions must be a plain, serializable JavaScript object, even when called by a Server Component. 

In the newly implemented Upcoming Bookings feature, two Server Actions were returning non-serializable Prisma types:
1. `getOfficerUpcomingBookings()` was suspected of leaking the `expectedQuantity` Decimal (it has been explicitly mapped using `.toNumber()`).
2. `getOfficerDashboardData()` was returning the raw `ProcurementCentre` object, which contained `latitude` and `longitude` as `Prisma.Decimal`, triggering the same "Only plain objects can be passed..." error in the dashboard.

## Affected Fields
- `ProcurementBooking.expectedQuantity: Decimal`
- `ProcurementCentre.latitude: Decimal`
- `ProcurementCentre.longitude: Decimal`
- Prisma `DateTime` fields mapped to `.toISOString()`

## Fix
The serialization architecture was standardized. Instead of passing raw Prisma records out of the Server Actions:
1. `getOfficerUpcomingBookings()` now explicitly calls `b.expectedQuantity.toNumber()` and `.toISOString()` on dates.
2. `getOfficerDashboardData()` now manually serializes the `centre` object before returning it, converting `latitude`/`longitude` to JavaScript Numbers and dates to ISO strings.
This ensures only Plain Data Transfer Objects (DTOs) cross the boundary, satisfying the Turbopack/Next.js Flight serialization constraints.

## Files Changed
- `src/actions/procurement/officer-actions.ts`

## Security
Authorization remains completely intact. The `centreId` is strictly resolved on the server via `session.user.id -> officer.procurementCentreId`. The client never provides or overrides the `centreId`.

## Database
- Aiven PostgreSQL remains completely unchanged.
- No schema changes or `db push` operations were executed.

## Validation
- `npx prisma validate`: **PASS**
- `npx prisma generate`: **PASS**
- `npx tsc --noEmit`: **PASS**
- `npm run build`: **PASS**

## Runtime
When accessed with `officer@smartprocure.com`:
- `/procurement-officer/dashboard` loads perfectly without boundary errors.
- `/procurement-officer/bookings/upcoming` loads and renders the DTOs cleanly.
- Booking details open seamlessly.
- Server console shows zero Decimal serialization errors.
