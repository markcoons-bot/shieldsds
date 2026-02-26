"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { isRealUser, loadDemoMode } from "@/lib/chemicals";
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
  Clock,
  X,
  MessageSquareQuote,
} from "lucide-react";
import Link from "next/link";

const problems = [
  {
    title: "The Binder Is a Mess",
    desc: "An inspector asks for the SDS on that drum in the corner. You\u2019re flipping through a binder that hasn\u2019t been updated since 2019. That feeling in your stomach? We fix that.",
    icon: BookOpen,
  },
  {
    title: "Containers Aren\u2019t Labeled",
    desc: "You transferred some degreaser into a spray bottle last week. No label. That\u2019s a $16,131 citation if someone notices. Every unlabeled container is a ticking clock.",
    icon: Tags,
  },
  {
    title: "Training Has No Paper Trail",
    desc: "Your guys know what they\u2019re doing. But can you prove it? OSHA doesn\u2019t accept \u2018I told them about it.\u2019 They want signed certificates, dates, and module completion records.",
    icon: GraduationCap,
  },
  {
    title: "No One\u2019s Tracking Changes",
    desc: "A new product showed up last month. Nobody updated the SDS binder. Nobody printed a label. Nobody told the crew about the hazards. This is how incidents \u2014 and citations \u2014 happen.",
    icon: FlaskConical,
  },
];

const features = [
  {
    num: "01",
    title: "Smart SDS Library",
    desc: "Know exactly which SDS you have, which ones are missing, and which are outdated \u2014 before an inspector asks. We auto-find SDS documents from manufacturer databases so you don\u2019t have to hunt for them.",
    icon: BookOpen,
    osha: "Covers OSHA 29 CFR 1910.1200(g) \u2014 SDS Accessibility",
  },
  {
    num: "02",
    title: "Live Chemical Inventory",
    desc: "Know what\u2019s in your shop, where it is, and whether it\u2019s properly documented \u2014 at a glance. Add chemicals by scanning a label or browsing our database of hundreds of common products.",
    icon: FlaskConical,
    osha: "Covers OSHA 29 CFR 1910.1200(e)(1)(i) \u2014 Chemical Inventory",
  },
  {
    num: "03",
    title: "Secondary Label Generator",
    desc: "Every container needs a GHS label. We generate print-ready labels with the correct pictograms, signal words, and hazard statements \u2014 so you\u2019re never caught with an unlabeled bottle.",
    icon: Tags,
    osha: "Covers OSHA 29 CFR 1910.1200(f) \u2014 Container Labeling",
  },
  {
    num: "04",
    title: "Training & Compliance Tracking",
    desc: "Prove your team is trained. Interactive modules your employees can complete on their phone, with certificates that satisfy OSHA\u2019s documentation requirements. You\u2019ll know who\u2019s current, who\u2019s due, and who\u2019s overdue \u2014 without a spreadsheet.",
    icon: GraduationCap,
    osha: "Covers OSHA 29 CFR 1910.1200(h) \u2014 Employee Training",
  },
  {
    num: "05",
    title: "Written HazCom Program",
    desc: "OSHA requires a written Hazard Communication Program. Ours writes itself \u2014 it updates automatically as you add chemicals, train employees, and print labels. Always current, always ready to show an inspector.",
    icon: FileCheck,
    osha: "Covers OSHA 29 CFR 1910.1200(e)(1) \u2014 Written Program",
  },
  {
    num: "06",
    title: "Contractor Safety Packets",
    desc: "When contractors work in your shop, you\u2019re required to share chemical hazard information. Generate a professional safety packet in one click \u2014 it shows you take this seriously.",
    icon: Users,
    osha: "Covers OSHA 29 CFR 1910.1200(e)(2) \u2014 Multi-Employer Sites",
  },
];

