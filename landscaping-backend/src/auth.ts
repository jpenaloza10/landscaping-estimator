// src/middleware/auth.ts
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

/**
 * Augment Express Request with `user` (no TS namespace usage).
 * This keeps ESLint happy and gives you strong typing on req.user.
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email?: string | null;
      source: "custom-jwt" | "supabase";
      // Include any extra fields you want to carry from Supabase user_metadata:
      [k: string]: any;
    };
  }
}

interface JwtPayload {
  userId: string | number;
  email: string;
}

/**
 * Sign a legacy/custom JWT (kept for backward compatibility).
 * Requires process.env.JWT_SECRET to be set on the server.
 */
export function signToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env var");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

/**
 * Auth middleware:
 * - Accepts Authorization: Bearer <token>
 * - First tries your legacy/custom JWT (JWT_SECRET)
 * - If that fails, tries Supabase access token via supabaseAdmin.auth.getUser(token)
 * - Attaches a normalized req.user and calls next()
 */
export async function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header format" });
  }

  // 1) Try validating as your legacy/custom JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = {
        id: String(decoded.userId),
        email: decoded.email,
        source: "custom-jwt",
      };
      return next();
    } catch {
      // Fall through to Supabase validation
    }
  }

  // 2) Try validating as a Supabase access token
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const u = data.user;
    req.user = {
      id: u.id,
      email: u.email,
      source: "supabase",
      // Merge user_metadata so you can read name, etc.
      ...(u.user_metadata ?? {}),
    };

    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
