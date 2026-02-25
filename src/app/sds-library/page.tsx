"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GHSPictogram, { GHS_LABELS } from "@/components/GHSPictogram";
import SDSFetchHelper from "@/components/SDSFetchHelper";
import HelpCard from "@/components/HelpCard";
import { getChemicals, initializeStore, updateChemical } from "@/lib/chemicals";
import type { Chemical } from "@/lib/types";
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
    case "expired":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-amber/15 text-status-amber">
          Expired
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

const signalBadge = (word: string | null) => {
  if (word === "DANGER") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-status-red/15 text-status-red border border-status-red/30">
        DANGER
      </span>
    );
  }
  if (word === "WARNING") {
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

// Hazard type filter mapping
const hazardTypes = [
  { label: "Flammable", codes: ["GHS02"] },
  { label: "Health Hazard", codes: ["GHS08"] },
  { label: "Corrosive", codes: ["GHS05"] },
  { label: "Toxic", codes: ["GHS06"] },
  { label: "Irritant", codes: ["GHS07"] },
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

function EmailModal({ chem, onClose }: { chem: Chemical; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const subject = `SDS Request: ${chem.product_name}`;
  const body = `Dear ${chem.manufacturer} Safety Department,

We are writing to request the current Safety Data Sheet (SDS) for:

Product: ${chem.product_name}
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

  const emailDomain = chem.manufacturer.toLowerCase().replace(/[^a-z]/g, "");

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
            <p className="text-sm text-white mt-1">safety@{emailDomain}.com</p>
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
            href={`mailto:safety@${emailDomain}.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
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
  chem,
  allChemicals,
  onClose,
  onUploaded,
}: {
  chem: Chemical | null;
  allChemicals: Chemical[];
  onClose: () => void;
  onUploaded: (record: UploadRecord) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(chem?.id || "");
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
    if (!selectedId) {
      setError("Please select a chemical.");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sdsId", selectedId);
    formData.append("uploadedBy", "Sarah Chen");

    try {
      const res = await fetch("/api/upload-sds", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // Mark chemical as having SDS uploaded
      updateChemical(selectedId, { sds_uploaded: true, sds_status: "current", sds_date: new Date().toISOString().split("T")[0] });
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
          {!chem && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Chemical</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Select a chemical...</option>
                {allChemicals.map((c) => (
                  <option key={c.id} value={c.id}>{c.product_name} ({c.manufacturer})</option>
                ))}
              </select>
            </div>
          )}
          {chem && (
            <div className="text-sm">
              <span className="text-gray-400">Uploading for:</span>{" "}
              <span className="text-white font-medium">{chem.product_name}</span>
            </div>
          )}

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
  chem,
  onClose,
  uploadedPDFs,
  onUpload,
  onViewPDF,
}: {
  chem: Chemical;
  onClose: () => void;
  uploadedPDFs: Record<string, UploadRecord>;
  onUpload: (chem: Chemical) => void;
  onViewPDF: (url: string, name: string) => void;
}) {
  const uploadRecord = uploadedPDFs[chem.id];
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
                {signalBadge(chem.signal_word)}
                {statusBadge(chem.sds_status)}
              </div>
              <h2 className="font-display font-bold text-lg text-white truncate">{chem.product_name}</h2>
              <p className="text-xs text-gray-400">{chem.manufacturer} &middot; {chem.location}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white ml-4 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
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
                  onClick={() => onViewPDF(pdfUrl, chem.product_name)}
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
                  onClick={() => onUpload(chem)}
                  className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Replace PDF
                </button>
              </>
            ) : (
              <button
                onClick={() => onUpload(chem)}
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
            <SDSFetchHelper manufacturer={chem.manufacturer} productName={chem.product_name} productCode="" />
          )}
        </div>

        {/* 16-Section Body */}
        <div className="px-6 py-4">
          {/* Section 1 — Identification */}
          <SDSSection num={1} title="Identification">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-500">Product Name:</span> <span className="text-white font-medium">{chem.product_name}</span></div>
              <div><span className="text-gray-500">Manufacturer:</span> <span className="text-white">{chem.manufacturer}</span></div>
              <div><span className="text-gray-500">Storage Location:</span> <span className="text-white">{chem.location}</span></div>
              <div><span className="text-gray-500">Container Type:</span> <span className="text-white">{chem.container_type}</span></div>
              {chem.un_number && <div><span className="text-gray-500">UN Number:</span> <span className="text-white">{chem.un_number}</span></div>}
              <div><span className="text-gray-500">Added By:</span> <span className="text-white">{chem.added_by}</span></div>
            </div>
          </SDSSection>

          {/* Section 2 — Hazard Identification */}
          <SDSSection num={2} title="Hazard Identification">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Signal Word:</span>
              {signalBadge(chem.signal_word)}
            </div>
            {chem.pictogram_codes.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {chem.pictogram_codes.map((code) => (
                  <div key={code} className="flex flex-col items-center gap-1">
                    <GHSPictogram code={code} size={44} />
                    <span className="text-[10px] text-gray-500">{GHS_LABELS[code] || code}</span>
                  </div>
                ))}
              </div>
            )}
            {chem.hazard_statements.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-400 mb-1">Hazard Statements</p>
                <ul className="text-xs space-y-0.5">
                  {chem.hazard_statements.map((h) => <li key={h.code}><span className="font-semibold">{h.code}</span> {h.text}</li>)}
                </ul>
              </div>
            )}
            {(chem.precautionary_statements.prevention.length > 0 || chem.precautionary_statements.response.length > 0) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Precautionary Statements</p>
                <ul className="text-xs space-y-0.5">
                  {chem.precautionary_statements.prevention.map((p) => <li key={p.code}><span className="font-semibold">{p.code}</span> {p.text}</li>)}
                  {chem.precautionary_statements.response.map((p) => <li key={p.code}><span className="font-semibold">{p.code}</span> {p.text}</li>)}
                </ul>
              </div>
            )}
          </SDSSection>

          {/* Section 3 — Composition */}
          <SDSSection num={3} title="Composition / Information on Ingredients">
            {chem.cas_numbers.length > 0 ? (
              <div className="text-xs">
                <p className="text-gray-400 font-semibold mb-1">CAS Numbers</p>
                <ul className="space-y-0.5">
                  {chem.cas_numbers.map((cas) => <li key={cas} className="text-white">{cas}</li>)}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No composition data available. See manufacturer SDS.</p>
            )}
          </SDSSection>

          {/* Section 4 — First Aid */}
          <SDSSection num={4} title="First Aid Measures">
            <div className="space-y-2 text-xs">
              {chem.first_aid.eyes && <div><span className="font-semibold text-gray-400">Eyes:</span> {chem.first_aid.eyes}</div>}
              {chem.first_aid.skin && <div><span className="font-semibold text-gray-400">Skin:</span> {chem.first_aid.skin}</div>}
              {chem.first_aid.inhalation && <div><span className="font-semibold text-gray-400">Inhalation:</span> {chem.first_aid.inhalation}</div>}
              {chem.first_aid.ingestion && <div><span className="font-semibold text-gray-400">Ingestion:</span> {chem.first_aid.ingestion}</div>}
            </div>
          </SDSSection>

          {/* Section 5 — Fire Fighting */}
          <SDSSection num={5} title="Fire-Fighting Measures">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Extinguishing Media:</span> {chem.pictogram_codes.includes("GHS02") ? "CO2, dry chemical, foam. Do NOT use water jet." : "Use extinguishing media appropriate for surrounding materials."}</div>
              <div><span className="font-semibold text-gray-400">Special Hazards:</span> {chem.pictogram_codes.includes("GHS02") ? "Flammable vapors may travel to ignition source and flash back. Containers may rupture or explode when exposed to heat." : "None known."}</div>
              <div><span className="font-semibold text-gray-400">Protective Equipment:</span> Self-contained breathing apparatus (SCBA) and full protective gear required for fire fighters.</div>
            </div>
          </SDSSection>

          {/* Section 6 — Accidental Release */}
          <SDSSection num={6} title="Accidental Release Measures">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Personal Precautions:</span> Don appropriate PPE (see Section 8). Ensure adequate ventilation. {chem.pictogram_codes.includes("GHS02") ? "Remove ignition sources." : ""}</div>
              <div><span className="font-semibold text-gray-400">Environmental:</span> Prevent entry into drains, sewers, or waterways. Notify authorities if release cannot be contained.</div>
            </div>
          </SDSSection>

          {/* Section 7 — Handling and Storage */}
          <SDSSection num={7} title="Handling and Storage">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Storage:</span> {chem.storage_requirements}</div>
              {chem.incompatible_materials.length > 0 && (
                <div><span className="font-semibold text-gray-400">Incompatibilities:</span> {chem.incompatible_materials.join(", ")}</div>
              )}
            </div>
          </SDSSection>

          {/* Section 8 — PPE */}
          <SDSSection num={8} title="Exposure Controls / Personal Protection">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Eye Protection</p>
                <p>{chem.ppe_required.eyes || "Not specified"}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Hand Protection</p>
                <p>{chem.ppe_required.hands || "Not specified"}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Respiratory</p>
                <p>{chem.ppe_required.respiratory || "Not specified"}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="font-semibold text-amber-400 mb-1">Body Protection</p>
                <p>{chem.ppe_required.body || "Not specified"}</p>
              </div>
            </div>
          </SDSSection>

          {/* Section 9 — Physical Properties */}
          <SDSSection num={9} title="Physical and Chemical Properties">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {chem.physical_properties.appearance && <div><span className="text-gray-500">Appearance:</span> <span className="text-white">{chem.physical_properties.appearance}</span></div>}
              {chem.physical_properties.odor && <div><span className="text-gray-500">Odor:</span> <span className="text-white">{chem.physical_properties.odor}</span></div>}
              {chem.physical_properties.flash_point && <div><span className="text-gray-500">Flash Point:</span> <span className="text-white font-medium">{chem.physical_properties.flash_point}</span></div>}
              {chem.physical_properties.ph && <div><span className="text-gray-500">pH:</span> <span className="text-white">{chem.physical_properties.ph}</span></div>}
              {chem.physical_properties.boiling_point && <div><span className="text-gray-500">Boiling Point:</span> <span className="text-white">{chem.physical_properties.boiling_point}</span></div>}
              {chem.physical_properties.vapor_pressure && <div><span className="text-gray-500">Vapor Pressure:</span> <span className="text-white">{chem.physical_properties.vapor_pressure}</span></div>}
            </div>
          </SDSSection>

          {/* Section 10 — Stability */}
          <SDSSection num={10} title="Stability and Reactivity">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Stability:</span> Stable under recommended storage conditions.</div>
              <div><span className="font-semibold text-gray-400">Conditions to Avoid:</span> {chem.pictogram_codes.includes("GHS02") ? "Heat, sparks, open flames, hot surfaces, and direct sunlight." : "Extreme temperatures."}</div>
              {chem.incompatible_materials.length > 0 && (
                <div><span className="font-semibold text-gray-400">Incompatible Materials:</span> {chem.incompatible_materials.join(", ")}</div>
              )}
            </div>
          </SDSSection>

          {/* Section 11 — Toxicological */}
          <SDSSection num={11} title="Toxicological Information">
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-gray-400">Acute Toxicity:</span> {chem.hazard_statements.some((h) => ["H301", "H302", "H304"].includes(h.code)) ? "Harmful or fatal if swallowed. Aspiration hazard." : chem.hazard_statements.some((h) => h.code === "H332") ? "Harmful if inhaled." : "Low acute toxicity by all routes of exposure."}</div>
              <div><span className="font-semibold text-gray-400">Chronic Effects:</span> {chem.hazard_statements.some((h) => ["H351", "H350"].includes(h.code)) ? "Suspected of causing cancer with prolonged exposure." : chem.hazard_statements.some((h) => ["H372", "H373"].includes(h.code)) ? "May cause damage to organs through prolonged or repeated exposure." : "No chronic effects known at recommended exposure levels."}</div>
              <div><span className="font-semibold text-gray-400">Sensitization:</span> {chem.hazard_statements.some((h) => ["H317", "H334"].includes(h.code)) ? "May cause sensitization by skin contact or inhalation." : "Not known to be a sensitizer."}</div>
            </div>
          </SDSSection>

          {/* Sections 12-15 */}
          <SDSSection num={12} title="Ecological Information">
            <p className="text-xs text-gray-500 italic">Sections 12-15 (Ecological, Disposal, Transport, Regulatory) are not enforced by OSHA per 29 CFR 1910.1200(g)(2). Consult manufacturer SDS for complete information.</p>
          </SDSSection>
          <SDSSection num={13} title="Disposal Considerations">
            <p className="text-xs text-gray-500 italic">Dispose of contents and container in accordance with all local, state, and federal regulations. See manufacturer SDS for details.</p>
          </SDSSection>
          <SDSSection num={14} title="Transport Information">
            <div className="text-xs">
              {chem.un_number && <p><span className="text-gray-500">UN Number:</span> <span className="text-white">{chem.un_number}</span></p>}
              <p className="text-gray-500 italic mt-1">Consult manufacturer SDS and DOT regulations for transport classification.</p>
            </div>
          </SDSSection>
          <SDSSection num={15} title="Regulatory Information">
            <p className="text-xs text-gray-500 italic">Consult manufacturer SDS for applicable federal, state, and local regulations.</p>
          </SDSSection>

          {/* Section 16 — Other */}
          <SDSSection num={16} title="Other Information">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-gray-500">SDS Date:</span> <span className="text-white">{chem.sds_date || "—"}</span></div>
              <div><span className="text-gray-500">SDS Status:</span> <span className="text-white">{chem.sds_status}</span></div>
              <div><span className="text-gray-500">Date Added:</span> <span className="text-white">{chem.added_date}</span></div>
              <div><span className="text-gray-500">Containers:</span> <span className="text-white">{chem.container_count} {chem.container_type} ({chem.labeled ? "labeled" : "needs label"})</span></div>
              {chem.nfpa_diamond && (
                <div className="col-span-2">
                  <span className="text-gray-500">NFPA Diamond:</span>{" "}
                  <span className="text-white">Health {chem.nfpa_diamond.health} / Fire {chem.nfpa_diamond.fire} / Reactivity {chem.nfpa_diamond.reactivity}{chem.nfpa_diamond.special ? ` / ${chem.nfpa_diamond.special}` : ""}</span>
                </div>
              )}
            </div>
          </SDSSection>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SDSLibraryPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
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
  const [selectedChem, setSelectedChem] = useState<Chemical | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [emailChem, setEmailChem] = useState<Chemical | null>(null);
  const [uploadModal, setUploadModal] = useState<Chemical | null | "open">(null);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string } | null>(null);
  const [uploadedPDFs, setUploadedPDFs] = useState<Record<string, UploadRecord>>({});

  // Load chemicals from store on mount
  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
  }, []);

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

  const allLocations = useMemo(
    () => Array.from(new Set(chemicals.map((c) => c.location))).sort(),
    [chemicals]
  );

  const missingSDS = useMemo(() => chemicals.filter((c) => c.sds_status === "missing"), [chemicals]);
  const currentCount = useMemo(() => chemicals.filter((c) => c.sds_status === "current").length, [chemicals]);
  const expiredCount = useMemo(() => chemicals.filter((c) => c.sds_status === "expired").length, [chemicals]);
  const pdfsUploaded = Object.keys(uploadedPDFs).length;

  const lastUpdated = useMemo(() => {
    const dates = chemicals
      .filter((c) => c.sds_date)
      .map((c) => new Date(c.sds_date!).getTime());
    if (dates.length === 0) return "N/A";
    const max = new Date(Math.max(...dates));
    return max.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [chemicals]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUploaded = useCallback((record: UploadRecord) => {
    setUploadedPDFs((prev) => ({ ...prev, [record.sdsId]: record }));
    const c = chemicals.find((ch) => ch.id === record.sdsId);
    showToast(`PDF uploaded: ${c?.product_name || record.originalName}`);
    setChemicals(getChemicals());
  }, [showToast, chemicals]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return chemicals.filter((c) => {
      const matchesSearch =
        !q ||
        c.product_name.toLowerCase().includes(q) ||
        c.manufacturer.toLowerCase().includes(q) ||
        (c.signal_word || "").toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.hazard_statements.some((h) => h.text.toLowerCase().includes(q) || h.code.toLowerCase().includes(q)) ||
        c.cas_numbers.some((cas) => cas.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Current" && c.sds_status === "current") ||
        (statusFilter === "Expired" && c.sds_status === "expired") ||
        (statusFilter === "Missing" && c.sds_status === "missing");

      const matchesSignal =
        signalFilter === "All" ||
        (signalFilter === "Danger" && c.signal_word === "DANGER") ||
        (signalFilter === "Warning" && c.signal_word === "WARNING") ||
        (signalFilter === "Not Classified" && c.signal_word === null);

      const matchesLocation = locationFilter === "All" || c.location === locationFilter;

      const matchesHazard =
        hazardFilter === "All" ||
        hazardTypes.find((ht) => ht.label === hazardFilter)?.codes.some((code) => c.pictogram_codes.includes(code));

      return matchesSearch && matchesStatus && matchesSignal && matchesLocation && matchesHazard;
    });
  }, [search, statusFilter, signalFilter, locationFilter, hazardFilter, chemicals]);

  const activeFilterCount = [statusFilter, signalFilter, locationFilter, hazardFilter].filter((f) => f !== "All").length;

  return (
    <DashboardLayout>
      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-gray-400">Total:</span>
          <span className="font-bold text-white">{chemicals.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-status-green" />
          <span className="text-gray-400">Current:</span>
          <span className="font-bold text-status-green">{currentCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-amber" />
          <span className="text-gray-400">Expired:</span>
          <span className="font-bold text-status-amber">{expiredCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-status-red" />
          <span className="text-gray-400">Missing:</span>
          <span className="font-bold text-status-red">{missingSDS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-400" />
          <span className="text-gray-400">PDFs:</span>
          <span className="font-bold text-white">{pdfsUploaded}/{chemicals.length}</span>
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
            {chemicals.length} safety data sheets &middot; click any row to view full 16-section SDS
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <li>&#x2705; Reliable devices accessible at all times (shop tablet, employee phones)</li>
            <li>&#x2705; Employees trained on how to use the system</li>
            <li>&#x2705; A backup system for emergencies (offline mode + printed binder)</li>
            <li>&#x2705; No passwords or logins required for workers to view SDS</li>
          </ul>
          <p><strong className="text-amber-400">What to do if an SDS is missing:</strong> Contact the manufacturer — they are legally required to provide it. If they don&apos;t respond, you can file a complaint with OSHA, but you still need to obtain the SDS. Do not use a chemical without its SDS on file.</p>
          <p className="text-amber-500/80 text-xs">[29 CFR 1910.1200(g)(8)]</p>
        </HelpCard>
      </div>

      {/* Empty State */}
      {chemicals.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No chemicals in your SDS library</h2>
          <p className="text-gray-400 mb-6">Scan your first chemical to start building your SDS binder.</p>
          <a
            href="/scan"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Scan Chemical
          </a>
        </div>
      )}

      {/* Missing SDS Banner */}
      {chemicals.length > 0 && missingSDS.length > 0 && (
        <div className="mb-6 rounded-xl bg-status-red/10 border border-status-red/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-status-red flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">
                {missingSDS.length} Missing SDS: {missingSDS.map((c) => c.product_name).join(", ")}
              </p>
              <p className="text-xs text-gray-400">
                OSHA requires an accessible SDS for every hazardous chemical in your inventory.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmailChem(missingSDS[0])}
            className="flex items-center gap-1 text-status-red hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            Request from Vendor <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content — only when chemicals exist */}
      {chemicals.length > 0 && <>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, manufacturer, hazard, CAS number..."
          className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Filter Rows */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Status</span>
          {["All", "Current", "Expired", "Missing"].map((f) => (
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
        Showing {filtered.length} of {chemicals.length} entries
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
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelectedChem(c)}
                className={`border-b border-navy-700/30 hover:bg-navy-800/30 transition-colors cursor-pointer ${
                  c.sds_status === "missing" ? "bg-status-red/5" : ""
                }`}
              >
                <td className="py-3.5 px-4">
                  <p className="text-sm font-medium text-white">{c.product_name}</p>
                  <p className="text-xs text-gray-500">{c.manufacturer} &middot; {c.location}</p>
                </td>
                <td className="py-3.5 px-4">{signalBadge(c.signal_word)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex gap-1">
                    {c.pictogram_codes.slice(0, 3).map((code) => (
                      <GHSPictogram key={code} code={code} size={24} />
                    ))}
                    {c.pictogram_codes.length > 3 && (
                      <span className="text-xs text-gray-500 self-center ml-1">+{c.pictogram_codes.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-300">{c.physical_properties.flash_point || "—"}</td>
                <td className="py-3.5 px-4">
                  {uploadedPDFs[c.id] ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-green/15 text-status-green">
                      <FileText className="h-3 w-3" /> On file
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4">{statusBadge(c.sds_status)}</td>
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

      </>}

      {/* Detail Panel */}
      {selectedChem && (
        <SDSDetailPanel
          chem={selectedChem}
          onClose={() => setSelectedChem(null)}
          uploadedPDFs={uploadedPDFs}
          onUpload={(c) => { setSelectedChem(null); setUploadModal(c); }}
          onViewPDF={(url, name) => setPdfViewer({ url, name })}
        />
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <UploadModal
          chem={uploadModal === "open" ? null : uploadModal}
          allChemicals={chemicals}
          onClose={() => setUploadModal(null)}
          onUploaded={handleUploaded}
        />
      )}

      {/* PDF Viewer */}
      {pdfViewer && (
        <PDFViewerModal url={pdfViewer.url} productName={pdfViewer.name} onClose={() => setPdfViewer(null)} />
      )}

      {/* Email Modal */}
      {emailChem && <EmailModal chem={emailChem} onClose={() => setEmailChem(null)} />}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
