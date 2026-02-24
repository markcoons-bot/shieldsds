"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Tags,
  GraduationCap,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import {
  sdsEntries,
  inventoryItems,
  employees,
  shopInfo,
  programVersionHistory,
} from "@/lib/data";

export default function SharePage() {
  // ── Compute compliance data (same logic as inspection page) ──
  const totalSDS = sdsEntries.length;
  const currentSDS = sdsEntries.filter((s) => s.sdsStatus === "current").length;
  const missingSDS = sdsEntries.filter((s) => s.sdsStatus === "missing").length;
  const reviewSDS = sdsEntries.filter((s) => s.sdsStatus === "review").length;

  const totalContainers = inventoryItems.reduce((sum, i) => sum + i.containers, 0);
  const labeledContainers = inventoryItems.filter((i) => i.labeled).reduce((sum, i) => sum + i.containers, 0);
  const unlabeledCount = inventoryItems.filter((i) => !i.labeled).length;
  const labelPct = totalContainers > 0 ? Math.round((labeledContainers / totalContainers) * 100) : 100;

  const totalEmployees = employees.length;
  const fullyTrained = employees.filter((e) => e.status === "current").length;
  const overdueCount = employees.filter((e) => e.status === "overdue").length;
  const trainingPct = totalEmployees > 0 ? Math.round((fullyTrained / totalEmployees) * 100) : 100;

  const sdsPct = totalSDS > 0 ? Math.round((currentSDS / totalSDS) * 100) : 100;

  // Weighted score
  const weights = { sds: 25, labels: 25, training: 25, program: 15, multiEmployer: 10 };
  const sdsScore = sdsPct === 100 ? 1 : sdsPct >= 90 ? 0.5 : 0;
  const labelScore = labelPct === 100 ? 1 : labelPct >= 80 ? 0.5 : 0;
  const trainingScore = trainingPct === 100 ? 1 : trainingPct >= 80 ? 0.5 : 0;
  const programScore = 1;
  const multiScore = 1;
  const score = Math.round(
    sdsScore * weights.sds + labelScore * weights.labels + trainingScore * weights.training +
    programScore * weights.program + multiScore * weights.multiEmployer
  );

  const circumference = 2 * Math.PI * 52;
  const readinessColor = score === 100 ? "#34C759" : score >= 80 ? "#F5A623" : "#FF3B30";
  const readinessLabel = score === 100 ? "Fully Compliant" : score >= 80 ? "Mostly Compliant" : "Needs Attention";

  const checklist = useMemo(() => [
    {
      label: "Written HazCom Program",
      icon: BookOpen,
      pass: true,
      detail: `Current — v${programVersionHistory[0].version} (updated ${programVersionHistory[0].date})`,
    },
    {
      label: "SDS Coverage",
      icon: FileText,
      pass: sdsPct === 100,
      detail: missingSDS > 0
        ? `${currentSDS}/${totalSDS} current — ${missingSDS} missing${reviewSDS > 0 ? `, ${reviewSDS} need review` : ""}`
        : `All ${totalSDS} SDS on file and current`,
    },
    {
      label: "Container Labeling",
      icon: Tags,
      pass: labelPct === 100,
      detail: unlabeledCount > 0
        ? `${labelPct}% labeled — ${unlabeledCount} containers need labels`
        : `All ${totalContainers} containers properly labeled`,
    },
    {
      label: "Employee Training",
      icon: GraduationCap,
      pass: trainingPct === 100,
      detail: overdueCount > 0
        ? `${fullyTrained}/${totalEmployees} current — ${overdueCount} overdue`
        : `All ${totalEmployees} employees fully trained`,
    },
    {
      label: "Chemical Inventory",
      icon: FlaskConical,
      pass: true,
      detail: `${sdsEntries.length} chemicals tracked across ${new Set(inventoryItems.map((i) => i.location)).size} locations`,
    },
    {
      label: "Multi-Employer Communication",
      icon: Shield,
      pass: true,
      detail: "Contractor safety packet system active",
    },
  ], [sdsPct, currentSDS, totalSDS, missingSDS, reviewSDS, labelPct, unlabeledCount, totalContainers, trainingPct, fullyTrained, totalEmployees, overdueCount]);

  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const reportTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Top bar */}
      <div className="bg-navy-900 border-b border-navy-700/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-400" />
            <span className="font-display font-black text-lg text-white">
              Shield<span className="text-amber-400">SDS</span>
            </span>
          </div>
          <span className="text-xs text-gray-500">Read-Only Compliance Report</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display font-black text-3xl mb-2">HazCom Compliance Report</h1>
          <p className="text-gray-400">{shopInfo.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {shopInfo.address}, {shopInfo.city}, {shopInfo.state} {shopInfo.zip}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Generated: {reportDate} at {reportTime}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Main Location</span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center mb-10">
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl p-8 flex items-center gap-8 w-full max-w-xl">
            <div className="relative flex-shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1A2D4D" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={readinessColor}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${circumference * (score / 100)} ${circumference * (1 - score / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-black text-3xl">{score}%</span>
                <span className="text-xs text-gray-400">Compliant</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className={`h-5 w-5 ${score === 100 ? "text-status-green" : score >= 80 ? "text-status-amber" : "text-status-red"}`} />
                <h2 className="font-display font-bold text-xl">{readinessLabel}</h2>
              </div>
              <p className="text-sm text-gray-400">
                {score === 100
                  ? "This facility is fully compliant with OSHA HazCom requirements."
                  : `This facility has ${checklist.filter((c) => !c.pass).length} area(s) requiring attention.`}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Compliance Checklist</h2>
          <div className="space-y-2">
            {checklist.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    item.pass ? "bg-navy-900 border-navy-700/50" : "bg-status-red/5 border-status-red/20"
                  }`}
                >
                  {item.pass ? (
                    <CheckCircle2 className="h-5 w-5 text-status-green flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-status-red flex-shrink-0" />
                  )}
                  <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.pass ? "bg-status-green/15 text-status-green" : "bg-status-red/15 text-status-red"
                  }`}>
                    {item.pass ? "Pass" : "Needs Attention"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "Chemicals Tracked", value: sdsEntries.length, icon: FlaskConical },
            { label: "SDS on File", value: `${currentSDS}/${totalSDS}`, icon: FileText },
            { label: "Employees Trained", value: `${fullyTrained}/${totalEmployees}`, icon: GraduationCap },
            { label: "Containers Labeled", value: `${labelPct}%`, icon: Tags },
          ].map((stat) => (
            <div key={stat.label} className="bg-navy-900 border border-navy-700/50 rounded-xl p-4 text-center">
              <stat.icon className="h-5 w-5 text-gray-500 mx-auto mb-2" />
              <p className="font-display font-bold text-2xl">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Score Breakdown */}
        <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "SDS Coverage", pct: Math.round(sdsScore * 100), weight: weights.sds },
              { label: "Container Labeling", pct: Math.round(labelScore * 100), weight: weights.labels },
              { label: "Employee Training", pct: Math.round(trainingScore * 100), weight: weights.training },
              { label: "Written Program", pct: Math.round(programScore * 100), weight: weights.program },
              { label: "Multi-Employer", pct: Math.round(multiScore * 100), weight: weights.multiEmployer },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-36">{item.label}</span>
                <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.pct === 100 ? "bg-status-green" : item.pct >= 50 ? "bg-status-amber" : "bg-status-red"}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{item.pct}% ({item.weight}pt)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-navy-700/50 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-amber-400" />
            <span className="font-display font-bold text-white">
              Shield<span className="text-amber-400">SDS</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
            This report was generated by ShieldSDS — Inspection-Ready Chemical Compliance for Small Shops
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Learn More About ShieldSDS
          </Link>
          <p className="text-xs text-gray-600 mt-4">
            &copy; {new Date().getFullYear()} ShieldSDS. Report generated for authorized recipients only.
          </p>
        </div>
      </div>
    </div>
  );
}
