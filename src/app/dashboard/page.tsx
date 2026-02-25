"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusDot from "@/components/StatusDot";
import HelpTooltip from "@/components/HelpTooltip";
import HelpCard from "@/components/HelpCard";
import FixAllPanel from "@/components/FixAllPanel";
import { getChemicals, getEmployees, initializeStore, updateChemical } from "@/lib/chemicals";
import type { Chemical, Employee } from "@/lib/types";
import {
  Search,
  Plus,
  ShieldCheck,
  FileText,
  FlaskConical,
  Tags,
  GraduationCap,
  ArrowRight,
  Upload,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Clock,
  Camera,
  Loader2,
} from "lucide-react";

// ─── Action Item Type ────────────────────────────────────────────────────────

interface DashboardActionItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  timeEstimate: string;
  oshaRisk: "Critical" | "High" | "Medium";
  fixHref: string;
  fixLabel: string;
  chemicalId?: string; // for SDS lookup actions
  actionType?: "find-sds" | "link"; // "find-sds" enables inline lookup
}

// ─── Dynamic action items from live data ─────────────────────────────────────

function getDynamicActionItems(chemicals: Chemical[], employees: Employee[]): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];
  let counter = 1;

  // Missing SDS
  const missingSds = chemicals.filter((c) => c.sds_status === "missing");
  missingSds.forEach((c) => {
    items.push({
      id: String(counter++),
      priority: "high",
      title: `Missing SDS: ${c.product_name}`,
      detail: `Chemical is in ${c.location}. Request SDS from ${c.manufacturer} or upload manually.`,
      timeEstimate: "~5 min",
      oshaRisk: "Critical",
      fixHref: "/sds-library",
      fixLabel: "Find SDS",
      chemicalId: c.id,
      actionType: "find-sds",
    });
  });

  // Expired SDS
  const expiredSds = chemicals.filter((c) => c.sds_status === "expired");
  expiredSds.forEach((c) => {
    items.push({
      id: String(counter++),
      priority: "medium",
      title: `Expired SDS: ${c.product_name}`,
      detail: `SDS needs to be updated. Request current version from ${c.manufacturer}.`,
      timeEstimate: "~5 min",
      oshaRisk: "High",
      fixHref: "/sds-library",
      fixLabel: "Update SDS",
    });
  });

  // Overdue training
  const overdueEmps = employees.filter((e) => e.status === "overdue");
  overdueEmps.forEach((emp) => {
    items.push({
      id: String(counter++),
      priority: "medium",
      title: `Training overdue: ${emp.name}`,
      detail: emp.pending_modules.join(", ") || "Overdue training modules",
      timeEstimate: "~3 min",
      oshaRisk: "High",
      fixHref: "/training",
      fixLabel: "Assign Training",
    });
  });

  // Pending new hire training
  const pendingEmps = employees.filter((e) => e.status === "pending");
  pendingEmps.forEach((emp) => {
    items.push({
      id: String(counter++),
      priority: "medium",
      title: `New hire training: ${emp.name}`,
      detail: `${emp.pending_modules.length} module${emp.pending_modules.length !== 1 ? "s" : ""} remaining`,
      timeEstimate: "~2 min",
      oshaRisk: "High",
      fixHref: "/training",
      fixLabel: "Assign Training",
    });
  });

  // Unlabeled containers
  const unlabeled = chemicals.filter((c) => !c.labeled);
  if (unlabeled.length > 0) {
    items.push({
      id: String(counter++),
      priority: "low",
      title: `Print labels: ${unlabeled.length} chemical${unlabeled.length !== 1 ? "s" : ""}`,
      detail: unlabeled.map((c) => `${c.location}: ${c.product_name}`).join("; "),
      timeEstimate: "~2 min",
      oshaRisk: "Medium",
      fixHref: "/labels",
      fixLabel: "Print Labels",
    });
  }

  return items;
}

// ─── Recent Activity from live data ──────────────────────────────────────────

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: "upload" | "label" | "training" | "warning" | "chemical";
}

