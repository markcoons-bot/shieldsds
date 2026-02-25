"use client";

import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HelpCard from "@/components/HelpCard";
import { generateContractorPacketPDF } from "@/lib/pdf-generator";
import {
  sdsEntries,
  inventoryItems,
  inventoryLocations,
  ghsPictogramLabels,
} from "@/lib/data";
import type { GHSPictogram } from "@/lib/data";
import { getCompanyProfile, isRealUser } from "@/lib/chemicals";
import GHSPictogramIcon from "@/components/GHSPictogram";
import {
  Plus,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  X,
  Eye,
  Building2,
  MapPin,
  Shield,
  Download,
  Link2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractorPacket {
  id: string;
  company: string;
  contact: string;
  email: string;
  locations: string[];
  startDate: string;
  endDate: string;
  generatedDate: string;
  acknowledged: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedPackets: ContractorPacket[] = [
  {
    id: "1",
    company: "Pacific Coast Plumbing",
    contact: "Tom Nguyen",
    email: "tom@pcplumbing.com",
    locations: ["Bay 2", "Parts Washer Station"],
    startDate: "2026-02-10",
    endDate: "2026-02-12",
    generatedDate: "2026-02-08",
    acknowledged: true,
  },
  {
    id: "2",
    company: "Long Beach Electrical Services",
    contact: "Diana Park",
    email: "diana@lbelectrical.com",
    locations: ["Paint Booth A", "Paint Mixing Room"],
    startDate: "2026-01-20",
    endDate: "2026-01-22",
    generatedDate: "2026-01-18",
    acknowledged: true,
  },
  {
    id: "3",
    company: "SoCal HVAC Pros",
    contact: "Marco Reyes",
    email: "marco@socalhvac.com",
    locations: ["Paint Booth A", "Bay 1", "Bay 2", "Bay 3"],
    startDate: "2026-03-01",
    endDate: "2026-03-05",
    generatedDate: "2026-02-22",
    acknowledged: false,
  },
];

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

// ─── Packet Preview ───────────────────────────────────────────────────────────

function getShopInfo() {
  const profile = getCompanyProfile();
  return {
    name: profile.name,
    owner: profile.owner,
    address: profile.address,
    city: profile.city || "",
    state: profile.state || "",
    zip: profile.zip || "",
    phone: profile.phone || "",
    emergencyContacts: {
      poisonControl: "1-800-222-1222",
      nearestHospital: {
        name: "Nearest Emergency Room",
        phone: "911",
        distance: "—",
      },
    },
  };
}

function PacketPreview({
  packet,
  onClose,
  showToast,
}: {
  packet: ContractorPacket;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [sigName, setSigName] = useState("");
  const [sigText, setSigText] = useState("");
  const shopInfo = getShopInfo();
  const shareUrl = `https://app.shieldsds.com/share/contractor/${packet.id}-${packet.company.toLowerCase().replace(/\s+/g, "-")}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast("Contractor packet link copied to clipboard");
  };

  // Chemicals present in selected locations
  const chemicalsInArea = useMemo(() => {
    const locationSet = new Set(packet.locations);
    const invInArea = inventoryItems.filter((i) => locationSet.has(i.location));
    return invInArea.map((inv) => {
      const sds = sdsEntries.find((s) => s.id === inv.sdsId);
      return { inv, sds };
    });
  }, [packet.locations]);

  // Unique pictograms present
  const uniquePictograms = useMemo(() => {
    const set = new Set<GHSPictogram>();
    chemicalsInArea.forEach(({ sds }) => {
      sds?.pictograms.forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, [chemicalsInArea]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-navy-950 text-white rounded-t-2xl px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-400" />
              <div>
                <h2 className="font-display font-black text-xl">
                  Contractor Safety Information
                </h2>
                <p className="text-sm text-gray-300">
                  {shopInfo.name} — {shopInfo.address}, {shopInfo.city}, {shopInfo.state} {shopInfo.zip}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 bg-navy-800 border border-navy-600 hover:border-navy-500 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" />
                Share Link
              </button>
              <button
                onClick={async () => {
                  try {
                    await generateContractorPacketPDF({ company: packet.company, contact: packet.contact, locations: packet.locations, startDate: packet.startDate, endDate: packet.endDate });
                  } catch (err) {
                    console.error("PDF generation error:", err);
                    alert("PDF error: " + (err instanceof Error ? err.message : "Unknown error"));
                  }
                }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Contractor</p>
              <p className="font-medium">{packet.company}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Work Dates</p>
              <p className="font-medium">{packet.startDate} to {packet.endDate}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Work Locations</p>
              <p className="font-medium">{packet.locations.join(", ")}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Section 1: Labeling System */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
              1. Labeling System Used On-Site
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {shopInfo.name} uses the Globally Harmonized System (GHS) for all chemical labeling.
              All secondary containers are labeled with GHS-compliant labels that include:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-3">
              <li>Product identifier (name and code)</li>
              <li>Signal word (DANGER or WARNING)</li>
              <li>GHS pictogram diamonds indicating hazard types</li>
              <li>Hazard and precautionary statements</li>
              <li>Manufacturer contact information</li>
              <li>QR code linking to the full Safety Data Sheet</li>
            </ul>
            <p className="text-sm font-medium text-gray-900 mb-2">GHS Pictograms present in your work area:</p>
            <div className="flex flex-wrap gap-3">
              {uniquePictograms.map((p) => (
                <div key={p} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <GHSPictogramIcon type={p} size={28} />
                  <span className="text-xs font-medium text-gray-700">{ghsPictogramLabels[p]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Chemicals Present */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
              2. Chemicals Present in Work Area
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Chemical</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Signal Word</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Primary Hazards</th>
                  </tr>
                </thead>
                <tbody>
                  {chemicalsInArea.map(({ inv, sds }) => (
                    <tr key={inv.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">{inv.product}</td>
                      <td className="py-2 px-3 text-gray-600">{inv.location}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-bold ${
                          sds?.signalWord === "Danger" ? "text-red-600" : sds?.signalWord === "Warning" ? "text-amber-600" : "text-gray-400"
                        }`}>
                          {sds?.signalWord ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 text-xs">
                        {sds?.pictograms.map((p) => ghsPictogramLabels[p]).join(", ") ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: SDS Access */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
              3. SDS Access
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              Safety Data Sheets for all chemicals on-site are available through the following methods:
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>QR Codes:</strong> Scan the QR code on any secondary container label to view the full SDS on your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Shop Tablet:</strong> The ShieldSDS app is available on the shop tablet located in the front office</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Front Office:</strong> Ask Sarah Chen at the front desk for a printed copy of any SDS</span>
              </li>
            </ul>
          </div>

          {/* Section 4: Precautionary Measures */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
              4. Precautionary Measures
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900 mb-1">Required PPE by Area:</p>
                <ul className="space-y-1 list-disc list-inside">
                  {packet.locations.map((loc) => {
                    const hasPaintChems = loc.includes("Paint") || loc.includes("Booth");
                    return (
                      <li key={loc}>
                        <strong>{loc}:</strong> {hasPaintChems
                          ? "Safety glasses, nitrile gloves, organic vapor respirator, protective coveralls"
                          : "Safety glasses, nitrile gloves at minimum — check SDS for specific requirements"}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Facility Safety Equipment:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Eyewash station: Located at Parts Washer Station and Paint Mixing Room</li>
                  <li>Fire extinguishers: Mounted at each bay entrance and paint booth</li>
                  <li>Spill kits: Located at each work bay and paint area</li>
                  <li>Emergency exits: Front entrance and rear bay doors</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Emergency Contacts */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
              5. Emergency Contacts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Responsible Person", value: `${shopInfo.owner} — ${shopInfo.phone}` },
                { label: "Fire / Police / EMS", value: "911" },
                { label: "Poison Control", value: shopInfo.emergencyContacts.poisonControl },
                {
                  label: "Nearest Hospital",
                  value: `${shopInfo.emergencyContacts.nearestHospital.name} — ${shopInfo.emergencyContacts.nearestHospital.phone} (${shopInfo.emergencyContacts.nearestHospital.distance})`,
                },
              ].map((c) => (
                <div key={c.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{c.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Acknowledgment */}
          <div className="border-2 border-gray-300 rounded-xl p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Acknowledgment of Receipt
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              I acknowledge that I have received and reviewed the chemical safety information
              for work at {shopInfo.name}. I understand the hazards present in the work area,
              how to access Safety Data Sheets, and the emergency procedures.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder={packet.contact}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Signature</label>
                <input
                  type="text"
                  value={sigText}
                  onChange={(e) => setSigText(e.target.value)}
                  placeholder="Type name as signature"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm italic focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
              <button
                onClick={() => {
                  showToast(`Acknowledgment recorded for ${packet.company}`);
                  onClose();
                }}
                className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Submit Acknowledgment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractorsPage() {
  const [packets, setPackets] = useState<ContractorPacket[]>(() => {
    if (typeof window !== "undefined" && isRealUser()) return [];
    return seedPackets;
  });
  const [toast, setToast] = useState<string | null>(null);
  const [previewPacket, setPreviewPacket] = useState<ContractorPacket | null>(null);

  // Form state
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-03-03");
  const [showForm, setShowForm] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = packets.length;
    const acked = packets.filter((p) => p.acknowledged).length;
    return { total, acked, pct: total > 0 ? Math.round((acked / total) * 100) : 100 };
  }, [packets]);

  function toggleLocation(name: string) {
    setSelectedLocations((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  }

  function handleGenerate() {
    if (!company.trim() || !contact.trim() || selectedLocations.length === 0) return;
    const newPacket: ContractorPacket = {
      id: `p-${Date.now()}`,
      company: company.trim(),
      contact: contact.trim(),
      email: email.trim(),
      locations: selectedLocations,
      startDate,
      endDate,
      generatedDate: "2026-02-24",
      acknowledged: false,
    };
    setPackets((prev) => [newPacket, ...prev]);
    setPreviewPacket(newPacket);
    setCompany("");
    setContact("");
    setEmail("");
    setSelectedLocations([]);
    setShowForm(false);
    showToast(`Contractor packet generated for ${newPacket.company}`);
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {previewPacket && (
        <PacketPreview
          packet={previewPacket}
          onClose={() => setPreviewPacket(null)}
          showToast={showToast}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Contractors</h1>
          <p className="text-sm text-gray-400 mt-1">
            Multi-employer chemical hazard communication — OSHA 29 CFR 1910.1200(e)(2)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Generate Packet
        </button>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p><strong className="text-white">This is the HazCom requirement most small businesses don&apos;t know about.</strong></p>
          <p>If workers from OTHER employers are on your site and may be exposed to your chemicals, you must:</p>
          <ul className="list-none space-y-1 ml-1">
            <li><strong className="text-amber-400">1.</strong> Provide them access to SDS for chemicals in their work area</li>
            <li><strong className="text-amber-400">2.</strong> Inform them of precautionary measures they need to take</li>
            <li><strong className="text-amber-400">3.</strong> Explain the labeling system used at your workplace</li>
          </ul>
          <p>This applies to: subcontractors, temporary workers, delivery drivers who enter chemical areas, maintenance contractors, insurance adjusters visiting the shop floor — anyone who isn&apos;t your employee but could be exposed.</p>
          <p><strong className="text-amber-400">The requirement is on YOU</strong> as the host employer, not on the contractor. If a contractor&apos;s worker has an exposure incident at your shop and you can&apos;t prove you communicated the hazards, that&apos;s your citation.</p>
          <p>ShieldSDS generates a location-specific safety packet that includes all required information and captures a digital acknowledgment signature — proving you met your obligation.</p>
          <p className="text-amber-500/80 text-xs">[29 CFR 1910.1200(e)(2)]</p>
        </HelpCard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Packets Generated</span>
            <div className="h-9 w-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">This year</p>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Acknowledged</span>
            <div className="h-9 w-9 rounded-lg bg-status-green/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-status-green" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-status-green">{stats.acked}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pct}% signed</p>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Pending</span>
            <div className="h-9 w-9 rounded-lg bg-status-amber/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-status-amber" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-status-amber">{stats.total - stats.acked}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting signature</p>
        </div>
      </div>

      {/* Generate Packet Form */}
      {showForm && (
        <div className="mb-6 bg-navy-900 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Generate Contractor Safety Packet
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Contractor Company <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Pacific Coast Plumbing"
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Contact Name <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. Tom Nguyen"
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. tom@pcplumbing.com"
                className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
          {/* Location Checkboxes */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Work Locations <span className="text-status-red">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {inventoryLocations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => toggleLocation(loc.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    selectedLocations.includes(loc.name)
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{loc.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{loc.chemicals}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!company.trim() || !contact.trim() || selectedLocations.length === 0}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              <FileText className="h-4 w-4" />
              Generate Packet
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contractor Log */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Contractor Log
        </h2>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contractor</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Locations</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Dates</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Generated</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((packet) => (
                <tr key={packet.id} className="border-b border-navy-700/30 hover:bg-navy-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">{packet.company}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{packet.contact}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    <span className="truncate block max-w-[140px]" title={packet.locations.join(", ")}>
                      {packet.locations.join(", ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {packet.startDate} — {packet.endDate}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{packet.generatedDate}</td>
                  <td className="py-3 px-4">
                    {packet.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs text-status-green bg-status-green/15 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-status-amber bg-status-amber/15 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewPacket(packet)}
                        className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                        title="View Packet"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => showToast(`Packet resent to ${packet.email || packet.contact}`)}
                        className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                        title="Resend"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {packets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                    No contractor packets generated yet.
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
