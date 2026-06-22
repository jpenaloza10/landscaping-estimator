import type { Request, Response, NextFunction } from "express";

interface BucketEntry {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-process rate limiter.
 * Counts requests per IP within a sliding window.
 * Does NOT require any external package.
 *
 * Usage:
 *   import { rateLimit } from "./lib/rateLimit";
 *   app.post("/api/auth/login", rateLimit({ windowMs: 60_000, max: 10 }), handler);
 */
export function rateLimit(options: {
  /** Window size in milliseconds. Default: 60 000 (1 min) */
  windowMs?: number;
  /** Max requests per IP per window. Default: 20 */
  max?: number;
  /** Message sent when the limit is exceeded. */
  message?: string;
}) {
  const { windowMs = 60_000, max = 20, message = "Too many requests, please try again later." } =
    options;

  // ip → { count, resetAt }
  const store = new Map<string, BucketEntry>();

  // Prune stale entries every window to avoid memory growth
  const pruneInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, windowMs);

  // Allow the Node process to exit even if this interval is still active
  if (pruneInterval.unref) pruneInterval.unref();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(ip, entry);
    } else {
      entry.count += 1;
    }

    // Set standard rate-limit response headers
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }

    return next();
  };
}
