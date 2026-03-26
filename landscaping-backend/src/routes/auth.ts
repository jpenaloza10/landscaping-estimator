import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { signToken, auth as authMiddleware } from "../auth";
import { rateLimit } from "../lib/rateLimit";
import type { SafeUser } from "../types/user";

const r = Router();

/* ── Validation schemas ── */

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/* ── Rate limiting: stricter for auth endpoints ── */

const authRateLimit = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10,          // 10 attempts per IP per minute
  message: "Too many authentication attempts. Please try again in a minute.",
});

/* ── POST /api/auth/signup ── */

r.post("/signup", authRateLimit, async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid signup data" });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const created = await prisma.user.create({
      data: { name, email, password_hash: await bcrypt.hash(password, 10) },
      select: { id: true, name: true, email: true },
    });

    const token = signToken({ userId: created.id, email: created.email });
    const user: SafeUser = created;

    return res.status(201).json({ token, user });
  } catch (e: unknown) {
    console.error("Signup error:", e);
    return res.status(500).json({ error: "Signup failed" });
  }
});

/* ── POST /api/auth/login ── */

r.post("/login", authRateLimit, async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid login data" });
    }

    const { email, password } = parsed.data;

    const userFull = await prisma.user.findUnique({ where: { email } });
    if (!userFull) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, userFull.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ userId: userFull.id, email: userFull.email });
    const user: SafeUser = { id: userFull.id, name: userFull.name, email: userFull.email };

    return res.json({ token, user });
  } catch (e: unknown) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
});

/* ── GET /api/auth/me ── */

r.get("/me", authMiddleware, async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const userId = Number(req.user.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id on request" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (e: unknown) {
    console.error("Auth /me error:", e);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default r;
