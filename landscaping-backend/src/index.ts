import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signToken, auth } from "./auth";
import { SafeUser } from "./types/user";

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true,
}));
app.options("*", cors());
app.use(express.json());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ───────────────────────────────────────────────────────────
// SIGN UP
// ───────────────────────────────────────────────────────────
type SignupBody = { name?: string; email?: string; password?: string };
app.post(
  "/api/auth/signup",
  async (req: Request<{}, {}, SignupBody>, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }

      // Inline the hash (prevents 'assigned but never used' warning)
      const created = await prisma.user.create({
        data: { name, email, password_hash: await bcrypt.hash(password, 10) },
        select: { id: true, name: true, email: true }, // only safe fields
      });

      const token = signToken({ userId: created.id, email: created.email });
      const user: SafeUser = created;

      return res.status(201).json({ token, user });
    } catch (e) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: "Signup failed" });
    }
  }
);

// ───────────────────────────────────────────────────────────
// LOGIN
// ───────────────────────────────────────────────────────────
type LoginBody = { email?: string; password?: string };
app.post(
  "/api/auth/login",
  async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Need hash to compare
      const userFull = await prisma.user.findUnique({ where: { email } });
      if (!userFull) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await bcrypt.compare(password, userFull.password_hash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({ userId: userFull.id, email: userFull.email });

      // Strip hash safely and type result as SafeUser
      const { password_hash: _ignored, ...rest } = userFull;
      const user: SafeUser = {
        id: rest.id,
        name: rest.name,
        email: rest.email,
      };

      return res.json({ token, user });
    } catch (e) {
      console.error("Login error:", e);
      return res.status(500).json({ error: "Login failed" });
    }
  }
);

// ───────────────────────────────────────────────────────────
// CURRENT USER
// ───────────────────────────────────────────────────────────
app.get("/api/auth/me", auth, async (req: Request, res: Response) => {
  if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

// ───────────────────────────────────────────────────────────
// PROJECTS (auth required)
// ───────────────────────────────────────────────────────────

// Create Project
type CreateProjectBody = { name?: string; description?: string; location?: string };
app.post(
  "/api/projects",
  auth,
  async (req: Request<{}, {}, CreateProjectBody>, res: Response) => {
    try {
      if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });
      const { name, description, location } = req.body ?? {};

      if (!name || !description || !location) {
        return res.status(400).json({ error: "name, description, location are required" });
      }

      const project = await prisma.project.create({
        data: {
          user_id: req.user.userId,
          name,
          description,
          location,
        },
        select: {
          id: true, name: true, description: true, location: true,
          created_at: true, updated_at: true,
        },
      });

      return res.status(201).json({ project });
    } catch (e) {
      console.error("Create project error:", e);
      return res.status(500).json({ error: "Failed to create project" });
    }
  }
);

// List Projects for current user
app.get("/api/projects", auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

    const projects = await prisma.project.findMany({
      where: { user_id: req.user.userId },
      select: {
        id: true, name: true, description: true, location: true,
        created_at: true, updated_at: true,
      },
      orderBy: { created_at: "desc" }
    });

    return res.json({ projects });
  } catch (e) {
    console.error("List projects error:", e);
    return res.status(500).json({ error: "Failed to list projects" });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
