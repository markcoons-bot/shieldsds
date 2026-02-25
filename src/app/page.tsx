"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  Tags,
  GraduationCap,
  FileCheck,
  Eye,
  Upload,
  Search,
  Printer,
  ShieldCheck,
  ArrowRight,
  Check,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

const problems = [
  {
    title: "The Binder Is a Mess",
    desc: "SDSs are outdated, unorganized, or missing entirely. If OSHA asks for one, you're scrambling.",
    icon: BookOpen,
  },
  {
    title: "Containers Aren't Labeled",
    desc: "Secondary containers are missing GHS labels. It's a citation waiting to happen.",
    icon: Tags,
  },
  {
    title: "Training Has No Paper Trail",
    desc: "Employees were trained… probably. But there's no documentation to prove it.",
    icon: GraduationCap,
  },
  {
    title: "No One's Tracking Changes",
    desc: "New chemicals come in, old ones change formulas. Nobody updates the inventory or SDS files.",
    icon: FlaskConical,
  },
];

const features = [
  {
    num: "01",
    title: "Smart SDS Library",
    desc: "Upload or auto-fetch SDSs. Track revision dates, flag outdated sheets, view full 16-section detail with composition data — all organized by location.",
    icon: BookOpen,
    osha: "SDS Accessibility (29 CFR 1910.1200(g))",
  },
  {
    num: "02",
    title: "Live Chemical Inventory",
    desc: "Track every chemical across 9+ storage locations. Know what's where, container counts, labeling status, and SDS coverage — with sortable, searchable tables.",
    icon: FlaskConical,
    osha: "Chemical Inventory (29 CFR 1910.1200(e)(1)(i))",
  },
  {
    num: "03",
    title: "Secondary Label Generator",
    desc: "Print GHS-compliant labels in 3 sizes with live preview — pictograms, signal words, hazard statements, and QR codes linking to the full SDS.",
    icon: Tags,
    osha: "Container Labeling (29 CFR 1910.1200(f))",
  },
  {
    num: "04",
    title: "Training & Compliance Tracking",
    desc: "Auto-assign training when new chemicals arrive. Track completions per employee, send reminders for overdue items, and maintain OSHA-ready training records.",
    icon: GraduationCap,
    osha: "Employee Training (29 CFR 1910.1200(h))",
  },
  {
    num: "05",
    title: "Written HazCom Program",
    desc: "A printable 10-section OSHA-compliant document that auto-updates with your chemical inventory, employee roster, and training records. Always current.",
    icon: FileCheck,
    osha: "Written Program (29 CFR 1910.1200(e)(1))",
  },
  {
    num: "06",
    title: "Contractor Safety Packets",
    desc: "Generate location-specific contractor safety packets with chemical hazard tables, GHS pictogram guides, SDS access instructions, and digital acknowledgment.",
    icon: Users,
    osha: "Multi-Employer Sites (29 CFR 1910.1200(e)(2))",
  },
];

const oshaRows = [
  {
    req: "Written HazCom Program",
    ref: "§1910.1200(e)(1)",
    means: "A documented plan describing how your workplace handles chemical hazards",
    shield: "Auto-generated, versioned 10-section document that updates with your inventory",
  },
  {
    req: "Chemical Inventory",
    ref: "§1910.1200(e)(1)(i)",
    means: "A list of all hazardous chemicals present in each work area",
    shield: "Live inventory tracking across 9 locations with container counts and reconciliation",
  },
  {
    req: "Safety Data Sheets (SDS)",
    ref: "§1910.1200(g)",
    means: "A current SDS must be accessible for every hazardous chemical on site",
    shield: "Cloud library with full 16-section detail view, revision tracking, and missing SDS alerts",
  },
  {
    req: "Container Labeling",
    ref: "§1910.1200(f)",
    means: "Every secondary container must have a GHS-compliant label",
    shield: "Print labels with pictograms, signal words, QR codes in 3 sizes — tracks labeling compliance",
  },
  {
    req: "Employee Training",
    ref: "§1910.1200(h)",
    means: "Workers must be trained on hazards before exposure and when new chemicals are introduced",
    shield: "Auto-triggered training with completion tracking, reminders, certificates, and audit trail",
  },
  {
    req: "Multi-Employer Sites",
    ref: "§1910.1200(e)(2)",
    means: "Host employers must share chemical hazard info with contractors on site",
    shield: "Contractor safety packets with chemical tables, GHS guides, and digital acknowledgment",
  },
];

