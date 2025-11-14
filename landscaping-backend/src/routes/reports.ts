// src/routes/reports.ts
import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * Resolve a project ID by either numeric ID, UUID, or slug
 */
async function resolveProjectId(input: { projectId?: string | null; projectSlug?: string | null }) {
  if (input.projectId && String(input.projectId).trim()) {
    return String(input.projectId).trim();
  }
  if (input.projectSlug && String(input.projectSlug).trim()) {
    const project = await prisma.project.findUnique({
      where: { slug: String(input.projectSlug).trim() },
      select: { id: true },
    });
    if (!project) throw new Error("Project not found for given slug");
    return project.id;
  }
  throw new Error("projectId or projectSlug is required");
}

router.get("/budget", async (req, res) => {
  try {
    // Support either ?projectId=... or ?projectSlug=...
    const projectId = await resolveProjectId({
      projectId: (req.query.projectId as string) ?? undefined,
      projectSlug: (req.query.projectSlug as string) ?? undefined,
    });

    const report = await getProjectBudgetReport(projectId);
    res.json(report);
  } catch (error: any) {
    console.error("Budget report error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;
