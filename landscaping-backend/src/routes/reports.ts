// src/routes/reports.ts
import { Router } from "express";
import { getProjectBudgetReport } from "../services/reports";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * Resolve a project ID by either explicit ID or non-unique slug.
 * Uses findFirst for slug because `slug` is not @unique in your schema.
 */
async function resolveProjectId(input: { projectId?: string | null; projectSlug?: string | null }) {
  const pid = typeof input.projectId === "string" ? input.projectId.trim() : "";
  if (pid) return pid;

  const pslug = typeof input.projectSlug === "string" ? input.projectSlug.trim() : "";
  if (pslug) {
    const project = await prisma.project.findFirst({
      where: { slug: pslug },
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
    console.error("Budget report error:", error?.message || error);
    res.status(400).json({ error: error?.message ?? "Failed to get budget report" });
  }
});

export default router;
