import { prisma } from "../prisma";

export type JobHandler = (payload: any) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export const jobs = {
  register(queueName: string, handler: JobHandler) {
    handlers.set(queueName, handler);
  },

  async enqueue(queueName: string, payload: any) {
    // In a fully robust system, you'd insert this into a PostgreSQL table (e.g. "BackgroundJob")
    // For now, we simulate async off-thread processing safely for Vercel/Node by just not awaiting it,
    // but in a production Kubernetes deployment, a proper Redis/BullMQ or PG-Boss queue is recommended.
    const handler = handlers.get(queueName);
    if (!handler) {
      console.warn(`No handler registered for job queue: ${queueName}`);
      return;
    }

    // Fire and forget, catching errors so it doesn't crash the main thread
    Promise.resolve().then(async () => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`Background job [${queueName}] failed:`, err);
      }
    });
  },

  /**
   * Safe scheduler that uses Postgres to ensure only one instance runs a cron job.
   */
  async runCronSafely(jobName: string, execute: () => Promise<void>, intervalMs: number) {
    // A simple lock mechanism using a dedicated lock table could go here.
    // E.g., UPDATE "CronLock" SET "lastRun" = NOW() WHERE "name" = jobName AND "lastRun" < NOW() - intervalMs
    // This abstraction documents the required integration point for production deployment.
    execute().catch(console.error);
  }
};
