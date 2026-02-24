"use client";

import { ExternalLink, Mail, Globe } from "lucide-react";

interface SDSFetchHelperProps {
  manufacturer: string;
  productName: string;
  productCode: string;
}

const manufacturerPortals: Record<string, { name: string; url: string; sdsUrl: string }> = {
  "PPG Industries": {
    name: "PPG Refinish",
    url: "https://us.ppgrefinish.com",
    sdsUrl: "https://us.ppgrefinish.com/safety-data-sheets",
  },
  "Axalta Coating Systems": {
    name: "Axalta Coatings",
    url: "https://www.axalta.com",
    sdsUrl: "https://www.axalta.com/us/en_US/safety-data-sheets.html",
  },
  "BASF Coatings": {
    name: "BASF Refinish",
    url: "https://www.basfrefinish.com",
    sdsUrl: "https://www.basf.com/us/en/legal/sds-search.html",
  },
  "CRC Industries": {
    name: "CRC Industries",
    url: "https://www.crcindustries.com",
    sdsUrl: "https://www.crcindustries.com/sds",
  },
  "Klean-Strip": {
    name: "Klean-Strip (W.M. Barr)",
    url: "https://www.kleanstrip.com",
    sdsUrl: "https://www.kleanstrip.com/safety-data-sheets",
  },
  "3M Company": {
    name: "3M SDS Portal",
    url: "https://www.3m.com",
    sdsUrl: "https://www.3m.com/3M/en_US/company-us/SDS-search/",
  },
  "3M / Bondo": {
    name: "3M SDS Portal",
    url: "https://www.3m.com",
    sdsUrl: "https://www.3m.com/3M/en_US/company-us/SDS-search/",
  },
  "Evercoat (ITW)": {
    name: "Evercoat (ITW)",
    url: "https://www.evercoat.com",
    sdsUrl: "https://www.evercoat.com/sds",
  },
  "SEM Products": {
    name: "SEM Products",
    url: "https://www.semproducts.com",
    sdsUrl: "https://www.semproducts.com/sds",
  },
  "Meguiar's Inc.": {
    name: "Meguiar's",
    url: "https://www.meguiars.com",
    sdsUrl: "https://www.meguiars.com/professional/support/safety-data-sheets",
  },
  "WD-40 Company": {
    name: "WD-40",
    url: "https://www.wd40.com",
    sdsUrl: "https://www.wd40.com/safety-data-sheets/",
  },
  "Zep, Inc.": {
    name: "Zep SDS Portal",
    url: "https://www.zep.com",
    sdsUrl: "https://www.zep.com/sds",
  },
  "Rust-Oleum Corporation": {
    name: "Rust-Oleum",
    url: "https://www.rustoleum.com",
    sdsUrl: "https://www.rustoleum.com/safety-data-sheets",
  },
  "Sunshine Makers, Inc.": {
    name: "Simple Green",
    url: "https://www.simplegreen.com",
    sdsUrl: "https://www.simplegreen.com/resources/sds/",
  },
  "U-POL Ltd": {
    name: "U-POL",
    url: "https://www.u-pol.com",
    sdsUrl: "https://www.u-pol.com/us/en/technical-data-sheets",
  },
  "Prestone Products": {
    name: "Prestone",
    url: "https://www.prestone.com",
    sdsUrl: "https://www.prestone.com/safety-data-sheets/",
  },
  "Aiken Chemical Company": {
    name: "Purple Power",
    url: "https://www.purplepower.com",
    sdsUrl: "https://www.purplepower.com/sds",
  },
  "Wurth USA": {
    name: "Wurth USA",
    url: "https://www.wurthaus.com",
    sdsUrl: "https://www.wurthaus.com/sds",
  },
};

export default function SDSFetchHelper({ manufacturer, productName, productCode }: SDSFetchHelperProps) {
  const portal = manufacturerPortals[manufacturer];

  const emailSubject = `SDS Request: ${productName} (${productCode})`;
  const emailBody = `Dear ${manufacturer} Safety Department,

We are writing to request the current Safety Data Sheet (SDS) for:

Product: ${productName}
Product Code: ${productCode}
Our Company: Mike's Auto Body
Address: 1847 Pacific Coast Hwy, Long Beach, CA 90806
Contact: Mike Rodriguez — (562) 555-0147

Per OSHA 29 CFR 1910.1200, we are required to maintain current SDS for all hazardous chemicals in our workplace. Please send the most recent revision at your earliest convenience.

Thank you,
Mike Rodriguez
Mike's Auto Body`;

  const emailAddr = `safety@${manufacturer.toLowerCase().replace(/[^a-z]/g, "")}.com`;

  return (
    <div className="bg-navy-800/50 border border-navy-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        No PDF uploaded — Get SDS from manufacturer
      </p>

      {portal && (
        <div className="flex items-center gap-3">
          <a
            href={portal.sdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {portal.name} SDS Portal
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </a>
        </div>
      )}

      <a
        href={`mailto:${emailAddr}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs px-3 py-2 rounded-lg transition-colors w-fit"
      >
        <Mail className="h-3.5 w-3.5" />
        Request from Manufacturer
      </a>

      <p className="text-[10px] text-gray-500">
        Search for &quot;{productCode}&quot; on the manufacturer portal, or use the email button to send an OSHA-compliant SDS request.
      </p>
    </div>
  );
}
