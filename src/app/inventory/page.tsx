"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  sdsEntries,
  inventoryItems as seedInventory,
  inventoryLocations,
} from "@/lib/data";
import type { InventoryItem } from "@/lib/data";
import {
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileText,
  FlaskConical,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  Eye,
  Mail,
  Package,
  Tags,
  ShieldCheck,
  Plus,
} from "lucide-react";
import HelpCard from "@/components/HelpCard";

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

// ─── Email Modal ──────────────────────────────────────────────────────────────

function EmailModal({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const sds = sdsEntries.find((s) => s.id === item.sdsId);
  const mfr = sds?.manufacturer ?? "Manufacturer";
  const phone = sds?.supplierPhone ?? "";
  const subject = encodeURIComponent(`SDS Request: ${item.product}`);
  const body = encodeURIComponent(
    `To whom it may concern,\n\nWe are requesting the current Safety Data Sheet (SDS) for:\n\nProduct: ${item.product}\nProduct Code: ${sds?.productCode ?? "N/A"}\n\nPlease send the SDS in PDF format to: mike@mikesautobody.com\n\nFacility: Mike's Auto Body\n1847 Pacific Coast Hwy, Long Beach, CA 90806\n\nThank you,\nMike Rodriguez\nOwner / Manager\n(562) 555-0147`
  );
  const mailto = `mailto:sds@${mfr.toLowerCase().replace(/[^a-z]/g, "")}.com?subject=${subject}&body=${body}`;

  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(decodeURIComponent(body));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h3 className="text-lg font-display font-bold text-white">Request SDS from {mfr}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-navy-800 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-line font-mono text-xs">
            {decodeURIComponent(body)}
          </div>
          {phone && (
            <p className="text-xs text-gray-400">Manufacturer phone: {phone}</p>
          )}
          <div className="flex gap-3">
            <a
              href={mailto}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4" />
              Open in Email
            </a>
            <button
              onClick={copyEmail}
              className="flex-1 flex items-center justify-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm py-2.5 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-status-green" />
                  Copied!
                </>
              ) : (
                <>Copy to Clipboard</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  item,
  onSave,
  onClose,
}: {
  item: InventoryItem;
  onSave: (updated: InventoryItem) => void;
  onClose: () => void;
}) {
  const [containers, setContainers] = useState(item.containers);
  const [location, setLocation] = useState(item.location);
  const [labeled, setLabeled] = useState(item.labeled);

  function handleSave() {
    onSave({ ...item, containers, location, labeled });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h3 className="text-lg font-display font-bold text-white">Edit: {item.product}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Containers</label>
            <input
              type="number"
              min={0}
              value={containers}
              onChange={(e) => setContainers(parseInt(e.target.value) || 0)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {inventoryLocations.map((loc) => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="labeled-check"
              checked={labeled}
              onChange={(e) => setLabeled(e.target.checked)}
              className="h-4 w-4 rounded border-navy-700 bg-navy-800 text-amber-500 focus:ring-amber-500/50"
            />
            <label htmlFor="labeled-check" className="text-sm text-white">Secondary container labeled</label>
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Chemical Modal ───────────────────────────────────────────────────────

function AddChemicalModal({
  onAdd,
  onClose,
  showToast,
}: {
  onAdd: (item: InventoryItem) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [product, setProduct] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [location, setLocation] = useState(inventoryLocations[0]?.name ?? "");
  const [containerType, setContainerType] = useState("Quart cans");
  const [containerCount, setContainerCount] = useState(1);

  function handleSubmit() {
    if (!product.trim() || !manufacturer.trim()) return;
    const newItem: InventoryItem = {
      id: `new-${Date.now()}`,
      product: product.trim(),
      sdsId: "",
      location,
      containers: containerCount,
      containerType,
      labeled: false,
      sds: false,
    };
    onAdd(newItem);
    showToast(`${product.trim()} added to inventory — SDS upload pending`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h3 className="text-lg font-display font-bold text-white">Add Chemical to Inventory</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Product Name <span className="text-status-red">*</span>
            </label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. 3M Super 77 Spray Adhesive"
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Manufacturer <span className="text-status-red">*</span>
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. 3M Company"
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Storage Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {inventoryLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Container Type</label>
              <input
                type="text"
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Container Count</label>
            <input
              type="number"
              min={1}
              value={containerCount}
              onChange={(e) => setContainerCount(parseInt(e.target.value) || 1)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Upload SDS (PDF)</label>
            <button
              onClick={() => {
                showToast("SDS file upload simulated — file received");
              }}
              className="w-full bg-navy-800 border border-navy-700 border-dashed rounded-lg px-3 py-6 text-sm text-gray-400 hover:text-white hover:border-navy-600 transition-colors"
            >
              <FileText className="h-6 w-6 mx-auto mb-1" />
              Click to select PDF file
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!product.trim() || !manufacturer.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Add to Inventory
          </button>
        </div>
      </div>
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
  const [localItems, setLocalItems] = useState<InventoryItem[]>([...seedInventory]);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [toast, setToast] = useState<string | null>(null);
  const [emailItem, setEmailItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const totalChemicals = localItems.length;
    const totalContainers = localItems.reduce((sum, i) => sum + i.containers, 0);
    const labeledContainers = localItems.filter((i) => i.labeled).reduce((sum, i) => sum + i.containers, 0);
    const withSds = localItems.filter((i) => i.sds).length;
    const thisMonth = localItems.filter((i) => {
      const sds = sdsEntries.find((s) => s.id === i.sdsId);
      if (!sds) return false;
      return sds.dateAdded.startsWith("2026-02");
    }).length;
    return {
      totalChemicals,
      totalContainers,
      labeledPct: totalContainers > 0 ? Math.round((labeledContainers / totalContainers) * 100) : 100,
      sdsPct: totalChemicals > 0 ? Math.round((withSds / totalChemicals) * 100) : 100,
      addedThisMonth: thisMonth,
    };
  }, [localItems]);

  // Location cards — recalculate from local items
  const locationCards = useMemo(() => {
    return inventoryLocations.map((loc) => {
      const items = localItems.filter((i) => i.location === loc.name);
      const total = items.reduce((sum, i) => sum + i.containers, 0);
      const labeled = items.filter((i) => i.labeled).reduce((sum, i) => sum + i.containers, 0);
      return { name: loc.name, chemicals: items.length, totalContainers: total, labeled };
    });
  }, [localItems]);

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
    let result = localItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.product.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.containerType.toLowerCase().includes(q);
      const matchesLocation = !selectedLocation || item.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === "product") cmp = a.product.localeCompare(b.product);
        else if (sortField === "location") cmp = a.location.localeCompare(b.location);
        else if (sortField === "containers") cmp = a.containers - b.containers;
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return result;
  }, [search, selectedLocation, localItems, sortField, sortDir]);

  function handleEditSave(updated: InventoryItem) {
    setLocalItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    showToast(`${updated.product} updated`);
  }

  function handleAddChemical(item: InventoryItem) {
    setLocalItems((prev) => [...prev, item]);
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {emailItem && <EmailModal item={emailItem} onClose={() => setEmailItem(null)} />}
      {editItem && <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}
      {showAddModal && (
        <AddChemicalModal
          onAdd={handleAddChemical}
          onClose={() => setShowAddModal(false)}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Chemical Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            {localItems.length} chemicals · {stats.totalContainers} containers across {inventoryLocations.length} storage areas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              const rows = localItems.map(function(item) {
                return "<div style=\"display:inline-block;width:1.5in;height:1.5in;border:1px dashed #ccc;margin:0.15in;padding:0.15in;text-align:center;font-family:system-ui;font-size:9px;page-break-inside:avoid;\">" +
                  "<div style=\"width:80px;height:80px;margin:0 auto 4px;border:2px solid #000;display:flex;align-items:center;justify-content:center;\">" +
                  "<svg viewBox=\"0 0 100 100\" width=\"60\" height=\"60\"><rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" fill=\"none\" stroke=\"#000\" stroke-width=\"3\"/><rect x=\"15\" y=\"15\" width=\"30\" height=\"30\" fill=\"#000\"/><rect x=\"55\" y=\"15\" width=\"30\" height=\"30\" fill=\"#000\"/><rect x=\"15\" y=\"55\" width=\"30\" height=\"30\" fill=\"#000\"/><rect x=\"60\" y=\"60\" width=\"10\" height=\"10\" fill=\"#000\"/><rect x=\"75\" y=\"60\" width=\"10\" height=\"10\" fill=\"#000\"/><rect x=\"60\" y=\"75\" width=\"10\" height=\"10\" fill=\"#000\"/></svg>" +
                  "</div><strong>" + item.product.substring(0, 30) + "</strong><br/>" + item.location + "</div>";
              }).join("");
              w.document.write("<html><head><title>QR Labels</title><style>@media print{body{margin:0}}</style></head><body>" + rows + "</body></html>");
              w.document.close();
              w.print();
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print QR Labels
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Chemical
          </button>
        </div>
      </div>

      <HelpCard>
        <p><strong className="text-white">Your chemical inventory is the backbone of your HazCom program.</strong> It must list every hazardous chemical present in each work area using a product identifier that matches the SDS.</p>
        <p><strong className="text-amber-400">What inspectors look for:</strong></p>
        <ul className="list-none space-y-1 ml-1">
          <li>• Does the list match what&apos;s actually on the shelves? (Walk your shop monthly to verify)</li>
          <li>• Are product identifiers consistent between the list, the SDS, and the labels?</li>
          <li>• Is the list current? (When did you last add or remove a chemical?)</li>
        </ul>
        <p><strong className="text-amber-400">Common mistakes:</strong></p>
        <ul className="list-none space-y-1 ml-1">
          <li>❌ Listing &quot;paint thinner&quot; instead of the specific product name and manufacturer</li>
          <li>❌ Having products on the shelf that aren&apos;t on the list (or vice versa)</li>
          <li>❌ Not updating when new products arrive or old ones are used up</li>
        </ul>
        <p>ShieldSDS tracks when chemicals are added and removed, creating an audit trail that proves your inventory is actively maintained.</p>
        <p className="text-amber-500/80 text-xs">[29 CFR 1910.1200(e)(1)(i)]</p>
      </HelpCard>

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
            <p className="text-lg font-display font-bold text-white">{localItems.length}</p>
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
          placeholder="Search inventory by product, location, or container type..."
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
              {filtered.map((item) => {
                const sds = sdsEntries.find((s) => s.id === item.sdsId);
                const manufacturer = sds?.manufacturer ?? "—";
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-navy-700/30 hover:bg-navy-800/30 transition-colors ${
                      !item.sds
                        ? "border-l-2 border-l-status-red bg-status-red/5"
                        : !item.labeled
                        ? "border-l-2 border-l-status-amber bg-status-amber/5"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-white">{item.product}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{manufacturer}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{item.location}</td>
                    <td className="py-3 px-4 text-sm text-gray-300 text-center">{item.containers}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{item.containerType}</td>
                    <td className="py-3 px-4">
                      {item.labeled ? (
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
                      {item.sds ? (
                        <span className="inline-flex items-center gap-1 text-xs text-status-green">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-status-red">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {!item.labeled && (
                          <Link
                            href={`/labels?sdsId=${item.sdsId}`}
                            className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                            title="Print Label"
                          >
                            <Printer className="h-3 w-3" />
                          </Link>
                        )}
                        {!item.sds && (
                          <button
                            onClick={() => setEmailItem(item)}
                            className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                            title="Request SDS"
                          >
                            <Mail className="h-3 w-3" />
                          </button>
                        )}
                        <Link
                          href={`/sds-library?id=${item.sdsId}`}
                          className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                          title="View SDS"
                        >
                          <Eye className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => setEditItem(item)}
                          className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
