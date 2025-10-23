// src/routes/projects.ts
import { Router } from "express";
import { auth } from "../auth";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase"; // ⬅️ Supabase server client (service role key)
import { createProjectSchema } from "../validation/project"; // or "../projects" if that's the path

// If your schema file is at src/projects.ts as you showed, update import to:
// import { createProjectSchema } from "../projects";

const r = Router();

// Protect all routes in this router
r.use(auth);

// GET /api/projects  -> list projects for current user
r.get("/", async (req, res) => {
  try {
    const userId = req.user!.id; // set by auth middleware

    // --- Supabase version (ACTIVE) ---
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ projects: data ?? [] });

    // --- Prisma version (if you prefer Prisma):
    // const projects = await prisma.project.findMany({
    //   where: { ownerId: userId },
    //   orderBy: { createdAt: "desc" },
    // });
    // return res.json({ projects });
  } catch (e: any) {
    console.error("[projects.get]", e);
    return res.status(500).json({ error: "Failed to load projects" });
  }
});

// POST /api/projects  -> create a project for current user
r.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validate request body with Zod
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const { name, description, location } = parsed.data;

    // --- Supabase version (ACTIVE) ---
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        name,
        description,
        location,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ project: data });

    // --- Prisma version (if you prefer Prisma):
    // const project = await prisma.project.create({
    //   data: { name, description, location, ownerId: userId },
    // });
    // return res.status(201).json({ project });
  } catch (e: any) {
    console.error("[projects.post]", e);
    return res.status(500).json({ error: "Failed to create project" });
  }
});

export default r;
