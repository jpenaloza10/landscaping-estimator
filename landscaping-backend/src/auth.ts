import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";


declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email?: string | null;
      source: "custom-jwt";
      [k: string]: any;
    };
  }
}

interface JwtPayload {
  userId: string | number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a custom JWT.
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
 * - Verifies with JWT_SECRET
 * - Attaches normalized req.user and calls next()
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Invalid Authorization header format" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("[auth] JWT_SECRET is not set");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing JWT_SECRET" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.user = {
      id: String(decoded.userId),
      email: decoded.email,
      source: "custom-jwt",
    };

    return next();
  } catch (err) {
    console.error(
      "[auth] JWT verification failed:",
      (err as Error).message || err
    );
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
