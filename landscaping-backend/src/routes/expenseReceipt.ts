import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
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
    text: "OCR not yet implemented"
  };
}

router.post("/receipt/ingest", async (req, res) => {
  try {
    const { projectId, receiptPath } = req.body;
    if (projectId == null || !receiptPath) {
      return res.status(400).json({ error: "projectId and receiptPath required" });
    }

    const { data, error } = await supabase.storage.from("receipts").download(receiptPath);
    if (error || !data) return res.status(400).json({ error: "Unable to download receipt" });

    const buffer = Buffer.from(await data.arrayBuffer());
    const ocr = await runFakeOCR(buffer);

    // Ensure a number
    let amount: number = Number(ocr.amount ?? 0);
    if (!amount) {
      // last-ditch: try parse from OCR text
      const m = ocr.text?.match?.(/(\d+\.\d{2})/);
      amount = m ? Number(m[1]) : 0;
    }

    const expense = await prisma.expense.create({
      data: {
        // If your projectId column is Int:
        projectId: Number(projectId),
        category: "OTHER",
        vendor: ocr.vendor || undefined,
        description: "Auto-created from receipt",
        amount, // number is fine for Prisma Decimal
        date: new Date(ocr.date || new Date()),
        receiptUrl: receiptPath,
        meta: { ocrRaw: ocr }
      }
    });

    res.json(expense);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
