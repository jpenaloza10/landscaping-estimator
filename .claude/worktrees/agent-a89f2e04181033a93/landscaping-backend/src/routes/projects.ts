import { Router, Request, Response } from "express";
import { auth as authMiddleware } from "../auth";
import { prisma } from "../prisma";
import { geocode } from "../geocode";
import { createProjectSchema } from "../validation/project";

const r = Router();

// Protect all routes in this router
r.use(authMiddleware);

/**
 * GET /api/projects
 * List projects for the current authenticated user
 */
r.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId)) {
      return res.status(400).json({ error: "Invalid user id on request" });
    }

    const projects = await prisma.project.findMany({
      where: { user_id: numericUserId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        latitude: true,
        longitude: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return res.json({ projects });
  } catch (e) {
    console.error("[projects.get]", e);
    return res.status(500).json({ error: "Failed to load projects" });
  }
});

/**
 * POST /api/projects
 * Create a new project for the current authenticated user
 */
r.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId == null) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId)) {
      return res.status(400).json({ error: "Invalid user id on request" });
    }

    // Validate body with Zod schema 
    const parsed = createProjectSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid body",
        details: parsed.error.flatten(),
      });
    }

    const { name, description, location } = parsed.data;

    let g:
      | {
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        }
      | null = null;

    if (location) {
      try {
        g = await geocode(location);
      } catch (geoErr) {
        // Log and continue with null coordinates/address
        console.error("[projects.post] geocode failed (non-fatal)", geoErr);
        g = null;
      }
    }

    const project = await prisma.project.create({
      data: {
        user_id: numericUserId,
        name,
        description: description ?? null,
        location: location ?? null,
        address: g?.address ?? null,
        city: g?.city ?? null,
        state: g?.state ?? null,
        postal_code: g?.postal_code ?? null,
        country: g?.country ?? null,
        latitude: g?.latitude ?? null,
        longitude: g?.longitude ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        latitude: true,
        longitude: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json({ project });
  } catch (e) {
    console.error("[projects.post]", e);
    return res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * GET /api/projects/:id
 * Return a single project (must belong to the authenticated user)
 */
r.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const numericUserId = Number(userId);
    const projectId = Number(req.params.id);
    if (!Number.isFinite(numericUserId) || !Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, user_id: numericUserId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        address: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,
        latitude: true,
        longitude: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });
    return res.json(project);
  } catch (e) {
    console.error("[projects.get/:id]", e);
    return res.status(500).json({ error: "Failed to load project" });
  }
});

/**
 * GET /api/projects/:id/estimates
 * List all estimates for a project (must belong to the authenticated user)
 */
r.get("/:id/estimates", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId == null) return res.status(401).json({ error: "Unauthorized" });

    const numericUserId = Number(userId);
    const projectId = Number(req.params.id);
    if (!Number.isFinite(numericUserId) || !Number.isFinite(projectId)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, user_id: numericUserId },
      select: { id: true },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const estimates = await prisma.estimate.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        lines: {
          select: {
            id: true,
            assemblyId: true,
            lineTotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ estimates });
  } catch (e) {
    console.error("[projects.get/:id/estimates]", e);
    return res.status(500).json({ error: "Failed to load estimates" });
  }
});

export default r;
