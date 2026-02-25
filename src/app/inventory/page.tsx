"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { getChemicals, initializeStore } from "@/lib/chemicals";
import type { Chemical } from "@/lib/types";
import {
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FlaskConical,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  Package,
  Tags,
  ShieldCheck,
  Plus,
  Camera,
} from "lucide-react";

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-status-green/15 border border-status-green/30 text-status-green px-5 py-3 rounded-xl shadow-lg">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-white transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Sort Helper ──────────────────────────────────────────────────────────────

type SortField = "product" | "location" | "containers" | null;
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = currentField === field;
  return (
    <th
      className={`py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [toast, setToast] = useState<string | null>(null);

  // Load chemicals from store on mount
  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const totalChemicals = chemicals.length;
    const totalContainers = chemicals.reduce((sum, c) => sum + c.container_count, 0);
    const labeledContainers = chemicals.filter((c) => c.labeled).reduce((sum, c) => sum + c.container_count, 0);
    const withSds = chemicals.filter((c) => c.sds_status === "current").length;
    const addedThisMonth = chemicals.filter((c) => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      return c.added_date.startsWith(`${y}-${m}`);
    }).length;
    return {
      totalChemicals,
      totalContainers,
      labeledPct: totalContainers > 0 ? Math.round((labeledContainers / totalContainers) * 100) : 100,
      sdsPct: totalChemicals > 0 ? Math.round((withSds / totalChemicals) * 100) : 100,
      addedThisMonth,
    };
  }, [chemicals]);

  // Build location cards dynamically by grouping chemicals by location
  const locationCards = useMemo(() => {
    const locMap = new Map<string, Chemical[]>();
    for (const c of chemicals) {
      const loc = c.location || "Unknown";
      if (!locMap.has(loc)) locMap.set(loc, []);
      locMap.get(loc)!.push(c);
    }
    return Array.from(locMap.entries())
      .map(([name, chems]) => ({
        name,
        chemicals: chems.length,
        totalContainers: chems.reduce((s, c) => s + c.container_count, 0),
        labeled: chems.filter((c) => c.labeled).reduce((s, c) => s + c.container_count, 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [chemicals]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = chemicals.filter((c) => {
      const matchesSearch =
        !q ||
        c.product_name.toLowerCase().includes(q) ||
        c.manufacturer.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.container_type.toLowerCase().includes(q);
      const matchesLocation = !selectedLocation || c.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === "product") cmp = a.product_name.localeCompare(b.product_name);
        else if (sortField === "location") cmp = a.location.localeCompare(b.location);
        else if (sortField === "containers") cmp = a.container_count - b.container_count;
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return result;
  }, [search, selectedLocation, chemicals, sortField, sortDir]);

  // Empty state
  if (chemicals.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <Package className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No chemicals in inventory</h2>
          <p className="text-gray-400 mb-6">Scan your first product to get started.</p>
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

  // Suppress unused var warning for showToast since it's used by toast display
  void showToast;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Chemical Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            {chemicals.length} chemicals &middot; {stats.totalContainers} containers across {locationCards.length} storage areas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/scan"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Chemical
          </Link>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Chemicals", value: stats.totalChemicals, icon: FlaskConical, color: "text-blue-400" },
          { label: "Total Containers", value: stats.totalContainers, icon: Package, color: "text-purple-400" },
          { label: "% Labeled", value: `${stats.labeledPct}%`, icon: Tags, color: stats.labeledPct === 100 ? "text-status-green" : "text-status-amber" },
          { label: "% with Current SDS", value: `${stats.sdsPct}%`, icon: ShieldCheck, color: stats.sdsPct === 100 ? "text-status-green" : "text-status-amber" },
          { label: "Added This Month", value: stats.addedThisMonth, icon: Plus, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Location Cards */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Storage Locations</h2>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {/* All Locations card */}
          <button
            onClick={() => setSelectedLocation(null)}
            className={`bg-navy-900 border rounded-xl p-4 transition-colors text-left ${
              selectedLocation === null
                ? "border-amber-500 ring-1 ring-amber-500/30"
                : "border-navy-700/50 hover:border-navy-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-white">All Locations</span>
            </div>
            <p className="text-lg font-display font-bold text-white">{chemicals.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalContainers} containers
            </p>
          </button>
          {locationCards.map((loc) => {
            const allLabeled = loc.labeled === loc.totalContainers;
            const isSelected = selectedLocation === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => setSelectedLocation(isSelected ? null : loc.name)}
                className={`bg-navy-900 border rounded-xl p-4 transition-colors text-left ${
                  isSelected
                    ? "border-amber-500 ring-1 ring-amber-500/30"
                    : "border-navy-700/50 hover:border-navy-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-white truncate">{loc.name}</span>
                </div>
                <p className="text-lg font-display font-bold text-white">{loc.chemicals}</p>
                <div className="flex items-center gap-1 mt-1">
                  {allLabeled ? (
                    <CheckCircle2 className="h-3 w-3 text-status-green" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-status-amber" />
                  )}
                  <span className={`text-xs ${allLabeled ? "text-status-green" : "text-status-amber"}`}>
                    {loc.labeled}/{loc.totalContainers} labeled
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {selectedLocation && (
          <button
            onClick={() => setSelectedLocation(null)}
            className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Clear filter — show all locations
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory by product, manufacturer, location, or container type..."
          className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-navy-700">
                <SortHeader label="Product" field="product" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manufacturer</th>
                <SortHeader label="Location" field="location" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Containers" field="containers" currentField={sortField} currentDir={sortDir} onSort={handleSort} className="text-center" />
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Labeled?</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SDS?</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-navy-700/30 hover:bg-navy-800/30 transition-colors ${
                    c.sds_status === "missing"
                      ? "border-l-2 border-l-status-red bg-status-red/5"
                      : !c.labeled
                      ? "border-l-2 border-l-status-amber bg-status-amber/5"
                      : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-white">{c.product_name}</span>
                    {c.added_method === "manual" && c.sds_status === "missing" && (
                      <span className="block text-[10px] text-amber-400 mt-0.5">Manually entered — SDS not verified</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{c.manufacturer}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{c.location}</td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-center">{c.container_count}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{c.container_type}</td>
                  <td className="py-3 px-4">
                    {c.labeled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-status-green">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-status-red">
                        <AlertTriangle className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {c.sds_status === "current" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-status-green">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Current
                      </span>
                    ) : c.sds_status === "expired" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-status-amber">
                        <AlertTriangle className="h-3.5 w-3.5" /> Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-status-red">
                        <AlertTriangle className="h-3.5 w-3.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {!c.labeled && (
                        <Link
                          href="/labels"
                          className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                          title="Print Label"
                        >
                          <Printer className="h-3 w-3" />
                        </Link>
                      )}
                      <Link
                        href="/sds-library"
                        className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                        title="View SDS"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                    No inventory items match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
