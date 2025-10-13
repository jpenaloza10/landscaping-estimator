import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SafeUser } from "./types/user";
import { geocode } from "./geocode";
import { createProjectSchema, CreateProjectBody } from "./validation/project";
import { signToken, auth as authMiddleware } from "./auth";

// Supabase admin client for Storage signing
import { createClient } from "@supabase/supabase-js";
// Validation
import { z } from "zod";

const app = express();

/* ----------------------------- CORS SETUP ----------------------------- */
/** CORS FIX:
 * - Middleware loaded before everything else
 * - Dynamic allow-list (exact prod + vercel previews)
 * - Let cors reflect request headers (removed strict allowedHeaders)
 * - Explicit app.options('*') + optionsSuccessStatus: 204
 */

const STATIC_ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://landscaping-estimator-rust.vercel.app",
]);

if (process.env.ALLOWED_ORIGINS) {
  for (const o of process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)) {
    STATIC_ALLOWED_ORIGINS.add(o);
  }
}

// Allow *.vercel.app previews
const VERCEL_PREVIEWS_ENABLED = true;
const VERCEL_HOSTNAME_REGEX = /(^|\.)vercel\.app$/i;

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl / health checks with no Origin
    if (!origin) return callback(null, true);

    try {
      const { hostname } = new URL(origin);
      const allowed =
        STATIC_ALLOWED_ORIGINS.has(origin) ||
        (VERCEL_PREVIEWS_ENABLED && VERCEL_HOSTNAME_REGEX.test(hostname));

      return allowed
        ? callback(null, true)
        : callback(new Error(`Not allowed by CORS: ${origin}`));
    } catch {
      return callback(new Error(`Invalid Origin header: ${origin}`));
    }
  },
  // You’re using Authorization: Bearer (no cross-site cookies), so:
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Let cors reflect requested headers to avoid case / variant mismatches
  // allowedHeaders: undefined,
  optionsSuccessStatus: 204,
  maxAge: 600, // cache preflight for 10 minutes
};

// Apply CORS before any other middleware/routes
app.use(cors(corsOptions));
// Explicit preflight for every route
app.options("*", cors(corsOptions));

// JSON parsing after CORS
app.use(express.json());

/* ----------------------------- ROOT & HEALTH ----------------------------- */

app.get("/", (_req, res) => {
  res.type("text/plain").send("Landscaping Estimator API: OK");
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Handy for debugging CORS/headers in prod
app.all("/api/debug/headers", (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    origin: req.headers.origin || null,
    authorization: req.headers.authorization || null,
    host: req.headers.host || null,
    "access-control-request-method": req.headers["access-control-request-method"] || null,
    "access-control-request-headers": req.headers["access-control-request-headers"] || null,
  });
});

/* --------------------------------- AUTH --------------------------------- */

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

    // user.id is Int — token will carry a number
    const token = signToken({ userId: created.id, email: created.email });
    const user: SafeUser = created;

    return res.status(201).json({ token, user });
  } catch (e) {
    console.error("Signup error:", e);
    return res.status(500).json({ error: "Signup failed" });
  }
});

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

app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
  if (req.user?.userId == null) return res.status(401).json({ error: "Unauthorized" });

  // user.id is Int
  const user = await prisma.user.findUnique({
    where: { id: Number(req.user.userId) },
    select: { id: true, name: true, email: true },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

/* ------------------------------- PROJECTS ------------------------------- */

app.post(
  "/api/projects",
  authMiddleware,
  async (req: Request<{}, {}, CreateProjectBody>, res: Response) => {
    try {
      if (req.user?.userId == null) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate body (zod)
      const parsed = createProjectSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid payload",
          details: parsed.error.flatten(),
        });
      }
      const { name, description, location } = parsed.data;

      // Geocode (graceful fallback)
      const g = await geocode(location);

      const project = await prisma.project.create({
        data: {
          user_id: Number(req.user.userId), // Int
          name,
          description,
          location, // raw input
          address: g?.address ?? null,
          city: g?.city ?? null,
          state: g?.state ?? null,
          postal_code: g?.postal_code ?? null,
          country: g?.country ?? null,
          latitude: g?.latitude ?? null,
          longitude: g?.longitude ?? null,
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
          updated_at: true,
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
app.get("/api/projects", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.userId == null) return res.status(401).json({ error: "Unauthorized" });

    const projects = await prisma.project.findMany({
      where: { user_id: Number(req.user.userId) }, // Int
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

/* --------------------------- SUPABASE: UPLOADS -------------------------- */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "project-uploads";

// Quick env sanity
["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`[WARN] Missing env ${k}`);
  }
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const signUploadSchema = z.object({
  // project.id is Int
  project_id: z.coerce.number().int().positive(),
  filename: z.string().min(1).max(180),
  mime_type: z.string().optional(),
});

/**
 * Client POSTs { project_id, filename, mime_type }
 * Response: { signedUrl, token, path, mime_type, expiresIn }
 * Then client must POST multipart (token + file) to signedUrl,
 * or use supabase-js: storage.from(bucket).uploadToSignedUrl(path, token, file)
 */
app.post("/api/uploads/sign", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.userId == null) return res.status(401).json({ error: "Unauthorized" });

    const parsed = signUploadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const { project_id, filename, mime_type } = parsed.data;

    // Verify the project belongs to this user
    const owns = await prisma.project.findFirst({
      where: { id: project_id, user_id: Number(req.user.userId) },
      select: { id: true },
    });
    if (!owns) return res.status(404).json({ error: "Project not found" });

    // Storage path: <project_id>/<timestamp>-<filename>
    const key = `${project_id}/${Date.now()}-${filename}`;

    // Supabase signed upload URL & token (v2)
    // @ts-ignore - suppress version typing differences
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUploadUrl(key);

    if (error) {
      console.error("Supabase sign error:", error);
      return res.status(500).json({ error: "Failed to sign upload URL" });
    }

    // Supabase default expiry is ~2 minutes; surface a hint to client
    return res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: key,
      mime_type: mime_type || "application/octet-stream",
      expiresIn: 120,
    });
  } catch (e) {
    console.error("Sign upload error:", e);
    return res.status(500).json({ error: "Failed to sign upload URL" });
  }
});

/* --------------------------------- START -------------------------------- */

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
