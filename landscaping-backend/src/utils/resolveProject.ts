// src/utils/resolveProject.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Resolve a project ID given either projectId or projectSlug.
 * Works even if 'slug' is NOT marked @unique in Prisma.
 * Falls back gracefully if only slug is provided.
 */
export async function resolveProjectId(input: {
  projectId?: string | null;
  projectSlug?: string | null;
}): Promise<string> {
  const { projectId, projectSlug } = input;

  // Prefer direct projectId if provided
  if (projectId && String(projectId).trim()) {
    return String(projectId).trim();
  }

  // Resolve by slug (safe even if not unique)
  if (projectSlug && String(projectSlug).trim()) {
    const slugValue = String(projectSlug).trim();

    // Use findFirst instead of findUnique (avoids TS2353 error if slug not @unique)
    const project = await prisma.project.findFirst({
      where: { slug: slugValue },
      select: { id: true },
    });

    if (!project) {
      throw new Error(`Project not found for slug: ${slugValue}`);
    }

    return project.id;
  }

  throw new Error("projectId or projectSlug is required");
}
