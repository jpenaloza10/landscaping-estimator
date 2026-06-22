import { Router } from "express";
import { prisma } from "./prisma/client.js";

const router = Router();

// Create a project 
router.post("/", async (req, res) => {
    const { name, description, location } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const proj = await prisma.project.create({
        data: {
            name, 
            description: description || null,
            location: location || null,
            userId: req.user.id,
        },
    });
    res.status(201).json(proj);
});

// List my projects
router.get("/", async (req, res) => {
    const projects = await prisma.project.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
    });
    res.json(projects);
});

export default router;