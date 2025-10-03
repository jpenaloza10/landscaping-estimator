import jwt from "jsonwebtoken";
export const signToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: "7d" });
export function auth(req, res, next) {
    const h = req.headers.authorization;
    if (!h)
        return res.status(401).json({ error: "Missing token" });
    const [, token] = h.split(" ");
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
