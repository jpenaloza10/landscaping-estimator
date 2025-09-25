import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerUser, loginUser, requireAuth } from "./auth.js";
import projectRouter from "./projects.js";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("Landscaping Estimator Backend ✅"));

app.post("/api/register", registerUser);
app.post("/api/login", loginUser);

app.use("/api/projects", requireAuth, projectRouter);

app.listen(process.env.PORT || 5000, () => 
    console.log(`Process is running on ${process.env.PORT || 5000}`)
);