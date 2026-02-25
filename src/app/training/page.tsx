"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getEmployees,
  getChemicals,
  getRecordsByEmployee,
  addEmployee,
  updateEmployee,
  initializeStore,
} from "@/lib/chemicals";
import type { Chemical, Employee, TrainingRecord } from "@/lib/types";
import {
  GraduationCap,
  Clock,
  AlertTriangle,
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
} from "lucide-react";

// ─── Module definitions ──────────────────────────────────────────────────────

// Interactive learn module IDs
const ALL_LEARN_MODULES = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];

const FOUNDATION_MODULES = [
  { id: "m1", name: "Your Right to Know", type: "Required — Initial Assignment", duration: "5 min" },
  { id: "m2", name: "The GHS System", type: "Required — Initial Assignment", duration: "7 min" },
  { id: "m3", name: "Reading a Chemical Label", type: "Required — Initial Assignment", duration: "7 min" },
  { id: "m4", name: "Understanding the SDS", type: "Required — Initial Assignment", duration: "8 min" },
  { id: "m5", name: "Protecting Yourself — PPE", type: "Required — Initial Assignment", duration: "7 min" },
  { id: "m6", name: "When Things Go Wrong", type: "Required — Initial Assignment", duration: "7 min" },
  { id: "m7", name: "Your Shop's HazCom Program", type: "Required — Initial Assignment", duration: "5 min" },
];

// Map both legacy seed IDs and learn IDs to display names
const MODULE_NAMES: Record<string, string> = {
  "hazcom-overview": "HazCom Orientation",
  "ghs-labels": "GHS Labels & Pictograms",
  "sds-reading": "SDS & Label Reading",
  "ppe-selection": "PPE Selection & Use",
  "chemical-storage": "Chemical Storage",
  "emergency-response": "Emergency Response",
  "spill-response": "Spill Response",
  "m1": "Your Right to Know",
  "m2": "The GHS System",
  "m3": "Reading a Chemical Label",
  "m4": "Understanding the SDS",
  "m5": "Protecting Yourself — PPE",
  "m6": "When Things Go Wrong",
  "m7": "Your Shop's HazCom Program",
};

