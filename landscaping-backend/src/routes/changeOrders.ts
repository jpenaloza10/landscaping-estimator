import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// POST /api/change-orders
router.post("/", async (req, res) => {
  const { projectId, estimateId, title, description, amount } = req.body;

  if (projectId == null || title == null || amount == null) {
    return res
      .status(400)
      .json({ error: "projectId, title, and amount are required" });
  }

  // projectId is numeric in DB
  const pid = Number(projectId);
  if (Number.isNaN(pid)) {
    return res.status(400).json({ error: "projectId must be a number" });
  }

  // estimateId is a string (or undefined)
  const eid =
    estimateId == null || estimateId === "" ? undefined : String(estimateId);

  const co = await prisma.changeOrder.create({
    data: {
      projectId: pid, // number
      estimateId: eid, // string | undefined
      title: String(title),
      description: description ? String(description) : undefined,
      amount: Number(amount), // Decimal-compatible
      // status defaults to PENDING if your schema sets a default
    },
  });

  res.json(co);
});

// POST /api/change-orders/:id/approve
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;

  // id is a string in DB
  const idStr = String(id);
  if (!idStr) {
    return res.status(400).json({ error: "id must be a non-empty string" });
  }

  const co = await prisma.changeOrder.update({
    where: { id: idStr }, // string
    data: { status: "APPROVED", decidedAt: new Date() },
  });

  res.json(co);
});

// GET /api/change-orders?projectId=...
router.get("/", async (req, res) => {
  const { projectId } = req.query;
  if (projectId == null) {
    return res.status(400).json({ error: "projectId required" });
  }

  // projectId filter is numeric in DB
  const pid = Number(Array.isArray(projectId) ? projectId[0] : projectId);
  if (Number.isNaN(pid)) {
    return res.status(400).json({ error: "projectId must be a number" });
  }

  const list = await prisma.changeOrder.findMany({
    where: { projectId: pid }, // number
    orderBy: { createdAt: "desc" },
  });

  res.json(list);
});

export default router;
