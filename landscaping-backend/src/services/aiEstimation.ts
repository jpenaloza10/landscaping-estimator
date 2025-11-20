import { prisma } from "../prisma";
import { callAI } from "./aiClient";
import { Decimal } from "@prisma/client/runtime/library";

function dec(n: Decimal | number | null | undefined): number {
  if (n == null) return 0;
  if (n instanceof Decimal) return Number(n);
  return n;
}

export async function loadEstimateContext(estimateId: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      project: true,
      lines: {
        include: {
          assembly: true,
        },
      },
      expenses: true,
      changeOrders: true,
    },
  });

  if (!estimate) throw new Error("Estimate not found");

  const { project, lines, expenses, changeOrders } = estimate;

  return {
    estimate,
    project,
    lines,
    expenses,
    changeOrders,
  };
}

/**
 * AI: Recommend additional assemblies that might be missing
 */
export async function aiRecommendAssemblies(estimateId: string) {
  const { estimate, project, lines } = await loadEstimateContext(estimateId);

  const prompt = `
You are assisting a landscaping contractor building an estimate.

Project:
- Name: ${project?.name ?? "N/A"}
- Location: ${project?.city ?? ""}, ${project?.state ?? ""}, ${
    project?.postal_code ?? ""
  }, ${project?.country ?? ""}
- Description: ${project?.description ?? ""}

Current assemblies / lines:
${lines
  .map(
    (l) =>
      `- Assembly: ${l.assembly?.name ?? "Unknown"} | Trade: ${
        l.assembly?.trade ?? ""
      } | Unit: ${l.assembly?.unit ?? ""} | Line total: ${dec(l.lineTotal)}`
  )
  .join("\n")}

Task:
1. Suggest additional assemblies that are commonly needed for this type of project but appear to be missing.
2. For each suggestion, include:
   - name
   - category (MATERIAL, LABOR, EQUIPMENT, SUBCONTRACTOR, OTHER)
   - rationale
   - quantityRuleOfThumb (e.g. "0.25 tons per 10 sqft").
3. Respond in strict JSON with shape:

{
  "suggestions": [
    {
      "name": string,
      "category": "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OTHER",
      "rationale": string,
      "quantityRuleOfThumb": string
    }
  ]
}

No extra commentary.
`;

  const raw = await callAI(prompt);
  try {
    return JSON.parse(raw);
  } catch {
    return { suggestions: [], raw };
  }
}

/**
 * AI: Proposal / narrative text for the estimate
 */
export async function aiGenerateProposalText(
  estimateId: string,
  style: "simple" | "professional" | "sales" = "professional"
) {
  const { estimate, project, lines, expenses, changeOrders } =
    await loadEstimateContext(estimateId);

  const totalEstimate =
    dec(estimate.total) ||
    lines.reduce((sum, l) => sum + dec(l.lineTotal), 0);

  const approvedCOs = changeOrders.filter((co) => co.status === "APPROVED");
  const coTotal = approvedCOs.reduce((s, co) => s + dec(co.amount), 0);
  const spent = expenses.reduce((s, e) => s + dec(e.amount), 0);

  const prompt = `
Write a ${style} proposal narrative for a landscaping construction project estimate.

Project:
- Name: ${project?.name ?? "N/A"}
- Location: ${project?.city ?? ""}, ${project?.state ?? ""}, ${
    project?.postal_code ?? ""
  }, ${project?.country ?? ""}
- Description: ${project?.description ?? ""}

Numbers:
- Baseline estimate total: ${totalEstimate}
- Approved change orders total: ${coTotal}
- Approximate expenses recorded so far: ${spent}

Major assemblies:
${lines
  .slice(0, 10)
  .map(
    (l) =>
      `- ${l.assembly?.name ?? "Assembly"}: trade=${l.assembly?.trade ?? ""}, unit=${
        l.assembly?.unit ?? ""
      }, line total=${dec(l.lineTotal)}`
  )
  .join("\n")}

Instructions:
- Explain the scope of work and what the client is paying for (materials, labor, equipment, etc.).
- Be clear and honest about what is included and not included.
- Avoid making up warranties, legal promises, or regulations.
- 2–4 short paragraphs, plain English, no bullet points.
`;

  const narrative = await callAI(prompt);
  return { narrative };
}

/**
 * AI: Validate estimate for possible issues / gaps
 */
