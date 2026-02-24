"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusDot from "@/components/StatusDot";
import HelpTooltip from "@/components/HelpTooltip";
import HelpCard from "@/components/HelpCard";
import FixAllPanel from "@/components/FixAllPanel";
import {
  sdsEntries,
  inventoryItems,
  employees,
  trainingCourses,
  auditLog,
  getComplianceData,
} from "@/lib/data";
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
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Clock,
} from "lucide-react";

// ─── Derive action items dynamically from data ───────────────────────────────

interface DashboardActionItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  timeEstimate: string;
  oshaRisk: "Critical" | "High" | "Medium";
  fixHref: string;
  fixLabel: string;
}

function getDynamicActionItems(): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];
  let counter = 1;

  // Missing SDS
  const missingSds = sdsEntries.filter((s) => s.sdsStatus === "missing");
  missingSds.forEach((s) => {
    items.push({
      id: String(counter++),
      priority: "high",
      title: `Missing SDS: ${s.productName}`,
      detail: `Chemical is in ${s.storageLocation} inventory. Request SDS from ${s.manufacturer} or upload manually.`,
      timeEstimate: "~5 min",
      oshaRisk: "Critical",
      fixHref: "/sds-library",
      fixLabel: "Upload SDS",
    });
  });

  // Overdue training
  const overdueEmps = employees.filter((e) => e.status === "overdue");
  overdueEmps.forEach((emp) => {
    const overdueCourses = emp.trainings
      .filter((t) => t.status === "overdue")
      .map((t) => trainingCourses.find((c) => c.id === t.courseId)?.title)
      .filter(Boolean);
    items.push({
      id: String(counter++),
      priority: "medium",
      title: `Training overdue: ${emp.name}`,
      detail: overdueCourses.join(", "),
      timeEstimate: "~3 min",
      oshaRisk: "High",
      fixHref: "/training",
      fixLabel: "Assign Training",
    });
  });

  // Pending new hire training
  const pendingEmps = employees.filter((e) => e.status === "pending");
  pendingEmps.forEach((emp) => {
    const remaining = emp.trainings.filter((t) => t.status !== "completed").length;
    items.push({
      id: String(counter++),
      priority: "medium",
      title: `New hire training: ${emp.name}`,
      detail: `${remaining} course${remaining !== 1 ? "s" : ""} remaining`,
      timeEstimate: "~2 min",
      oshaRisk: "High",
      fixHref: "/training",
      fixLabel: "Assign Training",
    });
  });

  // Unlabeled containers
  const unlabeled = inventoryItems.filter((i) => !i.labeled);
  if (unlabeled.length > 0) {
    items.push({
      id: String(counter++),
      priority: "low",
      title: `Reprint labels: ${unlabeled.length} container${unlabeled.length !== 1 ? "s" : ""}`,
      detail: unlabeled.map((i) => `${i.location}: ${i.product}`).join("; "),
      timeEstimate: "~2 min",
      oshaRisk: "Medium",
      fixHref: "/labels",
      fixLabel: "Print Labels",
    });
  }

  return items;
}

// ─── Derive recent activity from audit log ───────────────────────────────────

