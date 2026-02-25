"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  Pencil,
  ArrowLeft,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Package,
  Printer,
  LayoutDashboard,
  X,
} from "lucide-react";
import { addChemical, getLocations, initializeStore } from "@/lib/chemicals";
import type {
  Chemical,
  HazardStatement,
  PrecautionaryStatements,
  FirstAidInfo,
  PPERequirements,
  PhysicalProperties,
  NFPADiamond,
  Location,
} from "@/lib/types";

// ── GHS code → readable name map ──────────────────────────
const GHS_NAMES: Record<string, string> = {
  GHS01: "Exploding Bomb",
  GHS02: "Flame",
  GHS03: "Flame Over Circle",
  GHS04: "Gas Cylinder",
  GHS05: "Corrosion",
  GHS06: "Skull & Crossbones",
  GHS07: "Exclamation Mark",
  GHS08: "Health Hazard",
  GHS09: "Environment",
};

// ── Types for scan result ─────────────────────────────────
interface ScanResult {
  product_name: string;
  manufacturer: string;
  signal_word: "DANGER" | "WARNING" | null;
  pictogram_codes: string[];
  hazard_statements: HazardStatement[];
  precautionary_statements: PrecautionaryStatements;
  first_aid: FirstAidInfo;
  ppe_required: PPERequirements;
  physical_properties: PhysicalProperties;
  storage_requirements: string;
  incompatible_materials: string[];
  cas_numbers: string[];
  un_number: string | null;
  nfpa_diamond: NFPADiamond | null;
  confidence: number;
  fields_uncertain: string[];
}

type Step = "capture" | "preview" | "processing" | "review" | "success";

