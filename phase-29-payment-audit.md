# SmartProcure Phase 29 - Payment Audit

## 1. Existing Architecture Overview

**Models Involved:**
- `Order`: Uses `paymentMethod` (enum `PaymentMethod`) and `paymentStatus` (enum `PaymentStatus`).
- `OrderItem`: Stores line totals safely as `Decimal`.
- `ProcurementPayment`: Uses `paymentStatus` (`PaymentStatus`) and string `paymentMethod`. Also stores references like `transactionReference`, `receiptNumber`.
- `ProcurementPaymentAudit`: Tracks status changes for procurement payments.
- `MachineryBooking`: Uses `paymentStatus` (`PaymentStatus`) and `paymentMethod` (`String`).

**Existing Enums:**
- `PaymentStatus`: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`.
- `PaymentMethod`: `COD`, `UPI`.

**Current Flows:**
- Marketplace Orders: Currently handle COD and UPI (placeholders). No real gateway exists.
- Procurement Payouts: Currently handled manually or via bank transfer placeholders. The prompt dictates these remain strictly separate from customer-facing online payments.
- Machinery Rentals: Currently default to `CASH_ON_DELIVERY`.

## 2. Missing Functionality & Required Extensions

The current system lacks:
1. **Payment Transactions Tracking:** No model exists to track external gateway references (e.g. Razorpay Order ID, Razorpay Payment ID, Webhook ID, idempotency keys, refunds).
2. **Missing Payment States:** `CREATED`, `AUTHORIZED`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`, `REFUNDED`, `EXPIRED`.
3. **Gateway Abstraction:** No `src/lib/payments` infrastructure exists to seamlessly switch between Sandbox, Razorpay, or others.
4. **Webhooks & Idempotency:** No webhook ingestion logic or idempotency keys to prevent duplicate payments on double-clicks or repeated webhooks.

## 3. Proposed Schema Changes

1. **Extend `PaymentStatus` Enum:**
   Add `CREATED`, `AUTHORIZED`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`, `REFUNDED`, `EXPIRED`.

2. **Extend `PaymentMethod` Enum:**
   Add `ONLINE`.

3. **New Model `PaymentTransaction`:**
   ```prisma
   model PaymentTransaction {
     id                  String        @id @default(cuid())
     
     // Relations (Polymorphic-ish by optional foreign keys)
     orderId             String?
     order               Order?        @relation(fields: [orderId], references: [id], onDelete: SetNull)
     
     machineryBookingId  String?
     machineryBooking    MachineryBooking? @relation(fields: [machineryBookingId], references: [id], onDelete: SetNull)

     userId              String
     user                User          @relation(fields: [userId], references: [id], onDelete: Restrict)
     
     // Provider Details
     provider            String        // 'RAZORPAY', 'SANDBOX'
     providerOrderId     String?       @unique
     providerPaymentId   String?       @unique
     
     // Financials
     amount              Decimal       @db.Decimal(10, 2)
     currency            String        @default("INR")
     status              PaymentStatus @default(CREATED)
     paymentMethod       PaymentMethod @default(ONLINE)
     
     // Webhook & Safe Retry Controls
     idempotencyKey      String?       @unique
     
     failureReason       String?
     refundId            String?       @unique
     refundAmount        Decimal?      @db.Decimal(10, 2)
     
     paidAt              DateTime?
     createdAt           DateTime      @default(now())
     updatedAt           DateTime      @updatedAt
   }
   ```

4. **New Model `PaymentWebhookEvent`:**
   (Optional but recommended for idempotency)
   ```prisma
   model PaymentWebhookEvent {
     id              String   @id @default(cuid())
     provider        String
     providerEventId String   @unique
     processedAt     DateTime @default(now())
     payload         String   // Safe storage
   }
   ```

## 4. Proposed Architecture Structure

```
src/lib/payments/
  ├── types.ts          # Provider interfaces, payment states
  ├── provider.ts       # Factory to resolve the active provider
  ├── config.ts         # Environment variables & constants
  ├── idempotency.ts    # Safe duplicate-check logic
  ├── verification.ts   # Server-side amount calculators
  ├── reconciliation.ts # Admin status sync
  └── providers/
      ├── razorpay.ts   # Razorpay REST implementation
      └── sandbox.ts    # Sandbox stub for tests/development
```

## 5. Security Mitigations
- **Server-Side Math:** All payment amounts will be recalculated on the server directly from Prisma records before hitting the provider API.
- **Environment Separation:** Use `PAYMENT_ENVIRONMENT=sandbox` unconditionally until real config is loaded.
- **Idempotency:** A unique `idempotencyKey` will be attached per session/order combo so rapid clicks don't spawn multiple Razorpay orders.
- **IDOR Protection:** Payment verification webhooks will authenticate via Hash HMAC (from Razorpay). API routes handling payment initiation will strictly verify `userId` vs `Order.userId`.
