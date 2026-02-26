"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
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
  FileText,
  MapPin,
  Loader2,
  Merge,
  StickyNote,
  Search,
} from "lucide-react";
import { addChemical, addLocation, getLocations, initializeStore, getCompanyProfile } from "@/lib/chemicals";
import GHSPictogram from "@/components/GHSPictogram";
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
interface SDSLookupResult {
  sds_url: string | null;
  sds_source: string | null;
  manufacturer_sds_portal: string | null;
  confidence: number;
  notes: string | null;
}

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
  // SDS lookup fields (populated by auto-lookup)
  sds_url?: string | null;
  sds_status?: string;
  sds_uploaded?: boolean;
  sds_lookup_result?: SDSLookupResult | null;
  manufacturer_sds_portal?: string | null;
}

type Step = "capture" | "preview" | "processing" | "review" | "success" | "manual" | "manual-searching" | "manual-merge" | "manual-success";

// ── Hazard type checkboxes for manual entry ─────────────
const HAZARD_TYPES = [
  { code: "GHS02", label: "Flammable", emoji: "🔥" },
  { code: "GHS05", label: "Corrosive", emoji: "⚗️" },
  { code: "GHS06", label: "Toxic / Poisonous", emoji: "☠️" },
  { code: "GHS07", label: "Irritant / Harmful", emoji: "⚠️" },
  { code: "GHS08", label: "Health Hazard", emoji: "🫁" },
  { code: "GHS03", label: "Oxidizer", emoji: "🔥" },
  { code: "GHS04", label: "Compressed Gas", emoji: "🫙" },
  { code: "GHS01", label: "Explosive", emoji: "💥" },
  { code: "GHS09", label: "Environmental Hazard", emoji: "🌿" },
] as const;

const CONTAINER_TYPES = [
  "Spray Can", "Bottle", "Jug", "Drum", "Tube",
  "Bucket", "Bag", "Box", "Aerosol Can", "Other",
];

