import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";

const router = Router();

/* ── Supabase admin client ── */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "project-uploads";

["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].forEach((k) => {
  if (!process.env[k]) console.warn(`[WARN] Missing env ${k}`);
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* ── Validation schemas ── */

const signReceiptSchema = z.object({
  fileName: z.string().min(1).max(180),
});

const signProjectUploadSchema = z.object({
  project_id: z.coerce.number().int().positive(),
  filename: z.string().min(1).max(180),
  mime_type: z.string().optional(),
});

/* ── POST /api/uploads/receipt-sign  (expense receipts) ── */

router.post("/receipt-sign", async (req: Request, res: Response) => {
  try {
    const parsed = signReceiptSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "fileName is required" });
    }
    const { fileName } = parsed.data;

    type SignedUploadResult = { signedUrl: string; token: string; path: string };
    const { data, error } = await (
      supabaseAdmin.storage.from("receipts").createSignedUploadUrl(fileName, { upsert: true }) as Promise<{
        data: SignedUploadResult | null;
        error: Error | null;
      }>
    );

    if (error || !data) return res.status(400).json({ error: error?.message ?? "Sign failed" });

    return res.json({ path: data.path, token: data.token, signedUrl: data.signedUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/uploads/sign  (project file uploads)
 * Client POSTs { project_id, filename, mime_type }
 * Returns { signedUrl, token, path, mime_type, expiresIn }
 */
router.post("/sign", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const parsed = signProjectUploadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const { project_id, filename, mime_type } = parsed.data;

    const numericUserId = Number(req.user.id);
    if (!Number.isFinite(numericUserId)) {
      return res.status(400).json({ error: "Invalid user id on request" });
    }

    // Verify the project belongs to this user
    const owns = await prisma.project.findFirst({
      where: { id: project_id, user_id: numericUserId },
      select: { id: true },
    });
    if (!owns) return res.status(404).json({ error: "Project not found" });

    const key = `${project_id}/${Date.now()}-${filename}`;

    type SignedUploadResult = { signedUrl: string; token: string };
    const { data, error } = await (
      supabaseAdmin.storage.from(SUPABASE_BUCKET).createSignedUploadUrl(key) as Promise<{
        data: SignedUploadResult | null;
        error: Error | null;
      }>
    );

    if (error || !data) {
      console.error("Supabase sign error:", error);
      return res.status(500).json({ error: "Failed to sign upload URL" });
    }

    return res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: key,
      mime_type: mime_type || "application/octet-stream",
      expiresIn: 120,
    });
  } catch (e: unknown) {
    console.error("Sign upload error:", e);
    return res.status(500).json({ error: "Failed to sign upload URL" });
  }
});

export default router;
