"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getEmployees,
  getRecordsByEmployee,
  addEmployee,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateEmployee,
  initializeStore,
  getCompanyProfile,
} from "@/lib/chemicals";
import type { Employee } from "@/lib/types";
import { getEmployeeTrainingStatus, type TrainingStatus } from "@/lib/compliance-score";
import {
  GraduationCap,
  AlertTriangle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronRight,
  Camera,
  CheckCircle2,
  UserPlus,
  Trash2,
  Copy,
  X,
  Link2,
  Award,
  Check,
  MoreVertical,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Clock,
  XCircle,
} from "lucide-react";

// ─── Module definitions ──────────────────────────────────────────────────────

const ALL_LEARN_MODULES = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];

const MODULE_NAMES: Record<string, string> = {
  "hazcom-overview": "HazCom Orientation",
  "ghs-labels": "GHS Labels & Pictograms",
  "sds-reading": "SDS & Label Reading",
  "ppe-selection": "PPE Selection & Use",
  "chemical-storage": "Chemical Storage",
  "emergency-response": "Emergency Response",
  "spill-response": "Spill Response",
  m1: "Your Right to Know",
  m2: "The GHS System",
  m3: "Reading a Chemical Label",
  m4: "Understanding the SDS",
  m5: "Protecting Yourself — PPE",
  m6: "When Things Go Wrong",
  m7: "Your Shop's HazCom Program",
};

// ─── Status types ────────────────────────────────────────────────────────────

