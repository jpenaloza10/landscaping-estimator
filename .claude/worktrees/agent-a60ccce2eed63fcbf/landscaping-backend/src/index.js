import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signToken, auth } from "./auth";
const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));
// Sign up
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: "Missing fields" });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(409).json({ error: "Email already in use" });
        const passwordHash = await bcrypt.hash(password, 10); // <-- camelCase
        const user = await prisma.user.create({
            data: { name, email, passwordHash }, // <-- camelCase
        });
        const token = signToken({ userId: user.id, email: user.email }); // <-- user.id is string
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Signup failed" });
    }
});
// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "Missing fields" });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        const ok = await bcrypt.compare(password, user.passwordHash); // <-- camelCase
        if (!ok)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = signToken({ userId: user.id, email: user.email }); // <-- string id
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Login failed" });
    }
});
// Current user
app.get("/api/auth/me", auth, async (req, res) => {
    const { userId } = req.user; // string
    const user = await prisma.user.findUnique({
        where: { id: userId }, // <-- string id
        select: { id: true, name: true, email: true },
    });
    res.json({ user });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
