// src/utils/resolveProject.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function resolveProjectId(input: {
  projectId?: string | null;
  projectSlug?: string | null;
}) {
  if (input.projectId && String(input.projectId).trim()) {
    // trust provided string/uuid; if you truly require UUID, validate here
    return String(input.projectId).trim();
  }
  if (input.projectSlug && String(input.projectSlug).trim()) {
    const p = await prisma.project.findUnique({
      where: { slug: String(input.projectSlug).trim() },
      select: { id: true },
    });
    if (!p) throw new Error("Project not found for given slug");
    return p.id;
  }
  throw new Error("projectId or projectSlug is required");
}
