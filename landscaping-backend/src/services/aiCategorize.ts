// src/services/aiCategorize.ts
import { ExpenseCategory } from "@prisma/client";

const ALLOWED = ["MATERIAL","LABOR","EQUIPMENT","SUBCONTRACTOR","OTHER"];

export type AICategoryResult = {
  category: ExpenseCategory;
  confidence: number;
};

export async function aiCategorizeExpense(input: {
  vendor?: string | null;
  description?: string | null;
  ocrText?: string | null;
}): Promise<AICategoryResult> {
  const text = `
Vendor: ${input.vendor || ""}
Description: ${input.description || ""}
Receipt: ${input.ocrText || ""}
`.toLowerCase();

  // Very simple rules as fallback; replace with LLM call.
  let cat: ExpenseCategory = "OTHER";
  if (/paver|stone|rock|soil|mulch|plant|nursery|lumber|concrete/.test(text)) cat = "MATERIAL";
  else if (/labor|payroll|hours|crew/.test(text)) cat = "LABOR";
  else if (/rental|skid|bobcat|equipment/.test(text)) cat = "EQUIPMENT";
  else if (/subcontract|sub-contractor|sub contractor/.test(text)) cat = "SUBCONTRACTOR";

  return { category: cat, confidence: 0.7 };
}
