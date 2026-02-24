"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  MapPin,
  ArrowRight,
  Save,
} from "lucide-react";
import {
  sdsEntries,
  inventoryItems,
  employees,
  trainingCourses,
  programVersionHistory,
} from "@/lib/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (result: { score: number; findings: string[] }) => void;
}

type ChemStatus = "present" | "not-found" | "unlisted" | null;
type LabelStatus = "yes" | "no" | "reprint" | null;

const STEP_TITLES = [
  "Verify Chemicals by Location",
  "Check Secondary Labels",
  "Verify SDS Accessibility",
  "Check Training Records",
  "Review Written Program",
  "Contractor Check",
];

export default function SelfAuditWizard({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);

  // Step 1: Chemical verification
  const [chemChecks, setChemChecks] = useState<Record<string, ChemStatus>>({});
  const [newChemName, setNewChemName] = useState("");

  // Step 2: Label checks
  const [labelChecks, setLabelChecks] = useState<Record<string, LabelStatus>>({});

  // Step 3: SDS accessibility
  const [sdsAccess, setSdsAccess] = useState<Record<string, boolean | null>>({
    quickAccess: null,
    tabletOn: null,
    offlineWorks: null,
    paperBinder: null,
  });

  // Step 4: Training active checks
  const [activeWorkers, setActiveWorkers] = useState<Record<string, boolean | null>>({});

  // Step 5: Written program
  const [programCurrent, setProgramCurrent] = useState<boolean | null>(null);
  const [programChanged, setProgramChanged] = useState<boolean | null>(null);

  // Step 6: Contractor check
  const [contractorsOnSite, setContractorsOnSite] = useState<boolean | null>(null);
  const [contractorPacketSent, setContractorPacketSent] = useState<boolean | null>(null);

  // Summary
  const [showSummary, setShowSummary] = useState(false);

  const locationGroups = useMemo(() => {
    const groups: Record<string, typeof inventoryItems> = {};
    inventoryItems.forEach((item) => {
      if (!groups[item.location]) groups[item.location] = [];
      groups[item.location].push(item);
    });
    return groups;
  }, []);

  const chemicalsWithSecondary = useMemo(
    () => sdsEntries.filter((s) => s.secondaryContainers > 0),
    []
  );

  // Compute audit findings
  const findings = useMemo(() => {
    const f: string[] = [];

    // Step 1 findings
    Object.entries(chemChecks).forEach(([id, status]) => {
      if (status === "not-found") {
        const item = inventoryItems.find((i) => i.id === id);
        if (item) f.push(`Chemical not found: ${item.product} in ${item.location}`);
      }
    });

    // Step 2 findings
    Object.entries(labelChecks).forEach(([id, status]) => {
      if (status === "no" || status === "reprint") {
        const sds = sdsEntries.find((s) => s.id === id);
        if (sds) f.push(`Label ${status === "no" ? "missing" : "needs reprinting"}: ${sds.productName}`);
      }
    });

    // Step 3 findings
    if (sdsAccess.quickAccess === false) f.push("SDS not accessible within 15 seconds from shop floor");
    if (sdsAccess.tabletOn === false) f.push("Shop tablet not powered on or accessible");
    if (sdsAccess.offlineWorks === false) f.push("Offline SDS access not working");
    if (sdsAccess.paperBinder === false) f.push("Paper backup binder not current");

    // Step 4 findings
    Object.entries(activeWorkers).forEach(([id, active]) => {
      if (active) {
        const emp = employees.find((e) => e.id === id);
        if (emp && emp.status !== "current") {
          f.push(`Training gap: ${emp.name} is working with chemicals but has incomplete training`);
        }
      }
    });

    // Step 5 findings
    if (programCurrent === false) f.push("Written HazCom program does not reflect current chemicals");
    if (programChanged === true) f.push("Changes noted since last program update — program needs revision");

    // Step 6 findings
    if (contractorsOnSite === true && contractorPacketSent === false) {
      f.push("Contractors on-site without safety packet");
    }

    return f;
  }, [chemChecks, labelChecks, sdsAccess, activeWorkers, programCurrent, programChanged, contractorsOnSite, contractorPacketSent]);

  const auditScore = useMemo(() => {
    let total = 0;
    let passed = 0;

    // Step 1
    const chemTotal = inventoryItems.length;
    const chemPassed = Object.values(chemChecks).filter((s) => s === "present").length;
    total += chemTotal;
    passed += chemPassed;

    // Step 2
    total += chemicalsWithSecondary.length;
    passed += Object.values(labelChecks).filter((s) => s === "yes").length;

    // Step 3
    total += 4;
    passed += Object.values(sdsAccess).filter((v) => v === true).length;

    // Step 4
    const activeCount = Object.values(activeWorkers).filter((v) => v !== null).length;
    total += activeCount;
    passed += Object.entries(activeWorkers).filter(([id, active]) => {
      if (!active) return true; // not active = not a risk
      const emp = employees.find((e) => e.id === id);
      return emp?.status === "current";
    }).filter(([, v]) => v !== null).length;

    // Step 5
    total += 2;
    if (programCurrent === true) passed++;
    if (programChanged === false) passed++;

    // Step 6
    total += 1;
    if (contractorsOnSite === false || contractorPacketSent === true) passed++;

    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }, [chemChecks, labelChecks, sdsAccess, activeWorkers, programCurrent, programChanged, contractorsOnSite, contractorPacketSent, chemicalsWithSecondary.length]);

  if (!open) return null;

  const canNext = (() => {
    if (step === 0) return Object.keys(chemChecks).length > 0;
    if (step === 1) return Object.keys(labelChecks).length > 0;
    if (step === 2) return Object.values(sdsAccess).some((v) => v !== null);
    if (step === 3) return Object.keys(activeWorkers).length > 0;
    if (step === 4) return programCurrent !== null;
    if (step === 5) return contractorsOnSite !== null;
    return true;
  })();

  const handleFinish = () => {
    setShowSummary(true);
  };

  const handleSave = () => {
    onComplete({ score: auditScore, findings });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              {showSummary ? "Audit Summary" : `Step ${step + 1}: ${STEP_TITLES[step]}`}
            </h2>
            {!showSummary && (
              <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of 6</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!showSummary && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex gap-1">
              {STEP_TITLES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-status-green" : i === step ? "bg-amber-500" : "bg-navy-700"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {showSummary ? (
            <SummaryView score={auditScore} findings={findings} onSave={handleSave} />
          ) : step === 0 ? (
            <Step1Chemicals
              locationGroups={locationGroups}
              chemChecks={chemChecks}
              setChemChecks={setChemChecks}
              newChemName={newChemName}
              setNewChemName={setNewChemName}
            />
          ) : step === 1 ? (
            <Step2Labels
              chemicals={chemicalsWithSecondary}
              labelChecks={labelChecks}
              setLabelChecks={setLabelChecks}
            />
          ) : step === 2 ? (
            <Step3SdsAccess sdsAccess={sdsAccess} setSdsAccess={setSdsAccess} />
          ) : step === 3 ? (
            <Step4Training activeWorkers={activeWorkers} setActiveWorkers={setActiveWorkers} />
          ) : step === 4 ? (
            <Step5Program
              programCurrent={programCurrent}
              setProgramCurrent={setProgramCurrent}
              programChanged={programChanged}
              setProgramChanged={setProgramChanged}
            />
          ) : (
            <Step6Contractors
              contractorsOnSite={contractorsOnSite}
              setContractorsOnSite={setContractorsOnSite}
              contractorPacketSent={contractorPacketSent}
              setContractorPacketSent={setContractorPacketSent}
            />
          )}
        </div>

        {/* Footer nav */}
        {!showSummary && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-navy-700 flex-shrink-0">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-xs text-gray-500">{step + 1} / 6</span>
            {step < 5 ? (
              <button
                onClick={() => canNext && setStep(step + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1 bg-status-green hover:bg-status-green/90 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Finish <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1Chemicals({
  locationGroups,
  chemChecks,
  setChemChecks,
  newChemName,
  setNewChemName,
}: {
  locationGroups: Record<string, typeof inventoryItems>;
  chemChecks: Record<string, ChemStatus>;
  setChemChecks: React.Dispatch<React.SetStateAction<Record<string, ChemStatus>>>;
  newChemName: string;
  setNewChemName: (v: string) => void;
}) {
  const setStatus = (id: string, status: ChemStatus) => {
    setChemChecks((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Walk to each storage area and verify the chemicals that should be there.
      </p>
      {Object.entries(locationGroups).map(([location, items]) => (
        <div key={location} className="bg-navy-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{location}</h3>
            <span className="text-xs text-gray-500">({items.length} chemicals)</span>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-300">{item.product}</span>
                <div className="flex gap-1.5">
                  {(["present", "not-found", "unlisted"] as ChemStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatus(item.id, status)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        chemChecks[item.id] === status
                          ? status === "present"
                            ? "bg-status-green/20 text-status-green border border-status-green/30"
                            : status === "not-found"
                            ? "bg-status-red/20 text-status-red border border-status-red/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                      }`}
                    >
                      {status === "present" ? "Present" : status === "not-found" ? "Not Found" : "Unlisted"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="bg-navy-800/50 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-2">Found an unlisted chemical?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newChemName}
            onChange={(e) => setNewChemName(e.target.value)}
            placeholder="Chemical name..."
            className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={() => { if (newChemName.trim()) setNewChemName(""); }}
            className="flex items-center gap-1 bg-navy-700 border border-navy-600 hover:border-amber-500/50 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Step2Labels({
  chemicals,
  labelChecks,
  setLabelChecks,
}: {
  chemicals: typeof sdsEntries;
  labelChecks: Record<string, LabelStatus>;
  setLabelChecks: React.Dispatch<React.SetStateAction<Record<string, LabelStatus>>>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Check every chemical with secondary containers. Is the label present and legible?
      </p>
      {chemicals.map((sds) => (
        <div key={sds.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-navy-800/50">
          <div>
            <p className="text-sm text-white">{sds.productName}</p>
            <p className="text-xs text-gray-500">{sds.secondaryContainers} container{sds.secondaryContainers > 1 ? "s" : ""} · {sds.storageLocation}</p>
          </div>
          <div className="flex gap-1.5">
            {(["yes", "no", "reprint"] as LabelStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setLabelChecks((prev) => ({ ...prev, [sds.id]: status }))}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  labelChecks[sds.id] === status
                    ? status === "yes"
                      ? "bg-status-green/20 text-status-green border border-status-green/30"
                      : "bg-status-red/20 text-status-red border border-status-red/30"
                    : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {status === "yes" ? "Yes" : status === "no" ? "No" : "Reprint"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step3SdsAccess({
  sdsAccess,
  setSdsAccess,
}: {
  sdsAccess: Record<string, boolean | null>;
  setSdsAccess: React.Dispatch<React.SetStateAction<Record<string, boolean | null>>>;
}) {
  const questions = [
    { key: "quickAccess", text: "Can you pull up any SDS from the shop floor in under 15 seconds?" },
    { key: "tabletOn", text: "Is the shop tablet powered on and accessible?" },
    { key: "offlineWorks", text: "Is offline mode working? (Turn off WiFi and try)" },
    { key: "paperBinder", text: "Is the paper backup binder in the front office current?" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Verify that employees can quickly access Safety Data Sheets during their shift.
      </p>
      {questions.map((q) => (
        <div key={q.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-navy-800/50">
          <p className="text-sm text-white flex-1 mr-4">{q.text}</p>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setSdsAccess((prev) => ({ ...prev, [q.key]: val }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  sdsAccess[q.key] === val
                    ? val
                      ? "bg-status-green/20 text-status-green border border-status-green/30"
                      : "bg-status-red/20 text-status-red border border-status-red/30"
                    : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {val ? "Yes" : q.key === "paperBinder" ? "No / None" : "No"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step4Training({
  activeWorkers,
  setActiveWorkers,
}: {
  activeWorkers: Record<string, boolean | null>;
  setActiveWorkers: React.Dispatch<React.SetStateAction<Record<string, boolean | null>>>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Identify which employees are currently working with chemicals and verify their training is complete.
      </p>
      {employees.map((emp) => {
        const completedCourses = emp.trainings.filter((t) => t.status === "completed").length;
        const totalCourses = trainingCourses.length;
        const hasGap = activeWorkers[emp.id] === true && emp.status !== "current";
        return (
          <div
            key={emp.id}
            className={`flex items-center justify-between py-3 px-4 rounded-lg ${
              hasGap ? "bg-status-red/10 border border-status-red/20" : "bg-navy-800/50"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium">{emp.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  emp.status === "current" ? "bg-status-green/15 text-status-green"
                    : emp.status === "overdue" ? "bg-status-red/15 text-status-red"
                    : "bg-amber-500/15 text-amber-400"
                }`}>
                  {emp.status === "current" ? "Trained" : emp.status === "overdue" ? "Overdue" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-gray-500">{emp.role} · {completedCourses}/{totalCourses} courses</p>
              {hasGap && (
                <p className="text-xs text-status-red mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Working with chemicals but training incomplete
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-[10px] text-gray-500">Working with chemicals?</p>
              <div className="flex gap-1.5">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setActiveWorkers((prev) => ({ ...prev, [emp.id]: val }))}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      activeWorkers[emp.id] === val
                        ? val ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-navy-600/50 text-gray-400 border border-navy-600"
                        : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Step5Program({
  programCurrent,
  setProgramCurrent,
  programChanged,
  setProgramChanged,
}: {
  programCurrent: boolean | null;
  setProgramCurrent: (v: boolean | null) => void;
  programChanged: boolean | null;
  setProgramChanged: (v: boolean | null) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Your written HazCom program must accurately reflect your current workplace chemicals and procedures.
      </p>
      <div className="bg-navy-800/50 rounded-xl p-4 space-y-1">
        <p className="text-xs text-gray-400">Current version</p>
        <p className="text-sm text-white font-medium">v{programVersionHistory[0].version} — updated {programVersionHistory[0].date}</p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-navy-800/50">
          <p className="text-sm text-white">Does the written HazCom program reflect your current chemicals?</p>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setProgramCurrent(val)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  programCurrent === val
                    ? val ? "bg-status-green/20 text-status-green border border-status-green/30" : "bg-status-red/20 text-status-red border border-status-red/30"
                    : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-navy-800/50">
          <p className="text-sm text-white">Has anything changed since the last program update?</p>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setProgramChanged(val)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  programChanged === val
                    ? !val ? "bg-status-green/20 text-status-green border border-status-green/30" : "bg-status-amber/20 text-status-amber border border-status-amber/30"
                    : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        {programChanged === true && (
          <Link
            href="/hazcom-program"
            className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Update the Written Program <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Step6Contractors({
  contractorsOnSite,
  setContractorsOnSite,
  contractorPacketSent,
  setContractorPacketSent,
}: {
  contractorsOnSite: boolean | null;
  setContractorsOnSite: (v: boolean | null) => void;
  contractorPacketSent: boolean | null;
  setContractorPacketSent: (v: boolean | null) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        OSHA requires that contractors working on-site receive information about chemical hazards in your workplace.
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-navy-800/50">
          <p className="text-sm text-white">Have any contractors been on-site since the last audit?</p>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setContractorsOnSite(val)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  contractorsOnSite === val
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        {contractorsOnSite === true && (
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-navy-800/50">
            <p className="text-sm text-white">Did they receive a safety packet?</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setContractorPacketSent(val)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    contractorPacketSent === val
                      ? val ? "bg-status-green/20 text-status-green border border-status-green/30" : "bg-status-red/20 text-status-red border border-status-red/30"
                      : "bg-navy-700/50 text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        )}
        {contractorsOnSite === true && contractorPacketSent === false && (
          <Link
            href="/contractors"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Generate Packet Now <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SummaryView({ score, findings, onSave }: { score: number; findings: string[]; onSave: () => void }) {
  const circumference = 2 * Math.PI * 40;
  const color = score >= 90 ? "#34C759" : score >= 70 ? "#F5A623" : "#FF3B30";

  const fixLinks: Record<string, { href: string; label: string }> = {
    "SDS": { href: "/sds-library", label: "Go to SDS Library" },
    "Label": { href: "/labels", label: "Print Labels" },
    "Training": { href: "/training", label: "Assign Training" },
    "tablet": { href: "/sds-library", label: "Check SDS Access" },
    "Offline": { href: "/sds-library", label: "Check SDS Access" },
    "binder": { href: "/sds-library", label: "Update Binder" },
    "program": { href: "/hazcom-program", label: "Update Program" },
    "Contractor": { href: "/contractors", label: "Generate Packet" },
  };

  function getFixLink(finding: string) {
    for (const [key, val] of Object.entries(fixLinks)) {
      if (finding.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex items-center gap-6 justify-center">
        <div className="relative">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#1A2D4D" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke={color}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${circumference * (score / 100)} ${circumference * (1 - score / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-black text-2xl text-white">{score}%</span>
          </div>
        </div>
        <div>
          <h3 className="font-display font-bold text-xl text-white">
            {score >= 90 ? "Excellent" : score >= 70 ? "Good Progress" : "Needs Work"}
          </h3>
          <p className="text-sm text-gray-400">
            {findings.length === 0 ? "No issues found — great work!" : `${findings.length} finding${findings.length > 1 ? "s" : ""} to address`}
          </p>
        </div>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Findings</h4>
          <div className="space-y-2">
            {findings.map((f, i) => {
              const fix = getFixLink(f);
              return (
                <div key={i} className="flex items-start justify-between gap-2 py-2 px-3 rounded-lg bg-navy-800/50">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-status-red flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">{f}</p>
                  </div>
                  {fix && (
                    <Link
                      href={fix.href}
                      className="text-xs text-amber-400 hover:text-amber-300 whitespace-nowrap flex items-center gap-1 transition-colors"
                    >
                      {fix.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm py-3 rounded-lg transition-colors"
      >
        <Save className="h-4 w-4" />
        Save Audit Results
      </button>
    </div>
  );
}
