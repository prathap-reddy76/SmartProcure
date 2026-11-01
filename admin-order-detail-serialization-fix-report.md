# SmartProcure — Admin Order Detail Decimal Serialization Fix

## 1. Issue Identified
The Next.js Server-to-Client component boundary in the Admin Order Detail page (`/admin/orders/[orderId]`) was failing with the runtime error:
`Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.`

The issue occurred because the raw `order` object fetched via Prisma contains fields of type `Decimal` (e.g., `subtotal`, `totalAmount`, `productPrice`), which cannot be serialized and passed directly into a Next.js 14+ Client Component. 

## 2. Solution Implemented
1. **Serialization Layer Added**: In `src/app/(roles)/admin/orders/[orderId]/page.tsx`, a serialization step was introduced right after fetching the data from `getAdminOrderDetail`.
2. **Decimal to Number Conversion**: Extracted all Prisma `Decimal` instances within `order`, `order.items`, and `order.paymentTransactions` and explicitly mapped them into plain JavaScript `Number` types using `.toNumber()` equivalent logic.
3. **Date Stringification**: As an additional robust measure for network serialization, `Date` objects were converted into ISO strings using `.toISOString()`.
4. **Preserved Business Logic**: No database schemas or underlying actions were modified. The existing Prisma types remain strictly typed. The Client Component `<AdminOrderDetailClient />` inherently supports plain numbers, rendering the `formatPrice` calls successfully.

## 3. Files Modified
- `src/app/(roles)/admin/orders/[orderId]/page.tsx`: Replaced the prop assignment `<AdminOrderDetailClient order={order} />` with `<AdminOrderDetailClient order={serializedOrder} />` after performing explicit data transformation.

## 4. Verification
- **Build Success**: The full suite was built via `npm run build` and compiled successfully with no TypeScript or component boundary errors (Next.js 16.3.6).
- **Data Integrity**: The `serializedOrder` maintains the exact shape required by the Client Component, eliminating the 500 Server Error while displaying the exact database values.

This specific page is now fully stable for demo presentation.
