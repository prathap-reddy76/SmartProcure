import { auth } from "@/lib/auth";
import { subscribeToUserNotifications } from "@/lib/notification-events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) route for real-time user notification streaming (Phase 23).
 * Strictly authenticates requests via NextAuth session.
 * Never trusts client-supplied user IDs.
 */
export async function GET(req: Request) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    let cleanup: (() => void) | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        try {
          const initPayload = JSON.stringify({
            status: "connected",
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(
            encoder.encode(`event: connected\ndata: ${initPayload}\n\n`)
          );
        } catch {
          // Stream already closed
          return;
        }

        // Subscribe to real-time notification events for this user
        cleanup = subscribeToUserNotifications(userId, (event) => {
          if (isClosed) return;
          try {
            const data = JSON.stringify(event);
            controller.enqueue(
              encoder.encode(`event: notification\ndata: ${data}\n\n`)
            );
          } catch (err) {
            console.error("Error pushing notification over SSE:", err);
          }
        });

        // Periodic keepalive / heartbeat (every 25 seconds)
        heartbeatTimer = setInterval(() => {
          if (isClosed) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            isClosed = true;
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          }
        }, 25000);
      },
      cancel() {
        isClosed = true;
        if (cleanup) cleanup();
        if (heartbeatTimer) clearInterval(heartbeatTimer);
      },
    });

    // Handle client abort / disconnect
    req.signal.addEventListener("abort", () => {
      isClosed = true;
      if (cleanup) cleanup();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Failed to establish notification stream:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
