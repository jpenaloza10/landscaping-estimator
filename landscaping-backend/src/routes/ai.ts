import { Router } from "express";
import {
  aiRecommendAssemblies,
  aiGenerateProposalText,
  aiValidateEstimate,
  aiProfitAnalysis,
} from "../services/aiEstimation";
import { auth as authMiddleware } from "../auth";

const router = Router();

// Helper: map common AI config errors to nicer HTTP codes
function handleAiError(res: any, e: any, context: string) {
  console.error(`AI ${context} error:`, e);

  const msg = e?.message || "AI error";

  // If the underlying client threw because there's no key configured
  if (msg.includes("AI API key not configured")) {
    return res
      .status(503)
      .json({ error: "AI is not configured on the server (missing API key)." });
  }

  // Fallback: generic 500
  return res.status(500).json({ error: msg });
}

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
    return handleAiError(res, e, "recommend-assemblies");
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
    return handleAiError(res, e, "proposal-text");
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
    return handleAiError(res, e, "validate-estimate");
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
    return handleAiError(res, e, "profit-analysis");
  }
});

export default router;
