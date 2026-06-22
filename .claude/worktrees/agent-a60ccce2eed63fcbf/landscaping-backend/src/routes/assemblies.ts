import { Router } from "express";
import { prisma } from "../prisma"; // export a singleton Prisma in src/prisma.ts

const r = Router();

r.get("/", async (_req, res) => {
  const list = await prisma.assembly.findMany({ include: { items: true } });
  res.json(list);
});

r.post("/", async (req, res) => {
  const { slug, name, trade, unit, wastePct, items } = req.body;
  const created = await prisma.assembly.create({
    data: {
      slug, name, trade, unit, wastePct,
      items: { create: items ?? [] }
    },
    include: { items: true }
  });
  res.json(created);
});

r.get("/templates", async (_req, res) => {
  const list = await prisma.template.findMany({ include: { lines: true } });
  res.json(list);
});

r.post("/templates", async (req, res) => {
  const { name, description, lines } = req.body;
  const created = await prisma.template.create({
    data: { name, description, lines: { create: lines ?? [] } },
    include: { lines: true }
  });
  res.json(created);
});

export default r;
