# Disaster Recovery & Backups

## 1. Aiven PostgreSQL Backups
SmartProcure production data is managed via **Aiven PostgreSQL**. Aiven provides continuous automated backups out of the box.

- **RPO (Recovery Point Objective):** Continuous point-in-time recovery (PITR) typically offers an RPO of less than 5 minutes.
- **RTO (Recovery Time Objective):** Dependent on database size, a full restore to a new cluster instance takes approximately 10-30 minutes.

## 2. Secrets & Environment Recovery
Environment variables must be safely stored in the deployment orchestrator (e.g., Vercel Environment Variables, AWS Secrets Manager, Kubernetes Secrets). 
- If an environment is lost, it can be re-provisioned via infrastructure-as-code or manual key rotation (especially Razorpay and Auth secrets).

## 3. Storage Recovery
File storage utilizes the `src/lib/storage` provider interface.
- In production, object storage (e.g., AWS S3, Cloudflare R2) is required.
- Object storage buckets should have versioning enabled.
- Local filesystem storage (`/public/uploads`) is exclusively for development and should **never** be used for production persistent files, as they will be lost during deployment/restarts.

## 4. Rollback Strategy
Application rollback is independent of database rollback.
1. Prisma database migrations are designed to be backward-compatible (e.g., adding columns, rather than destroying them).
2. If a bad application version is deployed, the deployment orchestrator can revert to the previous container/Vercel build immediately, and the application will gracefully continue using the backward-compatible schema.
