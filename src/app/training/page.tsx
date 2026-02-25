"use client";

import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

const employees = [
  {
    name: "Mike Rodriguez",
    role: "Owner / Manager",
    initialTraining: "2024-01-15",
    lastTraining: "2025-12-08",
    status: "current" as const,
    completedCourses: 6,
    pendingCourses: 0,
  },
  {
    name: "Carlos Mendez",
    role: "Body Tech",
    initialTraining: "2024-03-22",
    lastTraining: "2026-02-16",
    status: "current" as const,
    completedCourses: 5,
    pendingCourses: 0,
  },
  {
    name: "Marcus Thompson",
    role: "Painter",
    initialTraining: "2024-06-10",
    lastTraining: "2025-11-20",
    status: "overdue" as const,
    completedCourses: 4,
    pendingCourses: 1,
  },
  {
    name: "Jamie Reyes",
    role: "Detail Tech (New Hire)",
    initialTraining: "—",
    lastTraining: "—",
    status: "pending" as const,
    completedCourses: 0,
    pendingCourses: 2,
  },
  {
    name: "David Park",
    role: "Mechanic",
    initialTraining: "2024-08-05",
    lastTraining: "2026-01-10",
    status: "current" as const,
    completedCourses: 4,
    pendingCourses: 0,
  },
];

const trainingCourses = [
  {
    name: "HazCom Initial Orientation",
    type: "Required — Initial Assignment",
    duration: "15 min",
    assigned: 5,
    completed: 4,
  },
  {
    name: "New Chemical: PPG DBC Basecoat",
    type: "Triggered — New Hazard Introduced",
    duration: "5 min",
    assigned: 3,
    completed: 2,
  },
  {
    name: "SDS & Label Reading",
    type: "Required — Initial Assignment",
    duration: "10 min",
    assigned: 5,
    completed: 5,
  },
  {
    name: "New Chemical: Acetone Handling",
    type: "Triggered — New Hazard Introduced",
    duration: "5 min",
    assigned: 4,
    completed: 4,
  },
  {
    name: "PPE Selection for Paint Booth",
    type: "Role-specific",
    duration: "8 min",
    assigned: 2,
    completed: 2,
  },
];

export default function TrainingPage() {
  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-navy/90 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight">Training</h1>
          <p className="text-sm text-gray-500">Employee HazCom training assignments &amp; records</p>
        </div>
        <button className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Assign Training
        </button>
      </div>

      <div className="p-8">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <div className="card p-5">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Employees</div>
            <div className="font-display font-black text-3xl text-white">{employees.length}</div>
          </div>
          <div className="card p-5">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Fully Trained</div>
            <div className="font-display font-black text-3xl text-status-good">
              {employees.filter((e) => e.status === "current").length}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Overdue</div>
            <div className="font-display font-black text-3xl text-status-bad">
              {employees.filter((e) => e.status === "overdue").length}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Pending (New Hire)</div>
            <div className="font-display font-black text-3xl text-status-warn">
              {employees.filter((e) => e.status === "pending").length}
            </div>
          </div>
        </div>

        {/* Overdue alert */}
        <div className="bg-status-bad/5 border border-status-bad/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-status-bad" />
            <div>
              <span className="text-sm font-semibold text-white">Marcus T. has overdue training</span>
              <span className="text-sm text-gray-400 ml-2">— &ldquo;New Chemical: PPG DBC Basecoat&rdquo; assigned 14 days ago</span>
            </div>
          </div>
          <button className="text-sm font-semibold text-status-bad hover:text-red-300 transition-colors">
            Send Reminder →
          </button>
        </div>

        {/* Launch Interactive Training */}
        <Link href="/training/learn" className="block mb-6">
          <div className="bg-amber-glow border border-amber/30 rounded-xl p-5 flex items-center justify-between hover:border-amber/50 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber" />
              </div>
              <div>
                <div className="text-white font-display font-bold text-lg">Launch Interactive HazCom Training</div>
                <div className="text-gray-400 text-sm">7-module foundation track · Industry-specific · OSHA 29 CFR 1910.1200(h) compliant</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Start Training <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Employee roster */}
          <div className="lg:col-span-3">
            <h2 className="font-display font-bold text-lg mb-4">Employee Roster</h2>
            <div className="space-y-2">
              {employees.map((emp, i) => (
                <div key={i} className="card p-4 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      emp.status === "current"
                        ? "bg-status-good/10 text-status-good"
                        : emp.status === "overdue"
                        ? "bg-status-bad/10 text-status-bad"
                        : "bg-status-warn/10 text-status-warn"
                    }`}>
                      {emp.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {emp.completedCourses} completed
                        {emp.pendingCourses > 0 && (
                          <span className="text-status-warn ml-1">• {emp.pendingCourses} pending</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        Last trained: {emp.lastTraining}
                      </div>
                    </div>
                    {emp.status === "current" && <span className="badge-good">Current</span>}
                    {emp.status === "overdue" && <span className="badge-bad">Overdue</span>}
                    {emp.status === "pending" && <span className="badge-warn">Pending</span>}
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training courses */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-lg mb-4">Training Modules</h2>
            <div className="space-y-3">
              {trainingCourses.map((course, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-semibold text-white">{course.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" /> {course.duration}
                    </div>
                  </div>
                  <div className="text-xs text-amber font-medium mb-3">{course.type}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-white/5 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          course.completed === course.assigned ? "bg-status-good" : "bg-amber"
                        }`}
                        style={{ width: `${(course.completed / course.assigned) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {course.completed}/{course.assigned}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 border border-dashed border-white/10 rounded-xl text-center">
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
      </div>
    </DashboardLayout>
  );
}