// ── Supabase match type for merge prompt ────────────────
interface VerifiedMatch {
  product_name: string;
  manufacturer: string | null;
  signal_word: string | null;
  pictogram_codes: string[];
  hazard_statements: string[];
  sds_url: string | null;
  cas_numbers: string[];
  un_number: string | null;
  confidence: number;
  source: "supabase" | "api";
}

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
function ScanPageInner() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return");
  const [step, setStep] = useState<Step>("capture");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  // Manual entry state
  const [manualProductName, setManualProductName] = useState("");
  const [manualManufacturer, setManualManufacturer] = useState("");
  const [manualSignalWord, setManualSignalWord] = useState<"DANGER" | "WARNING" | null>(null);
  const [manualHazardCodes, setManualHazardCodes] = useState<Set<string>>(new Set());
  const [manualDontKnowHazards, setManualDontKnowHazards] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [manualShowNewLoc, setManualShowNewLoc] = useState(false);
  const [manualNewLocName, setManualNewLocName] = useState("");
  const [manualContainerType, setManualContainerType] = useState("Spray Can");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualOriginalContainer, setManualOriginalContainer] = useState(true);
  const [manualNotes, setManualNotes] = useState("");
  const [verifiedMatch, setVerifiedMatch] = useState<VerifiedMatch | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);
  const [manualSuccessItems, setManualSuccessItems] = useState<number[]>([]);
  const [manualSavedData, setManualSavedData] = useState<{ sdsFound: boolean; verified: boolean } | null>(null);

  // Review step editable state
  const [editName, setEditName] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [editContainerType, setEditContainerType] = useState("Aerosol Can");
  const [editContainerCount, setEditContainerCount] = useState(1);
  const [originalContainer, setOriginalContainer] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  // Success animation
  const [successItems, setSuccessItems] = useState<number[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      labeled: originalContainer,
      label_printed_date: null,
      sds_url: scanResult.sds_url || null,
      sds_uploaded: !!scanResult.sds_url,
      sds_date: scanResult.sds_url ? new Date().toISOString().split("T")[0] : null,
      sds_status: scanResult.sds_url ? "current" : "missing",
      added_date: new Date().toISOString(),
      added_by: getCompanyProfile().owner,
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
    originalContainer,
    showNewLocation,
    newLocationName,
    imageUrl,
  ]);

  // ── Manual entry: search Supabase + API, then show merge ──
  const handleManualSearch = useCallback(async () => {
    if (!manualProductName.trim()) return;
    setStep("manual-searching");
    setVerifiedMatch(null);
    setManualSearchError(null);

    // Step 1: Check Supabase via the search endpoint directly
    try {
      const res = await fetch(
        `/api/chemical/sds-lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: manualProductName.trim(),
            manufacturer: manualManufacturer.trim() || "Unknown",
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.sds_url && (data.confidence ?? 0) > 0.5) {
          setVerifiedMatch({
            product_name: manualProductName.trim(),
            manufacturer: manualManufacturer.trim() || null,
            signal_word: null,
            pictogram_codes: [],
            hazard_statements: [],
            sds_url: data.sds_url,
            cas_numbers: [],
            un_number: null,
            confidence: data.confidence ?? 0,
            source: data.notes?.includes("cached") ? "supabase" : "api",
          });
          setStep("manual-merge");
          return;
        }
      }
    } catch {
      // Continue without match
    }

    // No match found — save as-is
    saveManualEntry(false, null);
  }, [manualProductName, manualManufacturer]);

  const saveManualEntry = useCallback((useVerified: boolean, match: VerifiedMatch | null) => {
    const locationName = manualShowNewLoc && manualNewLocName.trim()
      ? (() => { addLocation({ name: manualNewLocName.trim(), chemical_ids: [] }); return manualNewLocName.trim(); })()
      : manualLocation;

    const pictogramCodes = manualDontKnowHazards ? [] : Array.from(manualHazardCodes);
    const sdsUrl = useVerified && match?.sds_url ? match.sds_url : null;

    const chemData: Omit<Chemical, "id"> = {
      product_name: manualProductName.trim(),
      manufacturer: manualManufacturer.trim() || "Unknown",
      cas_numbers: useVerified && match?.cas_numbers ? match.cas_numbers : [],
      un_number: useVerified && match?.un_number ? match.un_number : null,
      signal_word: manualSignalWord,
      pictogram_codes: useVerified && match?.pictogram_codes?.length ? match.pictogram_codes : pictogramCodes,
      hazard_statements: useVerified && match?.hazard_statements?.length
        ? match.hazard_statements.map((h) => {
            const m = h.match(/^(H\d+)\s*[-–—:]\s*(.+)$/);
            return m ? { code: m[1], text: m[2] } : { code: "", text: h };
          })
        : [],
      precautionary_statements: { prevention: [], response: [], storage: [], disposal: [] },
      first_aid: { eyes: null, skin: null, inhalation: null, ingestion: null },
      ppe_required: { eyes: null, hands: null, respiratory: null, body: null },
      storage_requirements: "",
      incompatible_materials: [],
      physical_properties: { appearance: null, odor: null, flash_point: null, ph: null, boiling_point: null, vapor_pressure: null },
      nfpa_diamond: null,
      location: locationName,
      container_type: manualContainerType,
      container_count: manualQuantity,
      labeled: manualOriginalContainer,
      label_printed_date: null,
      sds_url: sdsUrl,
      sds_uploaded: !!sdsUrl,
      sds_date: sdsUrl ? new Date().toISOString().split("T")[0] : null,
      sds_status: sdsUrl ? "current" : "missing",
      added_date: new Date().toISOString(),
      added_by: getCompanyProfile().owner,
      added_method: "manual",
      scan_image_url: null,
      scan_confidence: null,
      last_updated: new Date().toISOString(),
    };

    addChemical(chemData);
    setManualSavedData({ sdsFound: !!sdsUrl, verified: useVerified });
    setStep("manual-success");
  }, [manualProductName, manualManufacturer, manualSignalWord, manualHazardCodes, manualDontKnowHazards, manualLocation, manualShowNewLoc, manualNewLocName, manualContainerType, manualQuantity, manualOriginalContainer]);

  // Manual success cascade animation
  useEffect(() => {
    if (step !== "manual-success") return;
    const items = [0, 1, 2, 3];
    items.forEach((i) => {
      setTimeout(() => {
        setManualSuccessItems((prev) => [...prev, i]);
      }, 400 * (i + 1));
    });
  }, [step]);

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
            Add a Chemical
          </h1>
          <p className="text-sm text-gray-400 text-center mb-10 w-full max-w-xs">
            Scan a label, search our database, or type in the details manually.
          </p>

          {/* Action buttons */}
          <div className="w-full max-w-full md:max-w-sm space-y-4">
            {/* Scan or Upload */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-lg py-5 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Camera className="h-7 w-7 flex-shrink-0" />
              <div className="text-left">
                <span className="block">Scan or Upload a Label</span>
                <span className="block text-xs font-medium text-navy-950/70 mt-0.5">Take a photo or choose an image of any chemical label</span>
              </div>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Browse Database */}
            <Link
              href="/sds-search"
              className="w-full flex items-center gap-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-base py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Search className="h-6 w-6 flex-shrink-0 text-gray-300" />
              <div className="text-left">
                <span className="block">Browse Chemical Database</span>
                <span className="block text-xs font-normal text-gray-400 mt-0.5">Search our database of 4M+ chemicals and add with one click</span>
              </div>
            </Link>

            {/* Manual Entry */}
            <button
              onClick={() => {
                setManualProductName("");
                setManualManufacturer("");
                setManualSignalWord(null);
                setManualHazardCodes(new Set());
                setManualDontKnowHazards(false);
                setManualContainerType("Spray Can");
                setManualQuantity(1);
                setManualOriginalContainer(true);
                setManualNotes("");
                setVerifiedMatch(null);
                setManualSearchError(null);
                setManualSuccessItems([]);
                setManualSavedData(null);
                const locs = getLocations();
                setLocations(locs);
                setManualLocation(locs[0]?.name ?? "");
                setManualShowNewLoc(false);
                setManualNewLocName("");
                setStep("manual");
              }}
              className="w-full flex items-center gap-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-base py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Pencil className="h-6 w-6 flex-shrink-0 text-gray-300" />
              <div className="text-left">
                <span className="block">Enter Manually</span>
                <span className="block text-xs font-normal text-gray-400 mt-0.5">Type in what you know about the chemical</span>
              </div>
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

{/* Manual toast removed — manual entry is now a full step */}
        </div>
      )}

      {/* ── STEP 2: PREVIEW ─────────────────────────────── */}
      {step === "preview" && imageUrl && (
        <div className="min-h-screen flex flex-col px-6 py-8 scan-fade-in">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="w-full max-w-full md:max-w-md rounded-2xl overflow-hidden border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Captured label"
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>

          <div className="w-full max-w-full md:max-w-md mx-auto">
            <p className="text-center text-sm text-gray-300 mb-6">
              Is the label clearly visible?
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={resetToCapture}
                className="w-full md:w-auto md:flex-1 flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors"
              >
                <Camera className="h-4 w-4" />
                Retake
              </button>
              <button
                onClick={startProcessing}
                className="w-full md:w-auto md:flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold min-h-[48px] py-3 rounded-xl transition-colors"
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

            <div className="space-y-4 w-full max-w-xs mx-auto">
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
            <div className="relative z-10 mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 w-full max-w-xs text-center">
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
            <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                <span className="font-display font-bold text-sm">Review Scan Results</span>
              </div>
              <button
                onClick={resetToCapture}
                className="text-xs text-gray-400 hover:text-white transition-colors min-h-[44px] md:min-h-0"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-5">
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
              <div className="flex flex-wrap items-center gap-3">
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
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">NFPA</span>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
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

            {/* SDS Status */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Safety Data Sheet
              </label>
              {scanResult.sds_url ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Official SDS found and linked</span>
                  </div>
                  {scanResult.sds_lookup_result?.sds_source && (
                    <p className="text-xs text-gray-400 mb-3 ml-7">
                      From {scanResult.sds_lookup_result.sds_source}
                    </p>
                  )}
                  <a
                    href={scanResult.sds_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 ml-7 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View SDS
                  </a>
                </div>
              ) : scanResult.manufacturer_sds_portal || scanResult.sds_lookup_result?.manufacturer_sds_portal ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-400">SDS not found automatically</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 ml-7">
                    You can search the manufacturer&apos;s SDS portal or upload manually after saving.
                  </p>
                  <div className="flex items-center gap-2 ml-7">
                    <a
                      href={scanResult.manufacturer_sds_portal || scanResult.sds_lookup_result?.manufacturer_sds_portal || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Search manufacturer&apos;s SDS portal
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-5 w-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">SDS not found — upload required</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-7">
                    Request the SDS from the manufacturer or search online. You can upload it from the SDS Library after saving.
                  </p>
                </div>
              )}
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Original Container Toggle */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Original Container?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOriginalContainer(true)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                    originalContainer
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]"
                  }`}
                >
                  Yes, original container
                </button>
                <button
                  type="button"
                  onClick={() => setOriginalContainer(false)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                    !originalContainer
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]"
                  }`}
                >
                  No, transferred
                </button>
              </div>
            </div>
          </div>

          {/* Fixed bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-navy-950/90 backdrop-blur-xl border-t border-white/5 px-4 py-4">
            <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row gap-3">
              <Link
                href="/dashboard"
                className="w-full md:flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors hover:bg-white/[0.1]"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="w-full md:flex-[2] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-navy-950 font-bold min-h-[48px] py-3 rounded-xl transition-colors"
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
          <div className="w-full max-w-full md:max-w-sm space-y-3 mb-10">
            {[
              { text: "Chemical added to inventory", type: "success" },
              { text: "Hazard classification complete", type: "success" },
              { text: "Secondary label ready to print", type: "success" },
              scanResult?.sds_url
                ? { text: "Safety Data Sheet linked automatically", type: "success" }
                : {
                    text: "SDS not found — upload or search manufacturer portal",
                    type: "warning",
                    link: scanResult?.manufacturer_sds_portal || scanResult?.sds_lookup_result?.manufacturer_sds_portal || null,
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
                <div>
                  <span
                    className={`text-sm font-medium ${
                      item.type === "success" ? "text-white" : "text-amber-400"
                    }`}
                  >
                    {item.text}
                  </span>
                  {"link" in item && item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-amber-400/70 hover:text-amber-300 mt-0.5 transition-colors"
                    >
                      Open manufacturer portal &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {returnTo === "setup" ? (
            <div className="w-full max-w-full md:max-w-sm space-y-3">
              <Link
                href="/setup?step=3"
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold min-h-[48px] py-3.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Setup
              </Link>
              <button
                onClick={resetToCapture}
                className="flex items-center justify-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors"
              >
                <Camera className="h-5 w-5 text-amber-400" />
                Scan Another
              </button>
            </div>
          ) : (
            <div className="w-full max-w-full md:max-w-sm grid grid-cols-2 gap-3">
              <button
                onClick={resetToCapture}
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Camera className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Scan Another</span>
              </button>
              <Link
                href="/labels"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Printer className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Print Label</span>
              </Link>
              <Link
                href="/inventory"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Package className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">View Inventory</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <LayoutDashboard className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: MANUAL ENTRY FORM ───────────────────────── */}
      {step === "manual" && (
        <div className="min-h-screen pb-32 scan-fade-in">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-navy-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
            <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-amber-400" />
                <span className="font-display font-bold text-sm">Enter Chemical Manually</span>
              </div>
              <button
                onClick={resetToCapture}
                className="text-xs text-gray-400 hover:text-white transition-colors min-h-[44px] md:min-h-0"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Product Name */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={manualProductName}
                onChange={(e) => setManualProductName(e.target.value)}
                placeholder="e.g. CRC Brakleen Brake Parts Cleaner"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-lg font-display font-bold text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Manufacturer
              </label>
              <input
                type="text"
                value={manualManufacturer}
                onChange={(e) => setManualManufacturer(e.target.value)}
                placeholder="e.g. CRC Industries"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            {/* Signal Word */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Signal Word
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  { value: "DANGER" as const, color: "bg-red-500/20 border-red-500/40 text-red-400", activeColor: "bg-red-500 border-red-500 text-white" },
                  { value: "WARNING" as const, color: "bg-amber-500/20 border-amber-500/40 text-amber-400", activeColor: "bg-amber-500 border-amber-500 text-navy-950" },
                  { value: null, label: "I Don't Know", color: "bg-white/[0.04] border-white/10 text-gray-400", activeColor: "bg-white/10 border-white/30 text-white" },
                ] as const).map((opt) => {
                  const isActive = manualSignalWord === opt.value;
                  return (
                    <button
                      key={opt.value ?? "unknown"}
                      onClick={() => setManualSignalWord(opt.value)}
                      className={`min-h-[48px] py-3 rounded-xl border-2 text-sm font-bold uppercase tracking-wider transition-all ${
                        isActive ? ("activeColor" in opt ? opt.activeColor : "") : ("color" in opt ? opt.color : "")
                      }`}
                    >
                      {"label" in opt ? opt.label : opt.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hazard Types with GHS pictograms */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Hazard Types (check what applies)
              </label>
              <div className="space-y-2">
                {HAZARD_TYPES.map((ht) => {
                  const isChecked = manualHazardCodes.has(ht.code);
                  return (
                    <button
                      key={ht.code}
                      onClick={() => {
                        setManualDontKnowHazards(false);
                        const next = new Set(manualHazardCodes);
                        if (isChecked) next.delete(ht.code);
                        else next.add(ht.code);
                        setManualHazardCodes(next);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isChecked
                          ? "border-amber-500/60 bg-amber-500/10"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isChecked ? "bg-amber-500 border-amber-500" : "border-gray-500"
                      }`}>
                        {isChecked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <GHSPictogram code={ht.code} size={32} />
                      <span className={`text-sm font-medium ${isChecked ? "text-white" : "text-gray-300"}`}>
                        {ht.label}
                      </span>
                    </button>
                  );
                })}
                {/* I Don't Know option */}
                <button
                  onClick={() => {
                    setManualDontKnowHazards(!manualDontKnowHazards);
                    if (!manualDontKnowHazards) setManualHazardCodes(new Set());
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    manualDontKnowHazards
                      ? "border-gray-400/60 bg-gray-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    manualDontKnowHazards ? "bg-gray-500 border-gray-500" : "border-gray-500"
                  }`}>
                    {manualDontKnowHazards && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <AlertTriangle className="h-6 w-6 text-gray-500 flex-shrink-0" />
                  <span className={`text-sm font-medium ${manualDontKnowHazards ? "text-white" : "text-gray-400"}`}>
                    I Don&apos;t Know / Not Sure
                  </span>
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Storage Location
              </label>
              {!manualShowNewLoc ? (
                <select
                  value={manualLocation}
                  onChange={(e) => {
                    if (e.target.value === "__new__") setManualShowNewLoc(true);
                    else setManualLocation(e.target.value);
                  }}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                  <option value="__new__">+ Add New Location</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={manualNewLocName}
                      onChange={(e) => setManualNewLocName(e.target.value)}
                      placeholder="New location name..."
                      className="w-full pl-8 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => { setManualShowNewLoc(false); setManualNewLocName(""); }}
                    className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Container Type + Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Container Type
                </label>
                <select
                  value={manualContainerType}
                  onChange={(e) => setManualContainerType(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {CONTAINER_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Original Container Toggle */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Original Container?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setManualOriginalContainer(true)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                    manualOriginalContainer
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]"
                  }`}
                >
                  Yes, original container
                </button>
                <button
                  type="button"
                  onClick={() => setManualOriginalContainer(false)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                    !manualOriginalContainer
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]"
                  }`}
                >
                  No, transferred
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Notes
              </label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Any other info about this chemical (where you bought it, what you use it for, etc.)"
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Fixed bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-navy-950/90 backdrop-blur-xl border-t border-white/5 px-4 py-4">
            <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row gap-3">
              <button
                onClick={resetToCapture}
                className="w-full md:flex-1 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors hover:bg-white/[0.1]"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSearch}
                disabled={!manualProductName.trim()}
                className="w-full md:flex-[2] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-navy-950 font-bold min-h-[48px] py-3 rounded-xl transition-colors"
              >
                Save Chemical
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: MANUAL SEARCHING ────────────────────────── */}
      {step === "manual-searching" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 scan-fade-in">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-amber-400 mx-auto mb-6 animate-spin" />
            <h2 className="text-lg font-display font-bold mb-2">Searching for SDS...</h2>
            <p className="text-sm text-gray-400 w-full max-w-xs mx-auto">
              Checking our database for verified safety data for &ldquo;{manualProductName}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: MANUAL MERGE PROMPT ─────────────────────── */}
      {step === "manual-merge" && verifiedMatch && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 scan-fade-in">
          <div className="w-full max-w-full md:max-w-md">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Merge className="h-6 w-6 text-green-400" />
              <h2 className="text-lg font-display font-bold">We Found Verified Data!</h2>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
                Verified Match
              </p>
              <p className="text-base font-bold text-white mb-1">{manualProductName}</p>
              {manualManufacturer && (
                <p className="text-sm text-gray-400 mb-3">{manualManufacturer}</p>
              )}
              {verifiedMatch.sds_url && (
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">SDS found and will be linked</span>
                </div>
              )}
              <p className="text-xs text-gray-400">
                Confidence: {Math.round(verifiedMatch.confidence * 100)}% | Source: {verifiedMatch.source === "supabase" ? "ShieldSDS Database" : "Web Search"}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => saveManualEntry(true, verifiedMatch)}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-navy-950 font-bold min-h-[48px] py-3.5 rounded-xl transition-colors"
              >
                <Check className="h-5 w-5" />
                Use Verified Data
              </button>
              <button
                onClick={() => saveManualEntry(false, null)}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors hover:bg-white/[0.1]"
              >
                <StickyNote className="h-4 w-4" />
                Keep My Entry As-Is
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: MANUAL SUCCESS CASCADE ──────────────────── */}
      {step === "manual-success" && (
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
          <div className="w-full max-w-full md:max-w-sm space-y-3 mb-10">
            {[
              { text: "Chemical added to inventory", type: "success" },
              manualSavedData?.verified
                ? { text: "Hazard classification verified", type: "success" }
                : manualHazardCodes.size > 0
                  ? { text: "Hazard classification (manual — review recommended)", type: "warning" }
                  : { text: "Hazard classification unknown — update when SDS is found", type: "warning" },
              manualSavedData?.sdsFound
                ? { text: "Safety Data Sheet linked automatically", type: "success" }
                : { text: "SDS not found — upload or search manufacturer portal", type: "warning" },
              { text: "Label ready to print", type: "success" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  manualSuccessItems.includes(i)
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
                <span className={`text-sm font-medium ${item.type === "success" ? "text-white" : "text-amber-400"}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {returnTo === "setup" ? (
            <div className="w-full max-w-full md:max-w-sm space-y-3">
              <Link
                href="/setup?step=3"
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold min-h-[48px] py-3.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Setup
              </Link>
              <button
                onClick={() => {
                  setManualProductName("");
                  setManualManufacturer("");
                  setManualSignalWord(null);
                  setManualHazardCodes(new Set());
                  setManualDontKnowHazards(false);
                  setManualContainerType("Spray Can");
                  setManualQuantity(1);
                  setManualNotes("");
                  setVerifiedMatch(null);
                  setManualSearchError(null);
                  setManualSuccessItems([]);
                  setManualSavedData(null);
                  const locs = getLocations();
                  setLocations(locs);
                  setManualLocation(locs[0]?.name ?? "");
                  setStep("manual");
                }}
                className="flex items-center justify-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold min-h-[48px] py-3 rounded-xl transition-colors"
              >
                <Pencil className="h-5 w-5 text-amber-400" />
                Add Another
              </button>
            </div>
          ) : (
            <div className="w-full max-w-full md:max-w-sm grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setManualProductName("");
                  setManualManufacturer("");
                  setManualSignalWord(null);
                  setManualHazardCodes(new Set());
                  setManualDontKnowHazards(false);
                  setManualContainerType("Spray Can");
                  setManualQuantity(1);
                  setManualNotes("");
                  setVerifiedMatch(null);
                  setManualSearchError(null);
                  setManualSuccessItems([]);
                  setManualSavedData(null);
                  const locs = getLocations();
                  setLocations(locs);
                  setManualLocation(locs[0]?.name ?? "");
                  setStep("manual");
                }}
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Pencil className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Add Another</span>
              </button>
              <Link
                href="/labels"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Printer className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Print Label</span>
              </Link>
              <Link
                href="/inventory"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <Package className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">View Inventory</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 min-h-[56px] py-5 rounded-xl transition-colors"
              >
                <LayoutDashboard className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-semibold">Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanPageInner />
    </Suspense>
  );
}
