# Production Deployment Guide

## 1. Prerequisites
- Node.js v20+
- Aiven PostgreSQL Cluster (with PgBouncer enabled for connection pooling).
- S3-compatible Object Storage.
- Live Razorpay Credentials.
- Production domain with HTTPS enabled.

## 2. Environment Variables
You must strictly provide the following environment variables (validated at boot via `src/lib/env.ts`):
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public&pgbouncer=true
AUTH_SECRET=generate_a_secure_random_string
APP_URL=https://www.smartprocure.com
WEATHER_API_KEY=your_openmeteo_key
AI_PROVIDER=GEMINI
AI_API_KEY=your_gemini_key
PAYMENT_ENVIRONMENT=production
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=live_key
RAZORPAY_KEY_SECRET=live_secret
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret
STORAGE_PROVIDER=s3
```

## 3. Database Migration
Database schema updates must be backward-compatible.
Use:
```bash
npx prisma migrate deploy
```
**NEVER** run `prisma db push --accept-data-loss` or `prisma migrate reset` in production.

## 4. Build and Start
Build the application:
```bash
npm run build
```
Start the application clusters (e.g. using PM2, Docker, or serverless provider):
```bash
npm run start
```

## 5. Security & Observability
- **Security Headers:** Automatically injected via `src/middleware.ts` (HSTS, NoSniff, X-Frame-Options).
- **Correlation IDs:** Every request gets an `x-correlation-id` header for log traceability.
- **Graceful Shutdown:** The Next.js server closes connections gracefully. Ensure your container orchestrator (e.g. Kubernetes) waits for the `SIGTERM` signal to complete before force-killing.
- **Health Checks:** Container orchestration should query `/api/health/live` for liveness probes, and `/api/health/ready` for readiness probes.

## 6. Background Workers & Cron
SmartProcure utilizes a unified scheduler abstraction `src/lib/jobs`. Ensure that your deployment triggers specific cron routes/functions (using tools like Vercel Cron or a dedicated worker pod) to handle tasks like Payment Reconciliation and Queue Cleanup.
