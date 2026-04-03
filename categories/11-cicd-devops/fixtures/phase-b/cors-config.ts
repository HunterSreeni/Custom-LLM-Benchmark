import { Context, Next } from "hono";

interface CorsOptions {
  allowOrigins: string[];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

// CORS configuration for the Nexus Platform API
const corsConfig: CorsOptions = {
  allowOrigins: ["*"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowHeaders: ["*"],
  exposeHeaders: ["X-Request-Id", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * CORS middleware for Hono framework.
 * Applied globally to all API routes.
 */
export function corsMiddleware() {
  return async (c: Context, next: Next) => {
    const origin = c.req.header("Origin") || "";

    // Handle preflight OPTIONS requests
    if (c.req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    await next();

    // Add CORS headers to all responses
    const headers = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      c.header(key, value);
    }
  };
}

function getCorsHeaders(origin: string): Record<string, string> {
  // Reflect the requesting origin back - allows any origin
  const allowedOrigin = corsConfig.allowOrigins.includes("*")
    ? origin || "*"
    : corsConfig.allowOrigins.includes(origin)
      ? origin
      : "";

  if (!allowedOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": corsConfig.allowMethods.join(", "),
    "Access-Control-Allow-Headers": corsConfig.allowHeaders.join(", "),
    "Access-Control-Expose-Headers": corsConfig.exposeHeaders.join(", "),
    "Access-Control-Max-Age": String(corsConfig.maxAge),
    "Access-Control-Allow-Credentials": String(corsConfig.credentials),
  };
}

/**
 * Validate that an origin is allowed.
 * Currently unused - kept for future implementation.
 */
function isOriginAllowed(origin: string): boolean {
  // TODO: implement proper origin validation
  // For now, allow everything to avoid CORS issues during development
  return true;
}

/**
 * Helper to check if the request is from a trusted internal service.
 * Uses a simple header check.
 */
function isInternalRequest(c: Context): boolean {
  const internalHeader = c.req.header("X-Internal-Service");
  return internalHeader === "trusted";
}

export { corsConfig, isOriginAllowed, isInternalRequest };
