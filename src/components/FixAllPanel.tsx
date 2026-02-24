"use client";

import { useState } from "react";
import { X, ArrowRight, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ActionItemWithMeta {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  timeEstimate: string;
  oshaRisk: "Critical" | "High" | "Medium";
  fixHref: string;
  fixLabel: string;
}

interface FixAllPanelProps {
  open: boolean;
  onClose: () => void;
  actionItems: ActionItemWithMeta[];
  complianceScore: number;
}

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-status-red/15", text: "text-status-red", border: "border-status-red/30" },
  High: { bg: "bg-status-amber/15", text: "text-status-amber", border: "border-status-amber/30" },
  Medium: { bg: "bg-yellow-400/15", text: "text-yellow-400", border: "border-yellow-400/30" },
};

export default function FixAllPanel({ open, onClose, actionItems, complianceScore }: FixAllPanelProps) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  if (!open) return null;

  const sorted = [...actionItems].sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2 };
    return order[a.oshaRisk] - order[b.oshaRisk];
  });

  const allReviewed = reviewed.size >= actionItems.length && actionItems.length > 0;
  const allCompliant = actionItems.length === 0;

  const circumference = 2 * Math.PI * 40;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-navy-950 border-l border-navy-700 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-navy-950 border-b border-navy-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">Fix All Items</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Compliance Ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1A2D4D" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={complianceScore >= 90 ? "#22C55E" : complianceScore >= 70 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${circumference * (complianceScore / 100)} ${circumference * (1 - complianceScore / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-black text-lg text-white">{complianceScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-white font-medium">
                {actionItems.length === 0
                  ? "Fully Compliant"
                  : `${actionItems.length} item${actionItems.length !== 1 ? "s" : ""} to resolve`}
              </p>
              <p className="text-xs text-gray-400">
                {actionItems.length > 0
                  ? `Est. total time: ${actionItems.reduce((sum, a) => sum + parseInt(a.timeEstimate) || 2, 0)} min`
                  : "All compliance checks passing"}
              </p>
            </div>
          </div>
        </div>

        {/* Celebration State */}
        {allCompliant && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="h-20 w-20 rounded-full bg-status-green/20 border-2 border-status-green flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-status-green" />
            </div>
            <h3 className="text-xl font-display font-bold text-status-green mb-2">100% Compliant!</h3>
            <p className="text-sm text-gray-400">All compliance checks are passing. Great work keeping your HazCom program current.</p>
          </div>
        )}

        {/* Item List */}
        {!allCompliant && (
          <div className="p-4 space-y-3">
            {sorted.map((item) => {
              const risk = riskColors[item.oshaRisk];
              const isReviewed = reviewed.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isReviewed
                      ? "bg-navy-800/30 border-navy-700/30 opacity-60"
                      : `bg-navy-900 ${risk.border}`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isReviewed ? "text-gray-500 line-through" : "text-white"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isReviewed}
                      onChange={() => {
                        setReviewed((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-amber-500 focus:ring-amber-500/50 flex-shrink-0 mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}>
                      <ShieldCheck className="h-3 w-3" />
                      {item.oshaRisk}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-gray-400">
                      <Clock className="h-3 w-3" />
                      {item.timeEstimate}
                    </span>
                    {!isReviewed && (
                      <a
                        href={item.fixHref}
                        className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {item.fixLabel} <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {allReviewed && (
              <div className="mt-4 p-4 rounded-xl bg-status-green/10 border border-status-green/20 text-center">
                <CheckCircle2 className="h-6 w-6 text-status-green mx-auto mb-2" />
                <p className="text-sm text-status-green font-medium">All items reviewed</p>
                <p className="text-xs text-gray-400 mt-1">Resolve each item to reach 100% compliance</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        {!allCompliant && (
          <div className="sticky bottom-0 bg-navy-950 border-t border-navy-700 px-4 py-3">
            <button
              onClick={() => {
                const allIds = new Set(actionItems.map((i) => i.id));
                setReviewed(allIds);
              }}
              className="w-full text-center text-xs text-gray-400 hover:text-white py-2 transition-colors"
            >
              Mark All Reviewed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
