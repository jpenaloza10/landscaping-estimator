// src/routes/changeOrders.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

// POST /api/change-orders
router.post("/", async (req, res) => {
  const { projectId, estimateId, title, description, amount } = req.body;
  if (!projectId || !title || amount == null) {
    return res.status(400).json({ error: "projectId, title, amount required" });
  }

  const co = await prisma.changeOrder.create({
    data: {
      projectId,
      estimateId,
      title,
      description,
      amount
    }
  });

  res.json(co);
});

// POST /api/change-orders/:id/approve
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;

  const co = await prisma.changeOrder.update({
    where: { id },
    data: {
      status: "APPROVED",
      decidedAt: new Date()
    }
  });

  res.json(co);
});

// GET /api/change-orders?projectId=...
router.get("/", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: "projectId required" });

  const list = await prisma.changeOrder.findMany({
    where: { projectId: String(projectId) },
    orderBy: { createdAt: "desc" }
  });
  res.json(list);
});

export default router;