const steps = [
  {
    num: 1,
    title: "Upload",
    desc: "Add your SDSs — drag-and-drop or let us auto-fetch from our database of 4M+ sheets.",
    icon: Upload,
  },
  {
    num: 2,
    title: "Review",
    desc: "We scan everything — missing SDSs, outdated revisions, unlabeled containers, training gaps.",
    icon: Search,
  },
  {
    num: 3,
    title: "Print Labels & Assign Training",
    desc: "Generate GHS labels, assign training modules, and build your written HazCom program.",
    icon: Printer,
  },
  {
    num: 4,
    title: "Stay Ready",
    desc: "Ongoing monitoring, automatic alerts, and one-click inspection mode. Always audit-ready.",
    icon: ShieldCheck,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "$99",
    desc: "For small shops getting organized",
    features: [
      "Up to 50 chemicals",
      "SDS library with 16-section viewer",
      "Secondary label printing (3 sizes)",
      "Chemical inventory tracking",
      "Written HazCom program",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "$199",
    desc: "For shops that need full compliance",
    features: [
      "Unlimited chemicals",
      "Everything in Starter",
      "Employee training modules",
      "Auto-triggered training assignments",
      "Inspection Mode with scoring",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "$299",
    desc: "For multi-location operations",
    features: [
      "Everything in Pro",
      "Contractor safety packets",
      "Digital acknowledgment tracking",
      "Multi-location management",
      "Custom training uploads",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

function CtaToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-status-green/15 border border-status-green/30 text-status-green rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
    </div>
  );
}

export default function LandingPage() {
  const [ctaName, setCtaName] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaShop, setCtaShop] = useState("");
  const [ctaChemicals, setCtaChemicals] = useState("");
  const [ctaToast, setCtaToast] = useState<string | null>(null);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaName.trim() || !ctaEmail.trim()) return;
    setCtaToast("Thanks! We'll be in touch within 24 hours.");
    setCtaName("");
    setCtaEmail("");
    setCtaShop("");
    setCtaChemicals("");
    setTimeout(() => setCtaToast(null), 5000);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Stop scrambling when the{" "}
                <span className="text-amber-400">inspector walks in.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-300 max-w-xl">
                ShieldSDS keeps your safety data sheets, container labels,
                chemical inventory, and training records organized, current, and
                inspection-ready — so you can focus on running your shop.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Free SDS Health Check
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 border border-navy-600 hover:border-gray-400 text-gray-200 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Demo Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mock App Preview Card */}
            <div className="bg-navy-900 border border-navy-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-status-green" />
                  <span className="font-display font-bold text-sm">
                    Inspection Readiness
                  </span>
                </div>
                <span className="bg-status-green/15 text-status-green text-xs font-bold px-3 py-1 rounded-full">
                  Ready
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "SDS Library", value: "31 chemicals tracked", status: "green" },
                  { label: "Secondary Labels", value: "3 sizes available", status: "green" },
                  { label: "Chemical Inventory", value: "9 locations synced", status: "green" },
                  { label: "Employee Training", value: "Auto-triggered", status: "green" },
                  { label: "Written HazCom Program", value: "10-section document", status: "green" },
                  { label: "Contractor Packets", value: "Digital acknowledgment", status: "green" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-navy-800/60"
                  >
                    <div className="flex items-center gap-3">
                      {row.status === "green" ? (
                        <CheckCircle2 className="h-4 w-4 text-status-green" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-status-amber" />
                      )}
                      <span className="text-sm text-gray-200">{row.label}</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        row.status === "green" ? "text-status-green" : "text-status-amber"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROBLEM ========== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              Sound familiar?
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Most small shops know they need to comply with OSHA&apos;s HazCom
              standard. The hard part is actually doing it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((p) => (
              <div
                key={p.title}
                className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 border-t-2 border-t-status-red hover:border-t-status-red/80 transition-colors"
              >
                <p.icon className="h-8 w-8 text-status-red mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              All 6 OSHA obligations. One platform.
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Every requirement of 29 CFR 1910.1200 — addressed with purpose-built tools that work together.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.num}
                className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 hover:border-amber-500/30 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-amber-400 font-display font-black text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
                    {f.num}
                  </span>
                  <f.icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">{f.desc}</p>
                <p className="text-xs text-amber-400/60 font-medium">{f.osha}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== OSHA TABLE ========== */}
      <section id="osha" className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              OSHA HazCom Requirements
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              29 CFR 1910.1200 — here&apos;s what&apos;s required and how
              ShieldSDS handles each one.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy-700">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    OSHA Requirement
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    CFR Reference
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    What It Means
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    How ShieldSDS Handles It
                  </th>
                </tr>
              </thead>
              <tbody>
                {oshaRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-navy-700/50 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-white">
                      {row.req}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500 font-mono">
                      {row.ref}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-400">
                      {row.means}
                    </td>
                    <td className="py-4 px-4 text-sm text-amber-400/90">
                      {row.shield}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========== INSPECTION MODE CALLOUT ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-status-green/20 via-status-green/10 to-navy-900 border border-status-green/30 rounded-2xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-status-green/20 border-2 border-status-green flex items-center justify-center flex-shrink-0">
                <Eye className="h-8 w-8 text-status-green" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">Inspection Mode</h3>
                <p className="text-sm text-gray-300 mt-1 max-w-lg">
                  One-click compliance audit with weighted scoring across all 6 OSHA obligations.
                  See exactly where you stand, fix gaps with direct links, and export a complete audit packet.
                </p>
              </div>
            </div>
            <Link
              href="/inspection"
              className="flex items-center gap-2 bg-status-green/20 hover:bg-status-green/30 border border-status-green/40 text-status-green font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Try It <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-gray-400">
              Four steps from chaos to compliance.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center mb-5">
                  <span className="font-display font-black text-2xl text-amber-400">
                    {s.num}
                  </span>
                </div>
                <s.icon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-400">
              No contracts. Cancel anytime. All plans include a 14-day free
              trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-navy-900 border rounded-2xl p-8 ${
                  plan.popular
                    ? "border-amber-500 shadow-lg shadow-amber-500/10"
                    : "border-navy-700/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-navy-950 text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{plan.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="font-display font-black text-4xl">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Check className="h-4 w-4 text-status-green flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/setup"
                  className={`block w-full py-3 rounded-lg font-semibold text-sm text-center transition-colors ${
                    plan.popular
                      ? "bg-amber-500 hover:bg-amber-400 text-navy-950"
                      : "border border-navy-600 hover:border-gray-400 text-gray-200 hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section id="cta" className="py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Shield className="h-12 w-12 text-amber-400 mx-auto mb-6" />
            <h2 className="font-display font-black text-3xl sm:text-4xl mb-4">
              Get a Free SDS Audit
            </h2>
            <p className="text-gray-400 text-lg">
              Find out where you stand in 10 minutes. We&apos;ll show you
              what&apos;s current, what&apos;s missing, and what needs
              attention — no credit card required.
            </p>
          </div>
          <form onSubmit={handleCtaSubmit} className="max-w-md mx-auto space-y-4">
            <div>
              <input
                type="text"
                value={ctaName}
                onChange={(e) => setCtaName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <input
                type="email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <input
                type="text"
                value={ctaShop}
                onChange={(e) => setCtaShop(e.target.value)}
                placeholder="Shop name"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <input
                type="text"
                value={ctaChemicals}
                onChange={(e) => setCtaChemicals(e.target.value)}
                placeholder="Estimated number of chemicals (e.g., 20-50)"
                className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-8 py-3.5 rounded-lg transition-colors text-lg"
            >
              Get Your Free Audit
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-white font-semibold text-sm transition-colors"
              >
                Or explore the demo dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-navy-700/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <span className="font-display font-black text-sm text-white">
                Shield<span className="text-amber-400">SDS</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center max-w-xl">
              ShieldSDS is a compliance management tool. It does not replace
              professional safety consultation. Always consult a qualified safety
              professional for site-specific guidance. OSHA requirements may vary
              by state and industry.
            </p>
            <p className="text-xs text-gray-500">
              &copy; 2026 ShieldSDS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {ctaToast && <CtaToast message={ctaToast} onClose={() => setCtaToast(null)} />}
    </div>
  );
}
