"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navItems = [
  { label: "Scan Chemical", href: "/scan", icon: Camera, cta: true },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "HazCom Program", href: "/hazcom-program", icon: BookOpen },
  { label: "SDS Library", href: "/sds-library", icon: FileText },
  { label: "Chemical Inventory", href: "/inventory", icon: Package },
  { label: "Labels", href: "/labels", icon: Tags },
  { label: "Training", href: "/training", icon: GraduationCap },
  { label: "Contractors", href: "/contractors", icon: Users },
  { label: "Inspection Mode", href: "/inspection", icon: ClipboardCheck },
];

const locations = [
  { name: "Mike's Auto Body", sub: "Main Location", active: true },
  { name: "Mike's Auto Body", sub: "Warehouse", active: false },
  { name: "Mike's Auto Body", sub: "Mobile Unit", active: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [locOpen, setLocOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(locations[0]);
  const dropRef = useRef<HTMLDivElement>(null);

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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isCta = "cta" in item && item.cta;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isCta
                  ? "bg-amber-500 text-navy-950 font-bold hover:bg-amber-400 mb-2"
                  : isActive
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-gray-300 hover:text-white hover:bg-navy-800"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive && !isCta ? "text-amber-400" : ""}`} />
              {item.label}
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
            MR
          </div>
          <div>
            <p className="text-sm font-medium text-white">Mike Rodriguez</p>
            <p className="text-xs text-gray-400">Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