// Legacy seed IDs that are equivalent to m1-m7
const MODULE_EQUIVALENTS: Record<string, string[]> = {
  m1: ["m1", "hazcom-overview"],
  m2: ["m2", "ghs-labels"],
  m3: ["m3", "sds-reading"],
  m4: ["m4", "ppe-selection"],
  m5: ["m5", "chemical-storage"],
  m6: ["m6", "emergency-response"],
  m7: ["m7", "spill-response"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
    // Also clean up training records
    const trRaw = localStorage.getItem("shieldsds-training-records");
    if (trRaw) {
      const allTr = JSON.parse(trRaw) as TrainingRecord[];
      const filteredTr = allTr.filter((r) => r.employee_id !== id);
      localStorage.setItem("shieldsds-training-records", JSON.stringify(filteredTr));
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Add Employee modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");

  // Send Training Link popup
  const [showLinkPopup, setShowLinkPopup] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    initializeStore();

    // Auto-recalculate training status (Part C)
    const emps = getEmployees();
    const now = new Date();
    let changed = false;

    for (const emp of emps) {
      let newStatus: "current" | "overdue" | "pending" = emp.status;
      const totalCompleted = emp.completed_modules.length;

      if (totalCompleted >= 7) {
        // All modules completed — check recency
        if (emp.last_training) {
          const lastDate = new Date(emp.last_training);
          const yearsSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          newStatus = yearsSince > 1 ? "overdue" : "current";
        } else {
          newStatus = "current";
        }
      } else if (emp.initial_training === null && totalCompleted === 0) {
        newStatus = "pending";
      } else {
        // Partially complete — overdue
        newStatus = "overdue";
      }

      if (newStatus !== emp.status) {
        updateEmployee(emp.id, { status: newStatus });
        changed = true;
      }
    }

    setEmployees(changed ? getEmployees() : emps);
    setChemicals(getChemicals());
  }, []);

  // Summary stats
  const currentCount = useMemo(() => employees.filter((e) => e.status === "current").length, [employees]);
  const overdueCount = useMemo(() => employees.filter((e) => e.status === "overdue").length, [employees]);
  const pendingCount = useMemo(() => employees.filter((e) => e.status === "pending").length, [employees]);
  const overdueEmployees = useMemo(() => employees.filter((e) => e.status === "overdue"), [employees]);

  // Foundation track progress (handles both legacy and learn IDs)
  const foundationModules = useMemo(() => {
    return FOUNDATION_MODULES.map((mod) => {
      const equivalents = MODULE_EQUIVALENTS[mod.id] || [mod.id];
      const completedCount = employees.filter((e) =>
        equivalents.some((eq) => e.completed_modules.includes(eq))
      ).length;
      return { ...mod, assigned: employees.length, completed: completedCount };
    });
  }, [employees]);

  // New chemical training entries
  const newChemicalTrainings = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return chemicals
      .filter((c) => {
        if (!c.added_date) return false;
        try {
          return new Date(c.added_date) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      })
      .map((c) => ({
        id: `new-chem-${c.id}`,
        name: `New Chemical: ${c.product_name}`,
        type: "Triggered — New Hazard Introduced",
        duration: "5 min",
        assigned: employees.filter((e) => e.status !== "pending").length,
        completed: employees.filter((e) => e.status === "current").length,
      }));
  }, [chemicals, employees]);

  const allModules = useMemo(
    () => [...foundationModules, ...newChemicalTrainings],
    [foundationModules, newChemicalTrainings]
  );

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
    if (selectedEmpId === id) setSelectedEmpId(null);
  };

  const handleCopyLink = (empId: string) => {
    const url = `${window.location.origin}/training/learn?employee=${empId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
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
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Add Employee
            </button>
            <Link
              href="/scan"
              className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-navy-700"
            >
              <Camera className="h-5 w-5" />
              Scan Chemical
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
          <p className="text-sm text-gray-400 mt-1">Employee HazCom training assignments &amp; records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Employees</div>
          <div className="font-display font-black text-3xl text-white">{employees.length}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Fully Trained</div>
          <div className="font-display font-black text-3xl text-status-green">{currentCount}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Overdue</div>
          <div className="font-display font-black text-3xl text-status-red">{overdueCount}</div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Pending (New Hire)</div>
          <div className="font-display font-black text-3xl text-status-amber">{pendingCount}</div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueEmployees.length > 0 && (
        <div className="bg-status-red/10 border border-status-red/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-status-red flex-shrink-0" />
            <div>
              <span className="text-sm font-semibold text-white">
                {overdueEmployees.map((e) => e.name).join(", ")} {overdueEmployees.length === 1 ? "has" : "have"} overdue training
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (overdueEmployees.length === 1) {
                setShowLinkPopup(overdueEmployees[0].id);
              }
            }}
            className="text-sm font-semibold text-status-red hover:text-red-300 transition-colors whitespace-nowrap"
          >
            Send Reminder &rarr;
          </button>
        </div>
      )}

      {/* Launch Interactive Training */}
      <Link href="/training/learn" className="block mb-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between hover:border-amber-500/50 transition-all group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-white font-display font-bold text-lg">Launch Interactive HazCom Training</div>
              <div className="text-gray-400 text-sm">7-module foundation track &middot; Industry-specific &middot; OSHA 29 CFR 1910.1200(h) compliant</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Start Training <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Employee roster */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Employee Roster ({employees.length})
          </h2>
          <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
            {employees.map((emp, i) => {
              const isSelected = selectedEmpId === emp.id;
              const completedCount = emp.completed_modules.length;
              const totalModules = 7;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(isSelected ? null : emp.id)}
                  className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-amber-500/10" : "hover:bg-navy-800/50"
                  } ${i < employees.length - 1 ? "border-b border-navy-700/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        emp.status === "current"
                          ? "bg-status-green/15 text-status-green"
                          : emp.status === "overdue"
                          ? "bg-status-red/15 text-status-red"
                          : "bg-status-amber/15 text-status-amber"
                      }`}
                    >
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {completedCount}/{totalModules} modules
                      </div>
                      <div className="text-xs text-gray-600">
                        Last trained: {formatDate(emp.last_training)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === "current"
                          ? "bg-status-green/15 text-status-green"
                          : emp.status === "overdue"
                          ? "bg-status-red/15 text-status-red"
                          : "bg-status-amber/15 text-status-amber"
                      }`}
                    >
                      {emp.status === "current" ? "Current" : emp.status === "overdue" ? "Overdue" : "Pending"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected employee detail (Part E: training records & certificate) */}
          {selectedEmpId && (() => {
            const emp = employees.find((e) => e.id === selectedEmpId);
            if (!emp) return null;
            const empRecords = getRecordsByEmployee(emp.id);
            const isFullyTrained = emp.completed_modules.length >= 7;
            return (
              <div className="mt-3 bg-navy-900 border border-navy-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">{emp.name} — Training Details</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowLinkPopup(emp.id); }}
                      className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded bg-amber-500/10"
                    >
                      <Link2 className="h-3 w-3" />
                      Send Link
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(emp.id); }}
                      className="flex items-center gap-1 text-xs font-medium text-status-red hover:text-red-300 transition-colors px-2 py-1 rounded bg-status-red/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Role:</span> <span className="text-white">{emp.role}</span></div>
                  <div><span className="text-gray-500">Initial Training:</span> <span className="text-white">{formatDate(emp.initial_training)}</span></div>
                  <div><span className="text-gray-500">Last Training:</span> <span className="text-white">{formatDate(emp.last_training)}</span></div>
                  <div><span className="text-gray-500">Records:</span> <span className="text-white">{empRecords.length} training records on file</span></div>
                </div>

                {/* Completed modules */}
                {emp.completed_modules.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1.5">Completed Modules:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {emp.completed_modules.map((mod) => (
                        <span key={mod} className="inline-flex items-center gap-1 text-[10px] bg-status-green/10 text-status-green px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {MODULE_NAMES[mod] || mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending modules */}
                {emp.pending_modules.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1.5">Pending Modules:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {emp.pending_modules.map((mod) => (
                        <span key={mod} className="inline-flex items-center gap-1 text-[10px] bg-status-amber/10 text-status-amber px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5" />
                          {MODULE_NAMES[mod] || mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Training records with quiz scores (Part E) */}
                {empRecords.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1.5">Quiz Scores:</p>
                    <div className="space-y-1">
                      {empRecords.map((rec) => (
                        <div key={rec.id} className="flex items-center justify-between text-xs bg-navy-800/50 rounded px-2 py-1.5">
                          <span className="text-gray-300">{MODULE_NAMES[rec.module_id] || rec.module_id}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${rec.score >= 80 ? "text-status-green" : "text-status-red"}`}>
                              {rec.score}%
                            </span>
                            <span className="text-gray-600">{formatDate(rec.completed_date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Certificate (Part E) */}
                {isFullyTrained && (
                  <div className="mt-3 pt-3 border-t border-navy-700/30">
                    <Link
                      href={`/training/learn?employee=${emp.id}`}
                      className="flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Award className="h-3.5 w-3.5" />
                      View Certificate
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Training modules */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Training Modules ({allModules.length})
          </h2>
          <div className="space-y-3">
            {allModules.map((mod) => {
              const pct = mod.assigned > 0 ? (mod.completed / mod.assigned) * 100 : 0;
              return (
                <div key={mod.id} className="bg-navy-900 border border-navy-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium text-white">{mod.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 ml-2">
                      <Clock className="w-3 h-3" /> {mod.duration}
                    </div>
                  </div>
                  <div className="text-xs text-amber-400 font-medium mb-3">{mod.type}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-navy-800 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct === 100 ? "bg-status-green" : "bg-amber-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {mod.completed}/{mod.assigned}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 border border-dashed border-navy-700 rounded-xl text-center">
            <GraduationCap className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <div className="text-sm text-gray-400">
              Training auto-triggers when new chemical hazards are added to your inventory.
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Per OSHA 29 CFR 1910.1200(h)
            </div>
          </div>
        </div>
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
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddEmployee(); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                <input
                  type="text"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
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
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!addName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-navy-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4" />
                Add Employee
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
                Copy this link and send it to <span className="text-white font-medium">{emp.name}</span>. When they complete the training, their records will update automatically.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-xs text-gray-300 font-mono truncate">
                  {trainingUrl}
                </div>
                <button
                  onClick={() => handleCopyLink(emp.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    linkCopied
                      ? "bg-status-green/20 text-status-green"
                      : "bg-amber-500 hover:bg-amber-400 text-navy-950"
                  }`}
                >
                  {linkCopied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
              <div className="bg-navy-800/50 border border-navy-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  <span className="text-amber-400 font-medium">Pending modules:</span> {emp.pending_modules.length > 0 ? emp.pending_modules.map((m) => MODULE_NAMES[m] || m).join(", ") : "None — all complete!"}
                </p>
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
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEmployee(deleteConfirmId)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-status-red hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
