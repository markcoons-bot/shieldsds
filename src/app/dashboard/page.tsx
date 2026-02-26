"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusDot from "@/components/StatusDot";
import HelpTooltip from "@/components/HelpTooltip";
import HelpCard from "@/components/HelpCard";
import FixAllPanel from "@/components/FixAllPanel";
import { getChemicals, getEmployees, initializeStore, updateChemical, getCompanyProfile, exitDemoMode } from "@/lib/chemicals";
import { calculateComplianceScore, getEmployeeTrainingStatus } from "@/lib/compliance-score";
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
  Copy,
  Check,
  X,
  Link2,
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
  employeeId?: string; // for training link actions
  actionType?: "find-sds" | "send-link" | "link"; // action type for inline buttons
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

  // Training items — use shared training status from compliance-score
  employees.forEach((emp) => {
    const info = getEmployeeTrainingStatus(emp);

    if (info.status === "current" || info.status === "due-soon") {
      // Fully trained and within 12-month window — NO action item needed
      return;
    }

    if (info.status === "overdue") {
      items.push({
        id: String(counter++),
        priority: "high",
        title: `Training overdue: ${emp.name} — annual refresher due`,
        detail: info.daysUntilDue != null
          ? `${Math.abs(info.daysUntilDue)} days overdue — all 7 modules complete but refresher expired.`
          : `Annual refresher overdue — all 7 modules complete but date unknown.`,
        timeEstimate: "~3 min",
        oshaRisk: "Critical",
        fixHref: `/training/learn?employee=${emp.id}`,
        fixLabel: "Start Training →",
        employeeId: emp.id,
        actionType: "link",
      });
    } else if (info.status === "in-progress") {
      items.push({
        id: String(counter++),
        priority: "medium",
        title: `Training in progress: ${emp.name} — ${info.remainingCount} of 7 modules remaining`,
        detail: `${info.completedCount}/7 modules completed — needs ${info.remainingCount} more to finish.`,
        timeEstimate: "~2 min",
        oshaRisk: "High",
        fixHref: `/training/learn?employee=${emp.id}`,
        fixLabel: "Start Training →",
        employeeId: emp.id,
        actionType: "link",
      });
    } else if (info.status === "not-started") {
      items.push({
        id: String(counter++),
        priority: "high",
        title: `Training not started: ${emp.name} — new hire orientation needed`,
        detail: `0/7 modules completed — needs full HazCom training before chemical exposure.`,
        timeEstimate: "~2 min",
        oshaRisk: "Critical",
        fixHref: `/training/learn?employee=${emp.id}`,
        fixLabel: "Start Training →",
        employeeId: emp.id,
        actionType: "link",
      });
    }
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
    const tInfo = getEmployeeTrainingStatus(emp);
    if (tInfo.status === "overdue") {
      items.push({
        id: `warn-train-${emp.id}`,
        action: "Training overdue",
        detail: `${emp.name} — ${tInfo.daysUntilDue != null ? `${Math.abs(tInfo.daysUntilDue)} days overdue` : "refresher due"}`,
        time: emp.last_training || new Date().toISOString().split("T")[0],
        type: "warning",
      });
    } else if (tInfo.status === "not-started" || tInfo.status === "in-progress") {
      items.push({
        id: `warn-train-${emp.id}`,
        action: tInfo.status === "not-started" ? "Training not started" : "Training incomplete",
        detail: `${emp.name} — ${tInfo.completedCount}/7 modules`,
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fixAllOpen, setFixAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [sdsLookupLoading, setSdsLookupLoading] = useState<string | null>(null); // action item id
  const [sdsLookupResult, setSdsLookupResult] = useState<Record<string, { found: boolean; portalUrl?: string }>>({});
  const [trainingLinkPopup, setTrainingLinkPopup] = useState<string | null>(null); // employee id
  const [trainingLinkCopied, setTrainingLinkCopied] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [realCompanyName, setRealCompanyName] = useState("");

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

    // Read company name from profile
    const profile = getCompanyProfile();
    setCompanyName(profile.name);

    // Check demo mode
    const demoActive = sessionStorage.getItem("shieldsds-demo-mode") === "true";
    setIsDemoMode(demoActive);
    if (demoActive) {
      try {
        const backup = sessionStorage.getItem("shieldsds-user-backup");
        if (backup) {
          const parsed = JSON.parse(backup);
          const companyRaw = parsed["shieldsds-company"];
          if (companyRaw) {
            const realProfile = JSON.parse(companyRaw);
            setRealCompanyName(realProfile.name || "My Shop");
          } else {
            setRealCompanyName("My Shop");
          }
        }
      } catch {
        setRealCompanyName("My Shop");
      }
    }

    // Show welcome banner once after setup
    try {
      const saved = localStorage.getItem("shieldsds-company");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.setupComplete) {
          const welcomed = localStorage.getItem("shieldsds-welcome-shown");
          if (welcomed === "false") {
            setShowWelcome(true);
            localStorage.setItem("shieldsds-welcome-shown", "true");
          }
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const compliance = useMemo(() => calculateComplianceScore(chemicals, employees), [chemicals, employees]);
  const actionItems = useMemo(() => getDynamicActionItems(chemicals, employees), [chemicals, employees]);
  const recentActivity = useMemo(() => getRecentActivity(chemicals, employees), [chemicals, employees]);

  const totalChemicals = chemicals.length;
  const totalContainers = chemicals.reduce((sum, c) => sum + c.container_count, 0);
  const missingSDS = chemicals.filter((c) => c.sds_status === "missing").length;
  const unlabeledCount = chemicals.filter((c) => !c.labeled).length;
  const uniqueLocations = new Set(chemicals.map((c) => c.location)).size;

  // Training counts from shared status
  const trainingCounts = useMemo(() => {
    let overdue = 0, dueSoon = 0, inProgress = 0, notStarted = 0;
    employees.forEach((e) => {
      const info = getEmployeeTrainingStatus(e);
      if (info.status === "overdue") overdue++;
      else if (info.status === "due-soon") dueSoon++;
      else if (info.status === "in-progress") inProgress++;
      else if (info.status === "not-started") notStarted++;
    });
    return { overdue, dueSoon, inProgress, notStarted, needsAction: overdue + inProgress + notStarted };
  }, [employees]);

  const statusCards = [
    {
      label: "SDS Library",
      value: `${totalChemicals}`,
      sub: `${compliance.breakdown.sds.current} current · ${missingSDS} missing`,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      href: "/sds-library",
    },
    {
      label: "Chemical Inventory",
      value: `${totalChemicals}`,
      sub: `${totalContainers} containers · ${uniqueLocations} locations`,
      icon: FlaskConical,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      href: "/inventory",
    },
    {
      label: "Label Compliance",
      value: `${compliance.breakdown.labels.pct}%`,
      sub: unlabeledCount > 0 ? `${unlabeledCount} need labeling` : "All containers labeled",
      icon: Tags,
      color: compliance.breakdown.labels.pct === 100 ? "text-status-green" : "text-purple-400",
      bgColor: "bg-purple-400/10",
      href: "/labels",
    },
    {
      label: "Training Compliance",
      value: `${compliance.breakdown.training.pct}%`,
      sub: (() => {
        const { overdue, dueSoon } = trainingCounts;
        const parts: string[] = [];
        if (overdue > 0) parts.push(`${overdue} overdue`);
        if (dueSoon > 0) parts.push(`${dueSoon} due soon`);
        parts.push(`${compliance.breakdown.training.current}/${compliance.breakdown.training.total} fully trained`);
        return parts.join(" · ");
      })(),
      icon: GraduationCap,
      color: compliance.breakdown.training.pct === 100 ? "text-status-green" : "text-amber-400",
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
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-white font-medium">
              You&apos;re viewing the demo shop (Mike&apos;s Auto Body). Your data is saved.
            </p>
          </div>
          <button
            onClick={() => {
              exitDemoMode();
              window.location.href = "/dashboard";
            }}
            className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors md:ml-3 flex-shrink-0 whitespace-nowrap min-h-[44px] flex items-center"
          >
            Back to {realCompanyName} →
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {companyName} — Main Location
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/sds-library?search=${encodeURIComponent(searchQuery.trim())}`; }}
            className="relative flex-1 md:flex-none"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chemicals, SDSs..."
              className="bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-full md:w-64"
            />
          </form>
          <Link
            href="/scan"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors min-h-[44px] flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Chemical
          </Link>
        </div>
      </div>

      {showWelcome && (
        <div className="mb-6 bg-status-green/10 border border-status-green/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-status-green flex-shrink-0" />
            <p className="text-sm text-white font-medium">
              Welcome to ShieldSDS, {companyName}! Your account is set up and ready to go.
            </p>
          </div>
          <button onClick={() => setShowWelcome(false)} className="text-gray-400 hover:text-white transition-colors ml-3 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
      <div className={`mb-8 rounded-xl bg-gradient-to-r ${compliance.overall >= 90 ? "from-status-green/20 via-status-green/10" : compliance.overall >= 70 ? "from-status-amber/20 via-status-amber/10" : "from-status-red/20 via-status-red/10"} to-navy-800 border ${compliance.overall >= 90 ? "border-status-green/30" : compliance.overall >= 70 ? "border-status-amber/30" : "border-status-red/30"} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className={`h-14 w-14 rounded-full ${compliance.overall >= 90 ? "bg-status-green/20 border-status-green" : compliance.overall >= 70 ? "bg-status-amber/20 border-status-amber" : "bg-status-red/20 border-status-red"} border-2 flex items-center justify-center flex-shrink-0`}>
              <ShieldCheck className={`h-7 w-7 ${compliance.overall >= 90 ? "text-status-green" : compliance.overall >= 70 ? "text-status-amber" : "text-status-red"}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-white">
                  {compliance.status}
                </h2>
                <span className={`text-2xl md:text-3xl font-display font-black ${compliance.overall >= 90 ? "text-status-green" : compliance.overall >= 70 ? "text-status-amber" : "text-status-red"}`}>
                  {compliance.overall}%
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {compliance.actionItemCount > 0
                  ? (() => {
                      const parts: string[] = [];
                      if (missingSDS > 0) parts.push(`${missingSDS} missing SDS`);
                      if (unlabeledCount > 0) parts.push(`${unlabeledCount} unlabeled`);
                      if (trainingCounts.needsAction > 0) parts.push(`${trainingCounts.needsAction} training incomplete`);
                      return `${compliance.actionItemCount} action item${compliance.actionItemCount > 1 ? "s" : ""} to resolve — ${parts.join(", ")}`;
                    })()
                  : "All compliance checks passing — ready for inspection"}
              </p>
              {compliance.improvements.length > 0 && compliance.overall < 100 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {compliance.improvements.map((imp, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-400 bg-navy-800/80 rounded px-2 py-0.5">
                      {imp.text} <span className={`font-semibold ${compliance.overall >= 90 ? "text-status-green" : compliance.overall >= 70 ? "text-status-amber" : "text-status-red"}`}>(+{imp.points} pts)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Link
            href="/inspection"
            className={`flex items-center gap-2 ${compliance.overall >= 90 ? "text-status-green" : compliance.overall >= 70 ? "text-status-amber" : "text-status-red"} hover:text-white text-sm font-medium transition-colors min-h-[44px]`}
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <p className="font-display font-black text-2xl md:text-3xl text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity + Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-1 md:col-span-2 bg-navy-900 border border-navy-700/50 rounded-xl p-6">
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
        <div className="order-first md:order-last bg-navy-900 border border-navy-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-white">
              Action Items ({actionItems.length})
            </h3>
            {actionItems.length > 0 && (
              <button
                onClick={() => setFixAllOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
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
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
                          >
                            Search manufacturer portal <ArrowRight className="h-3 w-3" />
                          </a>
                        ) : (
                          <Link
                            href={item.fixHref}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
                          >
                            Upload manually <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    ) : item.actionType === "find-sds" ? (
                      <button
                        onClick={() => handleFindSDS(item)}
                        disabled={sdsLookupLoading === item.id}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 min-h-[44px]"
                      >
                        {sdsLookupLoading === item.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Searching...</>
                        ) : (
                          <>{item.fixLabel} <ArrowRight className="h-3 w-3" /></>
                        )}
                      </button>
                    ) : item.actionType === "send-link" && item.employeeId ? (
                      <button
                        onClick={() => setTrainingLinkPopup(item.employeeId!)}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
                      >
                        <Link2 className="h-3 w-3" />
                        {item.fixLabel} <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <Link
                        href={item.fixHref}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
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

      {/* Training Link Popup */}
      {trainingLinkPopup && (() => {
        const emp = employees.find((e) => e.id === trainingLinkPopup);
        if (!emp) return null;
        const trainingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/training/learn?employee=${emp.id}`;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-white">Send Training Link</h3>
                <button onClick={() => { setTrainingLinkPopup(null); setTrainingLinkCopied(false); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Copy this link and send it to <span className="text-white font-medium">{emp.name}</span>. When they complete training, their records update automatically.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-xs text-gray-300 font-mono truncate">
                  {trainingUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trainingUrl).then(() => {
                      setTrainingLinkCopied(true);
                      setTimeout(() => setTrainingLinkCopied(false), 2000);
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    trainingLinkCopied
                      ? "bg-status-green/20 text-status-green"
                      : "bg-amber-500 hover:bg-amber-400 text-navy-950"
                  }`}
                >
                  {trainingLinkCopied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <FixAllPanel
        open={fixAllOpen}
        onClose={() => setFixAllOpen(false)}
        actionItems={actionItems}
        complianceScore={compliance.overall}
      />
    </DashboardLayout>
  );
}