export async function aiValidateEstimate(estimateId: string) {
  const { estimate, project, lines, expenses, changeOrders } =
    await loadEstimateContext(estimateId);

  const totalEstimate =
    dec(estimate.total) ||
    lines.reduce((sum, l) => sum + dec(l.lineTotal), 0);
  const totalExpenses = expenses.reduce((s, e) => s + dec(e.amount), 0);

  const prompt = `
You are reviewing a landscaping construction estimate for possible issues.

Project:
- Name: ${project?.name ?? "N/A"}
- Location: ${project?.city ?? ""}, ${project?.state ?? ""}, ${
    project?.postal_code ?? ""
  }, ${project?.country ?? ""}
- Description: ${project?.description ?? ""}

Estimate lines:
${lines
  .map(
    (l) =>
      `- ${l.assembly?.name ?? "Assembly"} | trade=${l.assembly?.trade ?? ""} | qty info: ${
        JSON.stringify(l.inputs) || "{}"
      } | line total=${dec(l.lineTotal)}`
  )
  .join("\n")}

Summary:
- Estimate total: ${totalEstimate}
- Number of change orders: ${changeOrders.length}
- Total expenses: ${totalExpenses}

Task:
1. Identify possible issues, such as:
   - Missing labor or equipment costs.
   - No delivery/disposal/overhead when they are usually needed.
   - Unusually low totals or obviously incomplete categories.
2. For each issue, provide:
   - severity: "LOW" | "MEDIUM" | "HIGH"
   - message: short human-readable sentence
   - suggestion: what the contractor should check or adjust.
3. Respond as JSON:
{
  "issues": [
    { "severity": "LOW"|"MEDIUM"|"HIGH", "message": string, "suggestion": string }
  ]
}

No extra prose.
`;

  const raw = await callAI(prompt);
  try {
    return JSON.parse(raw);
  } catch {
    return { issues: [], raw };
  }
}

/**
 * AI: Profit analysis based on estimate total, change orders, and expenses
 */
export async function aiProfitAnalysis(estimateId: string) {
  const { estimate, project, expenses, changeOrders } =
    await loadEstimateContext(estimateId);

  const baseline = dec(estimate.total);
  const approvedCOs = changeOrders.filter((co) => co.status === "APPROVED");
  const coTotal = approvedCOs.reduce((s, co) => s + dec(co.amount), 0);
  const contractValue = baseline + coTotal;
  const totalExpenses = expenses.reduce((s, e) => s + dec(e.amount), 0);
  const estimatedGrossProfit = contractValue - totalExpenses;
  const margin =
    contractValue > 0 ? (estimatedGrossProfit / contractValue) * 100 : 0;

  const prompt = `
You are a cost analyst for a landscaping contractor.

Project:
- Name: ${project?.name ?? "N/A"}
- Location: ${project?.city ?? ""}, ${project?.state ?? ""}, ${
    project?.postal_code ?? ""
  }, ${project?.country ?? ""}
- Description: ${project?.description ?? ""}

Numbers:
- Baseline estimate total: ${baseline}
- Approved change orders total: ${coTotal}
- Combined contract value: ${contractValue}
- Total recorded expenses: ${totalExpenses}

Task:
1. Summarize how the job appears to be tracking financially (under / on / over budget).
2. Use the numbers as-is; do not make up your own.
3. Identify up to 3 possible risk factors that could impact profit (in generic terms).
4. Respond as JSON:

{
  "summary": string,
  "numbers": {
    "baselineEstimate": number,
    "changeOrdersTotal": number,
    "contractValue": number,
    "totalExpenses": number,
    "estimatedGrossProfit": number,
    "estimatedProfitMarginPercent": number
  },
  "risks": string[]
}

No extra text.
`;

  const raw = await callAI(prompt);
  try {
    const parsed = JSON.parse(raw);
    // If AI forgets numbers, fill them
    parsed.numbers = parsed.numbers || {};
    parsed.numbers.baselineEstimate ??= baseline;
    parsed.numbers.changeOrdersTotal ??= coTotal;
    parsed.numbers.contractValue ??= contractValue;
    parsed.numbers.totalExpenses ??= totalExpenses;
    parsed.numbers.estimatedGrossProfit ??= estimatedGrossProfit;
    parsed.numbers.estimatedProfitMarginPercent ??= margin;
    return parsed;
  } catch {
    // safe fallback
    return {
      summary:
        "AI parsing failed; using computed baseline profit metrics only. Check details manually.",
      numbers: {
        baselineEstimate: baseline,
        changeOrdersTotal: coTotal,
        contractValue,
        totalExpenses,
        estimatedGrossProfit,
        estimatedProfitMarginPercent: margin,
      },
      risks: [],
      raw,
    };
  }
}
