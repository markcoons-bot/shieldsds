"use client";

import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HelpCard from "@/components/HelpCard";
import { sdsEntries, inventoryItems, recentLabels, inventoryLocations } from "@/lib/data";
import { printSingleLabel, printBatchLabels } from "@/lib/print-labels";
import GHSPictogram from "@/components/GHSPictogram";
import {
  AlertTriangle,
  Printer,
  QrCode,
  ArrowRight,
  Tags,
  Clock,
  RectangleHorizontal,
  Square,
  Search,
  X,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LabelSize = "4x3" | "2x1.5" | "1x1";

interface LabelLogEntry {
  product: string;
  sdsId: string;
  size: string;
  container: string;
  location: string;
  date: string;
}

// ─── Templates ────────────────────────────────────────────────────────────────

const templates: { name: string; desc: string; icon: typeof RectangleHorizontal; size: LabelSize }[] = [
  { name: "Full GHS 4×3", desc: "Standard secondary container label", icon: RectangleHorizontal, size: "4x3" },
  { name: "Mini GHS 2×1.5", desc: "Small containers and bottles", icon: Square, size: "2x1.5" },
  { name: "QR-Only 1×1", desc: "Quick-scan link to SDS", icon: QrCode, size: "1x1" },
  { name: "Pipe Wrap", desc: "For piping and tube labeling", icon: Tags, size: "2x1.5" },
];

const containerTypes = ["Spray Bottle", "Mix Cup", "Squeeze Bottle", "Bucket", "Drum"];

const sizeDimensions: Record<LabelSize, { label: string; w: string; h: string }> = {
  "4x3": { label: "4\" × 3\"", w: "w-full", h: "min-h-[380px]" },
  "2x1.5": { label: "2\" × 1.5\"", w: "w-3/4 mx-auto", h: "min-h-[240px]" },
  "1x1": { label: "1\" × 1\" QR-Only", w: "w-48 mx-auto", h: "min-h-[180px]" },
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-status-green/15 border border-status-green/30 text-status-green px-5 py-3 rounded-xl shadow-lg animate-in">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-white transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabelsPage() {
  const [selectedSdsId, setSelectedSdsId] = useState(sdsEntries[8]?.id ?? sdsEntries[0].id);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [labelSize, setLabelSize] = useState<LabelSize>("4x3");
  const [containerType, setContainerType] = useState(containerTypes[0]);
  const [containerLocation, setContainerLocation] = useState(inventoryLocations[0]?.name ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [printedLabels, setPrintedLabels] = useState<LabelLogEntry[]>([]);

  const selectedSds = sdsEntries.find((s) => s.id === selectedSdsId) ?? sdsEntries[0];

  // Chemicals that need labels: secondaryContainers > 0 and not labeled
  const needsLabels = useMemo(
    () => sdsEntries.filter((s) => s.secondaryContainers > 0 && !s.secondaryLabeled),
    []
  );

  // Unlabeled inventory items for alert banner
  const unlabeledItems = useMemo(() => inventoryItems.filter((i) => !i.labeled), []);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return sdsEntries;
    const q = productSearch.toLowerCase();
    return sdsEntries.filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        s.manufacturer.toLowerCase().includes(q) ||
        s.productCode.toLowerCase().includes(q)
    );
  }, [productSearch]);

  // Combined recent labels: printed this session + seed data
  const allRecentLabels = useMemo(() => {
    const printed = printedLabels.map((l) => ({
      product: l.product,
      sdsId: l.sdsId,
      size: l.size,
      date: l.date,
    }));
    return [...printed, ...recentLabels];
  }, [printedLabels]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  function handlePrintLabel() {
    const sizeLabel = labelSize === "4x3" ? "4×3 GHS" : labelSize === "2x1.5" ? "2×1.5 Mini" : "QR-Only 1×1";
    const newEntry: LabelLogEntry = {
      product: selectedSds.productName,
      sdsId: selectedSds.id,
      size: sizeLabel,
      container: containerType,
      location: containerLocation,
      date: "Just now",
    };
    setPrintedLabels((prev) => [newEntry, ...prev]);
    printSingleLabel(selectedSds, labelSize);
    showToast("Label sent to printer — logged to audit trail");
  }

  function handlePrintAllNeeded() {
    const count = printBatchLabels(sdsEntries);
    if (count > 0) {
      showToast(`Batch printing ${count} label${count !== 1 ? "s" : ""} for unlabeled containers`);
    } else {
      showToast("All containers are already labeled!");
    }
  }

  function selectChemicalForLabel(sdsId: string) {
    setSelectedSdsId(sdsId);
    setProductSearch("");
    setProductDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Labels</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate and print GHS-compliant secondary container labels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              printBatchLabels(sdsEntries);
              showToast("All labels exported to print window");
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Export All Labels
          </button>
          <button
            onClick={handlePrintAllNeeded}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Layers className="h-4 w-4" />
            Print All Needed
          </button>
        </div>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p>
            <strong className="text-amber-400">OSHA 29 CFR 1910.1200(f)</strong> requires that all secondary containers be labeled with the product identifier and hazard information. GHS-compliant labels must include the product name, signal word, hazard pictograms, and precautionary statements. Containers without proper labels are a common citation item.
          </p>
        </HelpCard>
      </div>

      {/* Alert Banner */}
      {unlabeledItems.length > 0 && (
        <div className="mb-6 rounded-xl bg-status-amber/10 border border-status-amber/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-status-amber flex-shrink-0" />
            <p className="text-sm text-white">
              <span className="font-medium">{unlabeledItems.length} containers need labels</span>{" "}
              <span className="text-gray-400">
                — {unlabeledItems.map((i) => i.product).join(", ")}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              const first = unlabeledItems[0];
              if (first) selectChemicalForLabel(first.sdsId);
            }}
            className="flex items-center gap-1 text-status-amber hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            Create Labels <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* ─── Left Column: Label Creator ─── */}
        <div className="space-y-5">
          {/* Product Selector (Searchable Dropdown) */}
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Select Chemical
            </label>
            <div className="relative">
              <button
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full flex items-center justify-between bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-left hover:border-navy-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedSds.productName}</p>
                  <p className="text-xs text-gray-500">{selectedSds.manufacturer} · {selectedSds.productCode}</p>
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
                    {filteredProducts.map((sds) => (
                      <button
                        key={sds.id}
                        onClick={() => selectChemicalForLabel(sds.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors border-b border-navy-700/30 last:border-b-0 ${
                          sds.id === selectedSdsId
                            ? "bg-amber-500/10"
                            : "hover:bg-navy-800/50"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${sds.id === selectedSdsId ? "text-amber-400" : "text-white"}`}>
                            {sds.productName}
                          </p>
                          <p className="text-xs text-gray-500">{sds.manufacturer} · {sds.productCode}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          sds.signalWord === "Danger"
                            ? "bg-status-red/15 text-status-red"
                            : sds.signalWord === "Warning"
                            ? "bg-status-amber/15 text-status-amber"
                            : "bg-navy-700/50 text-gray-400"
                        }`}>
                          {sds.signalWord === "None" ? "—" : sds.signalWord.toUpperCase()}
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

          {/* Label Size Selector */}
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Label Size
            </label>
            <div className="flex gap-2">
              {(["4x3", "2x1.5", "1x1"] as LabelSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setLabelSize(size)}
                  className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                    labelSize === size
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600"
                  }`}
                >
                  {sizeDimensions[size].label}
                </button>
              ))}
            </div>
          </div>

          {/* Container Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Container Type
              </label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {containerTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Location
              </label>
              <select
                value={containerLocation}
                onChange={(e) => setContainerLocation(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {inventoryLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── LABEL PREVIEW ─── */}
          <div>
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Label Preview
            </label>
            <div className={`bg-white rounded-xl p-4 transition-all ${sizeDimensions[labelSize].w}`}>
              {labelSize === "1x1" ? (
                /* QR-Only label */
                <div className="border-2 border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                  <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="h-14 w-14 text-gray-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-700 text-center">{selectedSds.productName}</p>
                  <p className="text-[10px] text-gray-500 text-center">Scan for full SDS</p>
                </div>
              ) : (
                /* Full / Mini GHS label */
                <div className={`border-4 border-red-600 rounded-lg ${labelSize === "2x1.5" ? "p-3" : "p-5"}`}>
                  {/* Product Identifier */}
                  <div className={`text-center border-b border-gray-300 ${labelSize === "2x1.5" ? "pb-2 mb-2" : "pb-3 mb-4"}`}>
                    <h3 className={`font-bold text-gray-900 ${labelSize === "2x1.5" ? "text-sm" : "text-lg"}`}>
                      {selectedSds.productName}
                    </h3>
                    <p className={`text-gray-500 ${labelSize === "2x1.5" ? "text-[10px]" : "text-xs"}`}>
                      Code: {selectedSds.productCode}
                    </p>
                  </div>

                  {/* Signal Word Banner */}
                  {selectedSds.signalWord !== "None" && (
                    <div className={`text-center font-black rounded mb-3 ${
                      labelSize === "2x1.5" ? "text-base py-1" : "text-2xl py-1.5"
                    } ${
                      selectedSds.signalWord === "Danger"
                        ? "bg-red-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}>
                      {selectedSds.signalWord.toUpperCase()}
                    </div>
                  )}

                  {/* GHS Pictograms */}
                  {selectedSds.pictograms.length > 0 && (
                    <div className={`flex justify-center gap-2 flex-wrap ${labelSize === "2x1.5" ? "mb-2" : "mb-4"}`}>
                      {selectedSds.pictograms.map((p) => (
                        <GHSPictogram key={p} type={p} size={labelSize === "2x1.5" ? 32 : 48} />
                      ))}
                    </div>
                  )}

                  {/* Hazard Statements */}
                  {selectedSds.hazardStatements.length > 0 && (
                    <div className={labelSize === "2x1.5" ? "mb-2" : "mb-3"}>
                      <p className={`font-bold text-gray-900 ${labelSize === "2x1.5" ? "text-[10px] mb-0.5" : "text-xs mb-1"}`}>
                        Hazard Statements:
                      </p>
                      <ul className={`text-gray-700 space-y-0.5 ${labelSize === "2x1.5" ? "text-[9px]" : "text-xs"}`}>
                        {selectedSds.hazardStatements.slice(0, labelSize === "2x1.5" ? 3 : 5).map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                        {selectedSds.hazardStatements.length > (labelSize === "2x1.5" ? 3 : 5) && (
                          <li className="text-gray-400 italic">
                            +{selectedSds.hazardStatements.length - (labelSize === "2x1.5" ? 3 : 5)} more — see SDS
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Precautionary Statements */}
                  {selectedSds.precautionaryStatements.length > 0 && (
                    <div className={labelSize === "2x1.5" ? "mb-2" : "mb-3"}>
                      <p className={`font-bold text-gray-900 ${labelSize === "2x1.5" ? "text-[10px] mb-0.5" : "text-xs mb-1"}`}>
                        Precautionary Statements:
                      </p>
                      <ul className={`text-gray-700 space-y-0.5 ${labelSize === "2x1.5" ? "text-[9px]" : "text-xs"}`}>
                        {selectedSds.precautionaryStatements.slice(0, labelSize === "2x1.5" ? 2 : 4).map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                        {selectedSds.precautionaryStatements.length > (labelSize === "2x1.5" ? 2 : 4) && (
                          <li className="text-gray-400 italic">
                            +{selectedSds.precautionaryStatements.length - (labelSize === "2x1.5" ? 2 : 4)} more — see SDS
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Manufacturer + QR */}
                  <div className={`flex items-end justify-between border-t border-gray-300 ${labelSize === "2x1.5" ? "pt-2" : "pt-3"}`}>
                    <div className={`text-gray-600 ${labelSize === "2x1.5" ? "text-[9px]" : "text-xs"}`}>
                      <p className="font-bold">{selectedSds.manufacturer}</p>
                      <p>{selectedSds.supplierPhone}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`bg-gray-200 rounded flex items-center justify-center ${
                        labelSize === "2x1.5" ? "h-8 w-8" : "h-12 w-12"
                      }`}>
                        <QrCode className={`text-gray-500 ${labelSize === "2x1.5" ? "h-5 w-5" : "h-8 w-8"}`} />
                      </div>
                      <p className={`text-gray-500 mt-0.5 ${labelSize === "2x1.5" ? "text-[8px]" : "text-[10px]"}`}>
                        Scan for full SDS
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrintLabel}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Label
            </button>
            <button
              onClick={() => {
                setLabelSize("1x1");
                handlePrintLabel();
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm py-2.5 rounded-lg transition-colors"
            >
              <QrCode className="h-4 w-4" />
              QR Code Only
            </button>
          </div>
        </div>

        {/* ─── Right Column: Needs Labels + Recent + Templates ─── */}
        <div className="space-y-6">
          {/* Needs Labels Section */}
          {needsLabels.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Needs Labels ({needsLabels.length})
              </h2>
              <div className="bg-navy-900 border border-status-amber/30 rounded-xl overflow-hidden">
                {needsLabels.map((sds, i) => (
                  <div
                    key={sds.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < needsLabels.length - 1 ? "border-b border-navy-700/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-status-amber flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{sds.productName}</p>
                        <p className="text-xs text-gray-500">
                          {sds.secondaryContainers} container{sds.secondaryContainers > 1 ? "s" : ""} · {sds.storageLocation}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => selectChemicalForLabel(sds.id)}
                      className="flex items-center gap-1 text-xs bg-status-amber/15 hover:bg-status-amber/25 text-status-amber px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Tags className="h-3 w-3" />
                      Create Label
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Labels */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recent Labels ({allRecentLabels.length})
            </h2>
            <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              {allRecentLabels.map((label, i) => (
                <button
                  key={`${label.sdsId}-${i}`}
                  onClick={() => selectChemicalForLabel(label.sdsId)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-navy-800/50 transition-colors ${
                    i < allRecentLabels.length - 1 ? "border-b border-navy-700/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-navy-800 flex items-center justify-center">
                      <Tags className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{label.product}</p>
                      <p className="text-xs text-gray-500">{label.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {label.date}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Label Templates */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Label Templates
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => {
                const isActive = labelSize === t.size;
                return (
                  <button
                    key={t.name}
                    onClick={() => setLabelSize(t.size)}
                    className={`bg-navy-900 border rounded-xl p-4 transition-colors text-left group ${
                      isActive
                        ? "border-amber-500/50 ring-1 ring-amber-500/20"
                        : "border-navy-700/50 hover:border-amber-500/30"
                    }`}
                  >
                    <t.icon className={`h-8 w-8 mb-2 transition-colors ${
                      isActive ? "text-amber-400" : "text-gray-500 group-hover:text-amber-400"
                    }`} />
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
