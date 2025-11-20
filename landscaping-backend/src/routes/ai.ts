import { Router } from "express";
import {
  aiRecommendAssemblies,
  aiGenerateProposalText,
  aiValidateEstimate,
  aiProfitAnalysis,
} from "../services/aiEstimation";
import { auth as authMiddleware } from "../auth";

const router = Router();

// Require auth for all AI routes
router.use(authMiddleware);

// POST /api/ai/recommend-assemblies
// body: { estimateId: string }
router.post("/recommend-assemblies", async (req, res) => {
  try {
    const { estimateId } = req.body;
    if (!estimateId) {
      return res.status(400).json({ error: "estimateId required" });
    }
    const data = await aiRecommendAssemblies(estimateId);
    res.json(data);
  } catch (e: any) {
    console.error("AI recommend-assemblies error:", e);
    res.status(500).json({ error: e.message || "AI error" });
  }
});

// POST /api/ai/proposal-text
// body: { estimateId: string, style?: "simple" | "professional" | "sales" }
router.post("/proposal-text", async (req, res) => {
  try {
    const { estimateId, style } = req.body;
    if (!estimateId) {
      return res.status(400).json({ error: "estimateId required" });
    }
    const result = await aiGenerateProposalText(
      estimateId,
      style ?? "professional"
    );
    res.json(result);
  } catch (e: any) {
    console.error("AI proposal-text error:", e);
    res.status(500).json({ error: e.message || "AI error" });
  }
});

// POST /api/ai/validate-estimate
// body: { estimateId: string }
router.post("/validate-estimate", async (req, res) => {
  try {
    const { estimateId } = req.body;
    if (!estimateId) {
      return res.status(400).json({ error: "estimateId required" });
    }
    const result = await aiValidateEstimate(estimateId);
    res.json(result);
  } catch (e: any) {
    console.error("AI validate-estimate error:", e);
    res.status(500).json({ error: e.message || "AI error" });
  }
});

// POST /api/ai/profit-analysis
// body: { estimateId: string }
router.post("/profit-analysis", async (req, res) => {
  try {
    const { estimateId } = req.body;
    if (!estimateId) {
      return res.status(400).json({ error: "estimateId required" });
    }
    const result = await aiProfitAnalysis(estimateId);
    res.json(result);
  } catch (e: any) {
    console.error("AI profit-analysis error:", e);
    res.status(500).json({ error: e.message || "AI error" });
  }
});

export default router;
