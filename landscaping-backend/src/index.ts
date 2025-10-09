import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signToken, auth } from "./auth";
import { SafeUser } from "./types/user";
import { geocode } from "./geocode";
import { auth as authMiddleware } from "./auth"; 
import { createProjectSchema, CreateProjectBody } from "./validation/project";



const app = express();


const STATIC_ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://landscaping-estimator-rust.vercel.app",
]);

if (process.env.ALLOWED_ORIGINS) {
  for (const o of process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean)) {
    STATIC_ALLOWED_ORIGINS.add(o);
  }
}

const VERCEL_PREVIEWS_ENABLED = true;
const VERCEL_REGEX = /\.vercel\.app$/;

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); 
    try {
      const url = new URL(origin);
      const allowed =
        STATIC_ALLOWED_ORIGINS.has(origin) ||
        (VERCEL_PREVIEWS_ENABLED && VERCEL_REGEX.test(url.hostname));
      return allowed ? callback(null, true) : callback(new Error(`Not allowed by CORS: ${origin}`));
    } catch {
      return callback(new Error(`Invalid Origin header: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/** ───────────────────────────────────────────────────────────
 * SIGN UP
 * ─────────────────────────────────────────────────────────── */
type SignupBody = { name?: string; email?: string; password?: string };

app.post("/api/auth/signup", async (req: Request<{}, {}, SignupBody>, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

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
  } catch (e) {
    console.error("Signup error:", e);
    return res.status(500).json({ error: "Signup failed" });
  }
});

/** ───────────────────────────────────────────────────────────
 * LOGIN (shared handler + optional legacy alias)
 * ─────────────────────────────────────────────────────────── */
type LoginBody = { email?: string; password?: string };

const loginHandler = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const userFull = await prisma.user.findUnique({ where: { email } });
    if (!userFull) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, userFull.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ userId: userFull.id, email: userFull.email });

    const { password_hash: _ignored, ...rest } = userFull;
    const user: SafeUser = { id: rest.id, name: rest.name, email: rest.email };

    return res.json({ token, user });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
};

app.post("/api/auth/login", loginHandler);
app.post("/api/login", loginHandler);

/** ───────────────────────────────────────────────────────────
 * CURRENT USER
 * ─────────────────────────────────────────────────────────── */
app.get("/api/auth/me", auth, async (req: Request, res: Response) => {
  if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

/** ───────────────────────────────────────────────────────────
 * PROJECTS (auth required)
 * ─────────────────────────────────────────────────────────── */

app.post(
  "/api/projects",
  authMiddleware,
  async (req: Request<{}, {}, CreateProjectBody>, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate body (zod)
      const parsed = createProjectSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid payload",
          details: parsed.error.flatten()
        });
      }
      const { name, description, location } = parsed.data;

      // Geocode (graceful fallback)
      const g = await geocode(location);

      const project = await prisma.project.create({
        data: {
          user_id: req.user.userId,
          name,
          description,
          location, // raw input
          address: g?.address ?? null,
          city: g?.city ?? null,
          state: g?.state ?? null,
          postal_code: g?.postal_code ?? null,
          country: g?.country ?? null,
          latitude: g?.latitude ?? null,
          longitude: g?.longitude ?? null
        },
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          address: true,
          city: true,
          state: true,
          postal_code: true,
          country: true,
          latitude: true,
          longitude: true,
          created_at: true,
          updated_at: true
        }
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
        id: true,
        name: true,
        description: true,
        location: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return res.json({ projects });
  } catch (e) {
    console.error("List projects error:", e);
    return res.status(500).json({ error: "Failed to list projects" });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
