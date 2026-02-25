import { getChemicals, getEmployees } from "@/lib/chemicals";
import type { Chemical, Employee } from "@/lib/types";

// ── Training status for a single employee ────────────────────────────────────

const ALL_MODULES = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"];

export type TrainingStatus = "current" | "due-soon" | "overdue" | "in-progress" | "not-started";

export function getEmployeeTrainingStatus(emp: Employee): {
  status: TrainingStatus;
  completedCount: number;
  remainingCount: number;
  daysUntilDue: number | null;
  statusLabel: string;
} {
  const completedCount = ALL_MODULES.filter((m) => emp.completed_modules?.includes(m)).length;
  const remainingCount = 7 - completedCount;

  // Not started: zero modules
  if (completedCount === 0) {
    return {
      status: "not-started",
      completedCount,
      remainingCount,
      daysUntilDue: null,
      statusLabel: `Not started: new hire needs orientation`,
    };
  }

  // In progress: some but not all 7
  if (completedCount < 7) {
    return {
      status: "in-progress",
      completedCount,
      remainingCount,
      daysUntilDue: null,
      statusLabel: `In progress: ${completedCount} of 7 modules complete`,
    };
  }

  // All 7 complete — check annual refresher
  if (!emp.last_training) {
    // All 7 done but no date recorded — treat as overdue
    return {
      status: "overdue",
      completedCount,
      remainingCount: 0,
      daysUntilDue: null,
      statusLabel: `Overdue: annual refresher date unknown`,
    };
  }

  const dueDate = new Date(emp.last_training);
  dueDate.setFullYear(dueDate.getFullYear() + 1);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return {
      status: "overdue",
      completedCount,
      remainingCount: 0,
      daysUntilDue,
      statusLabel: `Overdue: annual refresher ${Math.abs(daysUntilDue)} days past due`,
    };
  }

  if (daysUntilDue <= 30) {
    return {
      status: "due-soon",
      completedCount,
      remainingCount: 0,
      daysUntilDue,
      statusLabel: `Due soon: refresher due in ${daysUntilDue} days`,
    };
  }

  return {
    status: "current",
    completedCount,
    remainingCount: 0,
    daysUntilDue,
    statusLabel: `Up to date`,
  };
}

// ── Shared compliance score ──────────────────────────────────────────────────

export interface ScoreBreakdown {
  score: number;
  weight: number;
  current: number;
  total: number;
  label: string;
  pct: number;
}

export interface ComplianceResult {
  overall: number;
  breakdown: {
    sds: ScoreBreakdown;
    labels: ScoreBreakdown;
    training: ScoreBreakdown;
    program: ScoreBreakdown;
  };
  status: string;
  statusColor: "green" | "amber" | "red";
  improvements: { text: string; points: number }[];
  actionItemCount: number;
}