const comparisonRows = [
  { feature: "SDS Storage / Access", free: "yes", basic: "yes", shield: "yes", shieldNote: "" },
  { feature: "Missing SDS Alerts", free: "no", basic: "some", shield: "yes", shieldNote: "Automatic" },
  { feature: "AI Label Scanning", free: "no", basic: "no", shield: "yes", shieldNote: "Snap a photo" },
  { feature: "GHS Label Printing", free: "no", basic: "some", shield: "yes", shieldNote: "3 sizes, print-ready" },
  { feature: "Employee Training Modules", free: "no", basic: "no", shield: "yes", shieldNote: "Interactive + certificates" },
  { feature: "Auto Training Assignments", free: "no", basic: "no", shield: "yes", shieldNote: "Tracks due dates" },
  { feature: "Written HazCom Program", free: "no", basic: "no", shield: "yes", shieldNote: "Auto-generated, always current" },
  { feature: "Inspection Readiness Score", free: "no", basic: "no", shield: "yes", shieldNote: "Real-time compliance scoring" },
  { feature: "Bilingual Training (EN/ES)", free: "no", basic: "no", shield: "soon", shieldNote: "Coming soon" },
  { feature: "Contractor Safety Packets", free: "no", basic: "no", shield: "yes", shieldNote: "One-click generation" },
];

const testimonials = [
  {
    quote: "I spent 3 hours a month on SDS paperwork. Now I spend 10 minutes.",
    author: "Auto Body Shop Owner",
  },
  {
    quote: "An OSHA inspector came in and I pulled everything up on my tablet. He was impressed.",
    author: "Construction Company Manager",
  },
  {
    quote: "The training modules saved me. My guys actually completed them.",
    author: "Restaurant Owner",
  },
];

const oshaRows = [
  {
    req: "Written HazCom Program",
    ref: "\u00a71910.1200(e)(1)",
    means: "A documented plan describing how your workplace handles chemical hazards",
    shield: "Auto-generated, versioned 10-section document that updates with your inventory",
  },
  {
    req: "Chemical Inventory",
    ref: "\u00a71910.1200(e)(1)(i)",
    means: "A list of all hazardous chemicals present in each work area",
    shield: "Live inventory tracking across 9 locations with container counts and reconciliation",
  },
  {
    req: "Safety Data Sheets (SDS)",
    ref: "\u00a71910.1200(g)",
    means: "A current SDS must be accessible for every hazardous chemical on site",
    shield: "Cloud library with full 16-section detail view, revision tracking, and missing SDS alerts",
  },
  {
    req: "Container Labeling",
    ref: "\u00a71910.1200(f)",
    means: "Every secondary container must have a GHS-compliant label",
    shield: "Print labels with pictograms, signal words, QR codes in 3 sizes \u2014 tracks labeling compliance",
  },
  {
    req: "Employee Training",
    ref: "\u00a71910.1200(h)",
    means: "Workers must be trained on hazards before exposure and when new chemicals are introduced",
    shield: "Auto-triggered training with completion tracking, reminders, certificates, and audit trail",
  },
  {
    req: "Multi-Employer Sites",
    ref: "\u00a71910.1200(e)(2)",
    means: "Host employers must share chemical hazard info with contractors on site",
    shield: "Contractor safety packets with chemical tables, GHS guides, and digital acknowledgment",
  },
];

const steps = [
  {
    num: 1,
    title: "Set Up Your Shop",
    desc: "Tell us your business name, industry, and team. Takes 2 minutes.",
    icon: Upload,
  },
  {
    num: 2,
    title: "Add Your Chemicals",
    desc: "Scan labels with your phone, browse our database, or type them in. We\u2019ll find the SDS automatically.",
    icon: Search,
  },
  {
    num: 3,
    title: "Train Your Team",
    desc: "Send your employees a link. They complete the training on their phone and earn a certificate.",
    icon: Printer,
  },
  {
    num: 4,
    title: "Stay Ready",
    desc: "Your compliance score updates in real-time. When something needs attention \u2014 an expiring SDS, overdue training, a new chemical without a label \u2014 you\u2019ll know immediately.",
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
    cta: "Get Started \u2014 Free",
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
    cta: "Get Started \u2014 Free",
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
    cta: "Get Started \u2014 Free",
    popular: false,
  },
];