function getRecentActivity(chemicals: Chemical[], employees: Employee[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Generate activity from chemical data
  chemicals.forEach((c) => {
    // Added event
    if (c.added_date) {
      items.push({
        id: `add-${c.id}`,
        action: c.added_method === "scan" ? "Chemical scanned" : "Chemical added",
        detail: `${c.product_name} — ${c.manufacturer}`,
        time: c.added_date,
        type: "chemical",
      });
    }
    // Label printed event
    if (c.label_printed_date) {
      items.push({
        id: `label-${c.id}`,
        action: "Label printed",
        detail: `${c.product_name} — ${c.container_count} ${c.container_type}`,
        time: c.label_printed_date,
        type: "label",
      });
    }
    // SDS uploaded event
    if (c.sds_uploaded && c.sds_date) {
      items.push({
        id: `sds-${c.id}`,
        action: "SDS uploaded",
        detail: `${c.product_name} — ${c.manufacturer}`,
        time: c.sds_date,
        type: "upload",
      });
    }
    // Missing SDS warning
    if (c.sds_status === "missing") {
      items.push({
        id: `warn-sds-${c.id}`,
        action: "Missing SDS",
        detail: `${c.product_name} has no SDS on file`,
        time: c.last_updated,
        type: "warning",
      });
    }
  });

  // Employee events
  employees.forEach((emp) => {
    if (emp.last_training) {
      items.push({
        id: `train-${emp.id}`,
        action: "Training completed",
        detail: `${emp.name} — ${emp.role}`,
        time: emp.last_training,
        type: "training",
      });
    }
    if (emp.status === "overdue") {
      items.push({
        id: `warn-train-${emp.id}`,
        action: "Training overdue",
        detail: `${emp.name} has overdue modules`,
        time: emp.last_training || new Date().toISOString().split("T")[0],
        type: "warning",
      });
    }
  });

  // Sort by date descending
  items.sort((a, b) => b.time.localeCompare(a.time));
  return items.slice(0, 10);
}

const activityIcons: Record<string, typeof Upload> = {
  upload: Upload,
  label: Printer,
  training: GraduationCap,
  warning: AlertTriangle,
  chemical: FlaskConical,
};

const riskColors: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "bg-status-red/15", text: "text-status-red" },
  High: { bg: "bg-status-amber/15", text: "text-status-amber" },
  Medium: { bg: "bg-yellow-400/15", text: "text-yellow-400" },
};

// ─── Compliance Score ────────────────────────────────────────────────────────

