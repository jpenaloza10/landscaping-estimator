import { useState } from "react";
import {
  aiRecommendAssemblies,
  aiProposalText,
  aiValidateEstimate,
  aiProfitAnalysis,
} from "../lib/aiApi";

type Props = { estimateId: string | number };

const SEVERITY_COLOR: Record<string, string> = {
  HIGH:   "text-brand-orange border-brand-orange/40 bg-brand-orange/10",
  MEDIUM: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10",
  LOW:    "text-brand-cream-dim border-brand-cream/20 bg-brand-cream/5",
};

export default function AiAssistantPanel({ estimateId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [validation, setValidation]           = useState<any | null>(null);
  const [proposal, setProposal]               = useState<string>("");
  const [profit, setProfit]                   = useState<any | null>(null);

  async function run<T>(label: string, fn: () => Promise<T>, setter: (v: T) => void) {
    setLoading(label);
    setError(null);
    try {
      setter(await fn());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI error");
    } finally {
      setLoading(null);
    }
  }

  const estIdStr = String(estimateId);

  const actions = [
    {
      label: "Recommend Assemblies",
      key: "recommendations",
      primary: true,
      onClick: () => run("recommendations", () => aiRecommendAssemblies(estIdStr), setRecommendations),
    },
    {
      label: "Validate Estimate",
      key: "validation",
      onClick: () => run("validation", () => aiValidateEstimate(estIdStr), setValidation),
    },
    {
      label: "Generate Proposal Text",
      key: "proposal",
      onClick: () => run("proposal text", () => aiProposalText(estIdStr, "professional"), (d: any) => setProposal(d.narrative)),
    },
    {
      label: "Profit Analysis",
      key: "profit",
      onClick: () => run("profit analysis", () => aiProfitAnalysis(estIdStr), setProfit),
    },
  ];

  return (
    <div className="brand-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="brand-eyebrow mb-0.5">AI Assistant</p>
          <p className="font-sans text-[11px] text-brand-cream-dim">
            Powered by Claude — analyze, validate, and generate proposal text.
          </p>
        </div>
        {loading && (
          <span className="font-sans text-[10px] tracking-widest uppercase text-brand-orange animate-pulse">
            {loading}…
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, key, primary, onClick }) => (
          <button
            key={key}
            type="button"
            disabled={!!loading}
            onClick={onClick}
            className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              primary
                ? "bg-brand-orange border-brand-orange text-white hover:bg-brand-orange/90"
                : "border-brand-cream/25 text-brand-cream-dim hover:border-brand-cream/50 hover:text-brand-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="font-sans text-xs text-brand-orange border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {/* ── Assembly Recommendations ── */}
      {recommendations && (
        <div className="border-t border-brand-cream/10 pt-4 space-y-2">
          <p className="brand-eyebrow">Assembly Suggestions</p>
          <ul className="space-y-3">
            {(recommendations.suggestions ?? []).map((s: any, idx: number) => (
              <li key={idx} className="border border-brand-cream/15 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold italic text-brand-cream">{s.name}</span>
                  <span className="font-sans text-[9px] font-semibold tracking-widest uppercase text-brand-orange border border-brand-orange/30 px-2 py-0.5">
                    {s.category}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-brand-cream-dim">{s.rationale}</p>
                <p className="font-sans text-[10px] text-brand-cream/40 italic">
                  Rule of thumb: {s.quantityRuleOfThumb}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Validation Issues ── */}
      {validation && (
        <div className="border-t border-brand-cream/10 pt-4 space-y-2">
          <p className="brand-eyebrow">Validation Issues</p>
          {(validation.issues ?? []).length === 0 ? (
            <p className="font-sans text-xs text-emerald-400">✓ No issues found.</p>
          ) : (
            <ul className="space-y-2">
              {(validation.issues ?? []).map((issue: any, idx: number) => {
                const cls = SEVERITY_COLOR[issue.severity?.toUpperCase()] ?? SEVERITY_COLOR.LOW;
                return (
                  <li key={idx} className={`border rounded-sm p-3 space-y-1 ${cls}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[9px] font-semibold tracking-widest uppercase">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="font-sans text-[11px]">{issue.message}</p>
                    <p className="font-sans text-[10px] opacity-70 italic">Suggestion: {issue.suggestion}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Proposal Narrative ── */}
      {proposal && (
        <div className="border-t border-brand-cream/10 pt-4 space-y-2">
          <p className="brand-eyebrow">Proposal Narrative</p>
          <textarea
            className="w-full bg-transparent border border-brand-cream/25 rounded-sm p-3 font-sans text-xs text-brand-cream h-36 focus:outline-none focus:border-brand-cream/60 resize-none"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
          />
          <p className="font-sans text-[10px] text-brand-cream-dim">
            Edit before copying to your final proposal.
          </p>
        </div>
      )}

      {/* ── Profit Analysis ── */}
      {profit && (
        <div className="border-t border-brand-cream/10 pt-4 space-y-3">
          <p className="brand-eyebrow">Profit Analysis</p>
          <p className="font-sans text-xs text-brand-cream-dim">{profit.summary}</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Baseline",   value: profit.numbers?.baselineEstimate },
              { label: "Change Orders", value: profit.numbers?.changeOrdersTotal },
              { label: "Contract",   value: profit.numbers?.contractValue },
              { label: "Expenses",   value: profit.numbers?.totalExpenses },
              { label: "Gross Profit", value: profit.numbers?.estimatedGrossProfit },
              { label: "Margin",     value: profit.numbers?.estimatedProfitMarginPercent, isPercent: true },
            ].map(({ label, value, isPercent }: any) => (
              <div key={label} className="border border-brand-cream/15 p-2">
                <p className="font-sans text-[9px] tracking-widest uppercase text-brand-cream-dim mb-1">{label}</p>
                <p className={`font-serif text-sm font-bold italic ${
                  label === "Gross Profit" || label === "Margin"
                    ? (Number(value) >= 0 ? "text-emerald-400" : "text-brand-orange")
                    : "text-brand-cream"
                }`}>
                  {isPercent ? `${Number(value ?? 0).toFixed(1)}%` : `$${Number(value ?? 0).toFixed(0)}`}
                </p>
              </div>
            ))}
          </div>

          {profit.risks?.length > 0 && (
            <div>
              <p className="font-sans text-[10px] font-semibold tracking-widest uppercase text-brand-orange mb-2">Risks</p>
              <ul className="space-y-1">
                {profit.risks.map((r: string, idx: number) => (
                  <li key={idx} className="font-sans text-[11px] text-brand-cream-dim flex gap-2">
                    <span className="text-brand-orange shrink-0">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
