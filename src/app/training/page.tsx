"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { getEmployees, getChemicals, getTrainingRecords, initializeStore } from "@/lib/chemicals";
import type { Chemical, Employee, TrainingRecord } from "@/lib/types";
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  ChevronRight,
  Camera,
  CheckCircle2,
} from "lucide-react";

// ─── Foundation Track Modules ────────────────────────────────────────────────

const FOUNDATION_MODULES = [
  { id: "hazcom-overview", name: "HazCom Initial Orientation", type: "Required — Initial Assignment", duration: "15 min" },
  { id: "ghs-labels", name: "GHS Labels & Pictograms", type: "Required — Initial Assignment", duration: "10 min" },
  { id: "sds-reading", name: "SDS & Label Reading", type: "Required — Initial Assignment", duration: "10 min" },
  { id: "ppe-selection", name: "PPE Selection & Use", type: "Required — Initial Assignment", duration: "8 min" },
  { id: "chemical-storage", name: "Chemical Storage & Handling", type: "Required — Initial Assignment", duration: "8 min" },
  { id: "emergency-response", name: "Emergency Response Procedures", type: "Required — Initial Assignment", duration: "10 min" },
  { id: "spill-response", name: "Spill Response & Cleanup", type: "Required — Initial Assignment", duration: "8 min" },
];

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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  useEffect(() => {
    initializeStore();
    setEmployees(getEmployees());
    setChemicals(getChemicals());
    setTrainingRecords(getTrainingRecords());
  }, []);

  // Summary stats
  const currentCount = useMemo(() => employees.filter((e) => e.status === "current").length, [employees]);
  const overdueCount = useMemo(() => employees.filter((e) => e.status === "overdue").length, [employees]);
  const pendingCount = useMemo(() => employees.filter((e) => e.status === "pending").length, [employees]);
  const overdueEmployees = useMemo(() => employees.filter((e) => e.status === "overdue"), [employees]);

  // Foundation track: how many employees completed each module
  const foundationModules = useMemo(() => {
    return FOUNDATION_MODULES.map((mod) => {
      const completedCount = employees.filter((e) => e.completed_modules.includes(mod.id)).length;
      return {
        ...mod,
        assigned: employees.length,
        completed: completedCount,
      };
    });
  }, [employees]);

  // New chemical training entries — chemicals added via scan in last 30 days
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

  // All training modules combined
  const allModules = useMemo(
    () => [...foundationModules, ...newChemicalTrainings],
    [foundationModules, newChemicalTrainings]
  );

  // Empty state
  if (employees.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <GraduationCap className="h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">No employees added yet</h2>
          <p className="text-gray-400 mb-6">Scan your first chemical to get started with training.</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Training</h1>
          <p className="text-sm text-gray-400 mt-1">Employee HazCom training assignments &amp; records</p>
        </div>
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
              {overdueEmployees.length === 1 && overdueEmployees[0].pending_modules.length > 0 && (
                <span className="text-sm text-gray-400 ml-2">
                  — {overdueEmployees[0].pending_modules.join(", ")}
                </span>
              )}
            </div>
          </div>
          <button className="text-sm font-semibold text-status-red hover:text-red-300 transition-colors whitespace-nowrap">
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
              const pendingModCount = emp.pending_modules.length;
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
                        {completedCount} completed
                        {pendingModCount > 0 && (
                          <span className="text-status-amber ml-1">&middot; {pendingModCount} pending</span>
                        )}
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

          {/* Selected employee detail */}
          {selectedEmpId && (() => {
            const emp = employees.find((e) => e.id === selectedEmpId);
            if (!emp) return null;
            const empRecords = trainingRecords.filter((r) => r.employee_id === emp.id);
            return (
              <div className="mt-3 bg-navy-900 border border-navy-700/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">{emp.name} — Training Details</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Role:</span> <span className="text-white">{emp.role}</span></div>
                  <div><span className="text-gray-500">Initial Training:</span> <span className="text-white">{formatDate(emp.initial_training)}</span></div>
                  <div><span className="text-gray-500">Last Training:</span> <span className="text-white">{formatDate(emp.last_training)}</span></div>
                  <div><span className="text-gray-500">Records:</span> <span className="text-white">{empRecords.length} training records on file</span></div>
                </div>
                {emp.completed_modules.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1.5">Completed Modules:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {emp.completed_modules.map((mod) => {
                        const modInfo = FOUNDATION_MODULES.find((m) => m.id === mod);
                        return (
                          <span key={mod} className="inline-flex items-center gap-1 text-[10px] bg-status-green/10 text-status-green px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {modInfo?.name || mod}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {emp.pending_modules.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1.5">Pending Modules:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {emp.pending_modules.map((mod) => (
                        <span key={mod} className="inline-flex items-center gap-1 text-[10px] bg-status-amber/10 text-status-amber px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5" />
                          {mod}
                        </span>
                      ))}
                    </div>
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
    </DashboardLayout>
  );
}
