import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getRoleSubdomain(hostname: string): "delivery" | "officer" | null {
  const lower = hostname.toLowerCase();
  if (lower === "delivery.localhost" || lower.startsWith("delivery.")) {
    return "delivery";
  }
  if (lower === "officer.localhost" || lower.startsWith("officer.")) {
    return "officer";
  }
  return null;
}

function applySecurityHeaders(response: NextResponse, correlationId: string): NextResponse {
  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export function handleRouting(request: NextRequest): NextResponse {
  const correlationId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);

  const { pathname } = request.nextUrl;

  // 1. Static assets and internal endpoints pass through unchanged
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      correlationId
    );
  }

  // 2. Extract host and subdomain
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const [hostname, port] = hostHeader.split(":");
  const portSuffix = port ? `:${port}` : "";
  const subdomain = getRoleSubdomain(hostname || request.nextUrl.hostname);

  // Check for active session cookie
  const hasSessionCookie = Boolean(
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token")
  );

  // Helper for internal rewrites
  const rewriteTo = (targetPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    return applySecurityHeaders(
      NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
      correlationId
    );
  };

  // Helper for redirects
  const redirectTo = (urlStr: string) => {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(urlStr, request.url)),
      correlationId
    );
  };

  // 3. Subdomain: DELIVERY PARTNER (delivery.localhost)
  if (subdomain === "delivery") {
    // Intercept alien roles and redirect to their appropriate home
    if (pathname.startsWith("/procurement-officer") || pathname.startsWith("/procurement")) {
      return redirectTo(`http://officer.localhost${portSuffix}/dashboard`);
    }
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/farmer") ||
      pathname.startsWith("/shop") ||
      pathname.startsWith("/machinery")
    ) {
      return redirectTo(`http://localhost${portSuffix}${pathname}`);
    }

    // Direct delivery paths pass through
    if (pathname.startsWith("/delivery")) {
      return applySecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } }),
        correlationId
      );
    }

    // Notifications supported for delivery partner
    if (pathname.startsWith("/notifications")) {
      return applySecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } }),
        correlationId
      );
    }

    // Role-specific friendly route rewrites
    if (pathname === "/") {
      return hasSessionCookie
        ? rewriteTo("/delivery/dashboard")
        : rewriteTo("/delivery/login");
    }

    if (pathname === "/login") {
      return rewriteTo("/delivery/login");
    }

    if (pathname === "/dashboard") {
      return rewriteTo("/delivery/dashboard");
    }

    if (pathname === "/orders") {
      return rewriteTo("/delivery/orders");
    }

    if (pathname.startsWith("/orders/")) {
      return rewriteTo(`/delivery${pathname}`);
    }

    if (pathname === "/available") {
      return rewriteTo("/delivery/available");
    }

    if (pathname === "/profile") {
      return rewriteTo("/delivery/profile");
    }

    if (pathname === "/analytics") {
      return rewriteTo("/delivery/analytics");
    }

    // Fallback for any unknown route on delivery subdomain
    return hasSessionCookie
      ? rewriteTo("/delivery/dashboard")
      : rewriteTo("/delivery/login");
  }

  // 4. Subdomain: PROCUREMENT OFFICER (officer.localhost)
  if (subdomain === "officer") {
    // Intercept alien roles and redirect to their appropriate home
    if (pathname.startsWith("/delivery")) {
      return redirectTo(`http://delivery.localhost${portSuffix}/dashboard`);
    }
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/farmer") ||
      pathname.startsWith("/shop") ||
      pathname.startsWith("/machinery")
    ) {
      return redirectTo(`http://localhost${portSuffix}${pathname}`);
    }

    // Direct procurement officer paths pass through
    if (pathname.startsWith("/procurement-officer")) {
      return applySecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } }),
        correlationId
      );
    }

    if (pathname === "/procurement") {
      return rewriteTo("/procurement-officer/dashboard");
    }

    // Notifications supported for procurement officer
    if (pathname.startsWith("/notifications")) {
      return applySecurityHeaders(
        NextResponse.next({ request: { headers: requestHeaders } }),
        correlationId
      );
    }

    // Role-specific friendly route rewrites
    if (pathname === "/") {
      return hasSessionCookie
        ? rewriteTo("/procurement-officer/dashboard")
        : rewriteTo("/procurement-officer/login");
    }

    if (pathname === "/login") {
      return rewriteTo("/procurement-officer/login");
    }

    if (pathname === "/dashboard") {
      return rewriteTo("/procurement-officer/dashboard");
    }

    if (pathname === "/queue") {
      return rewriteTo("/procurement-officer/queue");
    }

    if (pathname === "/scan") {
      return rewriteTo("/procurement-officer/scan");
    }

    if (pathname === "/inspections") {
      return rewriteTo("/procurement-officer/inspections");
    }

    if (pathname === "/payments") {
      return rewriteTo("/procurement-officer/payments");
    }

    if (pathname === "/bookings") {
      return rewriteTo("/procurement-officer/bookings");
    }

    if (pathname.startsWith("/bookings/")) {
      return rewriteTo(`/procurement-officer${pathname}`);
    }

    // Fallback for any unknown route on officer subdomain
    return hasSessionCookie
      ? rewriteTo("/procurement-officer/dashboard")
      : rewriteTo("/procurement-officer/login");
  }

  // 5. Main Domain (localhost, www.localhost, etc.)
  // Keep all existing Admin, Farmer, and Shop Owner URLs working seamlessly
  return applySecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    correlationId
  );
}

export function middleware(request: NextRequest) {
  return handleRouting(request);
}

export function proxy(request: NextRequest) {
  return handleRouting(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
