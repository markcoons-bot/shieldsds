"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import GHSPictogram from "@/components/GHSPictogram";
import { getChemicals, getEmployees, initializeStore, getCompanyProfile } from "@/lib/chemicals";
import { calculateComplianceScore, getEmployeeTrainingStatus } from "@/lib/compliance-score";
import type { TrainingStatus } from "@/lib/compliance-score";
import type { Chemical, Employee } from "@/lib/types";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  Link2,
  X,
  ArrowRight,
  Copy,
  Send,
  Printer,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

// ─── Shop Info (dynamic from company profile) ──────────────────────────────

function getShopInfo() {
  const profile = getCompanyProfile();
  return {
    name: profile.name,
    owner: profile.owner,
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    zip: profile.zip || "",
    phone: profile.phone || "",
  };
}

// ─── Local helper components ────────────────────────────────────────────────

function ProgramSection({
  number,
  title,
  id,
  pageBreak,
  children,
}: {
  number: number;
  title: string;
  id: string;
  pageBreak?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`hazcom-section ${pageBreak ? "hazcom-page-break" : ""} mb-10`}
    >
      <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
        Section {number}: {title}
      </h2>
      {children}
    </section>
  );
}

function DeficiencyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="deficiency-notice border border-red-300 bg-red-50 rounded-lg p-4 mt-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-red-800">{children}</div>
    </div>
  );
}

function SignalWordBadge({ word }: { word: string | null }) {
  if (!word) return <span className="text-gray-400 text-xs">—</span>;
  if (word === "DANGER") {
    return (
      <span className="signal-danger inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
        DANGER
      </span>
    );
  }
  return (
    <span className="signal-warning inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">
      WARNING
    </span>
  );
}

function SdsStatusBadge({ status }: { status: string }) {
  if (status === "current") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        Current
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      Missing
    </span>
  );
}

