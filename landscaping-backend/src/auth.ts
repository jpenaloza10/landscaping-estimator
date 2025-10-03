import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface JwtPayload { userId: number; email: string; } 

export const signToken = (p: JwtPayload) =>
  jwt.sign(p, process.env.JWT_SECRET!, { expiresIn: "7d" });

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization; 
  if (!header) return res.status(401).json({ error: "Missing Authorization header" });

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded; 
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


