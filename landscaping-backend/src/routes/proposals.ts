import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../prisma";

const r = Router();

r.get("/:estimateId.pdf", async (req, res) => {
  const est = await prisma.estimate.findUnique({
    where: { id: req.params.estimateId },
    include: { lines: true }
  });
  if (!est) return res.status(404).send("Not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="estimate-${est.id}.pdf"`);

  const doc = new PDFDocument({ margin: 48 });
  doc.pipe(res);

  doc.fontSize(18).text("Estimate", { align: "right" });
  doc.moveDown().fontSize(12).text(`Project: ${est.projectId}`);
  if (est.location) doc.text(`Location: ${JSON.stringify(est.location)}`);
  doc.moveDown();

  doc.fontSize(14).text("Summary", { underline: true });
  doc.fontSize(12).text(`Subtotal: $${Number(est.subtotal).toFixed(2)}`);
  doc.text(`Tax: $${Number(est.tax).toFixed(2)}`);
  doc.text(`Total: $${Number(est.total).toFixed(2)}`);
  doc.moveDown();

  doc.fontSize(14).text("Line Items", { underline: true });
  for (const line of est.lines) {
    doc.moveDown(0.5).fontSize(12).text(`Assembly: ${line.assemblyId}`);
    const items = (line.items as any[]) || [];
    items.forEach(it => {
      doc.text(`- ${it.name}: ${it.qty.toFixed(2)} ${it.unit} @ $${it.unitCost.toFixed(2)} = $${it.extended.toFixed(2)}`);
    });
    doc.text(`Line total: $${Number(line.lineTotal).toFixed(2)}`);
  }

  doc.end();
});

export default r;
