import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../prisma";
import { auth as authMiddleware } from "../auth";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Replace with real OCR later
async function runFakeOCR(_buffer: Buffer) {
  return {
    vendor: "Unknown Vendor",
    amount: null as number | null,
    date: new Date().toISOString().slice(0, 10),
    text: "OCR not yet implemented",
  };
}

/**
 * POST /api/expenses/receipt/ingest
 * Body: { projectId, receiptPath }
 *
 * - Requires auth
 * - Verifies the project belongs to the current user
 * - Downloads the receipt from Supabase
 * - Runs fake OCR
 * - Creates an EXPENSE for that project
 */
router.post(
  "/receipt/ingest",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // 1) Auth / user
      const rawUserId = req.user?.id;
      const userId = rawUserId ? Number(rawUserId) : NaN;
      if (!Number.isFinite(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // 2) Validate body
      const { projectId, receiptPath } = req.body as {
        projectId?: number | string;
        receiptPath?: string;
      };

      if (projectId == null || !receiptPath) {
        return res
          .status(400)
          .json({ error: "projectId and receiptPath required" });
      }

      const numericProjectId = Number(projectId);
      if (!Number.isFinite(numericProjectId)) {
        return res.status(400).json({ error: "Invalid projectId" });
      }

      // 3) Verify the project belongs to this user
      const project = await prisma.project.findFirst({
        where: { id: numericProjectId, user_id: userId },
        select: { id: true },
      });

      if (!project) {
        // Either project doesn't exist or doesn't belong to this user
        return res.status(404).json({ error: "Project not found" });
      }

      // 4) Download receipt from Supabase
      const { data, error } = await supabase.storage
        .from("receipts")
        .download(receiptPath);

      if (error || !data) {
        console.error("[receipt.ingest] Supabase download error:", error);
        return res
          .status(400)
          .json({ error: "Unable to download receipt from storage" });
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      // 5) Run OCR (fake for now)
      const ocr = await runFakeOCR(buffer);

      // 6) Ensure amount is a number
      let amount: number = Number(ocr.amount ?? 0);
      if (!amount) {
        // last-ditch: try parse from OCR text
        const m = ocr.text?.match?.(/(\d+\.\d{2})/);
        amount = m ? Number(m[1]) : 0;
      }

      // 7) Create expense tied to this user's project
      const expense = await prisma.expense.create({
        data: {
          projectId: numericProjectId,
          category: "OTHER",
          vendor: ocr.vendor || undefined,
          description: "Auto-created from receipt",
          amount, // Prisma Decimal-compatible
          date: new Date(ocr.date || new Date()),
          receiptUrl: receiptPath,
          meta: { ocrRaw: ocr },
          createdById: userId,
        },
      });

      return res.json(expense);
    } catch (e: any) {
      console.error("[receipt.ingest] error:", e);
      return res.status(500).json({ error: e.message || "Server error" });
    }
  }
);

export default router;