// ── Client-side image compression ─────────────────────────
// Resizes to max 2000px longest edge and exports as JPEG 0.85
function compressImage(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_EDGE = 2000;
        let { width, height } = img;
        if (width > MAX_EDGE || height > MAX_EDGE) {
          if (width > height) {
            height = Math.round((height * MAX_EDGE) / width);
            width = MAX_EDGE;
          } else {
            width = Math.round((width * MAX_EDGE) / height);
            height = MAX_EDGE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        console.log("[scan] Compressed:", img.naturalWidth, "x", img.naturalHeight, "→", width, "x", height, "| Size:", Math.round(base64.length * 0.75 / 1024), "KB");
        resolve({ base64, dataUrl });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Collapsible Section ───────────────────────────────────
function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span>{icon}</span> {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 py-3 border-t border-white/5">{children}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function ScanPage() {
  const [step, setStep] = useState<Step>("capture");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [manualToast, setManualToast] = useState(false);

  // Review step editable state
  const [editName, setEditName] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [editContainerType, setEditContainerType] = useState("Aerosol Can");
  const [editContainerCount, setEditContainerCount] = useState(1);
  const [locations, setLocations] = useState<Location[]>([]);

  // Success animation
  const [successItems, setSuccessItems] = useState<number[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize store + load locations
  useEffect(() => {
    initializeStore();
    setLocations(getLocations());
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const { base64, dataUrl } = await compressImage(file);
      setCompressedBase64(base64);
      setImageUrl(dataUrl);
    } catch {
      // Fallback: read original file as data URL
      const raw = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setImageUrl(raw);
      setCompressedBase64(raw.split(",")[1] || raw);
    }
    setStep("preview");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const resetToCapture = useCallback(() => {
    setStep("capture");
    setImageUrl(null);
    setCompressedBase64(null);
    setScanResult(null);
    setProcessingStage(0);
    setError(null);
    setApiKeyError(false);
    setSuccessItems([]);
  }, []);

  // ── Step 3: Processing with real API call ─────────────
  const stageRef = useRef(0);

  const startProcessing = useCallback(() => {
    setStep("processing");
    setProcessingStage(0);
    setError(null);
    setApiKeyError(false);
    stageRef.current = 0;

    // Start stage animation (1.5s intervals)
    const interval = setInterval(() => {
      stageRef.current++;
      if (stageRef.current < 3) {
        setProcessingStage(stageRef.current);
      } else {
        clearInterval(interval);
      }
    }, 1500);

    // Call API in parallel
    (async () => {
      try {
        if (!compressedBase64) throw new Error("No image data available");
        console.log("[scan] Sending to API, base64 length:", compressedBase64.length, "(~" + Math.round(compressedBase64.length * 0.75 / 1024) + " KB)");

        const response = await fetch("/api/chemical/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64, mimeType: "image/jpeg" }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errData.error || "Scan failed");
        }

        const result: ScanResult = await response.json();
        console.log("[scan] API response received:", JSON.stringify(result).substring(0, 1000));
        console.log("[scan] product_name:", result.product_name, "| manufacturer:", result.manufacturer, "| signal_word:", result.signal_word);
        console.log("[scan] hazard_statements:", result.hazard_statements?.length, "| pictograms:", result.pictogram_codes?.length, "| confidence:", result.confidence);

        // Complete remaining stages quickly
        clearInterval(interval);
        for (let i = stageRef.current; i < 3; i++) {
          setProcessingStage(i);
          await new Promise((r) => setTimeout(r, 300));
        }

        // Set result and move to review
        setScanResult(result);
        setEditName(result.product_name || "");
        setEditManufacturer(result.manufacturer || "");
        const locs = getLocations();
        setLocations(locs);
        setEditLocation(locs[0]?.name ?? "");
        setStep("review");
      } catch (err) {
        clearInterval(interval);
        const msg = err instanceof Error ? err.message : "Scan failed";
        if (msg.includes("ANTHROPIC_API_KEY")) {
          setApiKeyError(true);
        }
        setError(
          "We couldn\u2019t read that label. Try taking a clearer photo with good lighting."
        );
      }
    })();
  }, [compressedBase64]);

  // ── Step 5: Success cascade animation ──────────────────
  useEffect(() => {
    if (step !== "success") return;
    const items = [0, 1, 2, 3, 4];
    items.forEach((i) => {
      setTimeout(() => {
        setSuccessItems((prev) => [...prev, i]);
      }, 400 * (i + 1));
    });
  }, [step]);

  // ── Save chemical ──────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!scanResult) return;
    const locationName = showNewLocation && newLocationName.trim()
      ? newLocationName.trim()
      : editLocation;

    const chemData: Omit<Chemical, "id"> = {
      product_name: editName,
      manufacturer: editManufacturer,
      cas_numbers: scanResult.cas_numbers,
      un_number: scanResult.un_number,
      signal_word: scanResult.signal_word,
      pictogram_codes: scanResult.pictogram_codes,
      hazard_statements: scanResult.hazard_statements,
      precautionary_statements: scanResult.precautionary_statements,
      first_aid: scanResult.first_aid,
      ppe_required: scanResult.ppe_required,
      storage_requirements: scanResult.storage_requirements,
      incompatible_materials: scanResult.incompatible_materials,
      physical_properties: scanResult.physical_properties,
      nfpa_diamond: scanResult.nfpa_diamond,
      location: locationName,
      container_type: editContainerType,
      container_count: editContainerCount,
      labeled: false,
      label_printed_date: null,
      sds_url: null,
      sds_uploaded: false,
      sds_date: null,
      sds_status: "missing",
      added_date: new Date().toISOString(),
      added_by: "Mike Rodriguez",
      added_method: "scan",
      scan_image_url: imageUrl,
      scan_confidence: scanResult.confidence,
      last_updated: new Date().toISOString(),
    };

    addChemical(chemData);
    setStep("success");
  }, [
    scanResult,
    editName,
    editManufacturer,
    editLocation,
    editContainerType,
    editContainerCount,
    showNewLocation,
    newLocationName,
    imageUrl,
  ]);

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-navy-950 text-white font-sans">
      <style jsx global>{`
        @keyframes shieldFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shieldPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shieldSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shieldCheckIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .scan-fade-in { animation: shieldFadeIn 0.3s ease both; }
        .scan-pulse { animation: shieldPulse 2s ease-in-out infinite; }
        .scan-spin { animation: shieldSpin 1s linear infinite; }
        .scan-check-in { animation: shieldCheckIn 0.4s ease both; }
      `}</style>

      {/* ── STEP 1: CAPTURE ─────────────────────────────── */}
      {step === "capture" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 scan-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <Shield className="h-10 w-10 text-amber-400" />
            <span className="font-display font-black text-2xl">
              Shield<span className="text-amber-400">SDS</span>
            </span>
          </div>

          <h1 className="text-xl font-display font-bold text-center mb-2">
            Scan a Chemical Label
          </h1>
          <p className="text-sm text-gray-400 text-center mb-10 max-w-xs">
            Take a photo of any chemical label and we&apos;ll extract the safety data automatically.
          </p>

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-4">
            {/* Camera */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-lg py-5 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Camera className="h-7 w-7 flex-shrink-0" />
              <span>Take a Photo</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Gallery */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-base py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Upload className="h-6 w-6 flex-shrink-0 text-gray-300" />
              <span>Upload from Gallery</span>
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Manual */}
            <button
              onClick={() => {
                setManualToast(true);
                setTimeout(() => setManualToast(false), 3000);
              }}
              className="w-full flex items-center gap-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-base py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Pencil className="h-6 w-6 flex-shrink-0 text-gray-300" />
              <span>Enter Manually</span>
            </button>
          </div>

          {/* Back link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 mt-12 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Manual toast */}
          {manualToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-navy-800 border border-white/10 px-5 py-3 rounded-xl shadow-xl scan-fade-in">
              <Pencil className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-gray-300">Manual entry coming soon</span>
              <button onClick={() => setManualToast(false)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: PREVIEW ─────────────────────────────── */}
      {step === "preview" && imageUrl && (
        <div className="min-h-screen flex flex-col px-6 py-8 scan-fade-in">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Captured label"
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <p className="text-center text-sm text-gray-300 mb-6">
              Is the label clearly visible?
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetToCapture}
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <Camera className="h-4 w-4" />
                Retake
              </button>
              <button
                onClick={startProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold py-3 rounded-xl transition-colors"
              >
                Analyze Label
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: PROCESSING ──────────────────────────── */}
      {step === "processing" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 scan-fade-in">
          {/* Faded image background */}
          {imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="max-w-full max-h-full object-contain blur-sm"
              />
            </div>
          )}

          <div className="relative z-10 text-center">
            {/* Spinner */}
            <div className="w-16 h-16 mx-auto mb-8 border-4 border-white/10 border-t-amber-400 rounded-full scan-spin" />

            <div className="space-y-4 max-w-xs mx-auto">
              {[
                { icon: "\ud83d\udd0d", text: "Reading label..." },
                { icon: "\u26a0\ufe0f", text: "Extracting hazards..." },
                { icon: "\ud83d\udccb", text: "Building safety profile..." },
              ].map((stage, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    i <= processingStage ? "opacity-100" : "opacity-20"
                  }`}
                >
                  {i < processingStage ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    </div>
                  ) : i === processingStage ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 scan-pulse">
                      <span className="text-sm">{stage.icon}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm opacity-40">{stage.icon}</span>
                    </div>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      i < processingStage
                        ? "text-green-400"
                        : i === processingStage
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {i < processingStage
                      ? stage.text.replace("...", " ✓")
                      : stage.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="relative z-10 mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-xs text-center">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              {apiKeyError && (
                <p className="text-xs text-amber-400 mb-3">
                  Set your ANTHROPIC_API_KEY in .env.local to enable AI scanning.
                </p>
              )}
              <button
                onClick={resetToCapture}
                className="text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: REVIEW & CONFIRM ────────────────────── */}
      {step === "review" && scanResult && (
        <div className="min-h-screen pb-32 scan-fade-in">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-navy-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                <span className="font-display font-bold text-sm">Review Scan Results</span>
              </div>
              <button
                onClick={resetToCapture}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
            {/* API key warning */}
            {apiKeyError && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Set your <code className="bg-white/10 px-1 rounded">ANTHROPIC_API_KEY</code> in{" "}
                  <code className="bg-white/10 px-1 rounded">.env.local</code> to enable AI scanning.
                </p>
              </div>
            )}

            {/* Product name + manufacturer */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-lg font-display font-bold text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={editManufacturer}
                  onChange={(e) => setEditManufacturer(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Signal word badge */}
            {scanResult.signal_word && (
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider ${
                    scanResult.signal_word === "DANGER"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {scanResult.signal_word}
                </span>
                {scanResult.un_number && (
                  <span className="text-xs text-gray-400 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-lg">
                    {scanResult.un_number}
                  </span>
                )}
                {scanResult.cas_numbers.length > 0 && (
                  <span className="text-xs text-gray-400 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-lg">
                    CAS: {scanResult.cas_numbers.join(", ")}
                  </span>
                )}
              </div>
            )}

            {/* GHS Pictograms */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                GHS Pictograms
              </label>
              <div className="flex flex-wrap gap-2">
                {scanResult.pictogram_codes.map((code) => (
                  <div
                    key={code}
                    className="flex items-center gap-2 bg-red-500/10 border-2 border-red-500/40 rounded-lg px-3 py-2"
                  >
                    <div className="w-8 h-8 border-2 border-red-500 rounded flex items-center justify-center bg-white/5 rotate-45">
                      <span className="text-[10px] font-bold text-red-400 -rotate-45">
                        {code.replace("GHS0", "")}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {GHS_NAMES[code] || code}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Scan Confidence
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      scanResult.confidence >= 0.9
                        ? "bg-green-500"
                        : scanResult.confidence >= 0.7
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${scanResult.confidence * 100}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-bold ${
                    scanResult.confidence >= 0.9
                      ? "text-green-400"
                      : scanResult.confidence >= 0.7
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {Math.round(scanResult.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* NFPA Diamond */}
            {scanResult.nfpa_diamond && (
              <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">NFPA</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                    Health: {scanResult.nfpa_diamond.health}
                  </span>
                  <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-1 rounded">
                    Fire: {scanResult.nfpa_diamond.fire}
                  </span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded">
                    React: {scanResult.nfpa_diamond.reactivity}
                  </span>
                  {scanResult.nfpa_diamond.special && (
                    <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded">
                      {scanResult.nfpa_diamond.special}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Collapsible sections */}
            <Section title="Hazard Statements" icon="\u26a0\ufe0f" defaultOpen>
              <ul className="space-y-2">
                {scanResult.hazard_statements.map((h) => (
                  <li key={h.code} className="flex items-start gap-2">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {h.code}
                    </span>
                    <span className="text-sm text-gray-300">{h.text}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="PPE Requirements" icon="\ud83d\udee1\ufe0f" defaultOpen>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["eyes", "\ud83d\udc41\ufe0f", "Eyes"],
                    ["hands", "\ud83e\udde4", "Hands"],
                    ["respiratory", "\ud83d\udca8", "Respiratory"],
                    ["body", "\ud83e\udde5", "Body"],
                  ] as const
                ).map(([key, emoji, label]) => {
                  const val = scanResult.ppe_required[key];
                  if (!val) return null;
                  return (
                    <div
                      key={key}
                      className="bg-white/[0.03] border border-white/10 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{emoji}</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">{val}</p>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="First Aid" icon="\ud83d\ude91">
              <div className="space-y-3">
                {(
                  [
                    ["eyes", "\ud83d\udc41\ufe0f", "Eyes"],
                    ["skin", "\u270b", "Skin"],
                    ["inhalation", "\ud83d\udca8", "Inhalation"],
                    ["ingestion", "\ud83d\udc44", "Ingestion"],
                  ] as const
                ).map(([key, emoji, label]) => {
                  const val = scanResult.first_aid[key];
                  if (!val) return null;
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{emoji}</span>
                        <span className="text-xs font-semibold text-white">{label}</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-6">{val}</p>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Storage & Handling" icon="\ud83d\udce6">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase block mb-1">
                    Storage Requirements
                  </span>
                  <p className="text-sm text-gray-300">
                    {scanResult.storage_requirements}
                  </p>
                </div>
                {scanResult.incompatible_materials.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase block mb-1">
                      Incompatible Materials
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.incompatible_materials.map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Physical Properties" icon="\ud83d\udd2c">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {(
                  [
                    ["appearance", "Appearance"],
                    ["odor", "Odor"],
                    ["flash_point", "Flash Point"],
                    ["ph", "pH"],
                    ["boiling_point", "Boiling Point"],
                    ["vapor_pressure", "Vapor Pressure"],
                  ] as const
                ).map(([key, label]) => {
                  const val = scanResult.physical_properties[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs text-white font-medium">{val}</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Precautionary Statements" icon="\ud83d\udccb">
              <div className="space-y-4">
                {(
                  [
                    ["prevention", "Prevention"],
                    ["response", "Response"],
                    ["storage", "Storage"],
                    ["disposal", "Disposal"],
                  ] as const
                ).map(([key, label]) => {
                  const stmts = scanResult.precautionary_statements[key];
                  if (!stmts || stmts.length === 0) return null;
                  return (
                    <div key={key}>
                      <span className="text-xs font-semibold text-amber-400 uppercase block mb-1.5">
                        {label}
                      </span>
                      <ul className="space-y-1.5">
                        {stmts.map((s) => (
                          <li key={s.code} className="flex items-start gap-2">
                            <span className="text-xs font-mono text-gray-500 flex-shrink-0 mt-0.5">
                              {s.code}
                            </span>
                            <span className="text-xs text-gray-300">{s.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Location picker */}
            <div className="border border-white/10 rounded-xl p-4 space-y-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Storage Location
              </label>
              {!showNewLocation ? (
                <div className="space-y-2">
                  <select
                    value={editLocation}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setShowNewLocation(true);
                      } else {
                        setEditLocation(e.target.value);
                      }
                    }}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                    <option value="__new__">+ Add New Location</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="New location name..."
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowNewLocation(false);
                      setNewLocationName("");
                    }}
                    className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Container info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Container Type
                </label>
                <input
                  type="text"
                  value={editContainerType}
                  onChange={(e) => setEditContainerType(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={editContainerCount}
                  onChange={(e) =>
                    setEditContainerCount(parseInt(e.target.value) || 1)
                  }
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Fixed bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-navy-950/90 backdrop-blur-xl border-t border-white/5 px-4 py-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors hover:bg-white/[0.1]"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-[2] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-navy-950 font-bold py-3 rounded-xl transition-colors"
              >
                Save Chemical
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: SUCCESS CASCADE ─────────────────────── */}
      {step === "success" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 scan-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-amber-400" />
            <span className="font-display font-bold text-lg">
              Shield<span className="text-amber-400">SDS</span>
            </span>
          </div>

          <h2 className="text-xl font-display font-bold mb-8">Chemical Added!</h2>

          {/* Cascade checklist */}
          <div className="w-full max-w-sm space-y-3 mb-10">
            {[
              { text: "Chemical added to inventory", type: "success" },
              { text: "Hazard classification complete", type: "success" },
              { text: "Secondary label ready to print", type: "success" },
              {
                text: "SDS not yet linked \u2014 upload recommended",
                type: "warning",
              },
              {
                text: "Training notification queued for 3 employees",
                type: "success",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  successItems.includes(i)
                    ? "opacity-100 scan-check-in"
                    : "opacity-0"
                }`}
              >
                {item.type === "success" ? (
                  <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                )}
                <span
                  className={`text-sm font-medium ${
                    item.type === "success" ? "text-white" : "text-amber-400"
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons 2x2 */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            <button
              onClick={resetToCapture}
              className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 py-5 rounded-xl transition-colors"
            >
              <Camera className="h-6 w-6 text-amber-400" />
              <span className="text-sm font-semibold">Scan Another</span>
            </button>
            <Link
              href="/labels"
              className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 py-5 rounded-xl transition-colors"
            >
              <Printer className="h-6 w-6 text-amber-400" />
              <span className="text-sm font-semibold">Print Label</span>
            </Link>
            <Link
              href="/inventory"
              className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 py-5 rounded-xl transition-colors"
            >
              <Package className="h-6 w-6 text-amber-400" />
              <span className="text-sm font-semibold">View Inventory</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 py-5 rounded-xl transition-colors"
            >
              <LayoutDashboard className="h-6 w-6 text-amber-400" />
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
