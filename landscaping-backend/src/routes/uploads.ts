import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "project-uploads";

/* ── Validation schemas ── */

const signReceiptSchema = z.object({
  fileName: z.string().min(1).max(180),
});

const signProjectUploadSchema = z.object({
  project_id: z.coerce.number().int().positive(),
  filename: z.string().min(1).max(180),
  mime_type: z.string().optional(),
});

// Company logos: only formats PDFKit can embed
const LOGO_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

const signLogoSchema = z.object({
  filename: z.string().min(1).max(180),
  mime_type: z.enum(["image/png", "image/jpeg"]),
});

const commitLogoSchema = z.object({
  path: z.string().min(1).max(300),
});

function logoPrefix(userId: number) {
  return `logos/${userId}/`;
}

async function signedLogoReadUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/* ── POST /api/uploads/receipt-sign  (expense receipts) ── */

router.post("/receipt-sign", async (req: Request, res: Response) => {
  try {
    const parsed = signReceiptSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "fileName is required" });
    }
    const { fileName } = parsed.data;

    const { data, error } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUploadUrl(fileName, { upsert: true });

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

    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUploadUrl(key);

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

/* ══════════════════════════ Company logo ══════════════════════════
   Flow: POST /logo-sign → client uploads to signedUrl →
         POST /logo-commit { path } → saved on User.logo_path.
   GET /logo returns a temporary read URL; DELETE /logo removes it. */

/* ── POST /api/uploads/logo-sign ── */

router.post("/logo-sign", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId)) return res.status(401).json({ error: "Unauthorized" });

    const parsed = signLogoSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Logo must be a PNG or JPEG image" });
    }

    const ext = LOGO_MIME_EXT[parsed.data.mime_type];
    const key = `${logoPrefix(userId)}${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUploadUrl(key);

    if (error || !data) {
      console.error("Logo sign error:", error);
      return res.status(500).json({ error: "Failed to sign logo upload" });
    }

    return res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: key,
      expiresIn: 120,
    });
  } catch (e: unknown) {
    console.error("Logo sign error:", e);
    return res.status(500).json({ error: "Failed to sign logo upload" });
  }
});

/* ── POST /api/uploads/logo-commit ── */

router.post("/logo-commit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId)) return res.status(401).json({ error: "Unauthorized" });

    const parsed = commitLogoSchema.safeParse(req.body ?? {});
    if (!parsed.success || !parsed.data.path.startsWith(logoPrefix(userId))) {
      return res.status(400).json({ error: "Invalid logo path" });
    }
    const path = parsed.data.path;

    // Confirm the object actually exists before pointing the profile at it
    const { error: statError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, 60);
    if (statError) return res.status(400).json({ error: "Logo file not found in storage" });

    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { logo_path: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { logo_path: path },
    });

    // Best-effort cleanup of the replaced logo
    if (previous?.logo_path && previous.logo_path !== path) {
      supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .remove([previous.logo_path])
        .catch((e) => console.warn("Old logo cleanup failed:", e));
    }

    return res.json({ logo_path: path, url: await signedLogoReadUrl(path) });
  } catch (e: unknown) {
    console.error("Logo commit error:", e);
    return res.status(500).json({ error: "Failed to save logo" });
  }
});

/* ── GET /api/uploads/logo ── */

router.get("/logo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId)) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logo_path: true },
    });

    return res.json({
      logo_path: user?.logo_path ?? null,
      url: await signedLogoReadUrl(user?.logo_path ?? null),
    });
  } catch (e: unknown) {
    console.error("Logo fetch error:", e);
    return res.status(500).json({ error: "Failed to fetch logo" });
  }
});

/* ── DELETE /api/uploads/logo ── */

router.delete("/logo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isFinite(userId)) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logo_path: true },
    });

    if (user?.logo_path) {
      supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .remove([user.logo_path])
        .catch((e) => console.warn("Logo storage delete failed:", e));
      await prisma.user.update({ where: { id: userId }, data: { logo_path: null } });
    }

    return res.json({ ok: true });
  } catch (e: unknown) {
    console.error("Logo delete error:", e);
    return res.status(500).json({ error: "Failed to delete logo" });
  }
});

export default router;
