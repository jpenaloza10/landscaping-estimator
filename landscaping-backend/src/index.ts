import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import projectsRouter from "./routes/projects";
import assembliesRouter from "./routes/assemblies";
import pricingRouter from "./routes/pricing";
import expensesRouter from "./routes/expenses";
import reportsRouter from "./routes/reports";
import expenseReceiptRouter from "./routes/expenseReceipt";
import estimatesRouter from "./routes/estimates";
import expenseAIRouter from "./routes/expenseAI";
import changeOrdersRouter from "./routes/changeOrders";
import exportRouter from "./routes/export";
import aiRouter from "./routes/ai";
import dashboardRouter from "./routes/dashboard";
import proposalsRouter from "./routes/proposals";
import deliveryRouter from "./routes/delivery";
import authRouter from "./routes/auth";
import uploadsRouter from "./routes/uploads";

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
  allowedHeaders: ["Content-Type", "Authorization"], // important for JWT header
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

/* -------------------------------- ROUTERS -------------------------------- */

app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/assemblies", assembliesRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/expenses", expenseReceiptRouter);
app.use("/api/expenses", expenseAIRouter);
app.use("/api/change-orders", changeOrdersRouter);
app.use("/api/export", exportRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/estimates", estimatesRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/delivery", deliveryRouter);

app.get("/api/assemblies/ping", (_req, res) => {
  res.json({ ok: true, when: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Debug endpoint — development only, never expose in production
if (process.env.NODE_ENV !== "production") {
  app.all("/api/debug/headers", (req, res) => {
    res.json({
      method: req.method,
      path: req.path,
      origin: req.headers.origin || null,
      host: req.headers.host || null,
      "access-control-request-method": req.headers["access-control-request-method"] || null,
      "access-control-request-headers": req.headers["access-control-request-headers"] || null,
    });
  });
}

/* Auth and upload routes are handled by their dedicated routers:
   /api/auth  → src/routes/auth.ts
   /api/uploads → src/routes/uploads.ts
*/

/* --------------------------------- START -------------------------------- */

// --- Global error handler (must be after all routes/middleware) ---
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("ERROR:", err?.stack || err);

  // Reflect the Origin if allowed, so the browser sees CORS even on errors
  const origin = req.headers.origin as string | undefined;
  try {
    if (!origin) {
      res.setHeader("Access-Control-Allow-Origin", "*"); // no credentials case
    } else {
      const { hostname } = new URL(origin);
      const allowed =
        STATIC_ALLOWED_ORIGINS.has(origin) ||
        (VERCEL_PREVIEWS_ENABLED && VERCEL_HOSTNAME_REGEX.test(hostname));
      if (allowed) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
    }
  } catch {
    /* ignore */
  }

  res.status(500).json({ error: err?.message || "Server error" });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