export function calculateComplianceScore(
  chemicals?: Chemical[],
  employees?: Employee[],
): ComplianceResult {
  const chems = chemicals ?? getChemicals();
  const emps = employees ?? getEmployees();

  // ── SDS Coverage — 30% weight ──
  const totalChemicals = chems.length;
  const currentSDS = chems.filter((c) => c.sds_status === "current").length;
  const sdsPct = totalChemicals > 0 ? (currentSDS / totalChemicals) * 100 : 100;

  // ── Container Labels — 25% weight ──
  const totalLabelItems = chems.length; // each chemical entry = needs a label
  const labeledItems = chems.filter((c) => c.labeled === true).length;
  const labelPct = totalLabelItems > 0 ? (labeledItems / totalLabelItems) * 100 : 100;

  // ── Employee Training — 30% weight ──
  const totalEmployees = emps.length;
  const trainedEmployees = emps.filter((e) => {
    const info = getEmployeeTrainingStatus(e);
    return info.status === "current" || info.status === "due-soon";
  }).length;
  const trainingPct = totalEmployees > 0 ? (trainedEmployees / totalEmployees) * 100 : 100;

  // ── Written Program — 15% weight ──
  const hasChemicals = chems.length > 0;
  const hasEmployees = emps.length > 0;
  const programChecks = [hasChemicals, hasEmployees, true /* ShieldSDS IS the written program */];
  const programPct = (programChecks.filter(Boolean).length / programChecks.length) * 100;

  // ── Weighted total ──
  const overall = Math.round(
    sdsPct * 0.30 +
    labelPct * 0.25 +
    trainingPct * 0.30 +
    programPct * 0.15,
  );

  // ── Improvement suggestions ──
  const improvements: { text: string; points: number }[] = [];

  // Training improvements
  const untrainedEmps = emps.filter((e) => {
    const info = getEmployeeTrainingStatus(e);
    return info.status !== "current" && info.status !== "due-soon";
  });
  if (untrainedEmps.length > 0 && totalEmployees > 0) {
    const pointsPerEmp = Math.round((30 / totalEmployees) * 1);
    untrainedEmps.forEach((e) => {
      const info = getEmployeeTrainingStatus(e);
      if (info.status === "not-started") {
        improvements.push({ text: `Complete training for ${e.name} (new hire)`, points: pointsPerEmp });
      } else if (info.status === "in-progress") {
        improvements.push({ text: `Finish training for ${e.name} (${info.remainingCount} modules left)`, points: pointsPerEmp });
      } else if (info.status === "overdue") {
        improvements.push({ text: `Refresh training for ${e.name} (annual overdue)`, points: pointsPerEmp });
      }
    });
  }

  // SDS improvements
  const missingSds = chems.filter((c) => c.sds_status === "missing");
  const expiredSds = chems.filter((c) => c.sds_status === "expired");
  if (totalChemicals > 0) {
    const pointsPerSds = Math.round((30 / totalChemicals) * 1);
    missingSds.forEach((c) => {
      improvements.push({ text: `Find SDS for ${c.product_name}`, points: pointsPerSds });
    });
    expiredSds.forEach((c) => {
      improvements.push({ text: `Update expired SDS for ${c.product_name}`, points: pointsPerSds });
    });
  }

  // Label improvements
  const unlabeled = chems.filter((c) => !c.labeled);
  if (totalLabelItems > 0) {
    const pointsPerLabel = Math.round((25 / totalLabelItems) * 1);
    unlabeled.forEach((c) => {
      improvements.push({ text: `Print label for ${c.product_name}`, points: pointsPerLabel });
    });
  }

  // Sort by points descending, take top 3
  improvements.sort((a, b) => b.points - a.points);

  // ── Action item count ──
  const actionItemCount =
    missingSds.length +
    expiredSds.length +
    unlabeled.length +
    untrainedEmps.length;

  // ── Status ──
  const status = overall >= 90 ? "Inspection Ready" : overall >= 70 ? "Getting Close" : overall >= 50 ? "Needs Work" : "At Risk";
  const statusColor: "green" | "amber" | "red" = overall >= 90 ? "green" : overall >= 70 ? "amber" : "red";

  return {
    overall,
    breakdown: {
      sds: { score: Math.round(sdsPct), weight: 30, current: currentSDS, total: totalChemicals, label: "SDS Coverage", pct: Math.round(sdsPct) },
      labels: { score: Math.round(labelPct), weight: 25, current: labeledItems, total: totalLabelItems, label: "Container Labels", pct: Math.round(labelPct) },
      training: { score: Math.round(trainingPct), weight: 30, current: trainedEmployees, total: totalEmployees, label: "Employee Training", pct: Math.round(trainingPct) },
      program: { score: Math.round(programPct), weight: 15, current: programChecks.filter(Boolean).length, total: programChecks.length, label: "Written Program", pct: Math.round(programPct) },
    },
    status,
    statusColor,
    improvements: improvements.slice(0, 3),
    actionItemCount,
  };
}
