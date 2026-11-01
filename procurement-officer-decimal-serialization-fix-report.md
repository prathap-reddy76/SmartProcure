# SmartProcure — Procurement Officer Decimal Serialization Fix Report

## Root Cause
The `Only plain objects can be passed to Client Components... Decimal objects are not supported` error occurred because the raw `booking` object from Prisma included `booking.payment` and `booking.qualityInspection` which contained database `Decimal` values. These relations were being passed directly as props into the `<OfficerActionsPanel />` Client Component on the `/procurement-officer/bookings/[bookingId]` page. Next.js App Router enforces a strict serialization boundary that prevents complex non-standard objects like Prisma's `Decimal` from passing into Client Components.

## Affected Fields
During the audit of the Prisma schema and the query returned on this page, the following non-serializable fields were identified:

**ProcurementQualityInspection (Decimal):**
- `moisturePercentage`
- `acceptedQuantity`
- `rejectedQuantity`

**ProcurementPayment (Decimal):**
- `eligibleQuantityKg`
- `pricePerKg`
- `grossAmount`
- `deductionAmount`
- `netPayableAmount`

**Date Fields also stringified for safety:**
- `qualityInspection`: `inspectedAt`, `createdAt`, `updatedAt`
- `payment`: `paidAt`, `createdAt`, `updatedAt`

## Fix Implemented
In `src/app/(roles)/procurement-officer/bookings/[bookingId]/page.tsx`, I introduced a serialization wrapper directly inside the `<OfficerActionsPanel />` props assignment. 
* All `Decimal` values were explicitly cast to standard JS numbers using `Number(val)`.
* All `Date` fields were converted securely into ISO strings using `.toISOString()`.
This approach conforms to the existing project convention, preserving exact DB precision rendering without resorting to `any` type overrides.

## Files Changed
- `src/app/(roles)/procurement-officer/bookings/[bookingId]/page.tsx`

## Security
- The `requireRole("PROCUREMENT_OFFICER")` authorization check remains fully intact.
- The Procurement Centre scoping check (`booking.centreId !== officer.procurementCentreId`) is completely unaffected.
- No database queries were moved to the Client Component. The data fetch remains strictly server-side.

## Database
- **Aiven PostgreSQL unchanged**: No schema changes, no migrations, no `db push`.
- The database `Decimal` column types remain completely unaltered.
- Demo data was entirely preserved.

## Validation
- **Prisma Validate**: PASS
- **TypeScript (`tsc --noEmit`)**: PASS
- **ESLint**: PASS
- **Production Build**: PASS (`npm run build` compiled successfully without boundary errors).

## Runtime & Regression
- The `/procurement-officer/dashboard` functions normally.
- The `bookings/[bookingId]` page successfully loads and passes data into `<OfficerActionsPanel />`.
- `Quality Inspection` and `Payment` details correctly display their numerical values (e.g., `Net Payable: ₹...`).
- The action buttons and forms in the Client Component accurately update the booking's timeline workflow (Arrived → Weighing → Quality Inspection → Settlement).
- No `Decimal objects are not supported` or hydration errors appear in the server console or browser.

## Final Status
**READY**
