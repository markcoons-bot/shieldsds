"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Shield,
  Search,
  X,
  Camera,
  ClipboardList,
  GraduationCap,
  Database,
  Building2,
  RefreshCw,
} from "lucide-react";
import SDSSearchCard from "@/components/SDSSearchCard";
import type { SDSRecord } from "@/lib/supabase";
import { addChemical } from "@/lib/chemicals";
import { initializeStore } from "@/lib/chemicals";

// ── Access control toggle ────────────────────────────────────────────────────
const IS_PAID_USER = false;

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

export default function SDSSearchPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [results, setResults] = useState<SDSRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [industryCount, setIndustryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Initialize localStorage store for addChemical
  useEffect(() => {
    initializeStore();
  }, []);

  // Fetch total count on mount
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("sds_database")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => {
        if (count !== null) setTotalCount(count);
      });
    // Count unique industries
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
          q = q.or(
            `product_name.ilike.%${term}%,manufacturer.ilike.%${term}%`
          );
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

  // Debounced search on query/industry change
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
    const cleaned = term.replace(/ SDS$/i, "");
    setQuery(cleaned);
  }

  function handleAddToInventory(chemical: SDSRecord) {
    const hazardStatements = (chemical.hazard_statements || []).map((h) => {
      const match = h.match(/^(H\d+)\s*[-–—:]\s*(.+)$/);
      return match ? { code: match[1], text: match[2] } : { code: "", text: h };
    });
    addChemical({
      product_name: chemical.product_name,
      manufacturer: chemical.manufacturer || "Unknown",
      cas_numbers: chemical.cas_numbers || [],
      un_number: chemical.un_number || null,
      signal_word: (chemical.signal_word?.toUpperCase() as "DANGER" | "WARNING" | null) || null,
      pictogram_codes: chemical.pictogram_codes || [],
      hazard_statements: hazardStatements,
      precautionary_statements: { prevention: [], response: [], storage: [], disposal: [] },
      first_aid: { eyes: null, skin: null, inhalation: null, ingestion: null },
      ppe_required: { eyes: null, hands: null, respiratory: null, body: null },
      storage_requirements: "",
      incompatible_materials: [],
      physical_properties: { appearance: null, odor: null, flash_point: null, ph: null, boiling_point: null, vapor_pressure: null },
      nfpa_diamond: null,
      location: "Unassigned",
      container_type: "Original",
      container_count: 1,
      labeled: false,
      label_printed_date: null,
      sds_url: chemical.sds_url || null,
      sds_uploaded: !!chemical.sds_url,
      sds_date: chemical.sds_url ? new Date().toISOString().split("T")[0] : null,
      sds_status: chemical.sds_url ? "current" : "missing",
      added_date: new Date().toISOString().split("T")[0],
      added_by: "SDS Search",
      added_method: "import",
      scan_image_url: null,
      scan_confidence: null,
      last_updated: new Date().toISOString().split("T")[0],
    });
    alert(`${chemical.product_name} added to your inventory!`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="h-7 w-7 text-amber-500 transition-transform group-hover:scale-110" />
            <span className="font-black text-lg text-gray-900">
              Shield<span className="text-amber-500">SDS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              className="bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
            Search Our Safety Data Sheet Library
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Instant access to SDS documents, GHS hazard data, and compliance
            info for hundreds of workplace chemicals.
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
            <p className="text-sm text-gray-500 mb-6">
              Found <strong className="text-gray-900">{results.length}</strong>{" "}
              chemical{results.length !== 1 ? "s" : ""}{" "}
              {query.trim() ? <>matching &quot;{query.trim()}&quot;</> : ""}
              {industry ? ` in ${industry.replace(/-/g, " ")}` : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((chem) => (
                <SDSSearchCard
                  key={chem.id}
                  chemical={chem}
                  isPaidUser={IS_PAID_USER}
                  onUnlockClick={() => setShowCTA(true)}
                  onAddToInventory={IS_PAID_USER ? handleAddToInventory : undefined}
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
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Camera className="h-4 w-4" />
                Try Snap to Compliance
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

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-navy-900 text-gray-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About */}
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

            {/* Popular Searches */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Popular Searches
              </h4>
              <ul className="space-y-2">
                {POPULAR_SEARCHES.slice(0, 6).map((term) => (
                  <li key={term}>
                    <button
                      onClick={() => {
                        handlePopularSearch(term);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-sm hover:text-amber-400 transition-colors"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Industries We Serve
              </h4>
              <ul className="space-y-2 text-sm">
                <li>Auto Body & Collision</li>
                <li>Construction & Trades</li>
                <li>Manufacturing</li>
                <li>Restaurants & Food Service</li>
                <li>Janitorial & Cleaning</li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                ShieldSDS
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Get Started Free
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

      {/* ── Unlock CTA Modal ──────────────────────────────────────── */}
      {showCTA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCTA(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in">
            <button
              onClick={() => setShowCTA(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <Shield className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900">
                Get Full Access to Our SDS Library
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                ShieldSDS gives you instant access to Safety Data Sheets, GHS
                hazard data, compliant labels, and employee training — everything
                you need for OSHA compliance.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Scan any chemical label with your phone
                  </p>
                  <p className="text-xs text-gray-500">
                    AI-powered label recognition extracts all GHS data instantly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Instant SDS lookup for hundreds of chemicals
                  </p>
                  <p className="text-xs text-gray-500">
                    Direct links to official Safety Data Sheets from manufacturers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Interactive employee training with certificates
                  </p>
                  <p className="text-xs text-gray-500">
                    7-module HazCom training with quizzes and completion tracking
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="block w-full bg-amber-500 hover:bg-amber-400 text-navy-950 text-center font-bold py-3 rounded-xl transition-colors text-base"
            >
              Start Free Trial →
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              No credit card required. Set up in 5 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
