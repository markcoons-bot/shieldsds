"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Shield,
  Search,
  X,
  ArrowLeft,
  Database,
  Building2,
  RefreshCw,
  ListChecks,
  Check,
  Package,
  Tags,
  Loader2,
  Camera,
  Hammer,
  Utensils,
  SprayCan,
  Wrench,
  Factory,
} from "lucide-react";
import SDSSearchCard from "@/components/SDSSearchCard";
import type { SDSRecord } from "@/lib/supabase";
import {
  addChemical,
  getChemicals,
  getLocations,
  addLocation,
  initializeStore,
} from "@/lib/chemicals";
import type { Chemical } from "@/lib/types";

// ── Supabase client (client-side, anon key) ──────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ── Industry filters ─────────────────────────────────────────────────────────
const INDUSTRIES = [
  { label: "All", value: "" },
  { label: "Auto Body", value: "auto-body" },
  { label: "Construction", value: "construction" },
  { label: "Janitorial", value: "janitorial" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Automotive", value: "automotive" },
  { label: "General", value: "general" },
];

const QUICK_START = [
  { label: "Auto Body Shop Essentials", value: "auto-body", icon: SprayCan },
  { label: "Construction Basics", value: "construction", icon: Hammer },
  { label: "Janitorial & Cleaning", value: "janitorial", icon: SprayCan },
  { label: "Restaurant & Food Service", value: "restaurant", icon: Utensils },
  { label: "Manufacturing", value: "manufacturing", icon: Factory },
  { label: "Automotive", value: "automotive", icon: Wrench },
];

const POPULAR_SEARCHES = [
  "CRC Brakleen SDS",
  "Simple Green SDS",
  "Acetone SDS",
  "Rust-Oleum SDS",
  "WD-40 SDS",
  "Gorilla Glue SDS",
  "Clorox Bleach SDS",
  "3M Adhesive SDS",
];

function mapToChemical(
  chem: SDSRecord,
  location: string,
  containerType: string,
  quantity: number
): Omit<Chemical, "id"> {
  const hazardStatements = (chem.hazard_statements || []).map((h) => {
    const match = h.match(/^(H\d+)\s*[-–—:]\s*(.+)$/);
    return match ? { code: match[1], text: match[2] } : { code: "", text: h };
  });
  const today = new Date().toISOString().split("T")[0];
  return {
    product_name: chem.product_name,
    manufacturer: chem.manufacturer || "Unknown",
    cas_numbers: chem.cas_numbers || [],
    un_number: chem.un_number || null,
    signal_word: (chem.signal_word?.toUpperCase() as "DANGER" | "WARNING" | null) || null,
    pictogram_codes: chem.pictogram_codes || [],
    hazard_statements: hazardStatements,
    precautionary_statements: { prevention: [], response: [], storage: [], disposal: [] },
    first_aid: { eyes: null, skin: null, inhalation: null, ingestion: null },
    ppe_required: { eyes: null, hands: null, respiratory: null, body: null },
    storage_requirements: "",
    incompatible_materials: [],
    physical_properties: { appearance: null, odor: null, flash_point: null, ph: null, boiling_point: null, vapor_pressure: null },
    nfpa_diamond: null,
    location,
    container_type: containerType,
    container_count: quantity,
    labeled: false,
    label_printed_date: null,
    sds_url: chem.sds_url || null,
    sds_uploaded: !!chem.sds_url,
    sds_date: chem.sds_url ? today : null,
    sds_status: chem.sds_url ? "current" : "missing",
    added_date: today,
    added_by: "SDS Search",
    added_method: "import",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: today,
  };
}

export default function SDSSearchPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [results, setResults] = useState<SDSRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [industryCount, setIndustryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Inventory tracking
  const [inventoryNames, setInventoryNames] = useState<Set<string>>(new Set());
  const [inventorySize, setInventorySize] = useState(0);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkLocation, setBulkLocation] = useState("");
  const [bulkContainer, setBulkContainer] = useState("Spray Can");
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkDone, setBulkDone] = useState(false);
  const [showNewBulkLoc, setShowNewBulkLoc] = useState(false);
  const [newBulkLocName, setNewBulkLocName] = useState("");

  // Initialize
  useEffect(() => {
    initializeStore();
    refreshInventory();
  }, []);

  function refreshInventory() {
    const chems = getChemicals();
    setInventoryNames(new Set(chems.map((c) => c.product_name.toLowerCase())));
    setInventorySize(chems.length);
    const locs = getLocations();
    setLocations(locs.map((l) => ({ id: l.id, name: l.name })));
    if (locs.length > 0 && !bulkLocation) setBulkLocation(locs[0].name);
  }

  // Fetch total count on mount
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("sds_database")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => {
        if (count !== null) setTotalCount(count);
      });
    supabase
      .from("sds_database")
      .select("industry_tags")
      .then(({ data }) => {
        if (data) {
          const tags = new Set<string>();
          data.forEach((r) => {
            if (r.industry_tags) r.industry_tags.forEach((t: string) => tags.add(t));
          });
          setIndustryCount(tags.size);
        }
      });
  }, []);

  const doSearch = useCallback(
    async (searchQuery: string, industryFilter: string) => {
      if (!supabase) return;
      setLoading(true);
      setHasSearched(true);

      try {
        let q = supabase.from("sds_database").select("*");

        if (searchQuery.trim()) {
          const term = searchQuery.trim().replace(/[%_]/g, "");
          q = q.or(`product_name.ilike.%${term}%,manufacturer.ilike.%${term}%`);
        }

        if (industryFilter) {
          q = q.contains("industry_tags", [industryFilter]);
        }

        q = q.order("confidence", { ascending: false }).limit(50);

        const { data, error } = await q;
        if (error) {
          console.error("[sds-search] Query error:", error.message);
          setResults([]);
        } else {
          setResults((data as SDSRecord[]) || []);
        }
      } catch (err) {
        console.error("[sds-search] Error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim() && !industry) {
      if (hasSearched) {
        setResults([]);
        setHasSearched(false);
      }
      return;
    }

    searchTimeout.current = setTimeout(() => {
      doSearch(query, industry);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, industry, doSearch, hasSearched]);

  function handlePopularSearch(term: string) {
    setQuery(term.replace(/ SDS$/i, ""));
  }

  function handleAddSingle(chem: SDSRecord, location: string, containerType: string, quantity: number) {
    addChemical(mapToChemical(chem, location, containerType, quantity));
    refreshInventory();
  }

  function handleAddLocation(name: string) {
    const loc = addLocation({ name, chemical_ids: [] });
    refreshInventory();
    return { id: loc.id, name: loc.name };
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAdd() {
    let loc = bulkLocation;
    if (showNewBulkLoc && newBulkLocName.trim()) {
      const created = handleAddLocation(newBulkLocName.trim());
      loc = created.name;
    }
    const toAdd = results.filter(
      (r) => selected.has(r.id) && !inventoryNames.has(r.product_name.toLowerCase())
    );
    setBulkAdding(true);
    setBulkProgress({ current: 0, total: toAdd.length });

    for (let i = 0; i < toAdd.length; i++) {
      addChemical(mapToChemical(toAdd[i], loc, bulkContainer, 1));
      setBulkProgress({ current: i + 1, total: toAdd.length });
      // Brief pause for UI update
      await new Promise((r) => setTimeout(r, 50));
    }

    refreshInventory();
    setBulkAdding(false);
    setBulkDone(true);
    setSelected(new Set());
    setShowBulkForm(false);
  }

  const selectedCount = selected.size;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <Link href="/" className="flex items-center gap-2 group">
              <Shield className="h-6 w-6 text-amber-500 transition-transform group-hover:scale-110" />
              <span className="font-black text-base text-gray-900">
                Shield<span className="text-amber-500">SDS</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/inventory" className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Inventory ({inventorySize})
            </Link>
            <Link href="/labels" className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:flex items-center gap-1.5">
              <Tags className="h-4 w-4" />
              Labels
            </Link>
          </div>
        </div>
      </header>

      {/* ── Build Your Inventory Guide (show when < 5 chemicals) ── */}
      {inventorySize < 5 && !hasSearched && (
        <section className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Build Your Chemical Inventory
              </h2>
              <p className="text-sm text-gray-600 mt-1 max-w-lg mx-auto">
                Browse our database and add the chemicals you use. Click &quot;Add
                to My Chemicals&quot; on any product — we&apos;ll handle the SDS,
                hazard data, and labels.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_START.map((qs) => {
                const Icon = qs.icon;
                return (
                  <button
                    key={qs.value}
                    onClick={() => { setIndustry(qs.value); setQuery(""); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-300 hover:border-amber-500 rounded-lg text-sm font-medium text-gray-800 hover:text-amber-800 transition-colors shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-amber-600" />
                    {qs.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
            Browse &amp; Add Chemicals
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Search our SDS database and add chemicals to your inventory with one click.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name or manufacturer..."
              className="w-full pl-12 pr-10 py-4 rounded-xl text-gray-900 text-base sm:text-lg bg-white border-2 border-transparent focus:border-amber-400 focus:outline-none shadow-lg placeholder:text-gray-400"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Industry Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.value}
                onClick={() => setIndustry(industry === ind.value ? "" : ind.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  industry === ind.value
                    ? "bg-amber-500 text-navy-950"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-center gap-6 sm:gap-10 text-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Database className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              {totalCount !== null ? (
                <><strong className="text-gray-900">{totalCount}</strong> chemicals in our database</>
              ) : (
                "Loading..."
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              <strong className="text-gray-900">{industryCount || 7}</strong> industries covered
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Updated daily</span>
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 mt-3">Searching...</p>
          </div>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <>
            {/* Results header + bulk toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <p className="text-sm text-gray-500">
                Found <strong className="text-gray-900">{results.length}</strong>{" "}
                chemical{results.length !== 1 ? "s" : ""}{" "}
                {query.trim() ? <>matching &quot;{query.trim()}&quot;</> : ""}
                {industry ? ` in ${industry.replace(/-/g, " ")}` : ""}
              </p>
              <button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelected(new Set());
                  setBulkDone(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  bulkMode
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ListChecks className="h-4 w-4" />
                {bulkMode ? "Cancel Multi-Select" : "Select Multiple"}
              </button>
            </div>

            {/* Bulk done message */}
            {bulkDone && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Check className="h-5 w-5" />
                  {bulkProgress.total} chemical{bulkProgress.total !== 1 ? "s" : ""} added to your inventory!
                </div>
                <div className="flex gap-2 sm:ml-auto">
                  <Link href="/inventory" className="text-sm text-green-700 underline hover:text-green-900">
                    View Inventory
                  </Link>
                  <Link href="/labels" className="text-sm text-green-700 underline hover:text-green-900">
                    Print Labels
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((chem) => (
                <SDSSearchCard
                  key={chem.id}
                  chemical={chem}
                  isInInventory={inventoryNames.has(chem.product_name.toLowerCase())}
                  locations={locations}
                  onAdd={handleAddSingle}
                  onAddLocation={handleAddLocation}
                  selectable={bulkMode}
                  selected={selected.has(chem.id)}
                  onToggleSelect={() => toggleSelect(chem.id)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No chemicals found
            </h3>
            <p className="text-gray-500 mb-6">
              Try a different search term or select a different industry.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Can&apos;t find what you need?
              </p>
              <p className="text-sm text-amber-700 mb-4">
                Our AI can find any SDS instantly — scan a label or search by name.
              </p>
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Camera className="h-4 w-4" />
                Snap to Compliance
              </Link>
            </div>
          </div>
        )}

        {/* Default state — no search yet */}
        {!loading && !hasSearched && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-6">
              Start typing to search, or click an industry filter above.
            </p>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Popular Searches
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Bulk Select Bottom Bar ────────────────────────────────── */}
      {bulkMode && selectedCount > 0 && !showBulkForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              <strong className="text-amber-600">{selectedCount}</strong> chemical{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <button
              onClick={() => setShowBulkForm(true)}
              className="bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              Add Selected to Inventory →
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Add Modal ────────────────────────────────────────── */}
      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !bulkAdding && setShowBulkForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {bulkAdding ? (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  Adding chemical {bulkProgress.current} of {bulkProgress.total}...
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowBulkForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Add {selectedCount} Chemical{selectedCount !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  Choose a location and container type. You can update individual details later in Inventory.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
                    {!showNewBulkLoc ? (
                      <select
                        value={bulkLocation}
                        onChange={(e) => {
                          if (e.target.value === "__new__") setShowNewBulkLoc(true);
                          else setBulkLocation(e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.name} className="text-gray-900">{l.name}</option>
                        ))}
                        <option value="__new__" className="text-gray-900">+ Add New Location</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBulkLocName}
                          onChange={(e) => setNewBulkLocName(e.target.value)}
                          placeholder="New location name..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => { setShowNewBulkLoc(false); setNewBulkLocName(""); }} className="text-xs text-gray-500 hover:text-gray-700 px-2">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Container Type</label>
                    <select
                      value={bulkContainer}
                      onChange={(e) => setBulkContainer(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none"
                    >
                      {["Spray Can", "Bottle", "Jug", "Drum", "Tube", "Bucket", "Bag", "Box", "Aerosol Can", "Other"].map((ct) => (
                        <option key={ct} value={ct} className="text-gray-900">{ct}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleBulkAdd}
                    disabled={showNewBulkLoc && !newBulkLocName.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-navy-950 font-bold py-3 rounded-xl transition-colors"
                  >
                    Add {selectedCount} Chemical{selectedCount !== 1 ? "s" : ""} →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-navy-900 text-gray-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-amber-400" />
                <span className="font-black text-white">
                  Shield<span className="text-amber-400">SDS</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                OSHA HazCom compliance made simple. Manage Safety Data Sheets,
                print GHS labels, track employee training, and pass inspections
                — all from one platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Popular Searches</h4>
              <ul className="space-y-2">
                {POPULAR_SEARCHES.slice(0, 6).map((term) => (
                  <li key={term}>
                    <button
                      onClick={() => { handlePopularSearch(term); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="text-sm hover:text-amber-400 transition-colors"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Industries We Serve</h4>
              <ul className="space-y-2 text-sm">
                <li>Auto Body & Collision</li>
                <li>Construction & Trades</li>
                <li>Manufacturing</li>
                <li>Restaurants & Food Service</li>
                <li>Janitorial & Cleaning</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">ShieldSDS</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-amber-400 transition-colors">About</a></li>
                <li><a href="#" className="text-sm hover:text-amber-400 transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                <li>
                  <Link href="/dashboard" className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    Go to Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700/50 mt-8 pt-6 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ShieldSDS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
