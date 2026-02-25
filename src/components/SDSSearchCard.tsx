"use client";

import { useState } from "react";
import { ExternalLink, Plus, Check, ChevronDown, MapPin } from "lucide-react";
import GHSPictogram from "@/components/GHSPictogram";
import type { SDSRecord } from "@/lib/supabase";

const CONTAINER_TYPES = [
  "Spray Can",
  "Bottle",
  "Jug",
  "Drum",
  "Tube",
  "Bucket",
  "Bag",
  "Box",
  "Aerosol Can",
  "Other",
];

const TAG_COLORS: Record<string, string> = {
  "auto-body": "bg-blue-100 text-blue-700",
  construction: "bg-orange-100 text-orange-700",
  janitorial: "bg-green-100 text-green-700",
  manufacturing: "bg-purple-100 text-purple-700",
  restaurant: "bg-red-100 text-red-700",
  automotive: "bg-cyan-100 text-cyan-700",
  general: "bg-gray-100 text-gray-700",
};

interface SDSSearchCardProps {
  chemical: SDSRecord;
  isInInventory: boolean;
  locations: { id: string; name: string }[];
  onAdd: (chemical: SDSRecord, location: string, containerType: string, quantity: number) => void;
  onAddLocation: (name: string) => { id: string; name: string };
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function SDSSearchCard({
  chemical,
  isInInventory,
  locations,
  onAdd,
  onAddLocation,
  selectable,
  selected,
  onToggleSelect,
}: SDSSearchCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [added, setAdded] = useState(false);
  const [location, setLocation] = useState(locations[0]?.name || "");
  const [showNewLoc, setShowNewLoc] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [containerType, setContainerType] = useState("Spray Can");
  const [quantity, setQuantity] = useState(1);

  const signalColor =
    chemical.signal_word?.toLowerCase() === "danger"
      ? "bg-red-600 text-white"
      : chemical.signal_word?.toLowerCase() === "warning"
        ? "bg-amber-500 text-white"
        : "";

  function handleSubmit() {
    let loc = location;
    if (showNewLoc && newLocName.trim()) {
      const created = onAddLocation(newLocName.trim());
      loc = created.name;
    }
    onAdd(chemical, loc, containerType, quantity);
    setAdded(true);
    setShowForm(false);
  }

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-all ${
        added
          ? "border-green-300 bg-green-50/50"
          : selected
            ? "border-amber-400 ring-2 ring-amber-200"
            : "border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Selectable checkbox + Header */}
      <div className="flex items-start gap-3 mb-3">
        {selectable && (
          <button
            onClick={onToggleSelect}
            className={`mt-1 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-gray-300 hover:border-amber-400"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {chemical.product_name}
          </h3>
          {chemical.manufacturer && (
            <p className="text-sm text-gray-500 mt-0.5">{chemical.manufacturer}</p>
          )}
        </div>
        {chemical.signal_word && signalColor && (
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${signalColor}`}>
            {chemical.signal_word}
          </span>
        )}
      </div>

      {/* GHS Pictograms */}
      {chemical.pictogram_codes && chemical.pictogram_codes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chemical.pictogram_codes.map((code) => (
            <GHSPictogram key={code} code={code} size={40} />
          ))}
        </div>
      )}

      {/* Industry tags */}
      {chemical.industry_tags && chemical.industry_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chemical.industry_tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${TAG_COLORS[tag] || "bg-gray-100 text-gray-600"}`}
            >
              {tag.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Hazard Statements — fully visible */}
      {chemical.hazard_statements && chemical.hazard_statements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Hazard Statements
          </p>
          <div className="space-y-0.5">
            {chemical.hazard_statements.map((h, i) => (
              <p key={i} className="text-sm text-gray-700">{h}</p>
            ))}
          </div>
        </div>
      )}

      {/* CAS Numbers — fully visible */}
      {chemical.cas_numbers && chemical.cas_numbers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            CAS Numbers
          </p>
          <p className="text-sm text-gray-700 font-mono">
            {chemical.cas_numbers.join(", ")}
          </p>
        </div>
      )}

      {/* Confidence */}
      <div className="mb-4">
        <p className="text-xs text-gray-400">
          Confidence: {Math.round(chemical.confidence * 100)}%
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {chemical.sds_url && (
          <a
            href={chemical.sds_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View SDS
          </a>
        )}

        {isInInventory || added ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
            <Check className="h-4 w-4" />
            {added ? "Added" : "Already in Inventory"}
          </span>
        ) : (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add to My Chemicals
          </button>
        )}
      </div>

      {/* Add-to-inventory inline form */}
      {showForm && !added && !isInInventory && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
            {!showNewLoc ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={location}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setShowNewLoc(true);
                      } else {
                        setLocation(e.target.value);
                      }
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                    <option value="__new__">+ Add New Location</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="New location name..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => { setShowNewLoc(false); setNewLocName(""); }}
                  className="px-2 py-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Container Type + Quantity row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Container Type</label>
              <div className="relative">
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:border-amber-400 focus:outline-none"
                >
                  {CONTAINER_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="w-20">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Qty</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={showNewLoc && !newLocName.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 text-sm font-bold py-2.5 rounded-lg transition-colors"
          >
            Add Chemical →
          </button>
        </div>
      )}
    </div>
  );
}
