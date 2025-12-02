// src/routes/proposals.ts
import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../prisma";
import { callAI } from "../services/aiClient";

const r = Router();

r.get("/:estimateId.pdf", async (req, res) => {
  try {
    const est = await prisma.estimate.findUnique({
      where: { id: req.params.estimateId },
      include: { lines: true },
    });

    if (!est) {
      return res.status(404).send("Not found");
    }

    // Try to generate an AI proposal narrative (non-fatal if it fails)
    let narrative: string | null = null;
    try {
      const prompt = [
        "You are an assistant for a landscaping construction estimating app.",
        "Write a clear, client-facing proposal summary for this estimate.",
        "",
        "Goals:",
        "- Explain the scope of work in plain language.",
        "- Emphasize professionalism and quality.",
        "- Avoid quoting line-item prices individually; focus on value and scope.",
        "- Do NOT invent legal terms or guarantees.",
        "",
        "Here is the estimate data in JSON form:",
        JSON.stringify(
          {
            id: est.id,
            projectId: est.projectId,
            location: est.location,
            subtotal: est.subtotal,
            tax: est.tax,
            total: est.total,
            lines: est.lines.map((l) => ({
              id: l.id,
              assemblyId: l.assemblyId,
              lineTotal: l.lineTotal,
              items: l.items,
            })),
          },
          null,
          2
        ),
      ].join("\n");

      narrative = await callAI(prompt);
    } catch (err) {
      console.error("[proposals] AI narrative failed:", err);
      narrative = null; // just skip AI section if it fails
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="estimate-${est.id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text("Estimate", { align: "right" });
    doc
      .moveDown()
      .fontSize(12)
      .text(`Project: ${est.projectId}`);
    if (est.location) {
      doc.text(`Location: ${JSON.stringify(est.location)}`);
    }
    doc.moveDown();

    // Optional AI proposal narrative
    if (narrative) {
      doc.fontSize(14).text("Proposal Narrative", { underline: true });
      doc
        .moveDown(0.5)
        .fontSize(11)
        .text(narrative, {
          align: "left",
        });
      doc.moveDown();
    }

    // Summary
    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(12).text(`Subtotal: $${Number(est.subtotal).toFixed(2)}`);
    doc.text(`Tax: $${Number(est.tax).toFixed(2)}`);
    doc.text(`Total: $${Number(est.total).toFixed(2)}`);
    doc.moveDown();

    // Line items
    doc.fontSize(14).text("Line Items", { underline: true });
    for (const line of est.lines) {
      doc.moveDown(0.5).fontSize(12).text(`Assembly: ${line.assemblyId}`);
      const items = ((line.items as any[]) || []) as any[];
      items.forEach((it) => {
        const qty = Number(it.qty ?? 0);
        const unitCost = Number(it.unitCost ?? 0);
        const extended = Number(it.extended ?? qty * unitCost);
        doc.text(
          `- ${it.name}: ${qty.toFixed(2)} ${it.unit} @ $${unitCost.toFixed(
            2
          )} = $${extended.toFixed(2)}`
        );
      });
      doc.text(`Line total: $${Number(line.lineTotal).toFixed(2)}`);
    }

    doc.end();
  } catch (err) {
    console.error("[proposals] PDF generation failed:", err);
    if (!res.headersSent) {
      res.status(500).send("Failed to generate proposal PDF");
    }
  }
});

export default r;