interface EmployeeWithStatus extends Employee {
  trainingStatus: TrainingStatus;
  dueDate: Date | null;
  daysUntilDue: number | null;
  modulesCompleted: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function deleteEmployeeLocal(id: string): boolean {
  try {
    const raw = localStorage.getItem("shieldsds-employees");
    if (!raw) return false;
    const all = JSON.parse(raw) as Employee[];
    const filtered = all.filter((e) => e.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem("shieldsds-employees", JSON.stringify(filtered));
    const trRaw = localStorage.getItem("shieldsds-training-records");
    if (trRaw) {
      const allTr = JSON.parse(trRaw) as { employee_id: string }[];
      localStorage.setItem("shieldsds-training-records", JSON.stringify(allTr.filter((r) => r.employee_id !== id)));
    }
    return true;
  } catch {
    return false;
  }
}

const STATUS_CONFIG: Record<TrainingStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  "overdue":      { label: "OVERDUE",      color: "text-status-red",   bgColor: "bg-status-red/10",   borderColor: "border-status-red/30", icon: "🔴" },
  "due-soon":     { label: "DUE SOON",     color: "text-status-amber", bgColor: "bg-status-amber/10", borderColor: "border-status-amber/30", icon: "🟡" },
  "in-progress":  { label: "IN PROGRESS",  color: "text-blue-400",     bgColor: "bg-blue-500/10",     borderColor: "border-blue-500/30", icon: "🔵" },
  "not-started":  { label: "NOT STARTED",  color: "text-gray-400",     bgColor: "bg-gray-500/10",     borderColor: "border-gray-500/30", icon: "⚪" },
  "current":      { label: "UP TO DATE",   color: "text-status-green", bgColor: "bg-status-green/10", borderColor: "border-status-green/30", icon: "🟢" },
};

const STATUS_ORDER: TrainingStatus[] = ["overdue", "due-soon", "in-progress", "not-started", "current"];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [showLinkPopup, setShowLinkPopup] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showCertForId, setShowCertForId] = useState<string | null>(null);

  useEffect(() => {
    initializeStore();
    setEmployees(getEmployees());
  }, []);

  // Enriched employees with training status (single shared source of truth)
  const enrichedEmployees = useMemo<EmployeeWithStatus[]>(() => {
    return employees.map((emp) => {
      const info = getEmployeeTrainingStatus(emp);
      // Compute due date for display
      let dueDate: Date | null = null;
      if (info.status !== "not-started" && info.status !== "in-progress" && emp.last_training) {
        dueDate = new Date(emp.last_training);
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
      return {
        ...emp,
        trainingStatus: info.status,
        dueDate,
        daysUntilDue: info.daysUntilDue,
        modulesCompleted: info.completedCount,
      };
    }).sort((a, b) => {
      const aIdx = STATUS_ORDER.indexOf(a.trainingStatus);
      const bIdx = STATUS_ORDER.indexOf(b.trainingStatus);
      return aIdx - bIdx;
    });
  }, [employees]);

  // Summary counts
  const counts = useMemo(() => {
    const c = { total: 0, upToDate: 0, dueSoon: 0, overdue: 0, inProgress: 0, notStarted: 0 };
    enrichedEmployees.forEach((e) => {
      c.total++;
      if (e.trainingStatus === "current") c.upToDate++;
      else if (e.trainingStatus === "due-soon") c.dueSoon++;
      else if (e.trainingStatus === "overdue") c.overdue++;
      else if (e.trainingStatus === "in-progress") c.inProgress++;
      else c.notStarted++;
    });
    return c;
  }, [enrichedEmployees]);

  const overdueList = useMemo(() => enrichedEmployees.filter((e) => e.trainingStatus === "overdue"), [enrichedEmployees]);
  const dueSoonList = useMemo(() => enrichedEmployees.filter((e) => e.trainingStatus === "due-soon"), [enrichedEmployees]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddEmployee = () => {
    if (!addName.trim()) return;
    addEmployee({
      name: addName.trim(),
      role: addRole.trim() || "Employee",
      initial_training: null,
      last_training: null,
      status: "pending",
      completed_modules: [],
      pending_modules: [...ALL_LEARN_MODULES],
    });
    setEmployees(getEmployees());
    setAddName("");
    setAddRole("");
    setShowAddModal(false);
  };

  const handleDeleteEmployee = (id: string) => {
    deleteEmployeeLocal(id);
    setEmployees(getEmployees());
    setDeleteConfirmId(null);
    if (expandedEmpId === id) setExpandedEmpId(null);
  };

  const handleCopyLink = (empId: string) => {
    const url = `${window.location.origin}/training/learn?employee=${empId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const CERT_MODULES = [
    { id: "m1", title: "Your Right to Know" },
    { id: "m2", title: "The GHS System" },
    { id: "m3", title: "Reading a Chemical Label" },
    { id: "m4", title: "Understanding the SDS" },
    { id: "m5", title: "Protecting Yourself — PPE" },
    { id: "m6", title: "When Things Go Wrong" },
    { id: "m7", title: "Your Shop's HazCom Program" },
  ];

  const handlePrintCertificate = (emp: EmployeeWithStatus) => {
    const certDate = emp.last_training
      ? new Date(emp.last_training).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${emp.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',system-ui,sans-serif; background:white; display:flex; align-items:center; justify-content:center; min-height:100vh; }
        .cert { width:7.5in; padding:0.75in; border:3px solid #B8860B; position:relative; }
        .corner { position:absolute; width:30px; height:30px; }
        .corner.tl { top:12px; left:12px; border-top:2px solid #B8860B; border-left:2px solid #B8860B; }
        .corner.tr { top:12px; right:12px; border-top:2px solid #B8860B; border-right:2px solid #B8860B; }
        .corner.bl { bottom:12px; left:12px; border-bottom:2px solid #B8860B; border-left:2px solid #B8860B; }
        .corner.br { bottom:12px; right:12px; border-bottom:2px solid #B8860B; border-right:2px solid #B8860B; }
        .brand { font-size:14px; letter-spacing:0.2em; color:#B8860B; font-weight:600; margin-bottom:8px; }
        h1 { font-size:28px; font-weight:800; color:#1a1a1a; margin-bottom:4px; }
        .divider { width:60px; height:2px; background:#B8860B; margin:12px auto 20px; }
        .certifies { font-size:14px; color:#666; margin-bottom:16px; }
        .name { font-size:26px; font-weight:800; color:#1a1a1a; border-bottom:2px solid #B8860B; display:inline-block; padding:0 24px 8px; }
        .company { font-size:13px; color:#888; margin:8px 0 20px; }
        .desc { font-size:14px; color:#444; line-height:1.6; margin-bottom:16px; }
        .osha { font-size:13px; color:#B8860B; font-weight:600; margin-bottom:20px; }
        .modules { margin:16px auto; max-width:360px; text-align:left; }
        .modules .mod { font-size:12px; color:#444; padding:3px 0; display:flex; gap:8px; }
        .meta { display:flex; justify-content:center; gap:40px; margin:20px 0; flex-wrap:wrap; }
        .meta > div { text-align:center; }
        .meta .label { font-size:10px; color:#888; letter-spacing:0.05em; }
        .meta .value { font-size:13px; font-weight:700; color:#1a1a1a; }
        .footer { font-size:10px; color:#aaa; line-height:1.5; margin-top:20px; }
        @media print { body { min-height:auto; } @page { size:letter; margin:0.5in; } }
      </style>
    </head><body>
      <div class="cert">
        <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
        <div style="text-align:center">
          <div class="brand">SHIELDSDS</div>
          <h1>Certificate of Completion</h1>
          <div class="divider"></div>
          <p class="certifies">This certifies that</p>
          <p class="name">${emp.name}</p>
          <p class="company">${getCompanyProfile().name}</p>
          <p class="desc">Has successfully completed <strong>OSHA HazCom Safety Training</strong><br/>covering all 7 required modules with passing assessments.</p>
          <p class="osha">29 CFR 1910.1200(h) Compliant</p>
          <div class="modules">
            ${CERT_MODULES.map(m => `<div class="mod"><span>✅</span><span>${m.title}</span></div>`).join("")}
          </div>
          <div class="meta">
            <div><div class="label">DATE</div><div class="value">${certDate}</div></div>
            <div><div class="label">INDUSTRY</div><div class="value">${getCompanyProfile().industry}</div></div>
            <div><div class="label">PROVIDER</div><div class="value">ShieldSDS</div></div>
          </div>
          <div class="footer">
            Training documentation per OSHA 29 CFR 1910.1200(h)<br/>
            This certificate documents completion of HazCom training content.<br/>
            Employers retain responsibility for site-specific supplemental training.
          </div>
        </div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  // Empty state
  if (employees.length === 0 && !showAddModal) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <GraduationCap className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No employees added yet</h2>
          <p className="text-gray-400 mb-6">Add employees and assign HazCom training.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors">
              <UserPlus className="h-5 w-5" /> Add Employee
            </button>
            <Link href="/scan" className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-navy-700">
              <Camera className="h-5 w-5" /> Scan Chemical
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Training</h1>
          <p className="text-sm text-gray-400 mt-1">Who needs training and when?</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total</div>
          <div className="font-display font-black text-2xl text-white">{counts.total}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
          <div className="text-status-green text-xs font-semibold uppercase tracking-wider mb-1">Up to Date</div>
          <div className="font-display font-black text-2xl text-status-green">{counts.upToDate}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
          <div className="text-status-amber text-xs font-semibold uppercase tracking-wider mb-1">Due Soon</div>
          <div className="font-display font-black text-2xl text-status-amber">{counts.dueSoon}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
          <div className="text-status-red text-xs font-semibold uppercase tracking-wider mb-1">Overdue</div>
          <div className="font-display font-black text-2xl text-status-red">{counts.overdue}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Not Started</div>
          <div className="font-display font-black text-2xl text-gray-400">{counts.notStarted}</div>
        </div>
      </div>

      {/* Overdue alert */}
      {(overdueList.length > 0 || dueSoonList.length > 0) && (
        <div className={`${overdueList.length > 0 ? "bg-status-red/10 border-status-red/30" : "bg-status-amber/10 border-status-amber/30"} border rounded-xl p-4 mb-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${overdueList.length > 0 ? "text-status-red" : "text-status-amber"}`} />
            <span className="text-sm font-semibold text-white">
              {overdueList.length > 0 && <>{overdueList.map((e) => e.name).join(", ")} {overdueList.length === 1 ? "is" : "are"} overdue. </>}
              {dueSoonList.length > 0 && <>{dueSoonList.map((e) => e.name).join(", ")} {dueSoonList.length === 1 ? "is" : "are"} due soon.</>}
            </span>
          </div>
        </div>
      )}

      {/* Employee Cards */}
      <div className="space-y-4">
        {enrichedEmployees.map((emp) => {
          const cfg = STATUS_CONFIG[emp.trainingStatus];
          const isExpanded = expandedEmpId === emp.id;
          const isMenuOpen = menuOpenId === emp.id;

          return (
            <div key={emp.id} className={`bg-navy-900 border rounded-xl overflow-hidden transition-all ${cfg.borderColor}`}>
              {/* Card Header */}
              <div
                className="p-4 cursor-pointer hover:bg-navy-800/30 transition-colors"
                onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}
              >
                {/* Status Row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : emp.id); }}
                        className="p-1.5 rounded-lg hover:bg-navy-700 transition-colors text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-30 w-48 overflow-hidden">
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedEmpId(emp.id); setMenuOpenId(null); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-navy-700 hover:text-white transition-colors"
                          >
                            View Training Details
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowLinkPopup(emp.id); setMenuOpenId(null); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-navy-700 hover:text-white transition-colors"
                          >
                            Send Training Link
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(emp.id); setMenuOpenId(null); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-status-red hover:bg-navy-700 transition-colors"
                          >
                            Delete Employee
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name + Role */}
                <div className="mb-2">
                  <span className="text-base font-bold text-white">{emp.name}</span>
                  <span className="text-sm text-gray-400 ml-2">— {emp.role}</span>
                </div>

                {/* Due date info */}
                <div className="text-sm mb-3">
                  {emp.trainingStatus === "overdue" && emp.daysUntilDue !== null && (
                    <span className="text-status-red">Training due: {formatDate(emp.dueDate?.toISOString() || null)} ({Math.abs(emp.daysUntilDue)} days overdue)</span>
                  )}
                  {emp.trainingStatus === "due-soon" && emp.daysUntilDue !== null && (
                    <span className="text-status-amber">Training due: {formatDate(emp.dueDate?.toISOString() || null)} ({emp.daysUntilDue} days)</span>
                  )}
                  {emp.trainingStatus === "current" && emp.dueDate && emp.daysUntilDue !== null && (
                    <span className="text-status-green">Next training due: {formatDate(emp.dueDate.toISOString())} ({emp.daysUntilDue} days)</span>
                  )}
                  {emp.trainingStatus === "in-progress" && (
                    <span className="text-blue-400">In progress: {emp.modulesCompleted} of 7 modules complete</span>
                  )}
                  {emp.trainingStatus === "not-started" && (
                    <span className="text-gray-500">No training on record</span>
                  )}
                </div>

                {/* Module indicators */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {ALL_LEARN_MODULES.map((modId) => {
                      const done = emp.completed_modules?.includes(modId);
                      return (
                        <div key={modId} title={`${modId.toUpperCase()}: ${MODULE_NAMES[modId]} ${done ? "✅" : "❌"}`} className="flex flex-col items-center">
                          <span className="text-sm">{done ? "✅" : "❌"}</span>
                          <span className="text-[9px] text-gray-500 uppercase">{modId}</span>
                        </div>
                      );
                    })}
                    <span className="text-xs text-gray-400 ml-2">({emp.modulesCompleted} of 7 passed)</span>
                  </div>
                  {(emp.trainingStatus === "current" || emp.trainingStatus === "due-soon") && emp.last_training && (
                    <p className="text-xs text-gray-500 mt-1">Last completed: {formatDate(emp.last_training)}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {emp.trainingStatus === "current" ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-status-green bg-status-green/10 rounded-lg cursor-default">
                        <CheckCircle2 className="h-4 w-4" /> Up to Date
                      </span>
                      <Link
                        href={`/training/learn?employee=${emp.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
                      >
                        🔄 Refresher Training
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/training/learn?employee=${emp.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-navy-950 rounded-lg transition-colors"
                    >
                      ▶ {emp.trainingStatus === "in-progress" ? "Continue Training" : emp.trainingStatus === "overdue" || emp.trainingStatus === "due-soon" ? "Refresh Training" : "Start Training"}
                    </Link>
                  )}
                </div>
              </div>

              {/* Expanded Detail (Part C) */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-navy-700/50">
                  <div className="pt-4 space-y-4">
                    {/* Training Timeline */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Training Timeline</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">Initial Training:</span> <span className="text-white ml-1">{formatDate(emp.initial_training)}</span></div>
                        <div><span className="text-gray-500">Last Training:</span> <span className="text-white ml-1">{formatDate(emp.last_training)}</span></div>
                        <div><span className="text-gray-500">Next Due:</span> <span className="text-white ml-1">{emp.dueDate ? formatDate(emp.dueDate.toISOString()) : "—"}</span></div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-1 font-medium ${cfg.color}`}>
                            {emp.trainingStatus === "overdue" && emp.daysUntilDue !== null ? `${Math.abs(emp.daysUntilDue)} days overdue` : ""}
                            {emp.trainingStatus === "due-soon" && emp.daysUntilDue !== null ? `Due in ${emp.daysUntilDue} days` : ""}
                            {emp.trainingStatus === "current" && emp.daysUntilDue !== null ? `${emp.daysUntilDue} days until due` : ""}
                            {emp.trainingStatus === "in-progress" ? `${emp.modulesCompleted} of 7 modules complete` : ""}
                            {emp.trainingStatus === "not-started" ? "Not started" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Module Breakdown */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Module Breakdown</h4>
                      <div className="space-y-1.5">
                        {ALL_LEARN_MODULES.map((modId) => {
                          const done = emp.completed_modules?.includes(modId);
                          const records = getRecordsByEmployee(emp.id);
                          const rec = records.find((r) => r.module_id === modId);
                          return (
                            <div key={modId} className="flex items-center justify-between text-xs bg-navy-800/50 rounded px-3 py-2">
                              <span className="text-gray-300">
                                Module {modId.replace("m", "")}: {MODULE_NAMES[modId]}
                              </span>
                              {done ? (
                                <span className="flex items-center gap-1.5 text-status-green font-medium">
                                  <CheckCircle2 className="h-3 w-3" /> Passed
                                  {rec && <span className="text-gray-500 ml-1">({formatDate(rec.completed_date)})</span>}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-gray-500">
                                  <XCircle className="h-3 w-3" /> Not Completed
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {emp.modulesCompleted >= 7 && (
                        <>
                          <button
                            onClick={() => setShowCertForId(showCertForId === emp.id ? null : emp.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg bg-amber-500/10 transition-colors"
                          >
                            <Award className="h-3.5 w-3.5" /> {showCertForId === emp.id ? "Hide Certificate" : "View Certificate"}
                          </button>
                          <button
                            onClick={() => handlePrintCertificate(emp)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg bg-navy-800 transition-colors"
                          >
                            🖨️ Print Certificate
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowLinkPopup(emp.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg bg-navy-800 transition-colors"
                      >
                        <Link2 className="h-3.5 w-3.5" /> Send Training Link
                      </button>
                    </div>

                    {/* Inline Certificate */}
                    {showCertForId === emp.id && emp.modulesCompleted >= 7 && (
                      <div className="mt-4 pt-4 border-t border-navy-700/50">
                        <div className="bg-[#FFFEF8] rounded-lg border-2 border-[#B8860B] p-8 relative overflow-hidden">
                          {/* Corner decorations */}
                          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#B8860B]" />
                          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#B8860B]" />
                          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#B8860B]" />
                          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#B8860B]" />

                          <div className="text-center">
                            <div className="text-xs tracking-[0.2em] text-[#B8860B] font-semibold mb-2">SHIELDSDS</div>
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-1">Certificate of Completion</h3>
                            <div className="w-14 h-0.5 bg-[#B8860B] mx-auto my-3" />
                            <p className="text-sm text-gray-500 mb-3">This certifies that</p>
                            <p className="text-xl font-extrabold text-gray-900 border-b-2 border-[#B8860B] inline-block px-6 pb-2">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 mb-4">{getCompanyProfile().name}</p>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                              Has successfully completed <strong>OSHA HazCom Safety Training</strong><br />
                              covering all 7 required modules with passing assessments.
                            </p>
                            <p className="text-xs font-semibold text-[#B8860B] mb-4">29 CFR 1910.1200(h) Compliant</p>

                            <div className="inline-block text-left mb-4">
                              {CERT_MODULES.map((mod) => (
                                <div key={mod.id} className="flex items-center gap-2 text-xs text-gray-600 py-0.5">
                                  <span className="text-green-600">✅</span>
                                  <span>{mod.title}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-center gap-8 my-4 flex-wrap">
                              <div className="text-center">
                                <div className="text-[10px] text-gray-400 tracking-wide">DATE</div>
                                <div className="text-xs font-bold text-gray-900">
                                  {emp.last_training
                                    ? new Date(emp.last_training).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-gray-400 tracking-wide">INDUSTRY</div>
                                <div className="text-xs font-bold text-gray-900">{getCompanyProfile().industry}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] text-gray-400 tracking-wide">PROVIDER</div>
                                <div className="text-xs font-bold text-gray-900">ShieldSDS</div>
                              </div>
                            </div>

                            <div className="text-[10px] text-gray-400 leading-relaxed mt-4">
                              Training documentation per OSHA 29 CFR 1910.1200(h)<br />
                              This certificate documents completion of HazCom training content.<br />
                              Employers retain responsibility for site-specific supplemental training.
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center mt-3">
                          <button
                            onClick={() => handlePrintCertificate(emp)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 px-4 py-2 rounded-lg bg-amber-500/10 transition-colors"
                          >
                            🖨️ Print Certificate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Add Employee Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold text-white">Add Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
                <input
                  type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleAddEmployee(); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                <input
                  type="text" value={addRole} onChange={(e) => setAddRole(e.target.value)}
                  placeholder="e.g. Painter, Mechanic, Detail Tech"
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddEmployee(); }}
                />
              </div>
              <div className="bg-navy-800/50 border border-navy-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  New employees start with <span className="text-amber-400 font-medium">7 pending modules</span>. Send them a training link to complete their HazCom Foundation Track.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddEmployee} disabled={!addName.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-navy-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <UserPlus className="h-4 w-4" /> Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Send Training Link Popup ──────────────────────────────────────── */}
      {showLinkPopup && (() => {
        const emp = employees.find((e) => e.id === showLinkPopup);
        if (!emp) return null;
        const trainingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/training/learn?employee=${emp.id}`;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-white">Send Training Link</h3>
                <button onClick={() => { setShowLinkPopup(null); setLinkCopied(false); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Copy this link and send it to <span className="text-white font-medium">{emp.name}</span>. Training records update automatically.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-xs text-gray-300 font-mono truncate">
                  {trainingUrl}
                </div>
                <button
                  onClick={() => handleCopyLink(emp.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    linkCopied ? "bg-status-green/20 text-status-green" : "bg-amber-500 hover:bg-amber-400 text-navy-950"
                  }`}
                >
                  {linkCopied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteConfirmId && (() => {
        const emp = employees.find((e) => e.id === deleteConfirmId);
        if (!emp) return null;
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-status-red/15 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-status-red" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Delete Employee?</h3>
                  <p className="text-xs text-gray-400">This will remove {emp.name} and all their training records.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteEmployee(deleteConfirmId)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-status-red hover:bg-red-500 text-white rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Close menus on click outside */}
      {menuOpenId && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
      )}
    </DashboardLayout>
  );
}
