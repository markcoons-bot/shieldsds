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
  Edit3,
} from "lucide-react";
import { getChemicals, addEmployee, addChemical, addLocation } from "@/lib/chemicals";
import type { Chemical } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

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

// Industry-based default locations
const INDUSTRY_LOCATIONS: Record<string, string[]> = {
  "Auto Body & Collision": ["Paint Booth", "Paint Mixing Room", "Body Bay", "Detail Bay", "Parts Washer Area", "Front Office"],
  "Automotive Repair": ["Service Bay 1", "Service Bay 2", "Parts Room", "Front Office"],
  "Construction": ["Job Site", "Tool Storage", "Material Storage", "Office Trailer"],
  "Manufacturing": ["Production Floor", "Assembly Line", "Chemical Storage", "QC Lab", "Warehouse"],
  "Janitorial & Cleaning": ["Supply Closet", "Storage Room", "Loading Dock"],
  "Restaurant & Food Service": ["Kitchen", "Dish Pit", "Storage Room", "Dining Area"],
  "Landscaping": ["Equipment Shed", "Chemical Storage", "Truck/Trailer"],
  "Agriculture": ["Equipment Barn", "Chemical Storage", "Field Office"],
  "Healthcare": ["Exam Room", "Lab", "Supply Room", "Pharmacy"],
  "Education": ["Science Lab", "Custodial Closet", "Maintenance Shop"],
  "Other": ["Main Work Area", "Storage", "Office"],
};

