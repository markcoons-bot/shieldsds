import type { SDSEntry, GHSPictogram } from "./data";

type LabelSize = "4x3" | "2x1.5" | "1x1";

const sizeMap: Record<LabelSize, { w: string; h: string }> = {
  "4x3": { w: "4in", h: "3in" },
  "2x1.5": { w: "2in", h: "1.5in" },
  "1x1": { w: "1in", h: "1in" },
};

function pictogramSvg(type: GHSPictogram, size: number): string {
  const symbols: Record<GHSPictogram, string> = {
    flame: `<path d="M50 22c0 0-15 18-15 30c0 8.3 6.7 15 15 15s15-6.7 15-15C65 40 50 22 50 22z M50 62c-5.5 0-10-4.5-10-10c0-7 10-18 10-18s10 11 10 18C60 57.5 55.5 62 50 62z" fill="black"/>`,
    oxidizer: `<circle cx="50" cy="45" r="12" fill="none" stroke="black" stroke-width="3"/><path d="M50 28c0 0 8 8 8 16s-8 16-8 16" fill="none" stroke="black" stroke-width="3"/><line x1="50" y1="25" x2="50" y2="65" stroke="black" stroke-width="3"/>`,
    "compressed-gas": `<ellipse cx="50" cy="50" rx="8" ry="20" fill="none" stroke="black" stroke-width="3"/><line x1="50" y1="30" x2="50" y2="25" stroke="black" stroke-width="3"/>`,
    corrosion: `<path d="M35 35h30l-5 30h-20z" fill="none" stroke="black" stroke-width="3"/><path d="M40 65v5" stroke="black" stroke-width="2"/><path d="M50 65v8" stroke="black" stroke-width="2"/><path d="M60 65v5" stroke="black" stroke-width="2"/>`,
    skull: `<circle cx="50" cy="42" r="14" fill="none" stroke="black" stroke-width="3"/><circle cx="44" cy="40" r="3" fill="black"/><circle cx="56" cy="40" r="3" fill="black"/><path d="M44 50h12" stroke="black" stroke-width="2"/><line x1="50" y1="56" x2="50" y2="70" stroke="black" stroke-width="3"/><line x1="40" y1="62" x2="60" y2="62" stroke="black" stroke-width="3"/>`,
    exclamation: `<line x1="50" y1="30" x2="50" y2="55" stroke="black" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="65" r="3" fill="black"/>`,
    "health-hazard": `<path d="M50 30l-8 15h16z" fill="none" stroke="black" stroke-width="2"/><rect x="46" y="48" width="8" height="15" fill="none" stroke="black" stroke-width="2"/><line x1="38" y1="55" x2="46" y2="52" stroke="black" stroke-width="2"/><line x1="62" y1="55" x2="54" y2="52" stroke="black" stroke-width="2"/>`,
    environment: `<circle cx="50" cy="55" r="10" fill="none" stroke="black" stroke-width="2"/><path d="M45 50c0-8 5-15 5-15s5 7 5 15" fill="none" stroke="black" stroke-width="2"/>`,
    "exploding-bomb": `<circle cx="50" cy="52" r="12" fill="none" stroke="black" stroke-width="3"/><path d="M56 40l4-8" stroke="black" stroke-width="2"/><path d="M60 30l3 2M63 28l-1 4M58 29l4-1" stroke="black" stroke-width="1.5"/>`,
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(50,50) rotate(45) translate(-35,-35)">
      <rect x="0" y="0" width="70" height="70" fill="white" stroke="#DC2626" stroke-width="4"/>
    </g>
    ${symbols[type] || ""}
  </svg>`;
}

function buildLabelHTML(sds: SDSEntry, labelSize: LabelSize): string {
  const dim = sizeMap[labelSize];

  if (labelSize === "1x1") {
    return `
      <div class="label-crop-marks" style="width:${dim.w};height:${dim.h};padding:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box;">
        <div style="width:50px;height:50px;background:#eee;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#666;">QR</div>
        <div style="font-size:7px;font-weight:bold;text-align:center;line-height:1.1;color:#111;">${sds.productName}</div>
        <div style="font-size:5px;color:#888;">Scan for full SDS</div>
      </div>`;
  }

  const isMini = labelSize === "2x1.5";
  const maxHazards = isMini ? 3 : 5;
  const maxPrecautions = isMini ? 2 : 4;
  const pictoSize = isMini ? 24 : 36;
  const titleSize = isMini ? "11px" : "14px";
  const bodySize = isMini ? "7px" : "9px";
  const signalSize = isMini ? "12px" : "18px";

  const signalBg = sds.signalWord === "Danger" ? "#DC2626" : sds.signalWord === "Warning" ? "#F59E0B" : "";
  const signalBlock = sds.signalWord !== "None" ? `<div style="text-align:center;font-weight:900;font-size:${signalSize};color:white;background:${signalBg};border-radius:3px;padding:2px 0;margin-bottom:4px;">${sds.signalWord.toUpperCase()}</div>` : "";

  const pictosHTML = sds.pictograms.length > 0
    ? `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:4px;">${sds.pictograms.map((p) => pictogramSvg(p, pictoSize)).join("")}</div>`
    : "";

  const hazardsList = sds.hazardStatements.slice(0, maxHazards).map((h) => `<li>${h}</li>`).join("");
  const hazardsExtra = sds.hazardStatements.length > maxHazards ? `<li style="color:#999;font-style:italic;">+${sds.hazardStatements.length - maxHazards} more — see SDS</li>` : "";
  const hazardsBlock = sds.hazardStatements.length > 0 ? `<div style="margin-bottom:3px;"><div style="font-weight:bold;font-size:${bodySize};color:#111;margin-bottom:1px;">Hazard Statements:</div><ul style="margin:0;padding-left:12px;font-size:${bodySize};color:#333;line-height:1.3;">${hazardsList}${hazardsExtra}</ul></div>` : "";

  const precaList = sds.precautionaryStatements.slice(0, maxPrecautions).map((p) => `<li>${p}</li>`).join("");
  const precaExtra = sds.precautionaryStatements.length > maxPrecautions ? `<li style="color:#999;font-style:italic;">+${sds.precautionaryStatements.length - maxPrecautions} more — see SDS</li>` : "";
  const precaBlock = sds.precautionaryStatements.length > 0 ? `<div style="margin-bottom:3px;"><div style="font-weight:bold;font-size:${bodySize};color:#111;margin-bottom:1px;">Precautionary Statements:</div><ul style="margin:0;padding-left:12px;font-size:${bodySize};color:#333;line-height:1.3;">${precaList}${precaExtra}</ul></div>` : "";

  return `
    <div class="label-crop-marks" style="width:${dim.w};height:${dim.h};padding:${isMini ? "6px" : "10px"};box-sizing:border-box;border:3px solid #DC2626;border-radius:4px;font-family:Arial,sans-serif;overflow:hidden;">
      <div style="text-align:center;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:4px;">
        <div style="font-weight:bold;font-size:${titleSize};color:#111;">${sds.productName}</div>
        <div style="font-size:${bodySize};color:#888;">Code: ${sds.productCode}</div>
      </div>
      ${signalBlock}
      ${pictosHTML}
      ${hazardsBlock}
      ${precaBlock}
      <div style="border-top:1px solid #ccc;padding-top:3px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="font-size:${bodySize};color:#555;">
          <div style="font-weight:bold;">${sds.manufacturer}</div>
          <div>${sds.supplierPhone}</div>
        </div>
        <div style="text-align:center;">
          <div style="width:${isMini ? "20px" : "30px"};height:${isMini ? "20px" : "30px"};background:#eee;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:6px;color:#999;">QR</div>
          <div style="font-size:5px;color:#999;margin-top:1px;">Scan for SDS</div>
        </div>
      </div>
    </div>`;
}

export function printSingleLabel(sds: SDSEntry, labelSize: LabelSize): void {
  const labelHTML = buildLabelHTML(sds, labelSize);
  const dim = sizeMap[labelSize];

  const win = window.open("", "_blank", `width=500,height=400`);
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html><head><title>Label: ${sds.productName}</title>
<style>
  @media print {
    @page { size: ${dim.w} ${dim.h}; margin: 0; }
    body { margin: 0; padding: 0; }
    .label-crop-marks { border: 0.5pt dashed #999 !important; }
  }
  body { margin: 20px; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f9f9f9; }
  .label-crop-marks { background: white; }
</style>
</head><body>
${labelHTML}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();
}

export function printBatchLabels(sdsEntries: SDSEntry[]): number {
  const needsLabels = sdsEntries.filter((s) => s.secondaryContainers > 0 && !s.secondaryLabeled);
  if (needsLabels.length === 0) return 0;

  const labels = needsLabels.map((sds) => `
    <div style="page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:100vh;">
      ${buildLabelHTML(sds, "4x3")}
    </div>`).join("");

  const win = window.open("", "_blank", "width=500,height=400");
  if (!win) return 0;

  win.document.write(`<!DOCTYPE html>
<html><head><title>Batch Labels (${needsLabels.length})</title>
<style>
  @media print {
    @page { size: 4in 3in; margin: 0; }
    body { margin: 0; padding: 0; }
    .label-crop-marks { border: 0.5pt dashed #999 !important; }
  }
  body { margin: 0; font-family: Arial, sans-serif; background: #f9f9f9; }
  .label-crop-marks { background: white; }
</style>
</head><body>
${labels}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();

  return needsLabels.length;
}