function getRecentActivity() {
  return auditLog.slice(0, 8).map((entry, i) => {
    let type: "upload" | "label" | "training" | "warning" | "chemical" = "chemical";
    const lower = entry.entry.toLowerCase();
    if (lower.includes("sds uploaded")) type = "upload";
    else if (lower.includes("label")) type = "label";
    else if (lower.includes("training") || lower.includes("new hire")) type = "training";
    else if (lower.includes("missing") || lower.includes("overdue")) type = "warning";

    // Extract the action and detail
    const parts = entry.entry.split(": ");
    const action = parts[0] || entry.entry;
    const detail = parts.slice(1).join(": ") || "";

    return {
      id: String(i + 1),
      action,
      detail,
      time: entry.time.split(" — ")[0] || entry.time,
      type,
    };
  });
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

export default function DashboardPage() {
  const [fixAllOpen, setFixAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const compliance = getComplianceData();
  const actionItems = getDynamicActionItems();
  const recentActivity = getRecentActivity();

  const totalSDS = sdsEntries.length;
  const currentSDS = sdsEntries.filter((s) => s.sdsStatus === "current").length;
  const missingSDS = sdsEntries.filter((s) => s.sdsStatus === "missing").length;
  const totalChemicals = inventoryItems.length;
  const totalContainers = inventoryItems.reduce((sum, i) => sum + i.containers, 0);
  const labeledItems = inventoryItems.filter((i) => i.labeled);
  const labeledContainers = labeledItems.reduce((sum, i) => sum + i.containers, 0);
  const unlabeledCount = inventoryItems.length - labeledItems.length;
  const labelPct = totalContainers > 0 ? Math.round((labeledContainers / totalContainers) * 100) : 100;
  const fullyTrained = employees.filter((e) => e.status === "current").length;
  const overdueCount = employees.filter((e) => e.status === "overdue").length;
  const trainingPct = Math.round((fullyTrained / employees.length) * 100);

  const statusCards = [
    {
      label: "SDS Library",
      value: `${totalSDS}`,
      sub: `${currentSDS} current · ${missingSDS} missing`,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      href: "/sds-library",
    },
    {
      label: "Chemical Inventory",
      value: `${totalChemicals}`,
      sub: `${totalContainers} containers · ${inventoryItems.filter((i) => i.location).length ? "9 locations" : ""}`,
      icon: FlaskConical,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      href: "/inventory",
    },
    {
      label: "Label Compliance",
      value: `${labelPct}%`,
      sub: unlabeledCount > 0 ? `${unlabeledCount} need labeling` : "All containers labeled",
      icon: Tags,
      color: labelPct === 100 ? "text-status-green" : "text-purple-400",
      bgColor: "bg-purple-400/10",
      href: "/labels",
    },
    {
      label: "Training Compliance",
      value: `${trainingPct}%`,
      sub: overdueCount > 0 ? `${overdueCount} overdue · ${fullyTrained}/${employees.length} current` : `${fullyTrained}/${employees.length} fully trained`,
      icon: GraduationCap,
      color: trainingPct === 100 ? "text-status-green" : "text-amber-400",
      bgColor: "bg-amber-400/10",
      href: "/training",
    },
  ];

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
            href="/inventory"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Chemical
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p>
            <strong className="text-amber-400">OSHA 29 CFR 1910.1200</strong> (the Hazard Communication Standard) is consistently one of OSHA&apos;s most-cited standards. This dashboard provides a real-time view of your compliance status across all HazCom requirements: SDS management, container labeling, employee training, and the written program.
          </p>
        </HelpCard>
      </div>

      {/* Inspection Readiness Banner */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-status-green/20 via-status-green/10 to-navy-800 border border-status-green/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-status-green/20 border-2 border-status-green flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-status-green" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-white">
                  Inspection Readiness
                </h2>
                <span className={`text-3xl font-display font-black ${compliance.score >= 90 ? "text-status-green" : compliance.score >= 70 ? "text-status-amber" : "text-status-red"}`}>
                  {compliance.score}%
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
            className="flex items-center gap-2 text-status-green hover:text-white text-sm font-medium transition-colors"
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
            <button
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              {showAllActivity ? "Show Less" : "View All"}
            </button>
          </div>
          <div className="space-y-1">
            {(showAllActivity ? recentActivity : recentActivity.slice(0, 6)).map((item) => {
              const Icon = activityIcons[item.type] || BookOpen;
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
                  <span className="text-xs text-gray-500 flex-shrink-0">{item.time}</span>
                </div>
              );
            })}
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
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.detail}</p>
                    <Link
                      href={item.fixHref}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {item.fixLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
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
        complianceScore={compliance.score}
      />
    </DashboardLayout>
  );
}