const STEPS = [
  { num: 1, label: "Company Profile", icon: Building2 },
  { num: 2, label: "Add Employees", icon: Users },
  { num: 3, label: "Add Chemicals", icon: FlaskConical },
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
  const [ownerRole, setOwnerRole] = useState("Owner / Manager");
  const [industry, setIndustry] = useState("");

  // Step 2: Employees
  const [employees, setEmployees] = useState<EmployeeRow[]>([
    { id: nextRowId(), name: "", role: "" },
  ]);

  // Step 3: Chemicals tracked in component state (source of truth)
  const [setupChemicals, setSetupChemicals] = useState<Omit<Chemical, "id">[]>([]);

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
        const profile = JSON.parse(saved);
        if (profile.name) setCompanyName(profile.name);
        if (profile.address) setAddress(profile.address);
        if (profile.city) setCity(profile.city);
        if (profile.state) setState(profile.state);
        if (profile.zip) setZip(profile.zip);
        if (profile.phone) setPhone(profile.phone);
        if (profile.owner) setOwnerName(profile.owner);
        if (profile.ownerRole) setOwnerRole(profile.ownerRole);
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

    // Restore setup chemicals from localStorage
    try {
      const savedChems = localStorage.getItem("shieldsds-setup-chemicals");
      if (savedChems) {
        const parsed = JSON.parse(savedChems);
        if (Array.isArray(parsed)) {
          setSetupChemicals(parsed);
        }
      }
    } catch {
      // ignore
    }

    // Check if a chemical was added (returning from scan or sds-search)
    const returnParam = searchParams.get("return");
    if (returnParam === "setup" || savedStep === "3") {
      // Check localStorage for any newly added chemicals not yet in our setup list
      const allChems = getChemicals();
      if (allChems.length > 0) {
        // Load existing setup chemicals to compare
        let existingSetup: Omit<Chemical, "id">[] = [];
        try {
          const savedChems = localStorage.getItem("shieldsds-setup-chemicals");
          if (savedChems) existingSetup = JSON.parse(savedChems);
        } catch { /* ignore */ }

        const existingNames = new Set(existingSetup.map(c => c.product_name));
        const newChems = allChems.filter(c => !existingNames.has(c.product_name));

        if (newChems.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const combined = [...existingSetup, ...newChems.map(({ id, ...rest }) => rest)];
          setSetupChemicals(combined);
          localStorage.setItem("shieldsds-setup-chemicals", JSON.stringify(combined));
        } else if (existingSetup.length > 0) {
          setSetupChemicals(existingSetup);
        }
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
      saveCompanyProfile(false);
    }
    if (step === 3 && currentStep === 2) {
      saveEmployeesToTemp();
    }
    setCurrentStep(step);
  }

  function saveCompanyProfile(complete: boolean) {
    const profile = {
      name: companyName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      phone: phone.trim(),
      owner: ownerName.trim(),
      ownerRole: ownerRole.trim(),
      industry,
      setupDate: new Date().toISOString(),
      setupComplete: complete,
    };
    localStorage.setItem("shieldsds-company", JSON.stringify(profile));
  }

  function saveEmployeesToTemp() {
    localStorage.setItem("shieldsds-setup-employees", JSON.stringify(employees));
  }

  function nuclearClear() {
    // 1. Remove ALL shieldsds-* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("shieldsds")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // 2. Remove any other app-specific keys
    const otherAppKeys = ["training-progress", "training-lang"];
    otherAppKeys.forEach((key) => localStorage.removeItem(key));
  }

  function handleFinish() {
    // Save chemicals from component state before nuclear clear
    const chemsToRestore = [...setupChemicals];
    const validEmployeeRows = employees.filter((e) => e.name.trim() && e.role.trim());

    // ── NUCLEAR CLEAR ──
    nuclearClear();

    // ── RE-INITIALIZE WITH USER DATA ONLY ──

    // a. Save company profile
    saveCompanyProfile(true);

    // b. Initialize locations based on industry
    const industryLocs = INDUSTRY_LOCATIONS[industry] || INDUSTRY_LOCATIONS["Other"];
    industryLocs.forEach((locName) => {
      addLocation({ name: locName, chemical_ids: [] });
    });

    // c. Create owner as first employee
    addEmployee({
      name: ownerName.trim(),
      role: ownerRole.trim() || "Owner / Manager",
      initial_training: null,
      last_training: null,
      status: "pending",
      completed_modules: [],
      pending_modules: [],
    });

    // Add employees from Step 2 (skip if same as owner)
    validEmployeeRows.forEach((emp) => {
      if (emp.name.trim().toLowerCase() === ownerName.trim().toLowerCase()) return;
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

    // d. Re-add chemicals from component state
    chemsToRestore.forEach((chem) => {
      addChemical(chem);
    });

    // e. Set setup-complete flag
    localStorage.setItem("shieldsds-setup-complete", "true");

    // f. Set welcome banner flag
    localStorage.setItem("shieldsds-welcome-shown", "false");

    // g. Clean up temp storage
    localStorage.removeItem("shieldsds-setup-employees");
    localStorage.removeItem("shieldsds-setup-chemicals");

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

  function updateEmployeeField(id: string, field: "name" | "role", value: string) {
    setEmployees(
      employees.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  // ── Chemical count message ────────────────────────────────────────────────

  function getChemicalMessage() {
    const count = setupChemicals.length;
    if (count === 0) return "Add your first chemical to get started";
    if (count <= 2) return "Great start! Most shops have 10-20 chemicals.";
    if (count <= 5) return "Nice! You can always add more from the dashboard.";
    return "You're on a roll! Ready to see your dashboard?";
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
                  placeholder="e.g. Acme Auto Body"
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
                  placeholder="e.g. John Smith"
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
                          updateEmployeeField(emp.id, "name", e.target.value)
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
                          updateEmployeeField(emp.id, "role", e.target.value)
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
                Next: Add Chemicals
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Add Chemicals (multiple) ──────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-black text-2xl mb-2">
                Add Your Chemicals
              </h2>
              <p className="text-gray-400 text-sm">
                {getChemicalMessage()}
              </p>
            </div>

            {/* Chemicals added so far */}
            {setupChemicals.length > 0 && (
              <div className="bg-status-green/10 border border-status-green/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-status-green" />
                  <h3 className="font-display font-bold text-white">
                    {setupChemicals.length} chemical{setupChemicals.length !== 1 ? "s" : ""} added so far!
                  </h3>
                </div>
                <div className="space-y-2">
                  {setupChemicals.map((chem, i) => (
                    <div key={i} className="flex items-center gap-3 bg-navy-900/50 rounded-lg px-3 py-2">
                      <FlaskConical className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{chem.product_name}</p>
                        <p className="text-xs text-gray-400">{chem.manufacturer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add more options — always visible */}
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
                    {setupChemicals.length > 0 ? "Scan Another Label" : "Scan a Chemical Label"}
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
                    {setupChemicals.length > 0 ? "Browse More Chemicals" : "Search SDS Database"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Browse our database of chemicals and add with one click.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </Link>

              <Link
                href="/scan?return=setup&mode=manual"
                className="flex items-center gap-4 bg-navy-900 border border-navy-700/50 hover:border-navy-600 rounded-xl p-5 transition-colors group"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Edit3 className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-white group-hover:text-purple-400 transition-colors">
                    Add Manually
                  </h3>
                  <p className="text-sm text-gray-400">
                    Enter chemical details by hand.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </Link>
            </div>

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
                className={`flex items-center gap-2 text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors ${
                  setupChemicals.length >= 3
                    ? "bg-amber-500 hover:bg-amber-400 ring-2 ring-amber-400/50"
                    : "bg-amber-500 hover:bg-amber-400"
                }`}
              >
                {setupChemicals.length > 0 ? "Next: Finish Setup" : "Skip for Now"}
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
                    {employees.filter((e) => e.name.trim()).length + 1} employee
                    {employees.filter((e) => e.name.trim()).length !== 0
                      ? "s"
                      : ""}{" "}
                    added
                  </p>
                  <p className="text-xs text-gray-400">
                    {[ownerName, ...employees
                      .filter((e) => e.name.trim() && e.name.trim().toLowerCase() !== ownerName.trim().toLowerCase())
                      .map((e) => e.name.trim())]
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
                    {setupChemicals.length > 0
                      ? `${setupChemicals.length} chemical${setupChemicals.length !== 1 ? "s" : ""} added`
                      : "No chemicals yet"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {setupChemicals.length > 0
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
