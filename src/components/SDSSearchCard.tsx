"use client";

import { Lock, ExternalLink, Plus, Printer } from "lucide-react";
import GHSPictogram from "@/components/GHSPictogram";
import type { SDSRecord } from "@/lib/supabase";
import Link from "next/link";

interface SDSSearchCardProps {
  chemical: SDSRecord;
  isPaidUser: boolean;
  onUnlockClick: () => void;
  onAddToInventory?: (chemical: SDSRecord) => void;
}

const TAG_COLORS: Record<string, string> = {
  "auto-body": "bg-blue-100 text-blue-700",
  construction: "bg-orange-100 text-orange-700",
  janitorial: "bg-green-100 text-green-700",
  manufacturing: "bg-purple-100 text-purple-700",
  restaurant: "bg-red-100 text-red-700",
  automotive: "bg-cyan-100 text-cyan-700",
  general: "bg-gray-100 text-gray-700",
};

export default function SDSSearchCard({
  chemical,
  isPaidUser,
  onUnlockClick,
  onAddToInventory,
}: SDSSearchCardProps) {
  const signalColor =
    chemical.signal_word?.toLowerCase() === "danger"
      ? "bg-red-600 text-white"
      : chemical.signal_word?.toLowerCase() === "warning"
        ? "bg-amber-500 text-white"
        : "";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {chemical.product_name}
          </h3>
          {chemical.manufacturer && (
            <p className="text-sm text-gray-500 mt-0.5">{chemical.manufacturer}</p>
          )}
        </div>
        {chemical.signal_word && signalColor && (
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${signalColor}`}>
            {chemical.signal_word}
          </span>
        )}
      </div>

      {/* GHS Pictograms — always visible (eye-catching, proves value) */}
      {chemical.pictogram_codes && chemical.pictogram_codes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chemical.pictogram_codes.map((code) => (
            <GHSPictogram key={code} code={code} size={40} />
          ))}
        </div>
      )}

      {/* Industry tags */}
      {chemical.industry_tags && chemical.industry_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chemical.industry_tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${TAG_COLORS[tag] || "bg-gray-100 text-gray-600"}`}
            >
              {tag.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Hazard Statements */}
      {chemical.hazard_statements && chemical.hazard_statements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Hazard Statements
          </p>
          {/* First statement always visible */}
          <p className="text-sm text-gray-700">{chemical.hazard_statements[0]}</p>
          {chemical.hazard_statements.length > 1 && (
            isPaidUser ? (
              <div className="mt-1 space-y-0.5">
                {chemical.hazard_statements.slice(1).map((h, i) => (
                  <p key={i} className="text-sm text-gray-700">{h}</p>
                ))}
              </div>
            ) : (
              <button
                onClick={onUnlockClick}
                className="mt-1 inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Lock className="h-3 w-3" />
                Sign up to see all {chemical.hazard_statements.length} hazard statements
              </button>
            )
          )}
        </div>
      )}

      {/* CAS Numbers — locked for free users */}
      {chemical.cas_numbers && chemical.cas_numbers.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            CAS Numbers
          </p>
          {isPaidUser ? (
            <p className="text-sm text-gray-700 font-mono">
              {chemical.cas_numbers.join(", ")}
            </p>
          ) : (
            <div className="relative">
              <p
                className="text-sm text-gray-700 font-mono select-none"
                style={{ filter: "blur(4px)", pointerEvents: "none" }}
              >
                {chemical.cas_numbers.join(", ")}
              </p>
              <button
                onClick={onUnlockClick}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-white/80 px-2 py-1 rounded-full font-medium">
                  <Lock className="h-3 w-3" />
                  Sign up to view
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confidence */}
      <div className="mb-4">
        <p className="text-xs text-gray-400">
          Confidence: {Math.round(chemical.confidence * 100)}%
        </p>
      </div>

      {/* SDS Link / Action Buttons */}
      {isPaidUser ? (
        <div className="flex flex-wrap gap-2">
          {chemical.sds_url && (
            <a
              href={chemical.sds_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-semibold rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View SDS
            </a>
          )}
          {onAddToInventory && (
            <button
              onClick={() => onAddToInventory(chemical)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add to Inventory
            </button>
          )}
          <Link
            href="/labels"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Label
          </Link>
        </div>
      ) : (
        <div className="relative">
          <button
            className="w-full text-left select-none"
            style={{ filter: "blur(4px)", pointerEvents: "none" }}
            tabIndex={-1}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-navy-950 text-sm font-semibold rounded-lg">
              <ExternalLink className="h-4 w-4" />
              View Safety Data Sheet
            </span>
          </button>
          <button
            onClick={onUnlockClick}
            className="absolute inset-0 flex items-center"
          >
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 font-medium">
              <Lock className="h-4 w-4" />
              Sign up to access SDS documents
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
