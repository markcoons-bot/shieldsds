"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";

interface HelpCardProps {
  title?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function HelpCard({
  title = "Why This Matters",
  defaultOpen = false,
  children,
}: HelpCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 overflow-hidden print:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-400">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-amber-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
