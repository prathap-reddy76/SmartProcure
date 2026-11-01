import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Readiness probe checks if the application is ready to accept traffic.
// Checks DB connection.
export async function GET() {
  try {
    // A simple query to check DB availability
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    console.error("Readiness check failed: Database connection error. (Raw error suppressed to prevent credential leakage)");
    return NextResponse.json({ status: "unavailable", error: "Database unavailable" }, { status: 503 });
  }
}
