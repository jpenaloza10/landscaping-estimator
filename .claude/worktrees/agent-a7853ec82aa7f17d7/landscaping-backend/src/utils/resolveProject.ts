import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Strictly parse a value into an integer.
 * Throws a 400-style error if invalid.
 */
function toIntStrict(value: unknown, fieldName: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err: any = new Error(`${fieldName} must be an integer`);
    err.status = 400;
    throw err;
  }
  return n;
}

/**
 * Resolve and validate a project by numeric ID.
 * - Accepts string or number
 * - Ensures it's a valid integer
 * - Confirms the project exists
 * Returns the numeric projectId.
 */
export async function resolveProjectId(input: {
  projectId?: string | number | null;
}): Promise<number> {
  const { projectId } = input;

  if (projectId === null || projectId === undefined || String(projectId).trim() === "") {
    const err: any = new Error("projectId is required");
    err.status = 400;
    throw err;
  }

  const id = toIntStrict(projectId, "projectId");

  // Confirm existence (prevents downstream 500s on foreign keys)
  const exists = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    const err: any = new Error(`Project not found for id: ${id}`);
    err.status = 404;
    throw err;
  }

  return id;
}

export async function resolveProject(input: {
  projectId?: string | number | null;
}) {
  const id = await resolveProjectId(input);
  const project = await prisma.project.findUnique({ where: { id } });
  // project is guaranteed by resolveProjectId, but keep a guard:
  if (!project) {
    const err: any = new Error(`Project not found for id: ${id}`);
    err.status = 404;
    throw err;
  }
  return project;
}
