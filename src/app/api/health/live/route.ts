import { NextResponse } from "next/server";

// Liveness probe strictly checks if the process is up and handling requests.
// It explicitly does NOT check DB or external services.
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }, { status: 200 });
}
