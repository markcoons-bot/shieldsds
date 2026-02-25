"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Building2,
  Users,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Camera,
  Search,
  Sparkles,
} from "lucide-react";
import { initializeStore, getChemicals, clearStore, addEmployee } from "@/lib/chemicals";

// ── Types ────────────────────────────────────────────────────────────────────

interface CompanyProfile {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  owner: string;
  industry: string;
  setupComplete: boolean;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
}

const INDUSTRIES = [
  "Auto Body & Collision",
  "Automotive Repair",
  "Construction",
  "Manufacturing",
  "Janitorial & Cleaning",
  "Restaurant & Food Service",
  "Landscaping",
  "Agriculture",
  "Healthcare",
  "Education",
  "Other",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const STEPS = [
  { num: 1, label: "Company Profile", icon: Building2 },
  { num: 2, label: "Add Employees", icon: Users },
  { num: 3, label: "Add First Chemical", icon: FlaskConical },
  { num: 4, label: "All Set!", icon: CheckCircle2 },
];

let rowIdCounter = 0;
function nextRowId() {
  return `row-${++rowIdCounter}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Company Profile
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2: Employees
  const [employees, setEmployees] = useState<EmployeeRow[]>([
    { id: nextRowId(), name: "", role: "" },
  ]);

  // Step 3: Chemical added flag
  const [chemicalAdded, setChemicalAdded] = useState(false);

  // Restore state if returning from scan/sds-search
  useEffect(() => {
    const savedStep = searchParams.get("step");
    if (savedStep) {
      const stepNum = parseInt(savedStep);
      if (stepNum >= 1 && stepNum <= 4) setCurrentStep(stepNum);
    }

    // Restore company profile from localStorage if available
    try {
      const saved = localStorage.getItem("shieldsds-company");
      if (saved) {
        const profile: CompanyProfile = JSON.parse(saved);
        if (profile.name) setCompanyName(profile.name);
        if (profile.address) setAddress(profile.address);
        if (profile.city) setCity(profile.city);
        if (profile.state) setState(profile.state);
        if (profile.zip) setZip(profile.zip);
        if (profile.phone) setPhone(profile.phone);
        if (profile.owner) setOwnerName(profile.owner);
        if (profile.industry) setIndustry(profile.industry);
      }
    } catch {
      // ignore
    }

    // Restore employees from localStorage if available
    try {
      const savedEmployees = localStorage.getItem("shieldsds-setup-employees");
      if (savedEmployees) {
        const parsed = JSON.parse(savedEmployees);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmployees(parsed);
        }
      }
    } catch {
      // ignore
    }

    // Check if a chemical was added (returning from scan or sds-search)
    const returnParam = searchParams.get("return");
    if (returnParam === "setup" || savedStep === "3") {
      initializeStore();
      const chems = getChemicals();
      if (chems.length > 0) {
        setChemicalAdded(true);
      }
    }
  }, [searchParams]);

  // ── Step Navigation ──────────────────────────────────────────────────────

  const canProceedStep1 =
    companyName.trim().length > 0 && ownerName.trim().length > 0;

  const canProceedStep2 =
    employees.some((e) => e.name.trim().length > 0 && e.role.trim().length > 0);

  function goToStep(step: number) {
    if (step === 2 && currentStep === 1) {
      // Save company profile
      saveCompanyProfile(false);
    }
    if (step === 3 && currentStep === 2) {
      // Save employees
      saveEmployees();
    }
    setCurrentStep(step);
  }

  function saveCompanyProfile(complete: boolean) {
    const profile: CompanyProfile = {
      name: companyName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      phone: phone.trim(),
      owner: ownerName.trim(),
      industry,
      setupComplete: complete,
    };
    localStorage.setItem("shieldsds-company", JSON.stringify(profile));
  }

  function saveEmployees() {
    // Save to setup storage for restoration
    localStorage.setItem("shieldsds-setup-employees", JSON.stringify(employees));

    // Clear demo data and create fresh employees
    clearStore();
    initializeStore();

    const validEmployees = employees.filter(
      (e) => e.name.trim() && e.role.trim()
    );
    validEmployees.forEach((emp) => {
      addEmployee({
        name: emp.name.trim(),
        role: emp.role.trim(),
        initial_training: null,
        last_training: null,
        status: "pending",
        completed_modules: [],
        pending_modules: [],
      });
    });
  }

  function handleFinish() {
    saveCompanyProfile(true);
    localStorage.removeItem("shieldsds-setup-employees");
    // Clear welcome banner shown flag so it shows once
    localStorage.setItem("shieldsds-welcome-shown", "false");
    router.push("/dashboard");
  }

  // ── Employee Rows ────────────────────────────────────────────────────────

  function addEmployeeRow() {
    setEmployees([...employees, { id: nextRowId(), name: "", role: "" }]);
  }

  function removeEmployeeRow(id: string) {
    if (employees.length <= 1) return;
    setEmployees(employees.filter((e) => e.id !== id));
  }

  function updateEmployee(id: string, field: "name" | "role", value: string) {
    setEmployees(
      employees.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header */}
      <header className="border-b border-navy-700/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="h-7 w-7 text-amber-400 transition-transform group-hover:scale-110" />
            <span className="font-display font-black text-lg text-white">
              Shield<span className="text-amber-400">SDS</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Explore Demo Instead
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-navy-700/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => {
              const isActive = currentStep === s.num;
              const isComplete = currentStep > s.num;
              return (
                <div
                  key={s.num}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isComplete
                        ? "bg-status-green text-white"
                        : isActive
                        ? "bg-amber-500 text-navy-950"
                        : "bg-navy-800 text-gray-500"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      isActive
                        ? "text-white"
                        : isComplete
                        ? "text-status-green"
                        : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.num < 4 && (
                    <div
                      className={`hidden sm:block w-8 lg:w-16 h-0.5 mx-1 ${
                        currentStep > s.num ? "bg-status-green" : "bg-navy-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* ── STEP 1: Company Profile ─────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-black text-2xl mb-2">
                Company Profile
              </h2>
              <p className="text-gray-400 text-sm">
                Tell us about your business. This info appears on your HazCom
                program, labels, and compliance reports.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Mike's Auto Body"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Owner / Manager Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Mike Rodriguez"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-2 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">--</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="12345"
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => goToStep(2)}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Next: Add Employees
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Add Employees ───────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-black text-2xl mb-2">
                Add Employees
              </h2>
              <p className="text-gray-400 text-sm">
                Add at least one employee. You can always add more later from
                the Training page.
              </p>
            </div>

            <div className="space-y-3">
              {employees.map((emp, idx) => (
                <div
                  key={emp.id}
                  className="flex items-start gap-3 bg-navy-900 border border-navy-700/50 rounded-xl p-4"
                >
                  <span className="text-xs font-bold text-gray-500 mt-3 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Name
                      </label>
                      <input
                        type="text"
                        value={emp.name}
                        onChange={(e) =>
                          updateEmployee(emp.id, "name", e.target.value)
                        }
                        placeholder="Employee name"
                        className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Role
                      </label>
                      <input
                        type="text"
                        value={emp.role}
                        onChange={(e) =>
                          updateEmployee(emp.id, "role", e.target.value)
                        }
                        placeholder="e.g. Painter, Technician"
                        className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                  {employees.length > 1 && (
                    <button
                      onClick={() => removeEmployeeRow(emp.id)}
                      className="mt-7 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addEmployeeRow}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Another Employee
            </button>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => goToStep(3)}
                disabled={!canProceedStep2}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Next: Add Chemical
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Add First Chemical ──────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-black text-2xl mb-2">
                Add Your First Chemical
              </h2>
              <p className="text-gray-400 text-sm">
                Scan a label, search our database, or skip for now and add
                chemicals later.
              </p>
            </div>

            {chemicalAdded ? (
              <div className="bg-status-green/10 border border-status-green/30 rounded-xl p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-status-green mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-white mb-1">
                  Chemical Added!
                </h3>
                <p className="text-sm text-gray-400">
                  Great start. You can add more chemicals anytime from the
                  dashboard.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/scan?return=setup"
                  className="flex items-center gap-4 bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-xl p-5 transition-colors group"
                >
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-white group-hover:text-amber-400 transition-colors">
                      Scan a Chemical Label
                    </h3>
                    <p className="text-sm text-gray-400">
                      Take a photo and we&apos;ll extract the safety data
                      automatically.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                </Link>

                <Link
                  href="/sds-search?return=setup"
                  className="flex items-center gap-4 bg-navy-900 border border-navy-700/50 hover:border-navy-600 rounded-xl p-5 transition-colors group"
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-white group-hover:text-blue-400 transition-colors">
                      Search SDS Database
                    </h3>
                    <p className="text-sm text-gray-400">
                      Browse our database of chemicals and add with one click.
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </Link>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 text-gray-400 hover:text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                {chemicalAdded ? "Next: Finish Setup" : "Skip for Now"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: All Set! ────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="text-center py-8 space-y-8">
            <div>
              <div className="h-20 w-20 rounded-full bg-status-green/20 border-2 border-status-green flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-status-green" />
              </div>
              <h2 className="font-display font-black text-3xl mb-2">
                You&apos;re All Set!
              </h2>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Your ShieldSDS account is ready. Here&apos;s a summary of what
                you&apos;ve set up.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 text-left max-w-md mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {companyName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[city, state].filter(Boolean).join(", ") || "Company profile saved"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {employees.filter((e) => e.name.trim()).length} employee
                    {employees.filter((e) => e.name.trim()).length !== 1
                      ? "s"
                      : ""}{" "}
                    added
                  </p>
                  <p className="text-xs text-gray-400">
                    {employees
                      .filter((e) => e.name.trim())
                      .map((e) => e.name.trim())
                      .slice(0, 3)
                      .join(", ")}
                    {employees.filter((e) => e.name.trim()).length > 3
                      ? ` +${employees.filter((e) => e.name.trim()).length - 3} more`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {chemicalAdded
                      ? "First chemical added"
                      : "No chemicals yet"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {chemicalAdded
                      ? "You can add more from the dashboard"
                      : "Add chemicals anytime from the dashboard"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-8 py-3.5 rounded-lg transition-colors text-lg"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to previous step
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupPageInner />
    </Suspense>
  );
}
