"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GHSPictogram from "@/components/GHSPictogram";
import SDSFetchHelper from "@/components/SDSFetchHelper";
import HelpCard from "@/components/HelpCard";
import { generateSDSBinder } from "@/lib/pdf-generator";
import {
  sdsEntries,
  ghsPictogramLabels,
  type SDSEntry,
  type GHSPictogram as GHSPictogramType,
} from "@/lib/data";
import {
  Search,
  AlertTriangle,
  FileText,
  ArrowRight,
  X,
  Printer,
  GraduationCap,
  FlaskConical,
  Download,
  ChevronDown,
  ChevronRight,
  Mail,
  Copy,
  CheckCircle2,
  Upload,
  Eye,
  RefreshCw,
  BookOpen,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UploadRecord {
  sdsId: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  switch (status) {
    case "current":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-green/15 text-status-green">
          Current
        </span>
      );
    case "review":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-amber/15 text-status-amber">
          Review
        </span>
      );
    case "missing":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-red/15 text-status-red">
          Missing
        </span>
      );
    default:
      return null;
  }
};

const signalBadge = (word: string) => {
  if (word === "Danger") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-status-red/15 text-status-red border border-status-red/30">
        DANGER
      </span>
    );
  }
  if (word === "Warning") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-status-amber/15 text-status-amber border border-status-amber/30">
        WARNING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-navy-700/50 text-gray-400 border border-navy-600/30">
      NONE
    </span>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Unique location list from data
const allLocations = Array.from(new Set(sdsEntries.map((s) => s.storageLocation)));

// Hazard type filter mapping
const hazardTypes = [
  { label: "Flammable", pictograms: ["flame"] as GHSPictogramType[] },
  { label: "Health Hazard", pictograms: ["health-hazard"] as GHSPictogramType[] },
  { label: "Corrosive", pictograms: ["corrosion"] as GHSPictogramType[] },
  { label: "Toxic", pictograms: ["skull"] as GHSPictogramType[] },
  { label: "Irritant", pictograms: ["exclamation"] as GHSPictogramType[] },
];

// ─── SDS Detail Section Component ────────────────────────────────────────────

function SDSSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(num <= 8);
  return (
    <div className="border-b border-navy-700/30 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 text-left hover:bg-navy-800/30 px-1 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-semibold text-amber-400 w-6">{num}.</span>
        <span className="text-sm font-medium text-white">{title}</span>
      </button>
      {open && <div className="pb-4 pl-8 pr-2 text-sm text-gray-300 space-y-2">{children}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-navy-800 border border-navy-600 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="h-5 w-5 text-status-green flex-shrink-0" />
      <span className="text-sm text-white">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white ml-2"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ─── Email Template Modal ────────────────────────────────────────────────────

function EmailModal({ sds, onClose }: { sds: SDSEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const subject = `SDS Request: ${sds.productName} (${sds.productCode})`;
  const body = `Dear ${sds.manufacturer} Safety Department,

We are writing to request the current Safety Data Sheet (SDS) for:

Product: ${sds.productName}
Product Code: ${sds.productCode}
Our Company: Mike's Auto Body
Address: 1847 Pacific Coast Hwy, Long Beach, CA 90806
Contact: Mike Rodriguez — (562) 555-0147

Per OSHA 29 CFR 1910.1200, we are required to maintain current SDS for all hazardous chemicals in our workplace. Please send the most recent revision at your earliest convenience.

Thank you,
Mike Rodriguez
Mike's Auto Body`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="font-display font-bold text-lg text-white">Request SDS from Vendor</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">To</label>
            <p className="text-sm text-white mt-1">safety@{sds.manufacturer.toLowerCase().replace(/[^a-z]/g, "")}.com</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Subject</label>
            <p className="text-sm text-white mt-1">{subject}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Body</label>
            <pre className="text-xs text-gray-300 mt-1 whitespace-pre-wrap bg-navy-800 rounded-lg p-4 border border-navy-700 max-h-52 overflow-y-auto">{body}</pre>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-navy-700 flex items-center gap-3 justify-end">
          <button onClick={handleCopy} className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
            {copied ? <CheckCircle2 className="h-4 w-4 text-status-green" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <a
            href={`mailto:safety@${sds.manufacturer.toLowerCase().replace(/[^a-z]/g, "")}.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Mail className="h-4 w-4" />
            Open in Email Client
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({
  sds,
  onClose,
  onUploaded,
}: {
  sds: SDSEntry | null;
  onClose: () => void;
  onUploaded: (record: UploadRecord) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSdsId, setSelectedSdsId] = useState(sds?.id || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File size must be under 25MB.");
      return;
    }
    if (!selectedSdsId) {
      setError("Please select a chemical.");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sdsId", selectedSdsId);
    formData.append("uploadedBy", "Sarah Chen");

    try {
      const res = await fetch("/api/upload-sds", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.record);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="font-display font-bold text-lg text-white">Upload SDS PDF</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Chemical selector (if not pre-selected) */}
          {!sds && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Chemical</label>
              <select
                value={selectedSdsId}
                onChange={(e) => setSelectedSdsId(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Select a chemical...</option>
                {sdsEntries.map((s) => (
                  <option key={s.id} value={s.id}>{s.productName} ({s.manufacturer})</option>
                ))}
              </select>
            </div>
          )}
          {sds && (
            <div className="text-sm">
              <span className="text-gray-400">Uploading for:</span>{" "}
              <span className="text-white font-medium">{sds.productName}</span>
            </div>
          )}

          {/* Drag-drop area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-amber-500 bg-amber-500/10"
                : "border-navy-600 hover:border-navy-500 bg-navy-800/30"
            }`}
          >
            <Upload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? "text-amber-400" : "text-gray-500"}`} />
            <p className="text-sm text-gray-300 mb-1">
              {uploading ? "Uploading..." : "Drag & drop a PDF here, or click to browse"}
            </p>
            <p className="text-xs text-gray-500">PDF files only, max 25MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="text-sm text-status-red bg-status-red/10 border border-status-red/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PDF Viewer Modal ───────────────────────────────────────────────────────

function PDFViewerModal({ url, productName, onClose }: { url: string; productName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-4xl h-[85vh] mx-4 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-navy-700">
          <h2 className="font-display font-bold text-sm text-white truncate">{productName} — SDS PDF</h2>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="h-3 w-3" /> Download
            </a>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 rounded-b-2xl overflow-hidden">
          <iframe src={url} className="w-full h-full" title={`SDS PDF - ${productName}`} />
        </div>
      </div>
    </div>
  );
}

// ─── SDS Detail Panel ────────────────────────────────────────────────────────

function SDSDetailPanel({
  sds,
  onClose,
  uploadedPDFs,
  onUpload,
  onViewPDF,
}: {
  sds: SDSEntry;
  onClose: () => void;
  uploadedPDFs: Record<string, UploadRecord>;
  onUpload: (sds: SDSEntry) => void;
  onViewPDF: (url: string, name: string) => void;
}) {
  const uploadRecord = uploadedPDFs[sds.id];
  const pdfUrl = uploadRecord ? `/sds-uploads/${uploadRecord.fileName}` : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-navy-950 border-l border-navy-700 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-navy-950 border-b border-navy-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {signalBadge(sds.signalWord)}
                {statusBadge(sds.sdsStatus)}
              </div>
              <h2 className="font-display font-bold text-lg text-white truncate">{sds.productName}</h2>
              <p className="text-xs text-gray-400">{sds.manufacturer} &middot; Code: {sds.productCode}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white ml-4 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <a href="/labels" className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              <Printer className="h-3 w-3" /> Print Label
            </a>
            <a href="/training" className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              <GraduationCap className="h-3 w-3" /> Assign Training
            </a>
            <a href="/inventory" className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              <FlaskConical className="h-3 w-3" /> View in Inventory
            </a>
            {pdfUrl ? (
              <>
                <button
                  onClick={() => onViewPDF(pdfUrl, sds.productName)}
                  className="flex items-center gap-1.5 bg-status-green/10 border border-status-green/30 hover:bg-status-green/20 text-status-green text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="h-3 w-3" /> View PDF
                </button>
                <a
                  href={pdfUrl}
                  download
                  className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-3 w-3" /> Download PDF
                </a>
                <button
                  onClick={() => onUpload(sds)}
                  className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Replace PDF
                </button>
              </>
            ) : (
              <button
                onClick={() => onUpload(sds)}
                className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload className="h-3 w-3" /> Upload PDF
              </button>
            )}
          </div>
        </div>

        {/* PDF Status Bar */}
        <div className="px-6 py-3 border-b border-navy-700/50">
          {pdfUrl ? (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-status-green" />
              <span className="text-status-green font-medium">PDF on file</span>
              <span className="text-gray-500">
                {uploadRecord.originalName} ({formatFileSize(uploadRecord.fileSize)}) — uploaded {new Date(uploadRecord.uploadedAt).toLocaleDateString()} by {uploadRecord.uploadedBy}
              </span>
            </div>
          ) : (
            <SDSFetchHelper manufacturer={sds.manufacturer} productName={sds.productName} productCode={sds.productCode} />
          )}
        </div>

        {/* 16-Section Body */}
        <div className="px-6 py-4">
          {/* Section 1 */}
          <SDSSection num={1} title="Identification">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-500">Product Name:</span> <span className="text-white font-medium">{sds.productName}</span></div>
              <div><span className="text-gray-500">Product Code:</span> <span className="text-white">{sds.productCode}</span></div>
              <div><span className="text-gray-500">Manufacturer:</span> <span className="text-white">{sds.manufacturer}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-white">{sds.supplierPhone}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="text-white">{sds.supplierAddress}</span></div>
              <div><span className="text-gray-500">Recommended Use:</span> <span className="text-white">{sds.category}</span></div>
              <div><span className="text-gray-500">Storage Location:</span> <span className="text-white">{sds.storageLocation}</span></div>
            </div>
          </SDSSection>

          {/* Section 2 */}
          <SDSSection num={2} title="Hazard Identification">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Signal Word:</span>
              {signalBadge(sds.signalWord)}
            </div>
            {sds.pictograms.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {sds.pictograms.map((p) => (
                  <div key={p} className="flex flex-col items-center gap-1">
                    <GHSPictogram type={p} size={44} />
                    <span className="text-[10px] text-gray-500">{ghsPictogramLabels[p]}</span>
                  </div>
                ))}
              </div>
            )}
            {sds.hazardStatements.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-400 mb-1">Hazard Statements</p>
                <ul className="text-xs space-y-0.5">{sds.hazardStatements.map((h) => <li key={h}>{h}</li>)}</ul>
              </div>
            )}
            {sds.precautionaryStatements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Precautionary Statements</p>
                <ul className="text-xs space-y-0.5">{sds.precautionaryStatements.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
          </SDSSection>

          {/* Section 3 — Real per-chemical composition */}
          <SDSSection num={3} title="Composition / Information on Ingredients">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-navy-700"><th className="text-left py-1 text-gray-400 font-semibold">Ingredient</th><th className="text-left py-1 text-gray-400 font-semibold">CAS #</th><th className="text-left py-1 text-gray-400 font-semibold">Concentration</th></tr></thead>
              <tbody>
                {sds.composition.map((c) => (
                  <tr key={c.ingredient} className="border-b border-navy-700/20"><td className="py-1">{c.ingredient}</td><td className="py-1 text-gray-400">{c.casNumber}</td><td className="py-1">{c.concentration}</td></tr>
                ))}
              </tbody>
            </table>
          </SDSSection>

          {/* Section 4 */}
          <SDSSection num={4} title="First Aid Measures">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Eyes:</span> {sds.firstAid.eyes}</div>
              <div><span className="font-semibold text-gray-400">Skin:</span> {sds.firstAid.skin}</div>
              <div><span className="font-semibold text-gray-400">Inhalation:</span> {sds.firstAid.inhalation}</div>
              <div><span className="font-semibold text-gray-400">Ingestion:</span> {sds.firstAid.ingestion}</div>
            </div>
          </SDSSection>

          {/* Section 5 — Real per-chemical fire fighting */}
          <SDSSection num={5} title="Fire-Fighting Measures">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Suitable Extinguishing Media:</span> {sds.fireFighting.extinguishingMedia}</div>
              <div><span className="font-semibold text-gray-400">Special Hazards:</span> {sds.fireFighting.specialHazards}</div>
              <div><span className="font-semibold text-gray-400">Protective Equipment:</span> Self-contained breathing apparatus (SCBA) and full protective gear required for fire fighters.</div>
            </div>
          </SDSSection>

          {/* Section 6 — Real per-chemical spill procedures */}
          <SDSSection num={6} title="Accidental Release Measures">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Personal Precautions:</span> Don appropriate PPE (see Section 8). Ensure adequate ventilation. Remove ignition sources.</div>
              <div><span className="font-semibold text-gray-400">Spill Cleanup:</span> {sds.spillProcedures}</div>
              <div><span className="font-semibold text-gray-400">Environmental:</span> Prevent entry into drains, sewers, or waterways. Notify authorities if release cannot be contained.</div>
            </div>
          </SDSSection>

          {/* Section 7 — Real per-chemical storage */}
          <SDSSection num={7} title="Handling and Storage">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Safe Handling:</span> {sds.precautionaryStatements.find((p) => p.includes("P261"))?.split(": ")[1] || "Avoid breathing vapors/mist/spray. Use only with adequate ventilation."} Wash hands thoroughly after handling.</div>
              <div><span className="font-semibold text-gray-400">Storage:</span> {sds.storageRequirements}</div>
              <div><span className="font-semibold text-gray-400">Incompatibilities:</span> {sds.pictograms.includes("flame") ? "Keep away from oxidizers, strong acids, and ignition sources." : "No specific incompatibilities noted."}</div>
            </div>
          </SDSSection>

          {/* Section 8 */}
          <SDSSection num={8} title="Exposure Controls / Personal Protection">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Eye Protection</p>
                <p>{sds.ppe.eyes}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Hand Protection</p>
                <p>{sds.ppe.hands}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Skin Protection</p>
                <p>{sds.ppe.skin}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Respiratory</p>
                <p>{sds.ppe.respiratory}</p>
              </div>
            </div>
          </SDSSection>

          {/* Section 9 — Real per-chemical physical properties */}
          <SDSSection num={9} title="Physical and Chemical Properties">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-500">Appearance:</span> <span className="text-white">{sds.appearance}</span></div>
              <div><span className="text-gray-500">Odor:</span> <span className="text-white">{sds.odor}</span></div>
              <div><span className="text-gray-500">Flash Point:</span> <span className="text-white font-medium">{sds.flashPoint}</span></div>
              <div><span className="text-gray-500">Storage Location:</span> <span className="text-white">{sds.storageLocation}</span></div>
            </div>
          </SDSSection>

          {/* Section 10 */}
          <SDSSection num={10} title="Stability and Reactivity">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Stability:</span> Stable under recommended storage conditions.</div>
              <div><span className="font-semibold text-gray-400">Conditions to Avoid:</span> {sds.pictograms.includes("flame") ? "Heat, sparks, open flames, hot surfaces, and direct sunlight." : "Extreme temperatures."}</div>
              <div><span className="font-semibold text-gray-400">Hazardous Decomposition:</span> CO, CO₂{sds.hazardStatements.some((h) => h.includes("H334")) ? ", isocyanate vapors" : ""}{sds.hazardStatements.some((h) => h.includes("H314")) ? ", corrosive fumes" : ""}.</div>
            </div>
          </SDSSection>

          {/* Section 11 */}
          <SDSSection num={11} title="Toxicological Information">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Acute Toxicity:</span> {sds.hazardStatements.some((h) => h.includes("H301") || h.includes("H302") || h.includes("H304")) ? "Harmful or fatal if swallowed. Aspiration hazard." : sds.hazardStatements.some((h) => h.includes("H332")) ? "Harmful if inhaled." : "Low acute toxicity by all routes of exposure."}</div>
              <div><span className="font-semibold text-gray-400">Chronic Effects:</span> {sds.hazardStatements.some((h) => h.includes("H351") || h.includes("H350")) ? "Suspected of causing cancer with prolonged exposure." : sds.hazardStatements.some((h) => h.includes("H372") || h.includes("H373")) ? "May cause damage to organs through prolonged or repeated exposure." : "No chronic effects known at recommended exposure levels."}</div>
              <div><span className="font-semibold text-gray-400">Sensitization:</span> {sds.hazardStatements.some((h) => h.includes("H317") || h.includes("H334")) ? "May cause sensitization by skin contact or inhalation. Isocyanate-containing products require medical surveillance." : "Not known to be a sensitizer."}</div>
            </div>
          </SDSSection>

          {/* Sections 12-15 */}
          <SDSSection num={12} title="Ecological Information">
            <p className="text-xs text-gray-500 italic">Sections 12–15 (Ecological, Disposal, Transport, Regulatory) are not enforced by OSHA per 29 CFR 1910.1200(g)(2). Consult manufacturer SDS for complete information.</p>
          </SDSSection>
          <SDSSection num={13} title="Disposal Considerations">
            <p className="text-xs text-gray-500 italic">Dispose of contents and container in accordance with all local, state, and federal regulations. See manufacturer SDS for details.</p>
          </SDSSection>
          <SDSSection num={14} title="Transport Information">
            <p className="text-xs text-gray-500 italic">Consult manufacturer SDS and DOT regulations for transport classification.</p>
          </SDSSection>
          <SDSSection num={15} title="Regulatory Information">
            <p className="text-xs text-gray-500 italic">Consult manufacturer SDS for applicable federal, state, and local regulations.</p>
          </SDSSection>

          {/* Section 16 */}
          <SDSSection num={16} title="Other Information">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-500">SDS Date:</span> <span className="text-white">{sds.sdsDate}</span></div>
              <div><span className="text-gray-500">Revision:</span> <span className="text-white">{sds.sdsRevision}</span></div>
              <div><span className="text-gray-500">Date Added to Inventory:</span> <span className="text-white">{sds.dateAdded}</span></div>
              <div><span className="text-gray-500">Secondary Containers:</span> <span className="text-white">{sds.secondaryContainers} ({sds.secondaryLabeled ? "labeled" : "needs label"})</span></div>
            </div>
          </SDSSection>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SDSLibraryPage() {
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [signalFilter, setSignalFilter] = useState<string>("All");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [hazardFilter, setHazardFilter] = useState<string>("All");
  const [selectedSds, setSelectedSds] = useState<SDSEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [emailSds, setEmailSds] = useState<SDSEntry | null>(null);
  const [uploadModal, setUploadModal] = useState<SDSEntry | null | "open">(null);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string } | null>(null);
  const [uploadedPDFs, setUploadedPDFs] = useState<Record<string, UploadRecord>>({});

  // Load upload index on mount
  useEffect(() => {
    fetch("/api/upload-sds")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, UploadRecord> = {};
        (data.uploads || []).forEach((r: UploadRecord) => { map[r.sdsId] = r; });
        setUploadedPDFs(map);
      })
      .catch(() => {});
  }, []);

  const missingSDS = sdsEntries.filter((s) => s.sdsStatus === "missing");
  const currentCount = sdsEntries.filter((s) => s.sdsStatus === "current").length;
  const reviewCount = sdsEntries.filter((s) => s.sdsStatus === "review").length;
  const pdfsUploaded = Object.keys(uploadedPDFs).length;

  const lastUpdated = useMemo(() => {
    const dates = sdsEntries
      .filter((s) => s.sdsDate !== "\u2014")
      .map((s) => new Date(s.sdsDate).getTime());
    if (dates.length === 0) return "N/A";
    const max = new Date(Math.max(...dates));
    return max.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUploaded = useCallback((record: UploadRecord) => {
    setUploadedPDFs((prev) => ({ ...prev, [record.sdsId]: record }));
    const sds = sdsEntries.find((s) => s.id === record.sdsId);
    showToast(`PDF uploaded: ${sds?.productName || record.originalName}`);
  }, [showToast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sdsEntries.filter((sds) => {
      const matchesSearch =
        !q ||
        sds.productName.toLowerCase().includes(q) ||
        sds.manufacturer.toLowerCase().includes(q) ||
        sds.signalWord.toLowerCase().includes(q) ||
        sds.storageLocation.toLowerCase().includes(q) ||
        sds.category.toLowerCase().includes(q) ||
        sds.hazardStatements.some((h) => h.toLowerCase().includes(q)) ||
        sds.composition.some((c) => c.ingredient.toLowerCase().includes(q) || c.casNumber.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Current" && sds.sdsStatus === "current") ||
        (statusFilter === "Needs Review" && sds.sdsStatus === "review") ||
        (statusFilter === "Missing" && sds.sdsStatus === "missing");

      const matchesSignal =
        signalFilter === "All" ||
        (signalFilter === "Danger" && sds.signalWord === "Danger") ||
        (signalFilter === "Warning" && sds.signalWord === "Warning") ||
        (signalFilter === "Not Classified" && sds.signalWord === "None");

      const matchesLocation = locationFilter === "All" || sds.storageLocation === locationFilter;

      const matchesHazard =
        hazardFilter === "All" ||
        hazardTypes.find((ht) => ht.label === hazardFilter)?.pictograms.some((p) => sds.pictograms.includes(p));

      return matchesSearch && matchesStatus && matchesSignal && matchesLocation && matchesHazard;
    });
  }, [search, statusFilter, signalFilter, locationFilter, hazardFilter]);

  const activeFilterCount = [statusFilter, signalFilter, locationFilter, hazardFilter].filter((f) => f !== "All").length;

  return (
    <DashboardLayout>
      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-gray-400">Total:</span>
          <span className="font-bold text-white">{sdsEntries.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-status-green" />
          <span className="text-gray-400">Current:</span>
          <span className="font-bold text-status-green">{currentCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-amber" />
          <span className="text-gray-400">Review:</span>
          <span className="font-bold text-status-amber">{reviewCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-status-red" />
          <span className="text-gray-400">Missing:</span>
          <span className="font-bold text-status-red">{missingSDS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-400" />
          <span className="text-gray-400">PDFs:</span>
          <span className="font-bold text-white">{pdfsUploaded}/{sdsEntries.length}</span>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          Last updated: {lastUpdated}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">SDS Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            {sdsEntries.length} safety data sheets &middot; click any row to view full 16-section SDS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await generateSDSBinder();
              } catch (err) {
                console.error("PDF generation error:", err);
                alert("PDF error: " + (err instanceof Error ? err.message : "Unknown error"));
              }
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Export SDS Binder
          </button>
          <button
            onClick={() => setUploadModal("open")}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload SDS PDF
          </button>
        </div>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p><strong className="text-white">OSHA&apos;s #1 test during a HazCom inspection:</strong> the inspector walks to a shelf, picks up a container, and says &quot;show me the SDS for this product.&quot;</p>
          <p>Your SDS must be &quot;readily accessible during each work shift to employees when they are in their work areas.&quot; OSHA explicitly says employees should NOT have to ask anyone for permission — that&apos;s considered a barrier to access.</p>
          <p><strong className="text-amber-400">Electronic systems like ShieldSDS are permitted, but you must meet these requirements:</strong></p>
          <ul className="list-none space-y-1 ml-1">
            <li>✅ Reliable devices accessible at all times (shop tablet, employee phones)</li>
            <li>✅ Employees trained on how to use the system</li>
            <li>✅ A backup system for emergencies (offline mode + printed binder)</li>
            <li>✅ No passwords or logins required for workers to view SDS</li>
          </ul>
          <p><strong className="text-amber-400">What to do if an SDS is missing:</strong> Contact the manufacturer — they are legally required to provide it. If they don&apos;t respond, you can file a complaint with OSHA, but you still need to obtain the SDS. Do not use a chemical without its SDS on file.</p>
          <p className="text-amber-500/80 text-xs">[29 CFR 1910.1200(g)(8)]</p>
        </HelpCard>
      </div>

      {/* Missing SDS Banner */}
      {missingSDS.length > 0 && (
        <div className="mb-6 rounded-xl bg-status-red/10 border border-status-red/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-status-red flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">
                {missingSDS.length} Missing SDS: {missingSDS.map((s) => s.productName).join(", ")}
              </p>
              <p className="text-xs text-gray-400">
                OSHA requires an accessible SDS for every hazardous chemical in your inventory.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmailSds(missingSDS[0])}
            className="flex items-center gap-1 text-status-red hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            Request from Vendor <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, manufacturer, hazard, CAS number, or ingredient..."
          className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Filter Rows */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Status</span>
          {["All", "Current", "Needs Review", "Missing"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f
                  ? "bg-amber-500 text-navy-950"
                  : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Signal</span>
          {["All", "Danger", "Warning", "Not Classified"].map((f) => (
            <button
              key={f}
              onClick={() => setSignalFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                signalFilter === f
                  ? "bg-amber-500 text-navy-950"
                  : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Location</span>
          <button
            onClick={() => setLocationFilter("All")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              locationFilter === "All"
                ? "bg-amber-500 text-navy-950"
                : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
            }`}
          >
            All
          </button>
          {allLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                locationFilter === loc
                  ? "bg-amber-500 text-navy-950"
                  : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Hazard</span>
          <button
            onClick={() => setHazardFilter("All")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              hazardFilter === "All"
                ? "bg-amber-500 text-navy-950"
                : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
            }`}
          >
            All
          </button>
          {hazardTypes.map((ht) => (
            <button
              key={ht.label}
              onClick={() => setHazardFilter(ht.label)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                hazardFilter === ht.label
                  ? "bg-amber-500 text-navy-950"
                  : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
              }`}
            >
              {ht.label}
            </button>
          ))}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setStatusFilter("All"); setSignalFilter("All"); setLocationFilter("All"); setHazardFilter("All"); }}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Clear {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">
        Showing {filtered.length} of {sdsEntries.length} entries
      </p>

      {/* SDS Table */}
      <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-navy-700">
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product / Manufacturer</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Signal Word</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pictograms</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Flash Point</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">PDF</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sds) => (
              <tr
                key={sds.id}
                onClick={() => setSelectedSds(sds)}
                className={`border-b border-navy-700/30 hover:bg-navy-800/30 transition-colors cursor-pointer ${
                  sds.sdsStatus === "missing" ? "bg-status-red/5" : ""
                }`}
              >
                <td className="py-3.5 px-4">
                  <p className="text-sm font-medium text-white">{sds.productName}</p>
                  <p className="text-xs text-gray-500">{sds.manufacturer} &middot; {sds.storageLocation}</p>
                </td>
                <td className="py-3.5 px-4">{signalBadge(sds.signalWord)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex gap-1">
                    {sds.pictograms.slice(0, 3).map((p) => (
                      <GHSPictogram key={p} type={p} size={24} />
                    ))}
                    {sds.pictograms.length > 3 && (
                      <span className="text-xs text-gray-500 self-center ml-1">+{sds.pictograms.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-300">{sds.flashPoint}</td>
                <td className="py-3.5 px-4">
                  {uploadedPDFs[sds.id] ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-green/15 text-status-green">
                      <FileText className="h-3 w-3" /> On file
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4">{statusBadge(sds.sdsStatus)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                  No SDS entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedSds && (
        <SDSDetailPanel
          sds={selectedSds}
          onClose={() => setSelectedSds(null)}
          uploadedPDFs={uploadedPDFs}
          onUpload={(s) => { setSelectedSds(null); setUploadModal(s); }}
          onViewPDF={(url, name) => setPdfViewer({ url, name })}
        />
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <UploadModal
          sds={uploadModal === "open" ? null : uploadModal}
          onClose={() => setUploadModal(null)}
          onUploaded={handleUploaded}
        />
      )}

      {/* PDF Viewer */}
      {pdfViewer && (
        <PDFViewerModal url={pdfViewer.url} productName={pdfViewer.name} onClose={() => setPdfViewer(null)} />
      )}

      {/* Email Modal */}
      {emailSds && <EmailModal sds={emailSds} onClose={() => setEmailSds(null)} />}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
