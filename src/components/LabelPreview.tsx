"use client";

import type { Chemical } from "@/lib/types";
import GHSPictogram from "./GHSPictogram";
import { Printer } from "lucide-react";

interface LabelPreviewProps {
  chemical: Chemical;
  size?: "full" | "small" | "minimal";
  onPrint?: () => void;
}

export default function LabelPreview({ chemical, size = "full", onPrint }: LabelPreviewProps) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function handlePrint() {
    if (onPrint) {
      onPrint();
      return;
    }
    const labelEl = document.getElementById(`label-print-${chemical.id}`);
    if (!labelEl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Label — ${chemical.product_name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  @media print { @page { margin: 0; } body { margin: 0; } }
</style></head><body>${labelEl.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  const pictoSize = size === "full" ? 44 : size === "small" ? 32 : 28;

  return (
    <div>
      <div
        id={`label-print-${chemical.id}`}
        className="bg-white rounded-lg overflow-hidden"
        style={size === "full" ? { maxWidth: 480 } : size === "small" ? { maxWidth: 320 } : { maxWidth: 260 }}
      >
        <div
          className={`border-[3px] border-red-600 ${
            size === "full" ? "p-5" : size === "small" ? "p-3" : "p-2"
          }`}
          style={{ borderStyle: "solid" }}
        >
          {/* Product name + manufacturer */}
          <div className={`text-center border-b border-gray-300 ${size === "full" ? "pb-3 mb-3" : "pb-2 mb-2"}`}>
            <h3
              className={`font-bold text-gray-900 leading-tight ${
                size === "full" ? "text-lg" : size === "small" ? "text-sm" : "text-xs"
              }`}
            >
              {chemical.product_name}
            </h3>
            {size !== "minimal" && (
              <p className={`text-gray-500 ${size === "full" ? "text-xs mt-1" : "text-[10px]"}`}>
                {chemical.manufacturer}
              </p>
            )}
          </div>

          {/* Signal word banner */}
          {chemical.signal_word && (
            <div
              className={`text-center font-black rounded ${
                size === "full" ? "text-xl py-1.5 mb-3" : size === "small" ? "text-base py-1 mb-2" : "text-sm py-0.5 mb-2"
              } ${
                chemical.signal_word === "DANGER"
                  ? "bg-red-600 text-white"
                  : "bg-amber-500 text-black"
              }`}
            >
              {chemical.signal_word}
            </div>
          )}

          {/* GHS Pictograms row */}
          {chemical.pictogram_codes.length > 0 && (
            <div className={`flex justify-center gap-1.5 flex-wrap ${size === "full" ? "mb-3" : "mb-2"}`}>
              {chemical.pictogram_codes.map((code) => (
                <GHSPictogram key={code} code={code} size={pictoSize} />
              ))}
            </div>
          )}

          {/* === FULL size extras === */}
          {size === "full" && (
            <>
              {/* Hazard Statements */}
              {chemical.hazard_statements.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-900 mb-1">Hazard Statements:</p>
                  <ul className="text-[11px] text-gray-700 space-y-0.5">
                    {chemical.hazard_statements.map((h) => (
                      <li key={h.code}>
                        <span className="font-semibold">{h.code}</span> {h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Precautionary Statements (prevention + response) */}
              {(chemical.precautionary_statements.prevention.length > 0 ||
                chemical.precautionary_statements.response.length > 0) && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-900 mb-1">Precautionary Statements:</p>
                  <ul className="text-[11px] text-gray-700 space-y-0.5">
                    {chemical.precautionary_statements.prevention.map((s) => (
                      <li key={s.code}>
                        <span className="font-semibold">{s.code}</span> {s.text}
                      </li>
                    ))}
                    {chemical.precautionary_statements.response.map((s) => (
                      <li key={s.code}>
                        <span className="font-semibold">{s.code}</span> {s.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* First Aid summary */}
              <div className="mb-3 border-t border-gray-200 pt-2">
                <p className="text-xs font-bold text-gray-900 mb-1">First Aid:</p>
                <div className="text-[10px] text-gray-600 space-y-0.5">
                  {chemical.first_aid.eyes && <p><strong>Eyes:</strong> {chemical.first_aid.eyes}</p>}
                  {chemical.first_aid.skin && <p><strong>Skin:</strong> {chemical.first_aid.skin}</p>}
                  {chemical.first_aid.inhalation && <p><strong>Inhalation:</strong> {chemical.first_aid.inhalation}</p>}
                  {chemical.first_aid.ingestion && <p><strong>Ingestion:</strong> {chemical.first_aid.ingestion}</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-300 pt-2 flex items-end justify-between">
                <div className="text-[10px] text-gray-500">
                  <p className="font-semibold text-gray-700">{chemical.manufacturer}</p>
                  <p>SDS available — ShieldSDS</p>
                  <p>Generated {dateStr}</p>
                </div>
              </div>
            </>
          )}

          {/* === SMALL size extras === */}
          {size === "small" && (
            <>
              {chemical.hazard_statements.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-gray-900 mb-0.5">Hazard Statements:</p>
                  <ul className="text-[9px] text-gray-700 space-y-0.5">
                    {chemical.hazard_statements.slice(0, 3).map((h) => (
                      <li key={h.code}>
                        <span className="font-semibold">{h.code}</span> {h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[9px] text-gray-400 text-center italic border-t border-gray-200 pt-1.5">
                See SDS for full details
              </p>
            </>
          )}

          {/* === MINIMAL has no extras beyond name/signal/pictograms === */}
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="mt-3 flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print Label
      </button>
    </div>
  );
}