function calculateComplianceScore(chemicals: Chemical[], employees: Employee[]) {
  const totalChems = chemicals.length;
  const totalEmps = employees.length;

  // SDS Coverage (25 points)
  const currentSDS = chemicals.filter((c) => c.sds_status === "current").length;
  const sdsPct = totalChems > 0 ? currentSDS / totalChems : 1;
  const sdsScore = sdsPct === 1 ? 25 : sdsPct >= 0.9 ? 13 : 0;

  // Labels (25 points)
  const totalContainers = chemicals.reduce((sum, c) => sum + c.container_count, 0);
  const labeledContainers = chemicals.filter((c) => c.labeled).reduce((sum, c) => sum + c.container_count, 0);
  const labelPct = totalContainers > 0 ? labeledContainers / totalContainers : 1;
  const labelScore = labelPct === 1 ? 25 : labelPct >= 0.8 ? 13 : 0;

  // Training (25 points)
  const fullyTrained = employees.filter((e) => e.status === "current").length;
  const trainingPct = totalEmps > 0 ? fullyTrained / totalEmps : 1;
  const trainingScore = trainingPct === 1 ? 25 : trainingPct >= 0.8 ? 13 : 0;

  // Written Program (15 points) — always exists
  const programScore = 15;

  // Multi-employer (10 points) — contractor pack available
  const multiScore = 10;

  return {
    total: sdsScore + labelScore + trainingScore + programScore + multiScore,
    sds: { score: sdsScore, pct: Math.round(sdsPct * 100), count: currentSDS, total: totalChems },
    labels: { score: labelScore, pct: Math.round(labelPct * 100), labeled: labeledContainers, total: totalContainers },
    training: { score: trainingScore, pct: Math.round(trainingPct * 100), current: fullyTrained, total: totalEmps },
    program: { score: programScore },
    multi: { score: multiScore },
  };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fixAllOpen, setFixAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [sdsLookupLoading, setSdsLookupLoading] = useState<string | null>(null); // action item id
  const [sdsLookupResult, setSdsLookupResult] = useState<Record<string, { found: boolean; portalUrl?: string }>>({});

  const handleFindSDS = useCallback(async (item: DashboardActionItem) => {
    if (!item.chemicalId) return;
    const chem = chemicals.find((c) => c.id === item.chemicalId);
    if (!chem) return;

    setSdsLookupLoading(item.id);
    try {
      const res = await fetch("/api/chemical/sds-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: chem.product_name, manufacturer: chem.manufacturer }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      if (data.sds_url && (data.confidence ?? 0) > 0.7) {
        updateChemical(chem.id, { sds_url: data.sds_url, sds_status: "current", sds_date: new Date().toISOString().split("T")[0] });
        setChemicals(getChemicals());
        setEmployees(getEmployees());
        setSdsLookupResult((prev) => ({ ...prev, [item.id]: { found: true } }));
      } else {
        setSdsLookupResult((prev) => ({
          ...prev,
          [item.id]: { found: false, portalUrl: data.manufacturer_sds_portal || undefined },
        }));
      }
    } catch {
      setSdsLookupResult((prev) => ({ ...prev, [item.id]: { found: false } }));
    } finally {
      setSdsLookupLoading(null);
    }
  }, [chemicals]);

  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
    setEmployees(getEmployees());
  }, []);

  const compliance = useMemo(() => calculateComplianceScore(chemicals, employees), [chemicals, employees]);
  const actionItems = useMemo(() => getDynamicActionItems(chemicals, employees), [chemicals, employees]);
  const recentActivity = useMemo(() => getRecentActivity(chemicals, employees), [chemicals, employees]);

  const totalChemicals = chemicals.length;
  const totalContainers = chemicals.reduce((sum, c) => sum + c.container_count, 0);
  const missingSDS = chemicals.filter((c) => c.sds_status === "missing").length;
  const unlabeledCount = chemicals.filter((c) => !c.labeled).length;
  const overdueCount = employees.filter((e) => e.status === "overdue").length;
  const uniqueLocations = new Set(chemicals.map((c) => c.location)).size;

  const statusCards = [
    {
      label: "SDS Library",
      value: `${totalChemicals}`,
      sub: `${compliance.sds.count} current \u00b7 ${missingSDS} missing`,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      href: "/sds-library",
    },
    {
      label: "Chemical Inventory",
      value: `${totalChemicals}`,
      sub: `${totalContainers} containers \u00b7 ${uniqueLocations} locations`,
      icon: FlaskConical,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      href: "/inventory",
    },
    {
      label: "Label Compliance",
      value: `${compliance.labels.pct}%`,
      sub: unlabeledCount > 0 ? `${unlabeledCount} need labeling` : "All containers labeled",
      icon: Tags,
      color: compliance.labels.pct === 100 ? "text-status-green" : "text-purple-400",
      bgColor: "bg-purple-400/10",
      href: "/labels",
    },
    {
      label: "Training Compliance",
      value: `${compliance.training.pct}%`,
      sub: overdueCount > 0 ? `${overdueCount} overdue \u00b7 ${compliance.training.current}/${compliance.training.total} current` : `${compliance.training.current}/${compliance.training.total} fully trained`,
      icon: GraduationCap,
      color: compliance.training.pct === 100 ? "text-status-green" : "text-amber-400",
      bgColor: "bg-amber-400/10",
      href: "/training",
    },
  ];

  // Empty state
  if (chemicals.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <FlaskConical className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No chemicals added yet</h2>
          <p className="text-gray-400 mb-6">Scan your first chemical to get started.</p>
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

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Mike&apos;s Auto Body — Main Location
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/sds-library?search=${encodeURIComponent(searchQuery.trim())}`; }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chemicals, SDSs..."
              className="bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-64"
            />
          </form>
          <Link
            href="/scan"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Chemical
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p>Your dashboard shows real-time compliance status across all 6 OSHA HazCom obligations. Here&apos;s what the numbers mean:</p>
          <p><strong className="text-amber-400">SDS Library</strong> — OSHA requires a Safety Data Sheet for every hazardous chemical, accessible to employees with NO barriers during every work shift. If this number doesn&apos;t match your chemical count, you have a gap. <span className="text-amber-500/80 text-xs">[29 CFR 1910.1200(g)(8)]</span></p>
          <p><strong className="text-amber-400">Chemical Inventory</strong> — Your written HazCom program must include a list of all hazardous chemicals using product identifiers that match the SDS and labels. This number should match what&apos;s physically on your shelves. <span className="text-amber-500/80 text-xs">[29 CFR 1910.1200(e)(1)(i)]</span></p>
          <p><strong className="text-amber-400">Label Compliance</strong> — Every secondary container must have a GHS-compliant label with the product identifier, signal word, hazard statements, and pictograms. <span className="text-amber-500/80 text-xs">[29 CFR 1910.1200(f)(6)]</span></p>
          <p><strong className="text-amber-400">Training Compliance</strong> — Employees must be trained on chemical hazards at initial assignment and whenever a new hazard is introduced. Without documented records, you cannot prove training happened. <span className="text-amber-500/80 text-xs">[29 CFR 1910.1200(h)]</span></p>
          <p><strong className="text-amber-400">Inspection Readiness Score</strong> — This weighted score reflects your overall compliance. Serious violations carry penalties up to <strong>$16,131</strong> per violation. Willful violations can reach <strong>$161,323</strong>.</p>
        </HelpCard>
      </div>

      {/* Inspection Readiness Banner */}
      <div className={`mb-8 rounded-xl bg-gradient-to-r ${compliance.total >= 90 ? "from-status-green/20 via-status-green/10" : compliance.total >= 70 ? "from-status-amber/20 via-status-amber/10" : "from-status-red/20 via-status-red/10"} to-navy-800 border ${compliance.total >= 90 ? "border-status-green/30" : compliance.total >= 70 ? "border-status-amber/30" : "border-status-red/30"} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full ${compliance.total >= 90 ? "bg-status-green/20 border-status-green" : compliance.total >= 70 ? "bg-status-amber/20 border-status-amber" : "bg-status-red/20 border-status-red"} border-2 flex items-center justify-center`}>
              <ShieldCheck className={`h-7 w-7 ${compliance.total >= 90 ? "text-status-green" : compliance.total >= 70 ? "text-status-amber" : "text-status-red"}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-white">
                  Inspection Readiness
                </h2>
                <span className={`text-3xl font-display font-black ${compliance.total >= 90 ? "text-status-green" : compliance.total >= 70 ? "text-status-amber" : "text-status-red"}`}>
                  {compliance.total}%
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {actionItems.length > 0
                  ? `${actionItems.length} action item${actionItems.length > 1 ? "s" : ""} to resolve — ${missingSDS > 0 ? `${missingSDS} missing SDS` : ""}${missingSDS > 0 && overdueCount > 0 ? ", " : ""}${overdueCount > 0 ? `${overdueCount} overdue training` : ""}${(missingSDS > 0 || overdueCount > 0) && unlabeledCount > 0 ? ", " : ""}${unlabeledCount > 0 ? `${unlabeledCount} unlabeled` : ""}`.replace(/— $/, "— review action items")
                  : "All compliance checks passing — ready for inspection"}
              </p>
            </div>
          </div>
          <Link
            href="/inspection"
            className={`flex items-center gap-2 ${compliance.total >= 90 ? "text-status-green" : compliance.total >= 70 ? "text-status-amber" : "text-status-red"} hover:text-white text-sm font-medium transition-colors`}
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statusCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-navy-900 border border-navy-700/50 rounded-xl p-5 hover:border-navy-600 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">{card.label}</span>
                {card.label === "SDS Library" && (
                  <HelpTooltip text="Every hazardous chemical requires a current SDS on file." citation="29 CFR 1910.1200(g)" />
                )}
                {card.label === "Training Compliance" && (
                  <HelpTooltip text="Employees must be trained on chemical hazards at initial assignment." citation="29 CFR 1910.1200(h)" />
                )}
                {card.label === "Label Compliance" && (
                  <HelpTooltip text="All secondary containers must have GHS-compliant labels." citation="29 CFR 1910.1200(f)" />
                )}
              </div>
              <div className={`h-9 w-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <p className="font-display font-black text-3xl text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity + Action Items */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-navy-900 border border-navy-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-white">Recent Activity</h3>
            {recentActivity.length > 6 && (
              <button
                onClick={() => setShowAllActivity(!showAllActivity)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {showAllActivity ? "Show Less" : "View All"}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {(showAllActivity ? recentActivity : recentActivity.slice(0, 6)).map((item) => {
              const Icon = activityIcons[item.type] || FlaskConical;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-navy-800/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon
                      className={`h-4 w-4 ${
                        item.type === "warning" ? "text-status-red" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{item.action}</p>
                    <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {(() => {
                      try {
                        return new Date(item.time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      } catch {
                        return item.time;
                      }
                    })()}
                  </span>
                </div>
              );
            })}
            {recentActivity.length === 0 && (
              <p className="py-6 text-center text-gray-500 text-sm">No activity yet</p>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-white">
              Action Items ({actionItems.length})
            </h3>
            {actionItems.length > 0 && (
              <button
                onClick={() => setFixAllOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                Fix All
              </button>
            )}
          </div>
          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-status-green mb-2" />
              <p className="text-sm text-status-green font-medium">All clear!</p>
              <p className="text-xs text-gray-500 mt-1">No action items — fully compliant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => {
                const risk = riskColors[item.oshaRisk];
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-navy-800/60 border border-navy-700/30 hover:border-navy-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusDot status={item.priority} />
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {item.priority}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${risk.bg} ${risk.text}`}>
                        {item.oshaRisk}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-navy-700/50 text-gray-400">
                        <Clock className="h-2.5 w-2.5" />
                        {item.timeEstimate}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {sdsLookupResult[item.id]?.found ? (
                        <span className="text-status-green">SDS found and linked!</span>
                      ) : (
                        item.title
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{item.detail}</p>
                    {sdsLookupResult[item.id]?.found ? (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-status-green">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </span>
                    ) : sdsLookupResult[item.id] && !sdsLookupResult[item.id].found ? (
                      <div className="flex items-center gap-2 mt-2">
                        {sdsLookupResult[item.id].portalUrl ? (
                          <a
                            href={sdsLookupResult[item.id].portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            Search manufacturer portal <ArrowRight className="h-3 w-3" />
                          </a>
                        ) : (
                          <Link
                            href={item.fixHref}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            Upload manually <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    ) : item.actionType === "find-sds" ? (
                      <button
                        onClick={() => handleFindSDS(item)}
                        disabled={sdsLookupLoading === item.id}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                      >
                        {sdsLookupLoading === item.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Searching...</>
                        ) : (
                          <>{item.fixLabel} <ArrowRight className="h-3 w-3" /></>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.fixHref}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {item.fixLabel} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FixAllPanel
        open={fixAllOpen}
        onClose={() => setFixAllOpen(false)}
        actionItems={actionItems}
        complianceScore={compliance.total}
      />
    </DashboardLayout>
  );
}
