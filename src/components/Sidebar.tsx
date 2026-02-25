"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getChemicals, getEmployees, initializeStore } from "@/lib/chemicals";
import type { Chemical, Employee } from "@/lib/types";
import {
  Shield,
  Camera,
  LayoutDashboard,
  FileText,
  Tags,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  MapPin,
  Package,
  Users,
  CheckCircle2,
  Search,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badgeKey: null },
  { label: "HazCom Program", href: "/hazcom-program", icon: BookOpen, badgeKey: null },
  { label: "SDS Library", href: "/sds-library", icon: FileText, badgeKey: "missingSds" as const },
  { label: "Chemical Inventory", href: "/inventory", icon: Package, badgeKey: null },
  { label: "Labels", href: "/labels", icon: Tags, badgeKey: "unlabeled" as const },
  { label: "Training", href: "/training", icon: GraduationCap, badgeKey: "trainingIssues" as const },
  { label: "Contractors", href: "/contractors", icon: Users, badgeKey: null },
  { label: "Inspection Mode", href: "/inspection", icon: ClipboardCheck, badgeKey: null },
  { label: "Browse & Add", href: "/sds-search", icon: Search, badgeKey: null },
];

const locations = [
  { name: "Mike\u2019s Auto Body", sub: "Main Location", active: true },
  { name: "Mike\u2019s Auto Body", sub: "Warehouse", active: false },
  { name: "Mike\u2019s Auto Body", sub: "Mobile Unit", active: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [locOpen, setLocOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(locations[0]);
  const dropRef = useRef<HTMLDivElement>(null);

  // Live data for badges
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
    setEmployees(getEmployees());
  }, []);

  // Refresh badge counts when pathname changes (user navigated after making changes)
  useEffect(() => {
    setChemicals(getChemicals());
    setEmployees(getEmployees());
  }, [pathname]);

  // Training status helpers (matches training page logic)
  const trainingCounts = useMemo(() => {
    const ALL_MODS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];
    const MOD_EQ: Record<string, string[]> = {
      m1: ["m1", "hazcom-overview"], m2: ["m2", "reading-sds"], m3: ["m3", "ghs-labels"],
      m4: ["m4", "ppe-selection"], m5: ["m5", "chemical-storage"], m6: ["m6", "emergency-response"],
      m7: ["m7", "spill-response"],
    };
    let overdue = 0;
    let dueSoon = 0;
    employees.forEach((emp) => {
      const completed = ALL_MODS.filter((mid) =>
        MOD_EQ[mid].some((eq) => emp.completed_modules?.includes(eq))
      ).length;
      if (completed < 7 || !emp.last_training) {
        // not-started counts as an issue
        if (completed < 7) { overdue++; return; }
      }
      if (emp.last_training) {
        const due = new Date(emp.last_training);
        due.setFullYear(due.getFullYear() + 1);
        const days = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) overdue++;
        else if (days <= 30) dueSoon++;
      }
    });
    return { overdue, dueSoon, total: overdue + dueSoon };
  }, [employees]);

  // Badge counts
  const badges = useMemo(() => {
    const missingSds = chemicals.filter((c) => c.sds_status === "missing").length;
    const unlabeled = chemicals.filter((c) => !c.labeled).length;
    const trainingIssues = trainingCounts.total;
    return { missingSds, unlabeled, trainingIssues };
  }, [chemicals, trainingCounts]);

  // Dynamic user — first employee with Owner/Manager role, or first employee
  const currentUser = useMemo(() => {
    const manager = employees.find(
      (e) => e.role.toLowerCase().includes("owner") || e.role.toLowerCase().includes("manager")
    );
    if (manager) return manager;
    return employees[0] || null;
  }, [employees]);

  const userInitials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SH";

  const userRole = currentUser
    ? currentUser.role.split("/")[0].trim().split("(")[0].trim()
    : "User";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setLocOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-navy-900 border-r border-navy-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-navy-700/50">
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-7 w-7 text-amber-400 transition-transform group-hover:scale-110" />
          <span className="font-display font-black text-lg text-white">
            Shield<span className="text-amber-400">SDS</span>
          </span>
        </Link>
      </div>

      {/* Location selector */}
      <div className="px-4 py-3 border-b border-navy-700/50 relative" ref={dropRef}>
        <button
          onClick={() => setLocOpen(!locOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors text-left"
        >
          <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {selectedLoc.name}
            </p>
            <p className="text-xs text-gray-400">{selectedLoc.sub}</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${locOpen ? "rotate-180" : ""}`} />
        </button>
        {locOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {locations.map((loc, i) => (
              <button
                key={i}
                onClick={() => { setSelectedLoc(loc); setLocOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-navy-700 transition-colors ${
                  selectedLoc.sub === loc.sub ? "bg-navy-700/50" : ""
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{loc.name}</p>
                  <p className="text-xs text-gray-400">{loc.sub}</p>
                </div>
                {selectedLoc.sub === loc.sub && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scan Chemical CTA — visually distinct, above nav */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/scan"
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-sm px-4 py-3 rounded-lg transition-colors"
        >
          <Camera className="h-5 w-5" />
          Scan Chemical
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          const badgeColor =
            item.badgeKey === "unlabeled"
              ? "bg-status-amber text-navy-950"
              : item.badgeKey === "trainingIssues" && trainingCounts.overdue === 0
              ? "bg-status-amber text-navy-950"
              : "bg-status-red text-white";

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-gray-300 hover:text-white hover:bg-navy-800"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-amber-400" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-navy-700/50 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Site
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
            {userInitials}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{currentUser?.name || "ShieldSDS User"}</p>
            <p className="text-xs text-gray-400">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
