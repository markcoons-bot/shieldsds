"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import LabelPreview from "@/components/LabelPreview";
import GHSPictogram from "@/components/GHSPictogram";
import { getChemicals, updateChemical, initializeStore } from "@/lib/chemicals";
import type { Chemical } from "@/lib/types";
import {
  AlertTriangle,
  Printer,
  Tags,
  Clock,
  Search,
  X,
  CheckCircle2,
  ChevronDown,
  Layers,
  Camera,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LabelSize = "full" | "small" | "minimal";

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-status-green/15 border border-status-green/30 text-status-green px-5 py-3 rounded-xl shadow-lg animate-in">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [labelSize, setLabelSize] = useState<LabelSize>("full");
  const [toast, setToast] = useState<string | null>(null);

  // Load chemicals from store on mount
  useEffect(() => {
    initializeStore();
    const chems = getChemicals();
    setChemicals(chems);
    // Select first unlabeled, or first chemical
    const firstUnlabeled = chems.find((c) => !c.labeled);
    setSelectedId(firstUnlabeled?.id ?? chems[0]?.id ?? null);
  }, []);

  const selectedChemical = useMemo(
    () => chemicals.find((c) => c.id === selectedId) ?? null,
    [chemicals, selectedId]
  );

  const needsLabels = useMemo(
    () => chemicals.filter((c) => !c.labeled),
    [chemicals]
  );

  const recentlyPrinted = useMemo(
    () =>
      chemicals
        .filter((c) => c.labeled && c.label_printed_date)
        .sort((a, b) => (b.label_printed_date ?? "").localeCompare(a.label_printed_date ?? "")),
    [chemicals]
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch) return chemicals;
    const q = productSearch.toLowerCase();
    return chemicals.filter(
      (c) =>
        c.product_name.toLowerCase().includes(q) ||
        c.manufacturer.toLowerCase().includes(q)
    );
  }, [productSearch, chemicals]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  function handlePrintLabel(chemId?: string) {
    const id = chemId ?? selectedId;
    if (!id) return;
    const now = new Date().toISOString();
    updateChemical(id, { labeled: true, label_printed_date: now });
    setChemicals(getChemicals());
    showToast("Label printed — chemical marked as labeled");
  }

  function handlePrintAllPending() {
    const pending = chemicals.filter((c) => !c.labeled);
    if (pending.length === 0) {
      showToast("All chemicals are already labeled!");
      return;
    }
    const now = new Date().toISOString();
    for (const c of pending) {
      updateChemical(c.id, { labeled: true, label_printed_date: now });
    }
    setChemicals(getChemicals());
    showToast(`${pending.length} label${pending.length !== 1 ? "s" : ""} printed`);
  }

  function selectChemical(id: string) {
    setSelectedId(id);
    setProductSearch("");
    setProductDropdownOpen(false);
  }

  // Empty state
  if (chemicals.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <Tags className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No chemicals added yet</h2>
          <p className="text-gray-400 mb-6">Scan your first chemical to get started.</p>
          <Link
            href="/scan"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Camera className="h-5 w-5" />
            Scan Chemical
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Labels</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate and print GHS-compliant secondary container labels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintAllPending}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2.5 min-h-[44px] rounded-lg transition-colors w-full md:w-auto justify-center"
          >
            <Layers className="h-4 w-4" />
            Print All Pending ({needsLabels.length})
          </button>
        </div>
      </div>

      {/* Alert banner for unlabeled */}
      {needsLabels.length > 0 && (
        <div className="mb-6 rounded-xl bg-status-amber/10 border border-status-amber/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-status-amber flex-shrink-0" />
            <p className="text-sm text-white">
              <span className="font-medium">{needsLabels.length} chemical{needsLabels.length !== 1 ? "s" : ""} need labels</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (needsLabels[0]) selectChemical(needsLabels[0].id);
            }}
            className="text-status-amber hover:text-white text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center"
          >
            Create Labels
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Left Column: Label Creator ─── */}
        <div className="space-y-5">
          {/* Product Selector */}
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Select Chemical
            </label>
            <div className="relative">
              <button
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full flex items-center justify-between bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 min-h-[44px] text-left hover:border-navy-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {selectedChemical?.product_name ?? "Select a chemical"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedChemical?.manufacturer ?? ""}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {productDropdownOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-navy-900 border border-navy-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-navy-700/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search chemicals..."
                        className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProducts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectChemical(c.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 min-h-[44px] text-left transition-colors border-b border-navy-700/30 last:border-b-0 ${
                          c.id === selectedId ? "bg-amber-500/10" : "hover:bg-navy-800/50"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${c.id === selectedId ? "text-amber-400" : "text-white"}`}>
                            {c.product_name}
                          </p>
                          <p className="text-xs text-gray-500">{c.manufacturer}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          c.signal_word === "DANGER"
                            ? "bg-status-red/15 text-status-red"
                            : c.signal_word === "WARNING"
                            ? "bg-status-amber/15 text-status-amber"
                            : "bg-navy-700/50 text-gray-400"
                        }`}>
                          {c.signal_word ?? "—"}
                        </span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="py-6 text-center text-gray-500 text-sm">No chemicals match your search.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Label Size Toggle */}
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Label Size
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "full" as const, label: "Full (4\u00d76)" },
                { key: "small" as const, label: "Small (2\u00d73)" },
                { key: "minimal" as const, label: "Minimal (1\u00d73)" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setLabelSize(opt.key)}
                  className={`flex-1 text-center py-2 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors border ${
                    labelSize === opt.key
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label Preview */}
          {selectedChemical && (
            <div>
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Label Preview
              </label>
              <div className="max-w-full overflow-x-auto">
                <LabelPreview
                  chemical={selectedChemical}
                  size={labelSize}
                  onPrint={() => handlePrintLabel()}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column: Needs Labels + Recently Printed ─── */}
        <div className="space-y-6">
          {/* Needs Labels */}
          {needsLabels.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Needs Labels ({needsLabels.length})
              </h2>
              <div className="bg-navy-900 border border-status-amber/30 rounded-xl overflow-hidden">
                {needsLabels.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < needsLabels.length - 1 ? "border-b border-navy-700/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-status-amber flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{c.location}</span>
                          {c.signal_word && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              c.signal_word === "DANGER"
                                ? "bg-status-red/15 text-status-red"
                                : "bg-status-amber/15 text-status-amber"
                            }`}>
                              {c.signal_word}
                            </span>
                          )}
                          {c.pictogram_codes.slice(0, 3).map((code) => (
                            <GHSPictogram key={code} code={code} size={16} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        selectChemical(c.id);
                        handlePrintLabel(c.id);
                      }}
                      className="flex items-center gap-1 text-xs bg-status-amber/15 hover:bg-status-amber/25 text-status-amber px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Printer className="h-3 w-3" />
                      Print Label
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Printed */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recently Printed ({recentlyPrinted.length})
            </h2>
            {recentlyPrinted.length > 0 ? (
              <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {recentlyPrinted.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < recentlyPrinted.length - 1 ? "border-b border-navy-700/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-navy-800 flex items-center justify-center">
                        <Tags className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.product_name}</p>
                        <p className="text-xs text-gray-500">{c.container_count} {c.container_type} &middot; {c.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {c.label_printed_date
                          ? new Date(c.label_printed_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </div>
                      <button
                        onClick={() => selectChemical(c.id)}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        Reprint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-500">No labels printed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
