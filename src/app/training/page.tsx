"use client";

import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HelpCard from "@/components/HelpCard";
import { generateTrainingRosterPDF } from "@/lib/pdf-generator";
import {
  employees as seedEmployees,
  trainingCourses,
  auditLog,
  getEmployeeTrainingStats,
  getTrainingCourseStats,
} from "@/lib/data";
import type { Employee } from "@/lib/data";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  Users,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
  Award,
  X,
  Search,
  Calendar,
  Zap,
  BarChart3,
  FileDown,
  Shield,
} from "lucide-react";

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

// ─── Certificate Modal ───────────────────────────────────────────────────────

function CertificateModal({ empName, courseName, completedDate, onClose }: {
  empName: string;
  courseName: string;
  completedDate: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-navy-950 text-white px-8 py-6 text-center">
          <Shield className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <h2 className="font-display font-black text-xl">Certificate of Completion</h2>
          <p className="text-xs text-gray-400 mt-1">ShieldSDS Training Program</p>
        </div>
        <div className="px-8 py-8 text-center">
          <p className="text-gray-500 text-sm mb-2">This certifies that</p>
          <p className="font-display font-bold text-2xl text-navy-950 mb-4">{empName}</p>
          <p className="text-gray-500 text-sm mb-2">has successfully completed</p>
          <p className="font-display font-bold text-lg text-navy-950 mb-4">{courseName}</p>
          <p className="text-gray-500 text-sm">Completed on <strong className="text-gray-700">{completedDate}</strong></p>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-700 font-medium">Mike Rodriguez</p>
            <p className="text-xs text-gray-400">Owner, Mike&apos;s Auto Body</p>
          </div>
        </div>
        <div className="px-8 pb-6 flex justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Print Certificate
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Training Modal ────────────────────────────────────────────────────

function AssignModal({
  employees,
  onAssign,
  onClose,
}: {
  employees: Employee[];
  onAssign: (empIds: string[], courseId: string, dueDate: string) => void;
  onClose: () => void;
}) {
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [courseId, setCourseId] = useState(trainingCourses[0].id);
  const [dueDate, setDueDate] = useState("2026-03-15");
  const allSelected = selectedEmpIds.length === employees.length;

  function toggleAll() {
    setSelectedEmpIds(allSelected ? [] : employees.map((e) => e.id));
  }

  function toggleEmp(id: string) {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
          <h3 className="text-lg font-display font-bold text-white">Assign Training</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Select Employees
            </label>
            <div className="bg-navy-800 border border-navy-700 rounded-lg max-h-48 overflow-y-auto">
              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-navy-700/50 hover:bg-navy-700/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  readOnly
                  className="h-4 w-4 rounded border-navy-600 bg-navy-900 text-amber-500"
                />
                <span className="text-sm font-medium text-amber-400">Select All</span>
              </button>
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmp(emp.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-navy-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmpIds.includes(emp.id)}
                    readOnly
                    className="h-4 w-4 rounded border-navy-600 bg-navy-900 text-amber-500"
                  />
                  <div className={`h-6 w-6 rounded-full ${emp.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                    {emp.initials}
                  </div>
                  <span className="text-sm text-white">{emp.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{emp.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Training Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {trainingCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.duration})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={() => {
              if (selectedEmpIds.length > 0) onAssign(selectedEmpIds, courseId, dueDate);
            }}
            disabled={selectedEmpIds.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Assign to {selectedEmpIds.length} Employee{selectedEmpIds.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Training Status Badge ────────────────────────────────────────────────────

function TrainingStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-green/15 text-status-green">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </span>
      );
    case "overdue":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-red/15 text-status-red">
          <AlertCircle className="h-3 w-3" /> Overdue
        </span>
      );
    case "in-progress":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-400/15 text-blue-400">
          <Clock className="h-3 w-3" /> In Progress
        </span>
      );
    case "not-started":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-navy-700/50 text-gray-400">
          <Clock className="h-3 w-3" /> Not Started
        </span>
      );
    default:
      return null;
  }
}

function EmployeeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "current":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-green/15 text-status-green">
          <CheckCircle2 className="h-3 w-3" /> Current
        </span>
      );
    case "overdue":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-red/15 text-status-red">
          <AlertCircle className="h-3 w-3" /> Overdue
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-amber/15 text-status-amber">
          <Clock className="h-3 w-3" /> Pending
        </span>
      );
    default:
      return null;
  }
}

// ─── Helper: days overdue ─────────────────────────────────────────────────────

function daysOverdue(dueDate?: string): number {
  if (!dueDate) return 0;
  const now = new Date("2026-02-24");
  const due = new Date(dueDate);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [localEmployees] = useState<Employee[]>([...seedEmployees]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState("");
  const [certModal, setCertModal] = useState<{ empName: string; courseName: string; completedDate: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const total = localEmployees.length;
    const fullyTrained = localEmployees.filter((e) => e.status === "current").length;
    const overdue = localEmployees.filter((e) => e.status === "overdue").length;
    const pending = localEmployees.filter((e) => e.status === "pending").length;
    const pct = total > 0 ? Math.round((fullyTrained / total) * 100) : 100;
    return { total, fullyTrained, overdue, pending, pct };
  }, [localEmployees]);

  // Training history from audit log (training-related entries)
  const trainingHistory = useMemo(() => {
    return auditLog.filter(
      (entry) =>
        entry.entry.toLowerCase().includes("training") ||
        entry.entry.toLowerCase().includes("new hire")
    );
  }, []);

  const filteredHistory = useMemo(() => {
    if (!historyFilter) return trainingHistory;
    const q = historyFilter.toLowerCase();
    return trainingHistory.filter((e) => e.entry.toLowerCase().includes(q));
  }, [trainingHistory, historyFilter]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleAssign(empIds: string[], courseId: string, dueDate: string) {
    const course = trainingCourses.find((c) => c.id === courseId);
    showToast(
      `${course?.title ?? "Training"} assigned to ${empIds.length} employee${empIds.length > 1 ? "s" : ""}`
    );
    setShowAssignModal(false);
  }

  const summaryCards = [
    { label: "Total Employees", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Fully Trained", value: stats.fullyTrained, icon: CheckCircle2, color: "text-status-green", bg: "bg-status-green/10" },
    { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-status-red", bg: "bg-status-red/10" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-status-amber", bg: "bg-status-amber/10" },
    { label: "Compliance", value: `${stats.pct}%`, icon: BarChart3, color: stats.pct === 100 ? "text-status-green" : "text-status-amber", bg: stats.pct === 100 ? "bg-status-green/10" : "bg-status-amber/10" },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {certModal && (
        <CertificateModal
          empName={certModal.empName}
          courseName={certModal.courseName}
          completedDate={certModal.completedDate}
          onClose={() => setCertModal(null)}
        />
      )}
      {showAssignModal && (
        <AssignModal
          employees={localEmployees}
          onAssign={handleAssign}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Training</h1>
          <p className="text-sm text-gray-400 mt-1">
            Employee HazCom training status and compliance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await generateTrainingRosterPDF();
              } catch (err) {
                console.error("PDF generation error:", err);
                alert("PDF error: " + (err instanceof Error ? err.message : "Unknown error"));
              }
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Export Roster PDF
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            Assign Training
          </button>
        </div>
      </div>

      <div className="mb-6">
        <HelpCard>
          <p><strong className="text-amber-400">OSHA requires chemical hazard training at two trigger points:</strong></p>
          <p><strong className="text-white">1. Initial Assignment</strong> — When an employee first starts working with or around hazardous chemicals. This must cover: the requirements of the HazCom standard, where to find SDS, how to read labels, the hazards of chemicals in their work area, and protective measures.</p>
          <p><strong className="text-white">2. New Hazard Introduced</strong> — When a chemical with a hazard type not previously present is added to the work area. Note: this is about NEW HAZARDS, not just new products. If you already use flammable solvents and add another flammable solvent, retraining isn&apos;t required. But if you add a respiratory sensitizer (like isocyanate clearcoat) for the first time — that requires training.</p>
          <p><strong className="text-amber-400">Documentation:</strong> While OSHA doesn&apos;t explicitly mandate written training records, without them you have absolutely no way to prove training occurred. Every safety professional, attorney, and OSHA consultant recommends documented records with dates, topics, and employee acknowledgments. During an inspection, &quot;we told them about it&quot; with no documentation is treated as no training.</p>
          <p>ShieldSDS auto-detects when new hazard types enter your inventory and assigns targeted training to affected employees.</p>
          <p className="text-amber-500/80 text-xs">[29 CFR 1910.1200(h)]</p>
        </HelpCard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-navy-900 border border-navy-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <p className={`font-display font-black text-3xl ${typeof card.value === "string" ? card.color : "text-white"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Overdue Alerts */}
      {localEmployees
        .filter((e) => e.status === "overdue")
        .map((emp) => {
          const overdueCourses = emp.trainings
            .filter((t) => t.status === "overdue")
            .map((t) => {
              const course = trainingCourses.find((c) => c.id === t.courseId);
              return course ? `${course.title} (${daysOverdue(t.dueDate)} days overdue)` : null;
            })
            .filter(Boolean);
          return (
            <div key={emp.id} className="mb-4 rounded-xl bg-status-red/10 border border-status-red/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-status-red flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Training Overdue: {emp.name}</p>
                  <p className="text-xs text-gray-400">{overdueCourses.join(", ")}</p>
                </div>
              </div>
              <button
                onClick={() => showToast(`Reminder sent to ${emp.name}`)}
                className="flex items-center gap-1 text-xs bg-status-red/15 hover:bg-status-red/25 text-status-red px-3 py-1.5 rounded-lg transition-colors"
              >
                <Send className="h-3 w-3" /> Send Reminder
              </button>
            </div>
          );
        })}

      {/* Employee Roster */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Employee Roster
        </h2>
        <div className="space-y-3">
          {localEmployees.map((emp) => {
            const empStats = getEmployeeTrainingStats(emp);
            const isExpanded = expandedEmployee === emp.id;
            const completionPct = empStats.total > 0 ? Math.round((empStats.completed / empStats.total) * 100) : 100;
            const borderColor = emp.status === "current" ? "border-status-green" : emp.status === "overdue" ? "border-status-red" : "border-status-amber";

            return (
              <div key={emp.id} className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-full ${emp.color} flex items-center justify-center text-sm font-bold text-white ring-2 ${borderColor}`}>
                      {emp.initials}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.role} · Hired {emp.hireDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Completion bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completionPct === 100 ? "bg-status-green" : "bg-status-amber"}`}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-16">{empStats.completed}/{empStats.total} done</span>
                    </div>
                    <EmployeeStatusBadge status={emp.status} />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-navy-700/30">
                    <div className="pt-3 space-y-2">
                      {emp.trainings.map((t) => {
                        const course = trainingCourses.find((c) => c.id === t.courseId);
                        if (!course) return null;
                        return (
                          <div
                            key={t.courseId}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-navy-800/40"
                          >
                            <div className="flex items-center gap-3">
                              <TrainingStatusBadge status={t.status} />
                              <div>
                                <p className="text-sm text-white">{course.title}</p>
                                <p className="text-xs text-gray-500">
                                  {course.duration} · {course.required ? "Required" : "Role-specific"}
                                  {t.status === "completed" && t.completedDate && ` · Completed ${t.completedDate}`}
                                  {t.status === "overdue" && t.dueDate && ` · Due ${t.dueDate} (${daysOverdue(t.dueDate)} days overdue)`}
                                  {(t.status === "not-started" || t.status === "in-progress") && t.dueDate && ` · Due ${t.dueDate}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {t.status === "completed" && (
                                <button
                                  onClick={() => setCertModal({ empName: emp.name, courseName: course.title, completedDate: t.completedDate || "N/A" })}
                                  className="flex items-center gap-1 text-xs bg-navy-800 hover:bg-navy-700 border border-navy-600 text-gray-300 hover:text-white px-2 py-1.5 rounded-md transition-colors"
                                >
                                  <Award className="h-3 w-3" /> Certificate
                                </button>
                              )}
                              {t.status === "overdue" && (
                                <button
                                  onClick={() => showToast(`Reminder sent to ${emp.name} for ${course.title}`)}
                                  className="flex items-center gap-1 text-xs bg-status-red/15 hover:bg-status-red/25 text-status-red px-2 py-1.5 rounded-md transition-colors"
                                >
                                  <Send className="h-3 w-3" /> Remind
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Training Courses Panel */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Training Courses
        </h2>
        <div className="space-y-3">
          {trainingCourses.map((course) => {
            const courseStats = getTrainingCourseStats(course.id);
            const pct = courseStats.total > 0 ? Math.round((courseStats.completed / courseStats.total) * 100) : 100;
            const isExpanded = expandedCourse === course.id;
            const courseType = course.required
              ? "Required"
              : course.title.startsWith("New Chemical")
              ? "Triggered"
              : "Role-specific";

            return (
              <div key={course.id} className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className="w-full px-5 py-4 hover:bg-navy-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-white">{course.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        courseType === "Required"
                          ? "bg-blue-400/10 text-blue-400"
                          : courseType === "Triggered"
                          ? "bg-purple-400/10 text-purple-400"
                          : "bg-navy-700/50 text-gray-400"
                      }`}>
                        {courseType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{course.duration}</span>
                      <span className={`font-medium ${pct === 100 ? "text-status-green" : "text-status-amber"}`}>
                        {courseStats.completed}/{courseStats.total}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? "bg-status-green" : "bg-status-amber"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-navy-700/30">
                    <p className="text-xs text-gray-400 py-2">{course.description}</p>
                    <div className="space-y-1">
                      {localEmployees.map((emp) => {
                        const t = emp.trainings.find((tr) => tr.courseId === course.id);
                        if (!t) return null;
                        return (
                          <div key={emp.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-navy-800/40">
                            <div className="flex items-center gap-3">
                              <div className={`h-6 w-6 rounded-full ${emp.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                {emp.initials}
                              </div>
                              <span className="text-sm text-white">{emp.name}</span>
                            </div>
                            <TrainingStatusBadge status={t.status} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Training History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Training History
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Filter by employee..."
              className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {filteredHistory.map((entry, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-navy-800/30 transition-colors ${
                i < filteredHistory.length - 1 ? "border-b border-navy-700/30" : ""
              }`}
            >
              <div className="h-7 w-7 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                {entry.entry.toLowerCase().includes("completed") ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-green" />
                ) : entry.entry.toLowerCase().includes("overdue") ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-status-red" />
                ) : entry.entry.toLowerCase().includes("assigned") ? (
                  <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{entry.entry}</p>
                <p className="text-xs text-gray-500">{entry.time}</p>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <p className="py-8 text-center text-gray-500 text-sm">No training events match your filter.</p>
          )}
        </div>
      </div>

      {/* Auto-trigger Explanation */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-navy-900 border border-amber-500/20 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            Automatic Training Triggers
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            Training is automatically assigned when new chemical hazards are added to inventory. When a
            chemical with a hazard type not previously present is added, targeted training is assigned to all
            employees in that work area. This satisfies OSHA 29 CFR 1910.1200(h)(1) requirements for training
            when new hazards are introduced.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" /> Last triggered: Feb 10, 2026 — BASF Glasurit 923-210
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
