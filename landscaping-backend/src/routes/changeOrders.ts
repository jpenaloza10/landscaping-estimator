// src/routes/changeOrders.ts
import { Router, Request, Response } from "express";
import { auth as authMiddleware } from "../auth";
import { prisma } from "../prisma";

const router = Router();

// Require auth for all change order routes
router.use(authMiddleware);

// Helper to normalize the current user id
function getUserId(req: Request): number | null {
  const raw = req.user?.id;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * POST /api/change-orders
 * Body: { projectId, estimateId?, title, description?, amount }
 * Creates a change order for a project owned by the current user.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, estimateId, title, description, amount } = req.body;

    if (projectId == null || title == null || amount == null) {
      return res
        .status(400)
        .json({ error: "projectId, title, and amount are required" });
    }

    // projectId is numeric in DB
    const pid = Number(projectId);
    if (!Number.isFinite(pid)) {
      return res.status(400).json({ error: "projectId must be a number" });
    }

    // Ensure the project belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: pid, user_id: userId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // estimateId is a string (or undefined)
    const eid =
      estimateId == null || estimateId === "" ? undefined : String(estimateId);

    if (eid) {
      // Ensure estimate belongs to this project & user (ownership in where clause)
      const estimate = await prisma.estimate.findFirst({
        where: {
          id: eid,
          projectId: pid,
          project: {
            user_id: userId,
          },
        },
      });

      if (!estimate) {
        return res.status(404).json({ error: "Estimate not found" });
      }
    }

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

    return res.json(co);
  } catch (err) {
    console.error("[changeOrders.post]", err);
    return res.status(500).json({ error: "Failed to create change order" });
  }
});

/**
 * POST /api/change-orders/:id/approve
 * Approve a change order if it belongs to a project owned by the current user.
 */
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // id is a string in DB
    const idStr = String(id);
    if (!idStr) {
      return res.status(400).json({ error: "id must be a non-empty string" });
    }

    // Load change order with its project for ownership check
    const existing = await prisma.changeOrder.findUnique({
      where: { id: idStr },
      include: { project: true },
    });

    if (!existing || !existing.project || existing.project.user_id !== userId) {
      return res.status(404).json({ error: "Change order not found" });
    }

    const co = await prisma.changeOrder.update({
      where: { id: idStr },
      data: { status: "APPROVED", decidedAt: new Date() },
    });

    return res.json(co);
  } catch (err) {
    console.error("[changeOrders.approve]", err);
    return res.status(500).json({ error: "Failed to approve change order" });
  }
});

/**
 * GET /api/change-orders?projectId=...
 * List change orders for a project owned by the current user.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId } = req.query;
    if (projectId == null) {
      return res.status(400).json({ error: "projectId required" });
    }

    // projectId filter is numeric in DB
    const pid = Number(Array.isArray(projectId) ? projectId[0] : projectId);
    if (!Number.isFinite(pid)) {
      return res.status(400).json({ error: "projectId must be a number" });
    }

    // Ensure the project belongs to this user
    const project = await prisma.project.findFirst({
      where: { id: pid, user_id: userId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const list = await prisma.changeOrder.findMany({
      where: { projectId: pid }, // number
      orderBy: { createdAt: "desc" },
    });

    return res.json(list);
  } catch (err) {
    console.error("[changeOrders.list]", err);
    return res.status(500).json({ error: "Failed to list change orders" });
  }
});

export default router;
