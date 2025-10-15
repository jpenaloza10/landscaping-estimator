import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signToken, auth } from "./auth";
const app = express();
app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password)
        return res.status(400).json({ error: "Missing fields" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: "Email already in use" });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password_hash } });
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password)
        return res.status(400).json({ error: "Missing fields" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});
app.get("/api/auth/me", auth, async (req, res) => {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
    res.json({ user });
});
app.listen(Number(process.env.PORT || 8080), () => console.log(`API on http://localhost:${process.env.PORT || 8080}`));
