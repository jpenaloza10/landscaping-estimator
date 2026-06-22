import jwt from "jsonwebtoken";
export const signToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: "7d" });
export function auth(req, res, next) {
    const header = req.headers.authorization; // "Bearer <token>"
    if (!header)
        return res.status(401).json({ error: "Missing Authorization header" });
    const [, token] = header.split(" ");
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
