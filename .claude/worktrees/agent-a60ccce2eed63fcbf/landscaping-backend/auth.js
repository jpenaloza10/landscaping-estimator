import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma/client.js";

export const registerUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, passwordHash } });

    return res.status(201).json({ message: "User registered" });
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user.id, email: user.email}, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
};

export const requireAuth = (req, res, next) => {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};