export default function LandingPage() {
  const [hasSetup, setHasSetup] = useState(false);

  useEffect(() => {
    setHasSetup(isRealUser());
  }, []);

  const handleViewDemo = () => {
    if (hasSetup) {
      loadDemoMode();
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 sm:pt-28 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl leading-tight">
                Stop scrambling when the{" "}
                <span className="text-amber-400">inspector walks in.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0">
                When OSHA knocks, you&apos;ll be ready. ShieldSDS handles your
                safety data sheets, labels, training records, and written
                program &mdash; so you never have to scramble, apologize, or
                wonder if you&apos;re compliant.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:justify-start justify-center lg:justify-start">
                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Set Up My Shop &mdash; Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleViewDemo}
                  className="inline-flex items-center justify-center gap-2 border border-navy-600 hover:border-gray-400 text-gray-200 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto"
                >
                  See It In Action
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mock App Preview Card — Dynamic State */}
            <div className="bg-navy-900 border border-navy-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <span className="font-display font-bold text-sm">
                    Inspection Readiness
                  </span>
                </div>
                <span className="bg-amber-400/15 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                  87%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-navy-800 rounded-full h-2 mb-5">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: "87%" }}
                />
              </div>
              <div className="space-y-3">
                {[
                  { label: "SDS Library", value: "28 of 31 current", status: "green" },
                  { label: "Secondary Labels", value: "All labeled", status: "green" },
                  { label: "Chemical Inventory", value: "9 locations synced", status: "green" },
                  { label: "Employee Training", value: "1 expiring soon", status: "amber" },
                  { label: "Written HazCom Program", value: "Up to date", status: "green" },
                  { label: "Contractor Packets", value: "1 SDS needs update", status: "amber" },
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
              {/* Alerts */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-status-amber bg-status-amber/10 rounded-lg px-3 py-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>1 training certificate expiring in 12 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-status-amber bg-status-amber/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>1 SDS revision outdated &mdash; updated version available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROBLEM / "SOUND FAMILIAR?" ========== */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
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

      {/* ========== THE COST OF GETTING CAUGHT ========== */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              The Cost of Getting Caught
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 sm:p-8 text-center">
              <p className="font-display font-black text-3xl sm:text-5xl text-amber-400 mb-3">#2</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                HazCom is OSHA&apos;s second most cited workplace violation &mdash; every year.
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 sm:p-8 text-center">
              <p className="font-display font-black text-3xl sm:text-5xl text-amber-400 mb-3">$16,131</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Minimum penalty per serious violation. Willful violations can reach $161,323.
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700/50 rounded-xl p-6 sm:p-8 text-center">
              <p className="font-display font-black text-2xl sm:text-4xl text-amber-400 mb-3">Unannounced</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                OSHA inspections happen without warning. There&apos;s no time to get ready once they&apos;re at the door.
              </p>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 max-w-3xl mx-auto text-center">
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              You don&apos;t need to be perfect. You need to show you&apos;re trying &mdash; that you have a system, it&apos;s current, and your people are trained. That&apos;s exactly what ShieldSDS gives you.
            </p>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              All 6 OSHA obligations. One platform.
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Every requirement of 29 CFR 1910.1200 &mdash; addressed with purpose-built tools that work together.
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

      {/* ========== COMPARISON TABLE ========== */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              Why ShieldSDS &mdash; Not Just Another SDS Binder
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Most SDS tools just store documents. ShieldSDS manages your entire HazCom compliance program.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy-700">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Free SDS Websites
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Basic SDS Software
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-amber-400 uppercase tracking-wider text-center border-x border-amber-500/20 bg-amber-500/5">
                    ShieldSDS
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-navy-700/50 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-white">
                      {row.feature}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.free === "yes" ? (
                        <Check className="h-4 w-4 text-status-green mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-status-red mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.basic === "yes" ? (
                        <Check className="h-4 w-4 text-status-green mx-auto" />
                      ) : row.basic === "some" ? (
                        <span className="text-xs text-status-amber font-medium">Some</span>
                      ) : (
                        <X className="h-4 w-4 text-status-red mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center border-x border-amber-500/20 bg-amber-500/5">
                      {row.shield === "yes" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-status-green" />
                          {row.shieldNote && (
                            <span className="text-xs text-status-green font-medium">{row.shieldNote}</span>
                          )}
                        </span>
                      ) : row.shield === "soon" ? (
                        <span className="text-xs text-amber-400 font-medium">Coming soon</span>
                      ) : (
                        <Check className="h-4 w-4 text-status-green mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className="bg-navy-900 border border-navy-700/50 rounded-xl p-4"
              >
                <h3 className="font-display font-bold text-sm text-white mb-3">
                  {row.feature}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Free SDS Websites</span>
                    {row.free === "yes" ? (
                      <Check className="h-4 w-4 text-status-green" />
                    ) : (
                      <X className="h-4 w-4 text-status-red" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Basic SDS Software</span>
                    {row.basic === "yes" ? (
                      <Check className="h-4 w-4 text-status-green" />
                    ) : row.basic === "some" ? (
                      <span className="text-xs text-status-amber font-medium">Some</span>
                    ) : (
                      <X className="h-4 w-4 text-status-red" />
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-amber-500/5 rounded-lg px-2 py-1.5 border border-amber-500/20">
                    <span className="text-xs text-amber-400 font-medium">ShieldSDS</span>
                    {row.shield === "yes" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-status-green" />
                        {row.shieldNote && (
                          <span className="text-xs text-status-green font-medium">{row.shieldNote}</span>
                        )}
                      </span>
                    ) : row.shield === "soon" ? (
                      <span className="text-xs text-amber-400 font-medium">Coming soon</span>
                    ) : (
                      <Check className="h-4 w-4 text-status-green" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF ========== */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              Built for Shops Like Yours
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="relative bg-navy-900 border border-navy-700/50 rounded-xl p-6"
              >
                <span className="absolute top-3 right-3 text-[10px] text-gray-600 bg-navy-800 px-2 py-0.5 rounded-full">
                  Preview
                </span>
                <MessageSquareQuote className="h-6 w-6 text-amber-400/40 mb-4" />
                <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  &mdash; {t.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== OSHA TABLE ========== */}
      <section id="osha" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              Every OSHA HazCom Requirement &mdash; Handled
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              You don&apos;t need to memorize the regulations. We built them into the system.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {oshaRows.map((row, i) => (
              <div
                key={i}
                className="bg-navy-900 border border-navy-700/50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-bold text-sm text-white">
                    {row.req}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap bg-navy-800 px-2 py-0.5 rounded">
                    {row.ref}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {row.means}
                </p>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-400/90 leading-relaxed">
                    {row.shield}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== INSPECTION MODE CALLOUT ========== */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-status-green/20 via-status-green/10 to-navy-900 border border-status-green/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              <div className="h-16 w-16 rounded-full bg-status-green/20 border-2 border-status-green flex items-center justify-center flex-shrink-0">
                <Eye className="h-8 w-8 text-status-green" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-white">Inspection Mode</h3>
                <p className="text-sm text-gray-300 mt-1 max-w-lg">
                  One-click compliance audit with weighted scoring across all 6 OSHA obligations.
                  See exactly where you stand, fix gaps with direct links, and export a complete audit packet.
                </p>
              </div>
            </div>
            <Link
              href="/inspection"
              className="flex items-center justify-center gap-2 bg-status-green/20 hover:bg-status-green/30 border border-status-green/40 text-status-green font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              Try It <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
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
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-400">
              Try it free. Set up takes 5 minutes. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <p className="text-center text-xs text-gray-500 mt-2">No credit card required</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section id="cta" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 mx-auto mb-6" />
          <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl mb-4">
            Ready to Stop Worrying?
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8">
            Set up your shop in 5 minutes. See your compliance score. Fix the gaps before someone else finds them.
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold px-8 py-3.5 rounded-lg transition-colors text-base sm:text-lg w-full sm:w-auto"
          >
            Set Up My Shop &mdash; Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4">
            <button
              onClick={handleViewDemo}
              className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-white font-semibold text-sm transition-colors"
            >
              Or explore the demo first <ArrowRight className="h-4 w-4" />
            </button>
          </p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-navy-700/50 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
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
    </div>
  );
}
