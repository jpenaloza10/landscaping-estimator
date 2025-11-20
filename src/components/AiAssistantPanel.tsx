import { useState } from "react";
import {
  aiRecommendAssemblies,
  aiProposalText,
  aiValidateEstimate,
  aiProfitAnalysis,
} from "../lib/aiApi";

type Props = {
  estimateId: string;
  token: string; // JWT or similar
};

export default function AiAssistantPanel({ estimateId, token }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [validation, setValidation] = useState<any | null>(null);
  const [proposal, setProposal] = useState<string>("");
  const [profit, setProfit] = useState<any | null>(null);

  async function run<T>(
    label: string,
    fn: () => Promise<T>,
    setter: (val: T) => void
  ) {
    setLoading(label);
    setError(null);
    try {
      const data = await fn();
      setter(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "AI error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">✨ AI Assistant</h3>
        {loading && (
          <span className="text-[11px] text-slate-500">
            Running {loading}…
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            run(
              "recommendations",
              () => aiRecommendAssemblies(estimateId, token),
              (data) => setRecommendations(data)
            )
          }
          className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          Recommend assemblies
        </button>
        <button
          type="button"
          onClick={() =>
            run(
              "validation",
              () => aiValidateEstimate(estimateId, token),
              (data) => setValidation(data)
            )
          }
          className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
        >
          Validate estimate
        </button>
        <button
          type="button"
          onClick={() =>
            run(
              "proposal text",
              () => aiProposalText(estimateId, "professional", token),
              (data: any) => setProposal(data.narrative)
            )
          }
          className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
        >
          Generate proposal text
        </button>
        <button
          type="button"
          onClick={() =>
            run(
              "profit analysis",
              () => aiProfitAnalysis(estimateId, token),
              (data) => setProfit(data)
            )
          }
          className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
        >
          Profit analysis
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}

      {recommendations && (
        <div className="border-t pt-2">
          <h4 className="font-semibold text-xs mb-1">Assembly Suggestions</h4>
          <ul className="list-disc ml-4 space-y-1">
            {(recommendations.suggestions ?? []).map(
              (s: any, idx: number) => (
                <li key={idx}>
                  <span className="font-medium">{s.name}</span>{" "}
                  <span className="text-slate-500">({s.category})</span>
                  <div className="text-slate-600">{s.rationale}</div>
                  <div className="text-slate-500 italic">
                    Rule of thumb: {s.quantityRuleOfThumb}
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {validation && (
        <div className="border-t pt-2">
          <h4 className="font-semibold text-xs mb-1">Validation Issues</h4>
          <ul className="space-y-1">
            {(validation.issues ?? []).map((issue: any, idx: number) => (
              <li key={idx} className="border rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{issue.severity}</span>
                  <span className="text-slate-500 text-[11px]">AI</span>
                </div>
                <div>{issue.message}</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Suggestion: {issue.suggestion}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {proposal && (
        <div className="border-t pt-2">
          <h4 className="font-semibold text-xs mb-1">Proposal Narrative</h4>
          <textarea
            className="w-full border rounded p-2 text-xs h-32"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            You can edit this text before adding it to the final proposal.
          </p>
        </div>
      )}

      {profit && (
        <div className="border-t pt-2">
          <h4 className="font-semibold text-xs mb-1">Profit Analysis</h4>
          <p className="text-slate-700 mb-1">{profit.summary}</p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span>
              Baseline: $
              {profit.numbers?.baselineEstimate?.toFixed?.(2) ?? "0.00"}
            </span>
            <span>
              CO Total: $
              {profit.numbers?.changeOrdersTotal?.toFixed?.(2) ?? "0.00"}
            </span>
            <span>
              Contract: $
              {profit.numbers?.contractValue?.toFixed?.(2) ?? "0.00"}
            </span>
            <span>
              Expenses: $
              {profit.numbers?.totalExpenses?.toFixed?.(2) ?? "0.00"}
            </span>
            <span>
              Gross Profit: $
              {profit.numbers?.estimatedGrossProfit?.toFixed?.(2) ?? "0.00"}
            </span>
            <span>
              Margin:{" "}
              {profit.numbers?.estimatedProfitMarginPercent?.toFixed?.(1) ??
                "0"}
              %
            </span>
          </div>
          {profit.risks && profit.risks.length > 0 && (
            <ul className="list-disc ml-4 mt-1 text-[11px]">
              {profit.risks.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
