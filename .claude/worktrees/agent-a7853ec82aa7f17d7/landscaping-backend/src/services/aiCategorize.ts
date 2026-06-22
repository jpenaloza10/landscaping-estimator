import { ExpenseCategory } from "@prisma/client";
import { callAI } from "./aiClient"; 

// Allowed categories for both AI + fallback
const ALLOWED: ExpenseCategory[] = [
  "MATERIAL",
  "LABOR",
  "EQUIPMENT",
  "SUBCONTRACTOR",
  "OTHER",
];

export type AICategoryResult = {
  category: ExpenseCategory;
  confidence: number; // 0–1
};

/**
 * Simple rule-based fallback if AI is not available or fails.
 */
function ruleBasedCategorize(input: {
  vendor?: string | null;
  description?: string | null;
  ocrText?: string | null;
}): AICategoryResult {
  const text = `
Vendor: ${input.vendor || ""}
Description: ${input.description || ""}
Receipt: ${input.ocrText || ""}
`.toLowerCase();

  let cat: ExpenseCategory = "OTHER";

  if (/paver|stone|rock|soil|mulch|plant|nursery|lumber|concrete/.test(text)) {
    cat = "MATERIAL";
  } else if (/labor|payroll|hours|crew/.test(text)) {
    cat = "LABOR";
  } else if (/rental|skid|bobcat|equipment/.test(text)) {
    cat = "EQUIPMENT";
  } else if (/subcontract|sub-contractor|sub contractor/.test(text)) {
    cat = "SUBCONTRACTOR";
  }

  return { category: cat, confidence: 0.7 };
}

/**
 * AI-driven categorization with Groq (via callAI) + safe fallback.
 */
export async function aiCategorizeExpense(input: {
  vendor?: string | null;
  description?: string | null;
  ocrText?: string | null;
}): Promise<AICategoryResult> {
  // Always have a deterministic fallback ready
  const fallback = ruleBasedCategorize(input);

  // If AI key is missing, callAI will throw — catch below and return fallback.
  const combinedText = `
Vendor: ${input.vendor || ""}
Description: ${input.description || ""}
Receipt OCR: ${input.ocrText || ""}
`.trim();

  const prompt = `
You are helping categorize landscaping expenses into one of these categories:

- MATERIAL
- LABOR
- EQUIPMENT
- SUBCONTRACTOR
- OTHER

Rules:
- "MATERIAL" = plants, stone, rock, soil, mulch, pavers, lumber, concrete, gravel, etc.
- "LABOR" = crew wages, labor hours, payroll, installation time.
- "EQUIPMENT" = rentals or purchases of machines, tools, skid steers, bobcats, etc.
- "SUBCONTRACTOR" = invoices from other companies doing part of the work.
- "OTHER" = anything that doesn't fit the above.

You MUST respond with a single JSON object ONLY, no extra text, in this shape:

{
  "category": "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OTHER",
  "confidence": 0.0-1.0
}

Text to analyze:
"""
${combinedText}
"""
`;

  try {
    const raw = await callAI(prompt); // uses Groq/OpenAI-compatible client

    // Model should return JSON only; parse it.
    const parsed = JSON.parse(raw);

    const category = String(parsed.category || "").toUpperCase() as ExpenseCategory;
    const confidence = Number(parsed.confidence);

    // Validate category & confidence
    const isValidCategory = ALLOWED.includes(category);
    const isValidConfidence =
      Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;

    if (!isValidCategory || !isValidConfidence) {
      console.warn("[aiCategorizeExpense] Invalid AI response, using fallback:", parsed);
      return fallback;
    }

    return { category, confidence };
  } catch (err) {
    console.error("[aiCategorizeExpense] AI call failed, using fallback:", err);
    return fallback;
  }
}