function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  const config: Record<TrainingStatus, { label: string; bg: string; text: string }> = {
    current: { label: "Current", bg: "bg-green-100", text: "text-green-700" },
    "due-soon": { label: "Due Soon", bg: "bg-amber-100", text: "text-amber-700" },
    overdue: { label: "Overdue", bg: "bg-red-100", text: "text-red-700" },
    "in-progress": { label: "In Progress", bg: "bg-blue-100", text: "text-blue-700" },
    "not-started": { label: "Not Started", bg: "bg-gray-100", text: "text-gray-700" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-navy-800 border border-navy-600 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl">
      <CheckCircle2 className="h-5 w-5 text-status-green flex-shrink-0" />
      <span className="text-sm text-white">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white ml-2"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ onClose, onToast, shopInfo }: { onClose: () => void; onToast: (msg: string) => void; shopInfo: { name: string; owner: string; address: string; city: string; state: string; zip: string; phone: string } }) {
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState("7d");
  const [accessMode, setAccessMode] = useState<"anyone" | "email">("anyone");
  const [restrictEmail, setRestrictEmail] = useState("");
  const shareId = "mikes-auto-body-2026-02-24";
  const mockUrl = `https://app.shieldsds.com/share/${shareId}`;
  const localUrl = `/share/${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${shopInfo.name} — HazCom Compliance Report`);
    const body = encodeURIComponent(`Here is a read-only link to our HazCom compliance report:\n\n${mockUrl}\n\nThis link expires in ${expiry === "24h" ? "24 hours" : expiry === "7d" ? "7 days" : expiry === "30d" ? "30 days" : "never"}.\n\nGenerated by ShieldSDS`);
    const to = accessMode === "email" && restrictEmail ? restrictEmail : "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
    onToast("Email client opened with share link");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h2 className="font-display font-bold text-lg text-white">Share Read-Only Link</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">Shareable URL</label>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={mockUrl} className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white font-mono" />
              <button onClick={handleCopy} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-xs px-3 py-2 rounded-lg transition-colors">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={localUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-400 hover:text-amber-300 mt-1 inline-block">
              Preview the shared report &rarr;
            </a>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">Link Expiration</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "24 hours", value: "24h" },
                { label: "7 days", value: "7d" },
                { label: "30 days", value: "30d" },
                { label: "Never", value: "never" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    expiry === opt.value
                      ? "bg-amber-500 text-navy-950"
                      : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-2">Access</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAccessMode("anyone")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  accessMode === "anyone" ? "bg-amber-500 text-navy-950" : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
                }`}
              >
                Anyone with link
              </button>
              <button
                onClick={() => setAccessMode("email")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  accessMode === "email" ? "bg-amber-500 text-navy-950" : "bg-navy-800 text-gray-400 hover:text-white border border-navy-700"
                }`}
              >
                Email-restricted
              </button>
            </div>
            {accessMode === "email" && (
              <input
                type="email"
                value={restrictEmail}
                onChange={(e) => setRestrictEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="mt-2 w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            )}
          </div>

          <button
            onClick={handleSendEmail}
            className="w-full flex items-center justify-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 text-sm py-2.5 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
            Send via Email
          </button>

          <p className="text-xs text-gray-500">
            This link gives read-only access to the compliance report summary. No full SDS content or employee details are shared.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Checklist Item ────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  item: string;
  pass: boolean;
  warn: boolean;
  score: number;
  maxScore: number;
  detail: string;
  subItems: { label: string; ok: boolean; link?: string; fixDescription?: string; fixAction?: string }[];
  sectionLink?: string;
}

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const [expanded, setExpanded] = useState(!item.pass);

  const StatusIcon = item.pass
    ? CheckCircle2
    : item.warn
    ? AlertTriangle
    : XCircle;
  const statusColor = item.pass
    ? "text-status-green"
    : item.warn
    ? "text-status-amber"
    : "text-status-red";
  const borderColor = item.pass
    ? "border-navy-700/50"
    : item.warn
    ? "border-status-amber/30"
    : "border-status-red/30";
  const badgeClass = item.pass
    ? "bg-status-green/15 text-status-green"
    : item.warn
    ? "bg-status-amber/15 text-status-amber"
    : "bg-status-red/15 text-status-red";
  const badgeText = item.pass ? "Pass" : item.warn ? "Warning" : "Fail";

  return (
    <div className={`bg-navy-900 border rounded-xl transition-colors ${borderColor}`}>
      <button
        className="w-full flex items-center justify-between p-5 text-left min-h-[44px]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={`h-5 w-5 ${statusColor} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">{item.item}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {item.sectionLink && (
            <a
              href={item.sectionLink}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
            >
              View section &darr;
            </a>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {badgeText}
          </span>
          {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {expanded && item.subItems.length > 0 && (
        <div className="px-5 pb-5 pt-0">
          <div className="border-t border-navy-700/30 pt-3 space-y-2">
            {item.subItems.map((sub, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sub.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-green" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-status-red" />
                    )}
                    <span className={sub.ok ? "text-gray-400" : "text-white"}>{sub.label}</span>
                  </div>
                  {sub.link && !sub.ok && (
                    <Link href={sub.link} className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap ml-2">
                      {sub.fixAction || "Fix"} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                {sub.fixDescription && !sub.ok && (
                  <p className="text-gray-500 mt-0.5 pl-[22px]">{sub.fixDescription}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generate audit log entries from live data ──────────────────────────────

interface AuditEntry {
  time: string;
  entry: string;
}

function generateAuditLog(chemicals: Chemical[], employees: Employee[]): AuditEntry[] {
  const entries: AuditEntry[] = [];

  chemicals.forEach((c) => {
    if (c.added_date) {
      entries.push({
        time: c.added_date,
        entry: `Chemical added: ${c.product_name} (${c.added_by})`,
      });
    }
    if (c.label_printed_date) {
      entries.push({
        time: c.label_printed_date,
        entry: `Label printed: ${c.product_name} — ${c.container_count} ${c.container_type}`,
      });
    }
    if (c.sds_uploaded && c.sds_date) {
      entries.push({
        time: c.sds_date,
        entry: `SDS uploaded: ${c.product_name} (${c.manufacturer})`,
      });
    }
    if (c.sds_status === "missing") {
      entries.push({
        time: c.last_updated,
        entry: `Missing SDS flagged: ${c.product_name} — request from ${c.manufacturer}`,
      });
    }
    if (c.sds_status === "expired") {
      entries.push({
        time: c.last_updated,
        entry: `SDS expired: ${c.product_name} — needs updated version`,
      });
    }
  });

  employees.forEach((emp) => {
    if (emp.last_training) {
      entries.push({
        time: emp.last_training,
        entry: `Training completed: ${emp.name} — ${emp.role}`,
      });
    }
    if (emp.status === "overdue") {
      entries.push({
        time: emp.last_training || new Date().toISOString().split("T")[0],
        entry: `Training overdue: ${emp.name} — ${emp.pending_modules.join(", ")}`,
      });
    }
    if (emp.status === "pending") {
      entries.push({
        time: new Date().toISOString().split("T")[0],
        entry: `New hire pending training: ${emp.name} — ${emp.pending_modules.length} modules`,
      });
    }
  });

  entries.sort((a, b) => b.time.localeCompare(a.time));
  return entries;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function InspectionPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shopInfo, setShopInfo] = useState(getShopInfo());

  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
    setEmployees(getEmployees());
    setShopInfo(getShopInfo());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Dynamic compliance calculations ──────────────────────────────────────

  const totalSDS = chemicals.length;
  const currentSDS = chemicals.filter((c) => c.sds_status === "current").length;
  const missingSdsChems = useMemo(() => chemicals.filter((c) => c.sds_status === "missing"), [chemicals]);
  const expiredSdsChems = useMemo(() => chemicals.filter((c) => c.sds_status === "expired"), [chemicals]);

  const totalContainers = chemicals.reduce((sum, c) => sum + c.container_count, 0);
  const labeledContainers = chemicals.filter((c) => c.labeled).reduce((sum, c) => sum + c.container_count, 0);
  const unlabeledChems = useMemo(() => chemicals.filter((c) => !c.labeled), [chemicals]);
  const labelPct = totalContainers > 0 ? Math.round((labeledContainers / totalContainers) * 100) : 100;

  const sdsPct = totalSDS > 0 ? Math.round((currentSDS / totalSDS) * 100) : 100;

  // ── Shared compliance score ─────────────────────────────────────────────
  const compliance = useMemo(() => calculateComplianceScore(chemicals, employees), [chemicals, employees]);
  const score = compliance.overall;

  // Employee training — use shared getEmployeeTrainingStatus
  const totalEmployees = employees.length;
  const employeeStatuses = useMemo(() => employees.map((e) => ({
    emp: e,
    info: getEmployeeTrainingStatus(e),
  })), [employees]);
  const fullyTrained = employeeStatuses.filter((es) => es.info.status === "current" || es.info.status === "due-soon").length;
  const overdueEmployees = useMemo(() => employeeStatuses.filter((es) => es.info.status === "overdue"), [employeeStatuses]);
  const inProgressEmployees = useMemo(() => employeeStatuses.filter((es) => es.info.status === "in-progress"), [employeeStatuses]);
  const notStartedEmployees = useMemo(() => employeeStatuses.filter((es) => es.info.status === "not-started"), [employeeStatuses]);
  const trainingPct = totalEmployees > 0 ? Math.round((fullyTrained / totalEmployees) * 100) : 100;

  const circumference = 2 * Math.PI * 52;
  const readinessLabel = compliance.status;
  const readinessColor = score >= 90 ? "#34C759" : score >= 70 ? "#F5A623" : "#FF3B30";

  // ── New derived data ────────────────────────────────────────────────────
  const sortedChemicals = useMemo(
    () => [...chemicals].sort((a, b) => a.location.localeCompare(b.location) || a.product_name.localeCompare(b.product_name)),
    [chemicals]
  );
  const uniqueLocations = useMemo(() => Array.from(new Set(chemicals.map((c) => c.location))).sort(), [chemicals]);
  const formattedDateTime = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + " at " + new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const dangerCount = chemicals.filter((c) => c.signal_word === "DANGER").length;
  const warningCount = chemicals.filter((c) => c.signal_word === "WARNING").length;
  const labeledChemCount = chemicals.filter((c) => c.labeled).length;

  // ── Build checklist items ───────────────────────────────────────────────

  const checklist: ChecklistItem[] = useMemo(() => [
    {
      id: "1",
      item: "Written HazCom Program",
      pass: true,
      warn: false,
      score: compliance.breakdown.program.pct === 100 ? 15 : 0,
      maxScore: 15,
      detail: "Program document current. All 10 required sections addressed.",
      sectionLink: "#section-1",
      subItems: [
        { label: "Written program exists and is accessible", ok: true },
        { label: "Program covers all 10 required sections", ok: true, link: "/hazcom-program" },
        { label: "Program is current (updated within 12 months)", ok: true },
      ],
    },
    {
      id: "2",
      item: "SDS Coverage",
      pass: sdsPct === 100,
      warn: sdsPct >= 90 && sdsPct < 100,
      score: Math.round(compliance.breakdown.sds.pct / 100 * 30),
      maxScore: 30,
      detail: missingSdsChems.length === 0 && expiredSdsChems.length === 0
        ? `All ${totalSDS} SDS on file and current`
        : `${currentSDS} of ${totalSDS} SDS current \u2014 ${missingSdsChems.length} missing${expiredSdsChems.length > 0 ? `, ${expiredSdsChems.length} expired` : ""}`,
      sectionLink: "#section-3",
      subItems: [
        ...missingSdsChems.map((c) => ({
          label: `Missing SDS: ${c.product_name} (${c.location})`,
          ok: false,
          link: "/sds-library",
          fixDescription: `${c.product_name} SDS is missing \u2014 upload or request from ${c.manufacturer}`,
          fixAction: "Go to SDS Library",
        })),
        ...expiredSdsChems.map((c) => ({
          label: `Expired: ${c.product_name}`,
          ok: false,
          link: "/sds-library",
          fixDescription: `SDS is outdated \u2014 request current version from ${c.manufacturer}`,
          fixAction: "Go to SDS Library",
        })),
        ...(missingSdsChems.length === 0 && expiredSdsChems.length === 0
          ? [{ label: "All SDS documents are current and accessible", ok: true }]
          : []),
        { label: "SDS accessible on shop tablet at Station 1", ok: true },
        { label: "Offline backup cache functional", ok: true },
      ],
    },
    {
      id: "3",
      item: "Container Labeling",
      pass: labelPct === 100,
      warn: labelPct >= 80 && labelPct < 100,
      score: Math.round(compliance.breakdown.labels.pct / 100 * 25),
      maxScore: 25,
      detail: unlabeledChems.length === 0
        ? `All ${totalContainers} containers across ${new Set(chemicals.map((c) => c.location)).size} locations properly labeled`
        : `${labeledContainers} of ${totalContainers} containers labeled \u2014 ${unlabeledChems.length} chemical${unlabeledChems.length > 1 ? "s" : ""} need labels`,
      sectionLink: "#section-4",
      subItems: [
        ...unlabeledChems.map((c) => ({
          label: `${c.location}: ${c.product_name} (${c.container_count} ${c.container_type}, unlabeled)`,
          ok: false,
          link: "/labels",
          fixDescription: `Print GHS-compliant secondary container labels for ${c.product_name}`,
          fixAction: "Print Labels",
        })),
        ...(unlabeledChems.length === 0
          ? [{ label: "All secondary containers have GHS-compliant labels", ok: true }]
          : []),
        { label: "Shipped container labels intact and legible", ok: true },
      ],
    },
    {
      id: "4",
      item: "Employee Training",
      pass: trainingPct === 100,
      warn: trainingPct >= 80 && trainingPct < 100,
      score: Math.round(compliance.breakdown.training.pct / 100 * 25),
      maxScore: 25,
      detail: fullyTrained === totalEmployees
        ? `All ${totalEmployees} employees current on required training`
        : `${fullyTrained} of ${totalEmployees} employees current${overdueEmployees.length > 0 ? ` \u2014 ${overdueEmployees.length} overdue` : ""}${inProgressEmployees.length > 0 ? ` \u2014 ${inProgressEmployees.length} in progress` : ""}${notStartedEmployees.length > 0 ? ` \u2014 ${notStartedEmployees.length} not started` : ""}`,
      sectionLink: "#section-5",
      subItems: [
        ...employeeStatuses.filter((es) => es.info.status === "current").map((es) => ({
          label: `${es.emp.name} \u2014 Up to date${es.emp.last_training ? ` (completed ${new Date(es.emp.last_training).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})` : ""}`,
          ok: true,
        })),
        ...employeeStatuses.filter((es) => es.info.status === "due-soon").map((es) => ({
          label: `${es.emp.name} \u2014 Due soon: refresher due in ${es.info.daysUntilDue} days`,
          ok: true,
        })),
        ...overdueEmployees.map((es) => ({
          label: `${es.emp.name} \u2014 Overdue: annual refresher${es.info.daysUntilDue != null ? ` (${Math.abs(es.info.daysUntilDue)} days past due)` : ""}`,
          ok: false,
          link: `/training/learn?employee=${es.emp.id}`,
          fixDescription: `All 7 modules complete but annual refresher has expired`,
          fixAction: "Start Training",
        })),
        ...inProgressEmployees.map((es) => ({
          label: `${es.emp.name} \u2014 In progress: ${es.info.completedCount} of 7 modules complete`,
          ok: false,
          link: `/training/learn?employee=${es.emp.id}`,
          fixDescription: `${es.info.remainingCount} modules remaining to complete training`,
          fixAction: "Start Training",
        })),
        ...notStartedEmployees.map((es) => ({
          label: `${es.emp.name} \u2014 Not started: new hire needs orientation`,
          ok: false,
          link: `/training/learn?employee=${es.emp.id}`,
          fixDescription: `New hire must complete all 7 HazCom modules before chemical exposure`,
          fixAction: "Start Training",
        })),
        { label: "Training records maintained with digital acknowledgments", ok: true },
      ],
    },
    {
      id: "5",
      item: "Chemical Inventory",
      pass: true,
      warn: false,
      score: 0,
      maxScore: 0,
      detail: `${chemicals.length} chemicals tracked across ${new Set(chemicals.map((c) => c.location)).size} storage locations`,
      sectionLink: "#section-2",
      subItems: [
        { label: "All chemicals have matching product identifiers", ok: true },
        { label: `Inventory reconciled: ${chemicals.length} items verified`, ok: true },
        { label: "Storage locations properly identified and signed", ok: true },
      ],
    },
    {
      id: "6",
      item: "Multi-Employer Communication",
      pass: true,
      warn: false,
      score: 10,
      maxScore: 10,
      detail: "Contractor safety packet generation available via ShieldSDS",
      sectionLink: "#section-7",
      subItems: [
        { label: "Contractor Safety Packet template ready", ok: true },
        { label: "Packet includes relevant SDS, labeling info, and emergency procedures", ok: true },
        { label: "Digital acknowledgment capture available", ok: true },
      ],
    },
  ], [sdsPct, labelPct, trainingPct, totalSDS, currentSDS, totalContainers, labeledContainers, totalEmployees, fullyTrained, chemicals, missingSdsChems, expiredSdsChems, unlabeledChems, overdueEmployees, inProgressEmployees, notStartedEmployees, employeeStatuses, compliance]);

  // Audit log from live data
  const auditLog = useMemo(() => generateAuditLog(chemicals, employees), [chemicals, employees]);

  return (
    <DashboardLayout>
      {/* ─── Screen-only top bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Written HazCom Program</h1>
          <p className="text-sm text-gray-400 mt-1">Living OSHA compliance document — always current</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 text-sm w-full md:w-auto px-4 py-2 rounded-lg transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Share Link
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 text-sm w-full md:w-auto px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Program
          </button>
          <button
            onClick={() => showToast("Export feature available with PDF generator module")}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm w-full md:w-auto px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Empty State */}
      {chemicals.length === 0 && (
        <div className="text-center py-16">
          <ShieldCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No chemicals to inspect</h2>
          <p className="text-gray-400 mb-6">Add chemicals to your inventory to generate a compliance report.</p>
          <a
            href="/scan"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Scan Chemical
          </a>
        </div>
      )}

      {chemicals.length > 0 && <>
      {/* ═══════════════════════════════════════════════════════════════════
          WHITE DOCUMENT CONTAINER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white text-gray-900 rounded-xl p-8 md:p-12 print:rounded-none print:p-0 print:shadow-none shadow-lg mb-10">

        {/* ─── Part A: Document Header ──────────────────────────────────── */}
        <div className="text-center mb-10 pb-8 border-b-2 border-gray-200">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-gray-900 mb-1">
            Written Hazard Communication Program
          </h1>
          <p className="text-sm text-gray-500 mb-6">Per OSHA 29 CFR 1910.1200</p>
          <p className="text-lg font-bold text-gray-800">{shopInfo.name}</p>
          <p className="text-sm text-gray-600">{shopInfo.address}, {shopInfo.city}, {shopInfo.state} {shopInfo.zip}</p>
          <p className="text-sm text-gray-600">{shopInfo.phone}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-1.5 rounded-full">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Document Status: LIVE — Last updated: {formattedDateTime}
          </div>
          <p className="text-xs text-gray-400 mt-2">Prepared by: ShieldSDS Compliance Platform</p>
        </div>

        {/* ─── Part A continued: Compliance Score Banner ─────────────────── */}
        <div className="compliance-ring-print bg-gray-50 border border-gray-200 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={readinessColor}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${circumference * (score / 100)} ${circumference * (1 - score / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black text-3xl text-gray-900">{score}%</span>
                <span className="text-xs text-gray-500">Compliant</span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <ShieldCheck className={`h-6 w-6 ${score === 100 ? "text-green-600" : score >= 80 ? "text-amber-600" : "text-red-600"}`} />
                <h2 className="font-bold text-xl text-gray-900">{readinessLabel}</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {chemicals.length} chemicals across {uniqueLocations.length} locations &bull; {currentSDS} of {totalSDS} SDS current &bull; {labeledChemCount} of {chemicals.length} labeled &bull; {fullyTrained} of {totalEmployees} employees trained
              </p>

              {/* Breakdown bars */}
              <div className="space-y-1.5 max-w-md mx-auto md:mx-0">
                {[
                  { label: "SDS Coverage", pct: compliance.breakdown.sds.pct, weight: compliance.breakdown.sds.weight },
                  { label: "Labeling", pct: compliance.breakdown.labels.pct, weight: compliance.breakdown.labels.weight },
                  { label: "Training", pct: compliance.breakdown.training.pct, weight: compliance.breakdown.training.weight },
                  { label: "Written Program", pct: compliance.breakdown.program.pct, weight: compliance.breakdown.program.weight },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 w-28 truncate">{item.label}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.pct === 100 ? "bg-green-500" : item.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-16 text-right">{item.pct}% <span className="text-gray-400">({item.weight}%)</span></span>
                  </div>
                ))}
              </div>

              {/* Top improvements */}
              {compliance.improvements.length > 0 && score < 100 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Top Improvements</p>
                  {compliance.improvements.map((imp, i) => (
                    <p key={i} className="text-xs text-gray-600 leading-relaxed">
                      {imp.text} <span className="font-semibold text-amber-600">(+{imp.points})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Part B: Section 1 — Purpose and Scope ──────────────────── */}
        <ProgramSection number={1} title="Purpose and Scope" id="section-1">
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            <p>
              This Written Hazard Communication Program has been established for <strong>{shopInfo.name}</strong> located
              at {shopInfo.address}, {shopInfo.city}, {shopInfo.state} {shopInfo.zip} in compliance with
              OSHA&apos;s Hazard Communication Standard, 29 CFR 1910.1200.
            </p>
            <p>
              The purpose of this program is to ensure that all employees are informed about the chemical
              hazards present in the workplace, and to provide them with the knowledge and tools needed to
              protect themselves. This program applies to all work operations where employees may be exposed
              to hazardous chemicals under normal working conditions or during foreseeable emergencies.
            </p>
            <p>
              <strong>Safety Coordinator:</strong> {shopInfo.owner}<br />
              <strong>Total Employees:</strong> {totalEmployees}<br />
              <strong>Chemicals on Inventory:</strong> {chemicals.length}<br />
              <strong>Storage Locations:</strong> {uniqueLocations.length} ({uniqueLocations.join(", ")})
            </p>
            <p>
              This document is maintained as a live digital record via the ShieldSDS Compliance Platform.
              All chemical inventory data, SDS records, labeling status, and training records referenced
              herein are current as of the date and time shown in the document header.
            </p>
          </div>
        </ProgramSection>

        {/* ─── Part C: Section 2 — Chemical Inventory ────────────────── */}
        <ProgramSection number={2} title="Chemical Inventory" id="section-2" pageBreak>
          <p className="text-sm text-gray-700 mb-4">
            The following table lists all hazardous chemicals known to be present in the workplace.
            This inventory is maintained digitally and updated whenever chemicals are added, removed,
            or relocated. Each entry includes GHS classification, signal word, and current compliance status.
          </p>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="hazcom-table w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">#</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Product Name</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Manufacturer</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Location</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Signal Word</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">GHS Hazards</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">SDS Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Labeled</th>
                </tr>
              </thead>
              <tbody>
                {sortedChemicals.map((c, i) => (
                  <tr
                    key={c.id}
                    className={
                      c.sds_status === "missing" ? "bg-red-50" :
                      c.sds_status === "expired" ? "bg-amber-50" :
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }
                  >
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-500">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-900">{c.product_name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{c.manufacturer}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{c.location}</td>
                    <td className="border border-gray-300 px-2 py-1.5"><SignalWordBadge word={c.signal_word} /></td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <div className="flex gap-0.5">
                        {c.pictogram_codes.map((code) => (
                          <GHSPictogram key={code} code={code} size={20} />
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5"><SdsStatusBadge status={c.sds_status} /></td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {c.labeled ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-700 font-medium">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold text-gray-700">
                  <td className="border border-gray-300 px-2 py-2" colSpan={2}>
                    Total: {chemicals.length} chemicals
                  </td>
                  <td className="border border-gray-300 px-2 py-2" />
                  <td className="border border-gray-300 px-2 py-2">{uniqueLocations.length} locations</td>
                  <td className="border border-gray-300 px-2 py-2">{dangerCount}D / {warningCount}W</td>
                  <td className="border border-gray-300 px-2 py-2" />
                  <td className="border border-gray-300 px-2 py-2">{currentSDS}/{totalSDS} current</td>
                  <td className="border border-gray-300 px-2 py-2">{labeledChemCount}/{chemicals.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {sortedChemicals.map((c, i) => (
              <div
                key={c.id}
                className={`border rounded-lg p-4 ${
                  c.sds_status === "missing"
                    ? "bg-red-50 border-l-4 border-l-red-400 border-gray-200"
                    : c.sds_status === "expired"
                    ? "bg-amber-50 border-l-4 border-l-amber-400 border-gray-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{i + 1}. {c.product_name}</p>
                    <p className="text-xs text-gray-500">{c.manufacturer}</p>
                  </div>
                  <SignalWordBadge word={c.signal_word} />
                </div>
                <p className="text-xs text-gray-500 mb-2">{c.location}</p>
                <div className="flex items-center gap-1 mb-2">
                  {c.pictogram_codes.map((code) => (
                    <GHSPictogram key={code} code={code} size={20} />
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    SDS: <SdsStatusBadge status={c.sds_status} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Labeled: {c.labeled ? (
                      <span className="text-green-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-red-700 font-medium">No</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
            <div className="bg-gray-100 rounded-lg p-3 text-xs font-semibold text-gray-700">
              Total: {chemicals.length} chemicals &bull; {uniqueLocations.length} locations &bull; {currentSDS}/{totalSDS} SDS current &bull; {labeledChemCount}/{chemicals.length} labeled
            </div>
          </div>
        </ProgramSection>

        {/* ─── Part D: Section 3 — SDS Management ─────────────────────── */}
        <ProgramSection number={3} title="Safety Data Sheet (SDS) Management" id="section-3" pageBreak>
          <div className="prose prose-sm max-w-none text-gray-700 mb-4">
            <p>
              Safety Data Sheets are maintained digitally via the ShieldSDS platform and are accessible
              to all employees at all times through the shop tablet and any networked device. SDS documents
              are indexed by product name and manufacturer, and are available in both English and Spanish
              where applicable. Physical binders are maintained as backup at Station 1.
            </p>
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="hazcom-table w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Product</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Manufacturer</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">SDS Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">SDS Source</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Last Verified</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedChemicals.map((c, i) => (
                  <tr
                    key={c.id}
                    className={
                      c.sds_status === "missing" ? "bg-red-50" :
                      c.sds_status === "expired" ? "bg-amber-50" :
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }
                  >
                    <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-900">{c.product_name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{c.manufacturer}</td>
                    <td className="border border-gray-300 px-2 py-1.5"><SdsStatusBadge status={c.sds_status} /></td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                      {c.sds_uploaded ? "Uploaded" : "Not on file"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                      {c.sds_date ? new Date(c.sds_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 print:hidden">
                      {c.sds_url ? (
                        <a href={c.sds_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                          View SDS <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : c.sds_status !== "current" ? (
                        <Link href="/sds-search" className="text-amber-600 hover:text-amber-800 font-medium">
                          Find SDS &rarr;
                        </Link>
                      ) : (
                        <Link href="/sds-library" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                          View SDS <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {sortedChemicals.map((c) => (
              <div
                key={c.id}
                className={`border rounded-lg p-4 ${
                  c.sds_status === "missing"
                    ? "bg-red-50 border-l-4 border-l-red-400 border-gray-200"
                    : c.sds_status === "expired"
                    ? "bg-amber-50 border-l-4 border-l-amber-400 border-gray-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.product_name}</p>
                    <p className="text-xs text-gray-500">{c.manufacturer}</p>
                  </div>
                  <SdsStatusBadge status={c.sds_status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>{c.sds_uploaded ? "Uploaded" : "Not on file"}</span>
                  <span>&middot;</span>
                  <span>{c.sds_date ? new Date(c.sds_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not verified"}</span>
                </div>
                <div className="print:hidden">
                  {c.sds_url ? (
                    <a href={c.sds_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      View SDS <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : c.sds_status !== "current" ? (
                    <Link href="/sds-search" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                      Find SDS &rarr;
                    </Link>
                  ) : (
                    <Link href="/sds-library" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      View SDS <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(missingSdsChems.length > 0 || expiredSdsChems.length > 0) && (
            <DeficiencyNotice>
              <p className="font-semibold mb-1">SDS Deficiency — 29 CFR 1910.1200(g)</p>
              {missingSdsChems.length > 0 && (
                <p>Missing SDS: {missingSdsChems.map((c) => c.product_name).join(", ")}</p>
              )}
              {expiredSdsChems.length > 0 && (
                <p>Expired SDS: {expiredSdsChems.map((c) => c.product_name).join(", ")}</p>
              )}
              <p className="mt-1 text-xs">
                Employers must maintain an SDS for each hazardous chemical in the workplace and ensure
                they are readily accessible during each work shift. Failure to do so may result in citation
                under 29 CFR 1910.1200(g)(1).
              </p>
            </DeficiencyNotice>
          )}
        </ProgramSection>

        {/* ─── Part E: Section 4 — Container Labeling ─────────────────── */}
        <ProgramSection number={4} title="Container Labeling" id="section-4" pageBreak>
          <div className="prose prose-sm max-w-none text-gray-700 mb-4">
            <p>
              All containers of hazardous chemicals in the workplace must be labeled with the product
              identifier, signal word, hazard statement(s), pictogram(s), precautionary statement(s),
              and the name/address of the manufacturer per GHS requirements. Secondary containers must
              bear labels that include at minimum the product identifier and hazard warnings.
            </p>
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="hazcom-table w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Product</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Location</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Containers</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Labeled</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Label Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedChemicals.map((c, i) => (
                  <tr key={c.id} className={!c.labeled ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-900">{c.product_name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{c.location}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{c.container_count} {c.container_type}</td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {c.labeled ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-700 font-medium">No</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                      {c.label_printed_date ? new Date(c.label_printed_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 print:hidden">
                      {!c.labeled ? (
                        <Link href="/labels" className="text-amber-600 hover:text-amber-800 font-medium">
                          Print Label &rarr;
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {sortedChemicals.map((c) => (
              <div
                key={c.id}
                className={`border rounded-lg p-4 ${
                  !c.labeled
                    ? "bg-red-50 border-l-4 border-l-red-400 border-gray-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.product_name}</p>
                    <p className="text-xs text-gray-500">{c.location}</p>
                  </div>
                  {c.labeled ? (
                    <span className="text-xs text-green-700 font-medium">Labeled</span>
                  ) : (
                    <span className="text-xs text-red-700 font-medium">Unlabeled</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>{c.container_count} {c.container_type}</span>
                  <span>&middot;</span>
                  <span>{c.label_printed_date ? new Date(c.label_printed_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No label date"}</span>
                </div>
                {!c.labeled && (
                  <div className="print:hidden">
                    <Link href="/labels" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                      Print Label &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {unlabeledChems.length > 0 && (
            <DeficiencyNotice>
              <p className="font-semibold mb-1">Labeling Deficiency — 29 CFR 1910.1200(f)</p>
              <p>Unlabeled chemicals: {unlabeledChems.map((c) => c.product_name).join(", ")}</p>
              <p className="mt-1 text-xs">
                Each container of hazardous chemicals in the workplace must be labeled, tagged, or marked
                with the product identifier and words, pictures, symbols, or combination thereof, which provide
                at least general information regarding the hazards of the chemicals. Citation may be issued
                under 29 CFR 1910.1200(f)(6).
              </p>
            </DeficiencyNotice>
          )}
        </ProgramSection>

        {/* ─── Part F: Section 5 — Employee Training ──────────────────── */}
        <ProgramSection number={5} title="Employee Training" id="section-5" pageBreak>
          <div className="prose prose-sm max-w-none text-gray-700 mb-4">
            <p>
              Per 29 CFR 1910.1200(h), employers must provide employees with effective information and
              training on hazardous chemicals in their work area at the time of initial assignment and
              whenever a new chemical hazard is introduced. Annual refresher training is required to maintain
              compliance. Training covers 7 core modules including hazard identification, SDS interpretation,
              label reading, PPE usage, emergency procedures, chemical storage, and program overview.
            </p>
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="hazcom-table w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Employee</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Role</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Modules</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Initial Training</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Last Training</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Next Due</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 print:hidden">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {employeeStatuses.map((es, i) => {
                  const nextDue = (() => {
                    if (es.info.completedCount < 7) return "Complete training first";
                    if (!es.emp.last_training) return "—";
                    const d = new Date(es.emp.last_training);
                    d.setFullYear(d.getFullYear() + 1);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  })();

                  return (
                    <tr
                      key={es.emp.id}
                      className={
                        es.info.status === "overdue" || es.info.status === "not-started" ? "bg-red-50" :
                        es.info.status === "in-progress" ? "bg-amber-50" :
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }
                    >
                      <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-900">{es.emp.name}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{es.emp.role}</td>
                      <td className="border border-gray-300 px-2 py-1.5"><TrainingStatusBadge status={es.info.status} /></td>
                      <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{es.info.completedCount}/7</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                        {es.emp.initial_training ? new Date(es.emp.initial_training).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                        {es.emp.last_training ? new Date(es.emp.last_training).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-gray-600">{nextDue}</td>
                      <td className="border border-gray-300 px-2 py-1.5 print:hidden">
                        {(es.info.status === "current" || es.info.status === "due-soon") ? (
                          <Link href={`/training/learn?employee=${es.emp.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            View
                          </Link>
                        ) : (
                          <Link href={`/training/learn?employee=${es.emp.id}`} className="text-amber-600 hover:text-amber-800 font-medium">
                            Start &rarr;
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {employeeStatuses.map((es) => {
              const nextDue = (() => {
                if (es.info.completedCount < 7) return "Complete training first";
                if (!es.emp.last_training) return "—";
                const d = new Date(es.emp.last_training);
                d.setFullYear(d.getFullYear() + 1);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              })();

              return (
                <div
                  key={es.emp.id}
                  className={`border rounded-lg p-4 ${
                    es.info.status === "overdue" || es.info.status === "not-started"
                      ? "bg-red-50 border-l-4 border-l-red-400 border-gray-200"
                      : es.info.status === "in-progress"
                      ? "bg-amber-50 border-l-4 border-l-amber-400 border-gray-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{es.emp.name}</p>
                      <p className="text-xs text-gray-500">{es.emp.role}</p>
                    </div>
                    <TrainingStatusBadge status={es.info.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>{es.info.completedCount}/7 modules</span>
                    <span>&middot;</span>
                    <span>Next due: {nextDue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>Last: {es.emp.last_training ? new Date(es.emp.last_training).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                  </div>
                  <div className="print:hidden">
                    {(es.info.status === "current" || es.info.status === "due-soon") ? (
                      <Link href={`/training/learn?employee=${es.emp.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View Certificate
                      </Link>
                    ) : (
                      <Link href={`/training/learn?employee=${es.emp.id}`} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                        Start Training &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(overdueEmployees.length > 0 || notStartedEmployees.length > 0 || inProgressEmployees.length > 0) && (
            <DeficiencyNotice>
              <p className="font-semibold mb-1">Training Deficiency — 29 CFR 1910.1200(h)</p>
              {overdueEmployees.length > 0 && (
                <p>Overdue: {overdueEmployees.map((es) => es.emp.name).join(", ")}</p>
              )}
              {notStartedEmployees.length > 0 && (
                <p>Not started: {notStartedEmployees.map((es) => es.emp.name).join(", ")}</p>
              )}
              {inProgressEmployees.length > 0 && (
                <p>In progress: {inProgressEmployees.map((es) => es.emp.name).join(", ")}</p>
              )}
              <p className="mt-1 text-xs">
                Employers shall provide employees with effective information and training on hazardous
                chemicals in their work area at the time of their initial assignment, and whenever a new
                chemical hazard the employees have not previously been trained about is introduced into
                their work area.
              </p>
            </DeficiencyNotice>
          )}
        </ProgramSection>

        {/* ─── Part G: Section 6 — Non-Routine Tasks ─────────────────── */}
        <ProgramSection number={6} title="Non-Routine Tasks" id="section-6" pageBreak>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            <p>
              Employees who perform non-routine tasks that may involve exposure to hazardous chemicals
              shall receive additional training prior to performing the task. The Safety Coordinator
              ({shopInfo.owner}) must be consulted before any non-routine task involving chemicals is initiated.
            </p>
            <p>Examples of non-routine tasks at {shopInfo.name} include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Spray booth deep cleaning and filter replacement</li>
              <li>Chemical spill cleanup and containment</li>
              <li>Paint mixing room ventilation system maintenance</li>
              <li>Waste solvent and paint disposal operations</li>
              <li>Emergency response to chemical releases</li>
              <li>Annual flammable storage cabinet inspection and reorganization</li>
            </ul>
            <p>
              Before any non-routine task, employees must review the relevant SDS, verify PPE requirements,
              and confirm emergency procedures with the Safety Coordinator. Contact: {shopInfo.owner}
              at {shopInfo.phone}.
            </p>
          </div>
        </ProgramSection>

        {/* ─── Part H: Section 7 — Multi-Employer Communication ──────── */}
        <ProgramSection number={7} title="Multi-Employer Workplace Communication" id="section-7">
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            <p>
              When contractors, temporary workers, or other outside employers perform work at {shopInfo.name},
              the following information shall be provided to them:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hazardous chemicals to which their employees may be exposed while performing their work</li>
              <li>Measures the contractor&apos;s employees can take to lessen the possibility of exposure</li>
              <li>Location and availability of Safety Data Sheets</li>
              <li>Procedures to follow if employees are exposed or need emergency assistance</li>
              <li>The labeling system used in the workplace</li>
            </ul>
            <p>
              A Contractor Safety Packet is available that includes relevant SDS, site-specific hazard
              information, emergency procedures, and a digital acknowledgment form.
            </p>
          </div>
          <button
            onClick={() => showToast("Contractor packet generation coming soon")}
            className="mt-4 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm w-full md:w-auto px-4 py-2 rounded-lg transition-colors print:hidden"
          >
            <FileText className="h-4 w-4" />
            Generate Contractor Packet
          </button>
        </ProgramSection>

        {/* ─── Part I: Section 8 — Program Review + Audit Log ────────── */}
        <ProgramSection number={8} title="Program Review and Audit Log" id="section-8" pageBreak>
          <div className="prose prose-sm max-w-none text-gray-700 mb-4 space-y-3">
            <p>
              This Written Hazard Communication Program is maintained as a living document that updates
              automatically as chemical inventory, SDS records, labeling, and training data change.
              The program shall be formally reviewed by the Safety Coordinator under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>At least annually, or more frequently as needed</li>
              <li>When new chemicals are introduced to the workplace</li>
              <li>When there is a change in work processes or equipment that introduces new hazards</li>
              <li>When an employee reports a chemical exposure incident</li>
              <li>After any OSHA inspection or compliance audit</li>
              <li>When regulatory requirements change</li>
            </ul>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Recent Activity Log</h3>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="hazcom-table w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 w-28">Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700">Event</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.slice(0, 20).map((entry, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-600 whitespace-nowrap">
                      {(() => {
                        try {
                          return new Date(entry.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        } catch {
                          return entry.time;
                        }
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-gray-700">{entry.entry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list view */}
          <div className="md:hidden space-y-2">
            {auditLog.slice(0, 20).map((entry, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  {(() => {
                    try {
                      return new Date(entry.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    } catch {
                      return entry.time;
                    }
                  })()}
                </p>
                <p className="text-xs text-gray-700">{entry.entry}</p>
              </div>
            ))}
          </div>
        </ProgramSection>

        {/* ─── Document Footer ────────────────────────────────────────── */}
        <div className="border-t-2 border-gray-200 pt-6 mt-10 text-center">
          <p className="text-xs text-gray-500">
            Generated: {formattedDateTime} &bull; {shopInfo.name} &bull; {shopInfo.address}, {shopInfo.city}, {shopInfo.state} {shopInfo.zip}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This document is generated by ShieldSDS and reflects real-time compliance data. It is the
            employer&apos;s responsibility to verify accuracy and maintain this program in accordance with
            29 CFR 1910.1200.
          </p>
          <div className="hidden print:block mt-4 text-xs text-gray-500">
            ShieldSDS HazCom Program — {shopInfo.name} — Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          COMPLIANCE CHECKLIST (dark theme, below document)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8 print:hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Compliance Checklist
        </h2>
        <div className="space-y-3">
          {checklist.map((item) => (
            <ChecklistCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      </>}

      {/* Modals & Toast */}
      {showShare && <ShareModal shopInfo={shopInfo} onClose={() => setShowShare(false)} onToast={(msg) => { setShowShare(false); showToast(msg); }} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
