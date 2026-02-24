"use client";

import DashboardLayout from "@/components/DashboardLayout";
import HelpCard from "@/components/HelpCard";
import { generateHazComProgramPDF } from "@/lib/pdf-generator";
import {
  sdsEntries,
  employees,
  trainingCourses,
  nonRoutineTasks,
  programVersionHistory,
  shopInfo,
  getEmployeeTrainingStats,
} from "@/lib/data";
import { Printer, Download, Clock } from "lucide-react";

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

const statusLabel = (status: string) => {
  switch (status) {
    case "current":
      return <span className="text-green-700 font-medium">Current</span>;
    case "review":
      return <span className="text-amber-700 font-medium">Review Needed</span>;
    case "missing":
      return <span className="text-red-700 font-medium">Missing</span>;
    default:
      return <span>{status}</span>;
  }
};

const trainingStatusLabel = (status: string) => {
  switch (status) {
    case "current":
      return <span className="text-green-700 font-medium">Current</span>;
    case "overdue":
      return <span className="text-red-700 font-medium">Overdue</span>;
    case "pending":
      return <span className="text-amber-700 font-medium">Pending (New Hire)</span>;
    default:
      return <span>{status}</span>;
  }
};

export default function HazComProgramPage() {
  const currentSDS = sdsEntries.filter((s) => s.sdsStatus === "current").length;
  const missingSDS = sdsEntries.filter((s) => s.sdsStatus === "missing").length;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const currentVersion = programVersionHistory[0];

  return (
    <DashboardLayout>
      {/* Screen-only header bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="font-display font-black text-2xl text-white">
            Written HazCom Program
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            OSHA 29 CFR 1910.1200 compliance document &middot; Version{" "}
            {currentVersion.version}
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
            <span>
              Version {currentVersion.version} &mdash;{" "}
              {new Date(currentVersion.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>Printed: {today}</span>
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
            inventory includes <strong>{sdsEntries.length}</strong> chemical
            products, of which <strong>{currentSDS}</strong> have current SDS on
            file
            {missingSDS > 0 && (
              <>
                {" "}
                and <strong className="text-red-700">{missingSDS}</strong>{" "}
                {missingSDS === 1 ? "is" : "are"} missing SDS documentation
              </>
            )}
            .
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    #
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Product Name
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Manufacturer
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Storage Location
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Signal Word
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    SDS Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sdsEntries.map((sds, i) => (
                  <tr
                    key={sds.id}
                    className={
                      sds.sdsStatus === "missing" ? "bg-red-50" : ""
                    }
                  >
                    <td className="border border-gray-300 px-2 py-1">
                      {i + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 font-medium">
                      {sds.productName}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {sds.manufacturer}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {sds.storageLocation}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <span
                        className={
                          sds.signalWord === "Danger"
                            ? "text-red-700 font-bold"
                            : sds.signalWord === "Warning"
                            ? "text-amber-700 font-bold"
                            : "text-gray-500"
                        }
                      >
                        {sds.signalWord}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {statusLabel(sds.sdsStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Last updated:{" "}
            {new Date(currentVersion.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            . Full interactive inventory available in ShieldSDS Chemical
            Inventory module.
          </p>
        </HazComSection>

        {/* Section 4: SDS Access */}
        <HazComSection number={4} title="Safety Data Sheet (SDS) Access">
          <p className="text-sm leading-relaxed mb-3">
            Safety Data Sheets for all hazardous chemicals are accessible to all
            employees at all times during their work shift. No supervisor
            permission is required to access any SDS. Access methods:
          </p>
          <ul className="text-sm space-y-2 ml-4 list-disc">
            <li>
              <strong>Primary:</strong> ShieldSDS application on the shop tablet
              (mounted at Station 1 near the Paint Booth A entrance) and via
              personal mobile device using QR codes on secondary container
              labels.
            </li>
            <li>
              <strong>Backup (Offline):</strong> Offline-cached SDS library on
              the shop tablet. Functions during internet or power outage via
              device battery.
            </li>
            <li>
              <strong>Secondary Backup:</strong> Printed PDF binder in the Front
              Office filing cabinet. Binder is reprinted quarterly to ensure
              current SDS revisions.
            </li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            SDS access training is included in the HazCom Initial Orientation
            (Section 6). Employees are trained to search by product name,
            manufacturer, or scan the QR code on any labeled container.
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
            <li>QR code linking to the full SDS in ShieldSDS</li>
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
              <strong>Annual refresher:</strong> All required courses reviewed
              annually
            </li>
          </ul>

          <h3 className="text-sm font-bold mb-2">Training Modules</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Course
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Duration
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Required
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {trainingCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="border border-gray-300 px-2 py-1 font-medium">
                      {course.title}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {course.duration}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {course.required ? "Yes" : "As needed"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {course.description}
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
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Employee
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Role
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Hire Date
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Modules Complete
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const stats = getEmployeeTrainingStats(emp);
                  return (
                    <tr
                      key={emp.id}
                      className={
                        emp.status === "overdue" ? "bg-red-50" : ""
                      }
                    >
                      <td className="border border-gray-300 px-2 py-1 font-medium">
                        {emp.name}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {emp.role}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {new Date(emp.hireDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {stats.completed}/{stats.total}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {trainingStatusLabel(emp.status)}
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
          {nonRoutineTasks.map((task) => (
            <div
              key={task.id}
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
                    {task.hazards.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">
                    Precautions:
                  </p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {task.precautions.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-800 mb-1">
                    Required PPE:
                  </p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {task.requiredPPE.map((ppe, i) => (
                      <li key={i}>{ppe}</li>
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
            <li>
              Alert nearby workers and evacuate the immediate area if necessary
            </li>
            <li>
              Consult the SDS (Section 6: Accidental Release Measures) for the
              spilled chemical
            </li>
            <li>
              Don appropriate PPE before attempting cleanup (per SDS Section 8)
            </li>
            <li>
              Use spill kit materials (absorbent pads, neutralizers) to contain
              and clean up
            </li>
            <li>
              Dispose of contaminated materials per SDS Section 13 (Disposal
              Considerations)
            </li>
            <li>Report the spill to {shopInfo.owner} and log in ShieldSDS</li>
          </ol>

          <h3 className="text-sm font-bold mt-4 mb-2">Chemical Exposure</h3>
          <ol className="text-sm space-y-1 ml-4 list-decimal mb-3">
            <li>
              Immediately follow first aid procedures per SDS Section 4 for the
              specific chemical
            </li>
            <li>
              Use emergency eyewash station or safety shower if eyes or skin are
              affected
            </li>
            <li>Call 911 if symptoms are severe or life-threatening</li>
            <li>
              Transport to{" "}
              {shopInfo.emergencyContacts.nearestHospital.name} (
              {shopInfo.emergencyContacts.nearestHospital.distance}) or call{" "}
              {shopInfo.emergencyContacts.nearestHospital.phone}
            </li>
            <li>
              Bring a copy of the SDS to the medical facility (accessible via
              ShieldSDS on any mobile device)
            </li>
          </ol>

          <h3 className="text-sm font-bold mt-4 mb-2">
            Fire Involving Chemicals
          </h3>
          <ol className="text-sm space-y-1 ml-4 list-decimal">
            <li>
              Activate fire alarm and call{" "}
              <strong>{shopInfo.emergencyContacts.fire}</strong>
            </li>
            <li>Evacuate all personnel to the designated assembly point</li>
            <li>
              Consult SDS Section 5 (Fire-Fighting Measures) for the chemicals
              involved &mdash; DO NOT use water on certain chemical fires
            </li>
            <li>
              Only trained employees may attempt to use fire extinguishers on
              small, contained fires
            </li>
            <li>
              Inform arriving firefighters of the chemicals present (provide SDS
              access via ShieldSDS)
            </li>
          </ol>
        </HazComSection>

        {/* Section 10: Program Review */}
        <HazComSection number={10} title="Program Review">
          <p className="text-sm leading-relaxed mb-3">
            This Written Hazard Communication Program is reviewed and updated
            whenever any of the following occur:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc mb-4">
            <li>New hazardous chemicals are introduced into the workplace</li>
            <li>Hazardous chemicals are removed from inventory</li>
            <li>Changes are made to the labeling system</li>
            <li>
              Employee roster changes (new hires, departures, role changes)
            </li>
            <li>
              At least <strong>annually</strong>, regardless of other triggers
            </li>
          </ul>

          <h3 className="text-sm font-bold mb-2">Version History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Version
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Date
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Author
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">
                    Changes
                  </th>
                </tr>
              </thead>
              <tbody>
                {programVersionHistory.map((v) => (
                  <tr key={v.version}>
                    <td className="border border-gray-300 px-2 py-1 font-medium">
                      {v.version}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {new Date(v.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {v.author}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {v.changes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HazComSection>

        {/* Footer / Disclaimer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                Generated by ShieldSDS on {today}
              </span>
            </div>
            <span>
              Version {currentVersion.version} &mdash; {shopInfo.name}
            </span>
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
          Version {currentVersion.version} &middot; Last updated{" "}
          {new Date(currentVersion.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          by {currentVersion.author}
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
