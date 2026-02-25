"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import HelpCard from "@/components/HelpCard";
import { generateHazComProgramPDF } from "@/lib/pdf-generator";
import { getChemicals, getEmployees, initializeStore } from "@/lib/chemicals";
import { getEmployeeTrainingStatus } from "@/lib/compliance-score";
import type { TrainingStatus } from "@/lib/compliance-score";
import type { Chemical, Employee } from "@/lib/types";
import { Printer, Download, Clock, AlertTriangle } from "lucide-react";

// ─── Shop Info (static config — matches inspection page) ────────────────────

const shopInfo = {
  name: "Mike's Auto Body",
  owner: "Mike Rodriguez",
  address: "1847 Pacific Coast Hwy",
  city: "Long Beach",
  state: "CA",
  zip: "90806",
  phone: "(562) 555-0147",
  ownerPhone: "(562) 555-0147",
  ownerEmail: "mike@mikesautobody.com",
  emergencyContacts: {
    fire: "911",
    police: "911",
    poisonControl: "1-800-222-1222",
    nearestHospital: {
      name: "Long Beach Memorial Medical Center",
      address: "2801 Atlantic Ave, Long Beach, CA 90806",
      phone: "(562) 933-2000",
      distance: "1.8 miles",
    },
  },
};

// ─── The 7 real training modules (matches learn page exactly) ───────────────

const TRAINING_MODULES = [
  { id: "m1", title: "Your Right to Know", duration: "5 min", description: "Why this training exists and your legal rights under OSHA's HazCom standard" },
  { id: "m2", title: "The GHS System", duration: "7 min", description: "9 pictograms, signal words, hazard classes, and the globally harmonized system" },
  { id: "m3", title: "Reading a Chemical Label", duration: "7 min", description: "Anatomy of a GHS label — product identifier, hazard statements, precautionary statements" },
  { id: "m4", title: "Understanding the SDS", duration: "8 min", description: "All 16 sections of a Safety Data Sheet — finding what saves your life" },
  { id: "m5", title: "Protecting Yourself — PPE", duration: "7 min", description: "Selecting and using the right personal protective equipment for each chemical" },
  { id: "m6", title: "When Things Go Wrong", duration: "7 min", description: "Spill response, chemical exposure first aid, and emergency procedures" },
  { id: "m7", title: "Your Shop's HazCom Program", duration: "5 min", description: "Your chemicals, your locations, your plan — site-specific HazCom procedures" },
];

// ─── Section wrapper ────────────────────────────────────────────────────────

function HazComSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
        Section {number}: {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Status badges ──────────────────────────────────────────────────────────

const sdsStatusLabel = (status: string) => {
  switch (status) {
    case "current":
      return <span className="text-green-700 font-medium">Current</span>;
    case "expired":
      return <span className="text-amber-700 font-medium">Expired</span>;
    case "missing":
      return <span className="text-red-700 font-medium">Missing</span>;
    default:
      return <span>{status}</span>;
  }
};

const trainingStatusBadge = (status: TrainingStatus) => {
  const config: Record<TrainingStatus, { label: string; className: string }> = {
    current: { label: "Current", className: "text-green-700 font-medium" },
    "due-soon": { label: "Due Soon", className: "text-amber-700 font-medium" },
    overdue: { label: "Overdue", className: "text-red-700 font-medium" },
    "in-progress": { label: "In Progress", className: "text-amber-700 font-medium" },
    "not-started": { label: "Pending (New Hire)", className: "text-red-700 font-medium" },
  };
  const c = config[status];
  return <span className={c.className}>{c.label}</span>;
};

// ─── Generate version history from real events ──────────────────────────────

interface VersionEntry {
  date: string;
  summary: string;
}

function generateVersionHistory(chemicals: Chemical[], employees: Employee[]): VersionEntry[] {
  const events: { date: string; text: string }[] = [];

  chemicals.forEach((c) => {
    if (c.added_date) {
      events.push({ date: c.added_date, text: `Added ${c.product_name} to inventory` });
    }
    if (c.sds_uploaded && c.sds_date) {
      events.push({ date: c.sds_date, text: `SDS linked for ${c.product_name}` });
    }
    if (c.label_printed_date) {
      events.push({ date: c.label_printed_date, text: `Label printed for ${c.product_name}` });
    }
  });

  employees.forEach((emp) => {
    if (emp.initial_training) {
      events.push({ date: emp.initial_training, text: `Employee added: ${emp.name}` });
    }
    if (emp.last_training) {
      events.push({ date: emp.last_training, text: `Training completed: ${emp.name}` });
    }
  });

  // Sort by date descending
  events.sort((a, b) => b.date.localeCompare(a.date));

  // Group events by date
  const grouped = new Map<string, string[]>();
  events.forEach((e) => {
    const existing = grouped.get(e.date);
    if (existing) {
      existing.push(e.text);
    } else {
      grouped.set(e.date, [e.text]);
    }
  });

  // Build summary entries (limit to 15)
  const entries: VersionEntry[] = [];
  grouped.forEach((texts, date) => {
    const summary = texts.length <= 3
      ? texts.join("; ")
      : `${texts.slice(0, 2).join("; ")} and ${texts.length - 2} more event${texts.length - 2 > 1 ? "s" : ""}`;
    entries.push({ date, summary });
  });

  return entries.slice(0, 15);
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function HazComProgramPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    initializeStore();
    setChemicals(getChemicals());
    setEmployees(getEmployees());
  }, []);

  const currentSDS = chemicals.filter((c) => c.sds_status === "current").length;
  const missingSDS = chemicals.filter((c) => c.sds_status === "missing").length;
  const expiredSDS = chemicals.filter((c) => c.sds_status === "expired").length;
  const totalSDS = chemicals.length;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sortedChemicals = useMemo(
    () => [...chemicals].sort((a, b) => a.location.localeCompare(b.location) || a.product_name.localeCompare(b.product_name)),
    [chemicals]
  );

  const employeeStatuses = useMemo(
    () => employees.map((e) => ({ emp: e, info: getEmployeeTrainingStatus(e) })),
    [employees]
  );

  const versionHistory = useMemo(
    () => generateVersionHistory(chemicals, employees),
    [chemicals, employees]
  );

  return (
    <DashboardLayout>
      {/* Screen-only header bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="font-display font-black text-2xl text-white">
            Written HazCom Program
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            OSHA 29 CFR 1910.1200 compliance document &middot; Live
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                await generateHazComProgramPDF();
              } catch (err) {
                console.error("PDF generation error:", err);
                alert("PDF error: " + (err instanceof Error ? err.message : "Unknown error"));
              }
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="mb-6 print:hidden">
        <HelpCard>
          <p><strong className="text-white">This is the FIRST document an OSHA inspector asks to see.</strong> It must describe:</p>
          <p><strong className="text-amber-400">1. How you handle labels</strong> — what system you use for secondary containers, who is responsible</p>
          <p><strong className="text-amber-400">2. How employees access SDS</strong> — where the binder/tablet/system is, how they use it, what the backup is</p>
          <p><strong className="text-amber-400">3. How training works</strong> — when it happens, what it covers, how it&apos;s documented</p>
          <p><strong className="text-amber-400">4. Your chemical list</strong> — must match what&apos;s actually on-site</p>
          <p><strong className="text-amber-400">5. Non-routine tasks</strong> — procedures for unusual chemical exposures (cleaning inside equipment, handling spills)</p>
          <p><strong className="text-amber-400">6. Contractor communication</strong> — how you share chemical info with other employers&apos; workers on your site</p>
          <p>Without this document, an inspector will cite you immediately under <span className="text-amber-500/80 text-xs">29 CFR 1910.1200(e)(1)</span>. ShieldSDS generates this document from your actual data, so it&apos;s always current. Most shops either don&apos;t have one at all, or have a generic template from years ago that doesn&apos;t match their current chemicals.</p>
          <p className="text-amber-400/80 italic">TIP: Print this document and keep a copy in your front office as well. If the power is out when an inspector arrives, you can still hand them the paper version.</p>
        </HelpCard>
      </div>

      {/* Printable Document */}
      <div className="bg-white text-gray-900 rounded-xl p-8 md:p-12 print:rounded-none print:p-0 print:shadow-none shadow-lg">
        {/* Document Header */}
        <div className="text-center mb-10 border-b-2 border-gray-900 pb-6">
          <h1 className="text-2xl font-black uppercase tracking-wide mb-1">
            Written Hazard Communication Program
          </h1>
          <p className="text-sm text-gray-600 mb-3">
            Per OSHA 29 CFR 1910.1200 (Hazard Communication Standard)
          </p>
          <div className="text-sm">
            <p className="font-bold text-lg">{shopInfo.name}</p>
            <p>
              {shopInfo.address}, {shopInfo.city}, {shopInfo.state}{" "}
              {shopInfo.zip}
            </p>
            <p>{shopInfo.phone}</p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
            <span>Live Document</span>
            <span>Generated: {today}</span>
          </div>
        </div>

        {/* Section 1: Purpose & Scope */}
        <HazComSection number={1} title="Purpose and Scope">
          <p className="text-sm leading-relaxed mb-3">
            This Written Hazard Communication Program has been established for{" "}
            <strong>{shopInfo.name}</strong> in compliance with OSHA&apos;s
            Hazard Communication Standard, 29 CFR 1910.1200. The purpose of this
            program is to ensure that all employees are informed about the
            hazardous chemicals present in their workplace and the measures they
            can take to protect themselves.
          </p>
          <p className="text-sm leading-relaxed mb-3">
            This program applies to <strong>all employees</strong> who may be
            exposed to hazardous chemicals during normal work operations or in
            foreseeable emergencies. Under this program, employees will be
            informed of the requirements of the Hazard Communication Standard,
            the hazardous properties of chemicals they work with, safe handling
            procedures, and measures to take to protect themselves.
          </p>
          <p className="text-sm leading-relaxed">
            This program covers all hazardous chemicals used at{" "}
            {shopInfo.name}, including but not limited to: automotive paints,
            clearcoats, reducers, solvents, adhesives, body fillers, degreasers,
            and shop maintenance chemicals.
          </p>
        </HazComSection>

        {/* Section 2: Responsible Person */}
        <HazComSection number={2} title="Responsible Person">
          <p className="text-sm leading-relaxed mb-3">
            The following person is the Hazard Communication Program
            Coordinator. They are responsible for implementing and maintaining
            this program, ensuring proper labeling, maintaining the chemical
            inventory and SDS library, and coordinating employee training.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <strong>{shopInfo.owner}</strong>
              </div>
              <div>
                <span className="text-gray-500">Title:</span> Owner / Manager
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{" "}
                {shopInfo.ownerPhone}
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{" "}
                {shopInfo.ownerEmail}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Location:</span>{" "}
                {shopInfo.address}, {shopInfo.city}, {shopInfo.state}{" "}
                {shopInfo.zip}
              </div>
            </div>
          </div>
        </HazComSection>

        {/* Section 3: Chemical Inventory */}
        <HazComSection number={3} title="Chemical Inventory">
          <p className="text-sm leading-relaxed mb-3">
            A complete inventory of all hazardous chemicals present at{" "}
            {shopInfo.name} is maintained in the ShieldSDS system. The current
            inventory includes <strong>{totalSDS}</strong> chemical
            products, of which <strong>{currentSDS}</strong> have current SDS on
            file
            {missingSDS > 0 && (
              <>
                {" "}
                and <strong className="text-red-700">{missingSDS}</strong>{" "}
                {missingSDS === 1 ? "is" : "are"} missing SDS documentation
              </>
            )}
            {expiredSDS > 0 && (
              <>
                {" "}
                and <strong className="text-amber-700">{expiredSDS}</strong>{" "}
                {expiredSDS === 1 ? "has" : "have"} expired SDS
              </>
            )}
            .
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">#</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Product Name</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Manufacturer</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Storage Location</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Signal Word</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">SDS Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedChemicals.map((c, i) => (
                  <tr
                    key={c.id}
                    className={
                      c.sds_status === "missing" ? "bg-red-50" :
                      c.sds_status === "expired" ? "bg-amber-50" : ""
                    }
                  >
                    <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1 font-medium">{c.product_name}</td>
                    <td className="border border-gray-300 px-2 py-1">{c.manufacturer}</td>
                    <td className="border border-gray-300 px-2 py-1">{c.location}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      <span className={
                        c.signal_word === "DANGER" ? "text-red-700 font-bold" :
                        c.signal_word === "WARNING" ? "text-amber-700 font-bold" : "text-gray-500"
                      }>
                        {c.signal_word || "—"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {sdsStatusLabel(c.sds_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Live data from ShieldSDS — {totalSDS} chemicals as of {today}. Full interactive inventory available in the Chemical Inventory module.
          </p>
        </HazComSection>

        {/* Section 4: SDS Access */}
        <HazComSection number={4} title="Safety Data Sheet (SDS) Access">
          <p className="text-sm leading-relaxed mb-3">
            Safety Data Sheets for all hazardous chemicals are accessible to all
            employees at all times during their work shift. No supervisor
            permission is required to access any SDS.
          </p>
          <p className="text-sm leading-relaxed mb-3">Access methods:</p>
          <ul className="text-sm space-y-2 ml-4 list-disc mb-3">
            <li>
              <strong>Primary:</strong> ShieldSDS web application — accessible
              on any device with internet (computer, tablet, or phone)
            </li>
            <li>
              <strong>Search:</strong> Employees can search by product name,
              manufacturer, or CAS number
            </li>
            <li>
              <strong>SDS count:</strong> <strong>{currentSDS}</strong> of{" "}
              <strong>{totalSDS}</strong> chemicals have current SDS on file
            </li>
          </ul>
          {(missingSDS > 0 || expiredSDS > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800">
                {missingSDS > 0 && <>{missingSDS} chemical{missingSDS > 1 ? "s are" : " is"} pending SDS retrieval. </>}
                {expiredSDS > 0 && <>{expiredSDS} chemical{expiredSDS > 1 ? "s have" : " has"} expired SDS requiring update. </>}
                Automated lookup is in progress.
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed mt-3">
            SDS access training is included in the HazCom training program
            (Module 4: Understanding the SDS). Employees are trained to search
            by product name, manufacturer, or CAS number.
          </p>
        </HazComSection>

        {/* Section 5: Labeling System */}
        <HazComSection number={5} title="Labeling System">
          <p className="text-sm leading-relaxed mb-3">
            All containers of hazardous chemicals at {shopInfo.name} are labeled
            in accordance with 29 CFR 1910.1200(f). The labeling system
            includes:
          </p>

          <h3 className="text-sm font-bold mt-4 mb-2">
            Shipped (Original) Containers
          </h3>
          <p className="text-sm leading-relaxed mb-3">
            Manufacturer labels on shipped containers are maintained and never
            removed or defaced. These labels include the product identifier,
            signal word, hazard statement(s), pictogram(s), precautionary
            statement(s), and supplier identification per GHS requirements.
          </p>

          <h3 className="text-sm font-bold mt-4 mb-2">
            Secondary / Workplace Containers
          </h3>
          <p className="text-sm leading-relaxed mb-3">
            When chemicals are transferred to secondary containers, a
            ShieldSDS-generated GHS-compliant label is applied. Secondary labels
            include:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc mb-3">
            <li>Product identifier (name and product code)</li>
            <li>Signal word (Danger / Warning)</li>
            <li>Hazard statement(s)</li>
            <li>GHS pictogram(s)</li>
            <li>Precautionary statement(s)</li>
          </ul>

          <h3 className="text-sm font-bold mt-4 mb-2">Exemptions</h3>
          <p className="text-sm leading-relaxed">
            Portable containers into which hazardous chemicals are transferred
            for the immediate use of the employee who performs the transfer are
            exempt from secondary labeling requirements, per 29 CFR
            1910.1200(f)(8).
          </p>
        </HazComSection>

        {/* Section 6: Employee Training */}
        <HazComSection number={6} title="Employee Training">
          <p className="text-sm leading-relaxed mb-3">
            All employees who may be exposed to hazardous chemicals receive
            training in accordance with 29 CFR 1910.1200(h). Training is
            provided:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc mb-4">
            <li>
              <strong>Initial assignment:</strong> HazCom orientation and
              SDS/Label reading within the first 3 working days
            </li>
            <li>
              <strong>New chemical hazards:</strong> Training assigned within 24
              hours when a new hazardous chemical is introduced into the work
              area
            </li>
            <li>
              <strong>Annual refresher:</strong> All 7 required modules reviewed
              annually
            </li>
          </ul>

          <h3 className="text-sm font-bold mb-2">Training Modules</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Module</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Duration</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Required</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {TRAINING_MODULES.map((mod, i) => (
                  <tr key={mod.id}>
                    <td className="border border-gray-300 px-2 py-1 font-medium">
                      {i + 1}. {mod.title}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {mod.duration}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      Yes
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {mod.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-bold mb-2">Employee Training Roster</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Employee</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Role</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Hire Date</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Modules Complete</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {employeeStatuses.map((es) => {
                  const isDeficient = es.info.status === "overdue" || es.info.status === "not-started";
                  return (
                    <tr
                      key={es.emp.id}
                      className={isDeficient ? "bg-red-50" : es.info.status === "in-progress" ? "bg-amber-50" : ""}
                    >
                      <td className="border border-gray-300 px-2 py-1 font-medium">
                        {es.emp.name}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {es.emp.role}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {es.emp.initial_training
                          ? new Date(es.emp.initial_training).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {es.info.completedCount}/7
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {trainingStatusBadge(es.info.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Training records including completion dates and digital
            acknowledgments are maintained in the ShieldSDS Training module.
          </p>
        </HazComSection>

        {/* Section 7: Non-Routine Tasks */}
        <HazComSection number={7} title="Non-Routine Tasks">
          <p className="text-sm leading-relaxed mb-4">
            Employees may occasionally perform non-routine tasks that involve
            exposure to hazardous chemicals. Before performing any non-routine
            task, employees must consult with the responsible person (
            {shopInfo.owner}) for specific hazard information and required
            precautions.
          </p>
          {[
            {
              task: "Spray Booth Deep Cleaning",
              location: "Paint Booth A",
              frequency: "Monthly",
              hazards: ["Isocyanate residue exposure", "Flammable solvent vapors", "Dust from dried paint overspray"],
              precautions: ["Ventilation system must be running during cleaning", "No ignition sources within 35 feet", "Two-person buddy system required"],
              requiredPPE: ["Supplied-air respirator", "Chemical-resistant coveralls", "Nitrile gloves (double layer)", "Safety goggles"],
            },
            {
              task: "Parts Washer Solvent Change",
              location: "Bay 2 Mechanical",
              frequency: "Quarterly",
              hazards: ["Skin contact with spent solvent", "Flammable vapors during transfer", "Environmental spill risk"],
              precautions: ["Transfer solvent to approved waste container only", "Use grounding/bonding during transfer", "Have spill kit ready before starting"],
              requiredPPE: ["Chemical splash goggles", "Solvent-resistant gloves", "Chemical-resistant apron", "Face shield for splash protection"],
            },
            {
              task: "Handling Leaking or Damaged Containers",
              location: "Any Location",
              frequency: "As needed",
              hazards: ["Unknown or mixed chemical exposure", "Vapors from opened containers", "Slip hazard from spilled material"],
              precautions: ["Identify chemical via label or SDS before handling", "Isolate area and alert nearby workers", "Use appropriate spill containment"],
              requiredPPE: ["Per SDS Section 8 for the specific chemical", "At minimum: nitrile gloves + safety goggles", "Respirator if vapors are present"],
            },
            {
              task: "Custom Paint Mixing — New Formulas",
              location: "Paint Mixing Room",
              frequency: "As needed",
              hazards: ["Exposure to new/unfamiliar chemicals", "Flammable vapor accumulation", "Skin sensitization from isocyanates"],
              precautions: ["Review SDS for all components before mixing", "Confirm ventilation is adequate", "Never mix without reviewing compatibility"],
              requiredPPE: ["Organic vapor respirator with P100 filter", "Chemical-resistant gloves", "Safety goggles", "Paint suit or coveralls"],
            },
          ].map((task, i) => (
            <div
              key={i}
              className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <h3 className="text-sm font-bold mb-2">{task.task}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">
                    <strong>Location:</strong> {task.location}
                  </p>
                  <p className="text-gray-500 mb-1">
                    <strong>Frequency:</strong> {task.frequency}
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-red-800 mb-1">Hazards:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {task.hazards.map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Precautions:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {task.precautions.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-800 mb-1">Required PPE:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {task.requiredPPE.map((ppe, j) => (
                      <li key={j}>{ppe}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </HazComSection>

        {/* Section 8: Multi-Employer / Contractor Communication */}
        <HazComSection
          number={8}
          title="Multi-Employer / Contractor Communication"
        >
          <p className="text-sm leading-relaxed mb-3">
            When outside contractors or multi-employer personnel perform work at{" "}
            {shopInfo.name}, the following information is provided before work
            begins:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc mb-3">
            <li>
              Safety Data Sheets for all hazardous chemicals present in their
              work area
            </li>
            <li>
              Explanation of the labeling system used at {shopInfo.name}
            </li>
            <li>
              Precautionary measures contractors must take to protect themselves
              and our employees
            </li>
            <li>Emergency procedures and contact information</li>
            <li>
              Contact information for the responsible person ({shopInfo.owner},{" "}
              {shopInfo.ownerPhone})
            </li>
          </ul>
          <p className="text-sm leading-relaxed mb-3">
            A <strong>Contractor Safety Packet</strong> is generated via
            ShieldSDS and includes relevant SDS documents, a labeling system
            overview, and emergency procedures specific to their work area.
            Contractor acknowledgment is captured digitally before work begins.
          </p>
          <p className="text-sm leading-relaxed">
            Contractors are also required to provide {shopInfo.name} with SDS
            for any hazardous chemicals they bring onto the premises.
          </p>
        </HazComSection>

        {/* Section 9: Emergency Procedures */}
        <HazComSection number={9} title="Emergency Procedures">
          <p className="text-sm leading-relaxed mb-4">
            In the event of a chemical emergency, employees should follow these
            procedures and contact emergency services as needed:
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-bold mb-2">Emergency Contacts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Fire / EMS:</span>{" "}
                <strong>{shopInfo.emergencyContacts.fire}</strong>
              </div>
              <div>
                <span className="text-gray-500">Police:</span>{" "}
                <strong>{shopInfo.emergencyContacts.police}</strong>
              </div>
              <div>
                <span className="text-gray-500">Poison Control:</span>{" "}
                <strong>{shopInfo.emergencyContacts.poisonControl}</strong>
              </div>
              <div>
                <span className="text-gray-500">Responsible Person:</span>{" "}
                <strong>
                  {shopInfo.owner} &mdash; {shopInfo.ownerPhone}
                </strong>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Nearest Hospital:</span>{" "}
                <strong>
                  {shopInfo.emergencyContacts.nearestHospital.name}
                </strong>{" "}
                &mdash;{" "}
                {shopInfo.emergencyContacts.nearestHospital.address} &mdash;{" "}
                {shopInfo.emergencyContacts.nearestHospital.phone} (
                {shopInfo.emergencyContacts.nearestHospital.distance})
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold mt-4 mb-2">Chemical Spill</h3>
          <ol className="text-sm space-y-1 ml-4 list-decimal mb-3">
            <li>Alert nearby workers and evacuate the immediate area if necessary</li>
            <li>Consult the SDS (Section 6: Accidental Release Measures) for the spilled chemical</li>
            <li>Don appropriate PPE before attempting cleanup (per SDS Section 8)</li>
            <li>Use spill kit materials (absorbent pads, neutralizers) to contain and clean up</li>
            <li>Dispose of contaminated materials per SDS Section 13 (Disposal Considerations)</li>
            <li>Report the spill to {shopInfo.owner} and log in ShieldSDS</li>
          </ol>

          <h3 className="text-sm font-bold mt-4 mb-2">Chemical Exposure</h3>
          <ol className="text-sm space-y-1 ml-4 list-decimal mb-3">
            <li>Immediately follow first aid procedures per SDS Section 4 for the specific chemical</li>
            <li>Use emergency eyewash station or safety shower if eyes or skin are affected</li>
            <li>Call 911 if symptoms are severe or life-threatening</li>
            <li>
              Transport to{" "}
              {shopInfo.emergencyContacts.nearestHospital.name} (
              {shopInfo.emergencyContacts.nearestHospital.distance}) or call{" "}
              {shopInfo.emergencyContacts.nearestHospital.phone}
            </li>
            <li>Bring a copy of the SDS to the medical facility (accessible via ShieldSDS on any mobile device)</li>
          </ol>

          <h3 className="text-sm font-bold mt-4 mb-2">Fire Involving Chemicals</h3>
          <ol className="text-sm space-y-1 ml-4 list-decimal">
            <li>
              Activate fire alarm and call{" "}
              <strong>{shopInfo.emergencyContacts.fire}</strong>
            </li>
            <li>Evacuate all personnel to the designated assembly point</li>
            <li>Consult SDS Section 5 (Fire-Fighting Measures) for the chemicals involved &mdash; DO NOT use water on certain chemical fires</li>
            <li>Only trained employees may attempt to use fire extinguishers on small, contained fires</li>
            <li>Inform arriving firefighters of the chemicals present (provide SDS access via ShieldSDS)</li>
          </ol>
        </HazComSection>

        {/* Section 10: Program Review */}
        <HazComSection number={10} title="Program Review">
          <p className="text-sm leading-relaxed mb-3">
            This Written Hazard Communication Program is a living document maintained
            in ShieldSDS that updates automatically as chemical inventory, SDS records,
            labeling, and training data change. The program is also reviewed whenever
            any of the following occur:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc mb-4">
            <li>New hazardous chemicals are introduced into the workplace</li>
            <li>Hazardous chemicals are removed from inventory</li>
            <li>Changes are made to the labeling system</li>
            <li>Employee roster changes (new hires, departures, role changes)</li>
            <li>At least <strong>annually</strong>, regardless of other triggers</li>
          </ul>

          <h3 className="text-sm font-bold mb-2">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold w-28">Date</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Event</th>
                </tr>
              </thead>
              <tbody>
                {versionHistory.length > 0 ? (
                  versionHistory.map((entry, i) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">
                        {(() => {
                          try {
                            return new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          } catch {
                            return entry.date;
                          }
                        })()}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {entry.summary}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-2 py-1" colSpan={2}>
                      No events recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </HazComSection>

        {/* Footer / Disclaimer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Generated by ShieldSDS on {today}</span>
            </div>
            <span>Live Document &mdash; {shopInfo.name}</span>
          </div>
          <p className="text-xs text-gray-500 italic leading-relaxed">
            <strong>Disclaimer:</strong> This Written Hazard Communication
            Program is generated to support OSHA 29 CFR 1910.1200 compliance.
            The employer remains responsible for implementing and maintaining
            all aspects of this program, including but not limited to: ensuring
            SDS accessibility, proper container labeling, employee training, and
            timely program updates. This document does not constitute legal
            advice. Consult with a qualified safety professional or OSHA
            compliance specialist for questions regarding your specific
            obligations.
          </p>
        </div>
      </div>

      {/* Screen-only bottom actions */}
      <div className="mt-6 flex items-center justify-between print:hidden">
        <p className="text-xs text-gray-500">
          Live document &middot; {shopInfo.name}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                await generateHazComProgramPDF();
              } catch (err) {
                console.error("PDF generation error:", err);
                alert("PDF error: " + (err instanceof Error ? err.message : "Unknown error"));
              }
            }}
            className="flex items-center gap-2 bg-navy-800 border border-navy-700 hover:border-navy-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
