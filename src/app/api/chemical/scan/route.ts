import { NextRequest, NextResponse } from "next/server";
import { lookupSDS } from "@/lib/supabase";

// ══════════════════════════════════════════════════════════
// KNOWN CHEMICALS DATABASE
// ══════════════════════════════════════════════════════════

interface KnownChemical {
  product_name: string;
  manufacturer: string;
  signal_word: "DANGER" | "WARNING" | null;
  pictogram_codes: string[];
  hazard_statements: { code: string; text: string }[];
  precautionary_statements: {
    prevention: { code: string; text: string }[];
    response: { code: string; text: string }[];
    storage: { code: string; text: string }[];
    disposal: { code: string; text: string }[];
  };
  first_aid: {
    eyes: string | null;
    skin: string | null;
    inhalation: string | null;
    ingestion: string | null;
  };
  ppe_required: {
    eyes: string | null;
    hands: string | null;
    respiratory: string | null;
    body: string | null;
  };
  physical_properties: {
    appearance: string | null;
    odor: string | null;
    flash_point: string | null;
    ph: string | null;
    boiling_point: string | null;
    vapor_pressure: string | null;
  };
  storage_requirements: string;
  incompatible_materials: string[];
  cas_numbers: string[];
  un_number: string | null;
  nfpa_diamond: {
    health: number;
    fire: number;
    reactivity: number;
    special: string | null;
  } | null;
}

const KNOWN_CHEMICALS: KnownChemical[] = [
  // 1. CRC Brakleen
  {
    product_name: "CRC Brakleen Brake Parts Cleaner",
    manufacturer: "CRC Industries",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H222", text: "Extremely flammable aerosol" },
      { code: "H229", text: "Pressurized container: May burst if heated" },
      { code: "H304", text: "May be fatal if swallowed and enters airways" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P211", text: "Do not spray on an open flame or other ignition source." },
        { code: "P251", text: "Do not pierce or burn, even after use." },
        { code: "P261", text: "Avoid breathing spray." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      response: [
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
        { code: "P331", text: "Do NOT induce vomiting." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [
        { code: "P403+P235", text: "Store in a well-ventilated place. Keep cool." },
        { code: "P410+P412", text: "Protect from sunlight. Do not expose to temperatures exceeding 50\u00b0C/122\u00b0F." },
      ],
      disposal: [
        { code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." },
      ],
    },
    first_aid: {
      eyes: "Rinse cautiously with water for at least 15 minutes. Remove contact lenses if present. Seek medical attention if irritation persists.",
      skin: "Remove contaminated clothing. Wash skin thoroughly with soap and water. Seek medical attention if irritation develops.",
      inhalation: "Move to fresh air immediately. If breathing is difficult, administer oxygen. Call a physician if symptoms persist.",
      ingestion: "Do NOT induce vomiting. Rinse mouth with water. Call a POISON CENTER or doctor immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Nitrile gloves, minimum 8 mil thickness",
      respiratory: "Use in well-ventilated area. If ventilation inadequate, use NIOSH-approved organic vapor respirator.",
      body: "Chemical-resistant apron recommended for prolonged use",
    },
    physical_properties: {
      appearance: "Clear, colorless liquid",
      odor: "Mild ketone/ester odor",
      flash_point: "-4\u00b0F (-20\u00b0C)",
      ph: null,
      boiling_point: "133\u00b0F (56\u00b0C)",
      vapor_pressure: "184 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, well-ventilated area away from ignition sources. Keep container tightly closed. Store away from oxidizers.",
    incompatible_materials: ["Strong oxidizers", "Strong acids", "Strong bases"],
    cas_numbers: ["67-64-1", "141-78-6"],
    un_number: "UN1950",
    nfpa_diamond: { health: 1, fire: 3, reactivity: 0, special: null },
  },

  // 2. Simple Green
  {
    product_name: "Simple Green All-Purpose Cleaner",
    manufacturer: "Sunshine Makers, Inc.",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P270", text: "Do not eat, drink or smoke when using this product." },
        { code: "P280", text: "Wear eye protection." },
      ],
      response: [
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P330", text: "Rinse mouth." },
      ],
      storage: [{ code: "P405", text: "Store locked up." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for 15-20 minutes. Seek medical attention if irritation continues.",
      skin: "Rinse with water. Generally non-irritating to skin.",
      inhalation: "Move to fresh air. Not expected to be an inhalation hazard.",
      ingestion: "Rinse mouth. Drink a glass of water. Contact physician if discomfort occurs.",
    },
    ppe_required: {
      eyes: "Safety glasses (ANSI Z87.1) recommended",
      hands: "Rubber or nitrile gloves for prolonged use",
      respiratory: "None required under normal use conditions",
      body: null,
    },
    physical_properties: {
      appearance: "Green liquid",
      odor: "Mild, sassafras-like",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "8.5-9.5",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: "17 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store at room temperature in original container. Keep out of reach of children. Protect from freezing.",
    incompatible_materials: ["Strong oxidizers"],
    cas_numbers: ["111-76-2"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },

  // 3. Acetone
  {
    product_name: "Acetone Technical Grade",
    manufacturer: "Klean-Strip",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P233", text: "Keep container tightly closed." },
        { code: "P240", text: "Ground and bond container and receiving equipment." },
        { code: "P241", text: "Use explosion-proof electrical/ventilating/lighting equipment." },
        { code: "P280", text: "Wear protective gloves/eye protection/face protection." },
      ],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P337+P313", text: "If eye irritation persists: Get medical advice/attention." },
      ],
      storage: [{ code: "P403+P235", text: "Store in a well-ventilated place. Keep cool." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with plenty of water for at least 15 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Prolonged contact may cause drying/cracking.",
      inhalation: "Move to fresh air. If dizziness occurs, lie down and rest. Seek medical attention if symptoms persist.",
      ingestion: "Rinse mouth. Do NOT induce vomiting. Get medical attention.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Nitrile gloves (acetone degrades latex \u2014 do NOT use latex gloves)",
      respiratory: "Organic vapor respirator if above PEL (750 ppm TWA). Use in well-ventilated area.",
      body: "Chemical-resistant apron for large-volume handling",
    },
    physical_properties: {
      appearance: "Clear, colorless liquid",
      odor: "Sweet, pungent, mint-like odor",
      flash_point: "-4\u00b0F (-20\u00b0C)",
      ph: "7 (neutral)",
      boiling_point: "133\u00b0F (56.1\u00b0C)",
      vapor_pressure: "184 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in tightly closed containers in cool, dry, well-ventilated area. Keep away from heat, sparks, open flame. Flammable liquid storage cabinet recommended.",
    incompatible_materials: ["Strong oxidizers", "Strong acids", "Strong bases", "Amines", "Chloroform"],
    cas_numbers: ["67-64-1"],
    un_number: "UN1090",
    nfpa_diamond: { health: 1, fire: 3, reactivity: 0, special: null },
  },

  // 4. WD-40
  {
    product_name: "WD-40 Multi-Use Product",
    manufacturer: "WD-40 Company",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H222", text: "Extremely flammable aerosol" },
      { code: "H229", text: "Pressurized container: May burst if heated" },
      { code: "H304", text: "May be fatal if swallowed and enters airways" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P211", text: "Do not spray on an open flame or other ignition source." },
        { code: "P251", text: "Do not pierce or burn, even after use." },
        { code: "P261", text: "Avoid breathing vapors/spray." },
      ],
      response: [
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
        { code: "P331", text: "Do NOT induce vomiting." },
      ],
      storage: [{ code: "P410+P412", text: "Protect from sunlight. Do not expose to temperatures exceeding 50\u00b0C/122\u00b0F." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for at least 15 minutes. If irritation persists, get medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call a POISON CENTER immediately.",
    },
    ppe_required: {
      eyes: "Safety glasses with side shields (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile)",
      respiratory: "Use with adequate ventilation. Organic vapor respirator if mist is generated.",
      body: null,
    },
    physical_properties: {
      appearance: "Light amber liquid with petroleum odor",
      odor: "Mild petroleum odor",
      flash_point: "122\u00b0F (50\u00b0C) (liquid); propellant flash point much lower",
      ph: null,
      boiling_point: "361\u00b0F (183\u00b0C)",
      vapor_pressure: "60 psi @ 70\u00b0F (propellant)",
    },
    storage_requirements: "Store in cool, dry area. Do not store above 120\u00b0F. Protect from sunlight. Keep away from heat and ignition sources.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    cas_numbers: ["64742-47-8"],
    un_number: "UN1950",
    nfpa_diamond: { health: 1, fire: 2, reactivity: 0, special: null },
  },

  // 5. 3M Super 77
  {
    product_name: "3M Super 77 Multipurpose Spray Adhesive",
    manufacturer: "3M Company",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS04", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H222", text: "Extremely flammable aerosol" },
      { code: "H229", text: "Pressurized container: May burst if heated" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      { code: "H304", text: "May be fatal if swallowed and enters airways" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P211", text: "Do not spray on an open flame or other ignition source." },
        { code: "P251", text: "Do not pierce or burn, even after use." },
        { code: "P261", text: "Avoid breathing spray." },
      ],
      response: [
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
        { code: "P331", text: "Do NOT induce vomiting." },
      ],
      storage: [{ code: "P410+P412", text: "Protect from sunlight. Do not expose to temperatures exceeding 50\u00b0C/122\u00b0F." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with large amounts of water. If irritation persists, get medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      inhalation: "Move person to fresh air. If you feel unwell, call a POISON CENTER/doctor.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call a POISON CENTER immediately.",
    },
    ppe_required: {
      eyes: "Safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile gloves",
      respiratory: "Use with adequate ventilation. NIOSH-approved organic vapor respirator if ventilation is poor.",
      body: "No special body protection required for normal use",
    },
    physical_properties: {
      appearance: "Aerosol spray, clear to light yellow",
      odor: "Petroleum solvent odor",
      flash_point: "-156\u00b0F (-104\u00b0C) (propellant)",
      ph: null,
      boiling_point: "95\u00b0F (35\u00b0C)",
      vapor_pressure: ">250 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, well-ventilated area. Do not expose to temperatures above 122\u00b0F. Protect from sunlight. Keep away from ignition sources.",
    incompatible_materials: ["Strong oxidizers", "Heat sources"],
    cas_numbers: ["75-28-5", "67-64-1", "142-82-5"],
    un_number: "UN1950",
    nfpa_diamond: { health: 1, fire: 4, reactivity: 0, special: null },
  },

  // 6. PPG DBC Basecoat
  {
    product_name: "PPG DBC Basecoat",
    manufacturer: "PPG Industries",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      { code: "H304", text: "May be fatal if swallowed and enters airways" },
      { code: "H372", text: "Causes damage to organs through prolonged or repeated exposure" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P233", text: "Keep container tightly closed." },
        { code: "P240", text: "Ground and bond container and receiving equipment." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      response: [
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      storage: [
        { code: "P403+P235", text: "Store in a well-ventilated place. Keep cool." },
        { code: "P405", text: "Store locked up." },
      ],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush eyes with water for at least 15 minutes, lifting upper and lower eyelids. Get medical attention.",
      skin: "Remove contaminated clothing. Wash with soap and water. If irritation persists, get medical attention.",
      inhalation: "Move to fresh air. If not breathing, give artificial respiration. Get medical attention immediately.",
      ingestion: "Do NOT induce vomiting. Get medical attention immediately. Aspiration hazard.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles or safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile or butyl rubber gloves",
      respiratory: "NIOSH-approved organic vapor respirator with P100 particulate filter. Use supplied-air respirator in confined spaces.",
      body: "Paint suit or chemical-resistant coveralls. Use in spray booth with proper ventilation.",
    },
    physical_properties: {
      appearance: "Pigmented liquid (various colors)",
      odor: "Strong solvent odor",
      flash_point: "27\u00b0F (-3\u00b0C)",
      ph: null,
      boiling_point: "133\u00b0F (56\u00b0C)",
      vapor_pressure: "170 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, dry, well-ventilated area away from heat, sparks, and open flame. Keep containers tightly closed and grounded. Store between 60-80\u00b0F.",
    incompatible_materials: ["Strong oxidizers", "Strong acids", "Amines", "Alkalis"],
    cas_numbers: ["67-64-1", "123-86-4", "110-43-0"],
    un_number: "UN1263",
    nfpa_diamond: { health: 2, fire: 3, reactivity: 0, special: null },
  },

  // 7. Bondo Body Filler
  {
    product_name: "Bondo Body Filler",
    manufacturer: "3M / Bondo",
    signal_word: "WARNING",
    pictogram_codes: ["GHS02", "GHS07"],
    hazard_statements: [
      { code: "H226", text: "Flammable liquid and vapor" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H317", text: "May cause an allergic skin reaction" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H332", text: "Harmful if inhaled" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P261", text: "Avoid breathing dust/fume/gas/mist/vapors/spray." },
        { code: "P272", text: "Contaminated work clothing should not be allowed out of the workplace." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection." },
      ],
      response: [
        { code: "P302+P352", text: "IF ON SKIN: Wash with plenty of water." },
        { code: "P333+P313", text: "If skin irritation or rash occurs: Get medical advice/attention." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [{ code: "P403+P235", text: "Store in a well-ventilated place. Keep cool." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for 15 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Remove contaminated clothing. If allergic reaction develops, seek medical attention.",
      inhalation: "Move to fresh air. If breathing difficulty persists, seek medical attention.",
      ingestion: "Rinse mouth with water. Do not induce vomiting. Seek medical attention if significant amount ingested.",
    },
    ppe_required: {
      eyes: "Safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile gloves. Avoid skin contact \u2014 styrene is a sensitizer.",
      respiratory: "Use in well-ventilated area. Dust mask (N95) when sanding cured filler. Organic vapor respirator if ventilation is inadequate.",
      body: "Work clothing that covers arms. Disposable coveralls when sanding.",
    },
    physical_properties: {
      appearance: "Gray/tan paste",
      odor: "Styrene odor",
      flash_point: "88\u00b0F (31\u00b0C)",
      ph: null,
      boiling_point: "293\u00b0F (145\u00b0C) (styrene)",
      vapor_pressure: "5 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, dry area between 60-80\u00b0F. Keep container closed. Keep hardener separate. Shelf life approximately 2 years unopened.",
    incompatible_materials: ["Peroxides (hardener) \u2014 store separately", "Strong oxidizers", "Strong acids"],
    cas_numbers: ["100-42-5", "14807-96-6", "13397-24-5"],
    un_number: null,
    nfpa_diamond: { health: 2, fire: 2, reactivity: 1, special: null },
  },

  // 8. Zep Heavy-Duty Degreaser
  {
    product_name: "Zep Heavy-Duty Citrus Degreaser",
    manufacturer: "Zep Inc.",
    signal_word: "DANGER",
    pictogram_codes: ["GHS05", "GHS07"],
    hazard_statements: [
      { code: "H314", text: "Causes severe skin burns and eye damage" },
      { code: "H318", text: "Causes serious eye damage" },
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H317", text: "May cause an allergic skin reaction" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P260", text: "Do not breathe mist/vapors/spray." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      response: [
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P310", text: "Immediately call a POISON CENTER/doctor." },
      ],
      storage: [{ code: "P405", text: "Store locked up." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Immediately flush with plenty of water for at least 20 minutes. Get medical attention immediately \u2014 corrosive product.",
      skin: "Immediately flush with water for at least 20 minutes. Remove all contaminated clothing. Get medical attention.",
      inhalation: "Move to fresh air. If breathing difficulty occurs, seek medical attention.",
      ingestion: "Do NOT induce vomiting. Rinse mouth. Immediately call a POISON CENTER or doctor. Corrosive \u2014 may cause internal burns.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles AND face shield (ANSI Z87.1) \u2014 product is corrosive",
      hands: "Chemical-resistant gloves (butyl rubber or neoprene, minimum 14 mil)",
      respiratory: "NIOSH-approved respirator if mist is generated.",
      body: "Chemical-resistant apron. Full body protection for large spill cleanup.",
    },
    physical_properties: {
      appearance: "Yellow-orange liquid",
      odor: "Strong citrus odor",
      flash_point: "138\u00b0F (59\u00b0C)",
      ph: "11.5-12.5",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: "17 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in original container in a cool, dry, locked area. Keep away from metals \u2014 corrosive to aluminum and zinc. Separate from acids and oxidizers.",
    incompatible_materials: ["Strong acids", "Strong oxidizers", "Aluminum", "Zinc", "Tin", "Reactive metals"],
    cas_numbers: ["5989-27-5", "68439-46-3", "111-76-2"],
    un_number: null,
    nfpa_diamond: { health: 3, fire: 1, reactivity: 0, special: null },
  },

  // 9. Meguiar's D120 APC
  {
    product_name: "Meguiar's D120 All Purpose Cleaner Plus",
    manufacturer: "Meguiar's Inc.",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P280", text: "Wear protective gloves/eye protection." },
      ],
      response: [
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
        { code: "P302+P352", text: "IF ON SKIN: Wash with plenty of water." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [{ code: "P405", text: "Store locked up." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with plenty of water for at least 15 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Get medical advice if irritation develops.",
      inhalation: "Move to fresh air. Not typically a concern at room temperature.",
      ingestion: "Rinse mouth. Drink 1-2 glasses of water. Do not induce vomiting. Call a physician.",
    },
    ppe_required: {
      eyes: "Safety glasses (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile or rubber)",
      respiratory: "None required under normal use conditions",
      body: null,
    },
    physical_properties: {
      appearance: "Purple liquid",
      odor: "Mild, pleasant",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "12.0-13.0",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: "17 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store at room temperature. Keep container closed. Protect from freezing.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    cas_numbers: ["111-76-2", "68439-46-3"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },

  // 10. Rust-Oleum Primer
  {
    product_name: "Rust-Oleum Professional Primer Spray",
    manufacturer: "Rust-Oleum Corporation",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS04", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H222", text: "Extremely flammable aerosol" },
      { code: "H229", text: "Pressurized container: May burst if heated" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      { code: "H351", text: "Suspected of causing cancer (inhalation)" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P201", text: "Obtain special instructions before use." },
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P211", text: "Do not spray on an open flame or other ignition source." },
        { code: "P280", text: "Wear protective gloves/eye protection/face protection." },
      ],
      response: [
        { code: "P308+P313", text: "IF exposed or concerned: Get medical advice/attention." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [{ code: "P410+P412", text: "Protect from sunlight. Do not expose to temperatures exceeding 50\u00b0C/122\u00b0F." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush immediately with water for at least 15 minutes. Seek medical attention.",
      skin: "Remove contaminated clothing. Wash skin with soap and water.",
      inhalation: "Move to fresh air immediately. If breathing difficulty occurs, give oxygen and get medical attention.",
      ingestion: "Do NOT induce vomiting. Seek immediate medical attention.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile)",
      respiratory: "NIOSH-approved organic vapor respirator with particulate pre-filter. Required in poorly ventilated areas.",
      body: "Protective clothing to prevent skin contact. Use in spray booth with proper ventilation.",
    },
    physical_properties: {
      appearance: "Gray aerosol spray",
      odor: "Solvent odor",
      flash_point: "-156\u00b0F (-104\u00b0C) (propellant)",
      ph: null,
      boiling_point: "133\u00b0F (56\u00b0C)",
      vapor_pressure: ">250 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, well-ventilated area. Do not store above 120\u00b0F. Protect from sunlight. Keep away from ignition sources.",
    incompatible_materials: ["Strong oxidizers", "Strong acids", "Open flames"],
    cas_numbers: ["67-64-1", "68476-86-8", "13463-67-7"],
    un_number: "UN1950",
    nfpa_diamond: { health: 2, fire: 4, reactivity: 0, special: null },
  },

  // 11. Purple Power Degreaser
  {
    product_name: "Purple Power Industrial Strength Degreaser",
    manufacturer: "Aiken Chemical Company",
    signal_word: "DANGER",
    pictogram_codes: ["GHS05", "GHS07"],
    hazard_statements: [
      { code: "H314", text: "Causes severe skin burns and eye damage" },
      { code: "H302", text: "Harmful if swallowed" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P260", text: "Do not breathe mist/vapors." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      response: [
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P310", text: "Immediately call a POISON CENTER/doctor." },
      ],
      storage: [{ code: "P405", text: "Store locked up." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Immediately flush with large amounts of water for at least 20 minutes. Get emergency medical attention.",
      skin: "Flush immediately with water for 15-20 minutes. Remove contaminated clothing. Get medical attention.",
      inhalation: "Move to fresh air. If breathing is difficult, seek medical attention.",
      ingestion: "Do NOT induce vomiting. Rinse mouth. Drink water or milk. Call a POISON CENTER immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles and face shield (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (neoprene or butyl rubber)",
      respiratory: "NIOSH-approved respirator if mist is generated",
      body: "Chemical-resistant apron",
    },
    physical_properties: {
      appearance: "Purple liquid",
      odor: "Mild chemical odor",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "12.5-13.5",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: "17 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in original container. Keep from freezing. Store away from acids. Keep out of reach of children.",
    incompatible_materials: ["Strong acids", "Oxidizers", "Aluminum", "Zinc"],
    cas_numbers: ["1310-73-2", "111-76-2"],
    un_number: null,
    nfpa_diamond: { health: 3, fire: 0, reactivity: 0, special: null },
  },

  // 12. Gojo Hand Cleaner
  {
    product_name: "GOJO Natural Orange Pumice Hand Cleaner",
    manufacturer: "GOJO Industries",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [{ code: "P264", text: "Wash hands thoroughly after handling." }],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P337+P313", text: "If eye irritation persists: Get medical advice/attention." },
      ],
      storage: [],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for at least 15 minutes. If irritation persists, consult a physician.",
      skin: "Rinse with water. Product is designed for skin contact but may cause irritation with prolonged exposure.",
      inhalation: "Not expected to be an inhalation hazard under normal use.",
      ingestion: "Rinse mouth. Drink water. Call physician if large amount is ingested.",
    },
    ppe_required: {
      eyes: "Not required for normal hand washing use. Safety glasses for industrial dispensing.",
      hands: null,
      respiratory: null,
      body: null,
    },
    physical_properties: {
      appearance: "Orange lotion with pumice particles",
      odor: "Citrus/orange fragrance",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "5.0-7.0",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: null,
    },
    storage_requirements: "Store at room temperature. Protect from freezing and extreme heat.",
    incompatible_materials: ["Strong oxidizers"],
    cas_numbers: ["5989-27-5"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },

  // 13. Dawn Dish Soap
  {
    product_name: "Dawn Ultra Dishwashing Liquid",
    manufacturer: "Procter & Gamble",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [{ code: "P264", text: "Wash hands thoroughly after handling." }],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P337+P313", text: "If eye irritation persists: Get medical advice/attention." },
      ],
      storage: [],
      disposal: [],
    },
    first_aid: {
      eyes: "Rinse with water for several minutes. If irritation persists, consult a physician.",
      skin: "Rinse with water. May cause dryness with repeated exposure.",
      inhalation: "Not applicable under normal use conditions.",
      ingestion: "Drink a glass of water or milk. Call a physician or poison control center if symptoms occur.",
    },
    ppe_required: {
      eyes: "Not required for household use. Safety glasses for industrial/commercial dispensing.",
      hands: "Rubber gloves recommended for prolonged exposure or sensitive skin",
      respiratory: null,
      body: null,
    },
    physical_properties: {
      appearance: "Blue viscous liquid",
      odor: "Pleasant fragrance",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "8.0-9.0",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: null,
    },
    storage_requirements: "Store at room temperature. Keep container closed when not in use.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    cas_numbers: ["68585-34-2"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },

  // 14. Clorox Bleach
  {
    product_name: "Clorox Regular Bleach",
    manufacturer: "The Clorox Company",
    signal_word: "DANGER",
    pictogram_codes: ["GHS05", "GHS07", "GHS09"],
    hazard_statements: [
      { code: "H314", text: "Causes severe skin burns and eye damage" },
      { code: "H318", text: "Causes serious eye damage" },
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H332", text: "Harmful if inhaled" },
      { code: "H400", text: "Very toxic to aquatic life" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P260", text: "Do not breathe vapors/mist." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P273", text: "Avoid release to the environment." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      response: [
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P310", text: "Immediately call a POISON CENTER/doctor." },
      ],
      storage: [{ code: "P405", text: "Store locked up." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Immediately flush with plenty of water for at least 15-20 minutes. Get medical attention immediately.",
      skin: "Remove contaminated clothing immediately. Flush skin with water for 15-20 minutes. Get medical attention.",
      inhalation: "Move to fresh air. If breathing is difficult, give oxygen. Seek medical attention.",
      ingestion: "Do NOT induce vomiting. Rinse mouth with water. Drink water or milk. Call POISON CENTER immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Rubber or nitrile gloves",
      respiratory: "Use in well-ventilated area. Chlorine gas may be released if mixed with acids or ammonia.",
      body: "Chemical-resistant apron for large quantities",
    },
    physical_properties: {
      appearance: "Clear, pale yellow liquid",
      odor: "Chlorine odor",
      flash_point: "None (non-flammable)",
      ph: "11.9",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: "17 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store upright in cool, dry area away from direct sunlight. NEVER mix with ammonia, acids, or other cleaners. Keep out of reach of children.",
    incompatible_materials: ["Ammonia", "Acids", "Other household cleaners", "Metals", "Reducing agents"],
    cas_numbers: ["7681-52-9"],
    un_number: "UN1791",
    nfpa_diamond: { health: 2, fire: 0, reactivity: 1, special: "OX" },
  },

  // 15. Windex
  {
    product_name: "Windex Original Glass Cleaner",
    manufacturer: "SC Johnson",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P261", text: "Avoid breathing mist/spray." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
      ],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [],
      disposal: [],
    },
    first_aid: {
      eyes: "Flush with water for 15-20 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water.",
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      ingestion: "Rinse mouth. Drink water. Call Poison Control if symptoms occur.",
    },
    ppe_required: {
      eyes: "Safety glasses if spraying overhead or in enclosed spaces",
      hands: "Not required for normal use",
      respiratory: "Use with adequate ventilation",
      body: null,
    },
    physical_properties: {
      appearance: "Blue liquid",
      odor: "Mild ammonia odor",
      flash_point: ">100\u00b0F (>38\u00b0C)",
      ph: "10.0-10.5",
      boiling_point: "207\u00b0F (97\u00b0C)",
      vapor_pressure: "18 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store at room temperature. Keep out of reach of children.",
    incompatible_materials: ["Bleach (sodium hypochlorite)", "Strong acids"],
    cas_numbers: ["67-63-0", "111-76-2"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 1, reactivity: 0, special: null },
  },

  // 16. Lysol Disinfectant
  {
    product_name: "Lysol Disinfectant Spray",
    manufacturer: "Reckitt Benckiser",
    signal_word: "WARNING",
    pictogram_codes: ["GHS02", "GHS07"],
    hazard_statements: [
      { code: "H222", text: "Extremely flammable aerosol" },
      { code: "H229", text: "Pressurized container: May burst if heated" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P211", text: "Do not spray on an open flame or other ignition source." },
        { code: "P251", text: "Do not pierce or burn, even after use." },
      ],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [{ code: "P410+P412", text: "Protect from sunlight. Do not expose to temperatures exceeding 50\u00b0C/122\u00b0F." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for 15-20 minutes. If irritation persists, get medical attention.",
      skin: "Wash with soap and water. If irritation develops, get medical advice.",
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      ingestion: "Rinse mouth. Drink water. Call Poison Control.",
    },
    ppe_required: {
      eyes: "Safety glasses for prolonged or industrial use",
      hands: "Not required for normal household use",
      respiratory: "Use with adequate ventilation. Avoid prolonged inhalation of spray.",
      body: null,
    },
    physical_properties: {
      appearance: "Aerosol spray mist",
      odor: "Characteristic fragrance",
      flash_point: "-156\u00b0F (-104\u00b0C) (propellant)",
      ph: "6.0-8.0 (diluted)",
      boiling_point: null,
      vapor_pressure: "40-50 psi",
    },
    storage_requirements: "Store at room temperature below 120\u00b0F. Do not puncture or incinerate. Protect from sunlight.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    cas_numbers: ["67-63-0"],
    un_number: "UN1950",
    nfpa_diamond: { health: 1, fire: 3, reactivity: 0, special: null },
  },

  // 17. Gorilla Glue
  {
    product_name: "Gorilla Glue Original",
    manufacturer: "The Gorilla Glue Company",
    signal_word: "WARNING",
    pictogram_codes: ["GHS07", "GHS08"],
    hazard_statements: [
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H332", text: "Harmful if inhaled" },
      { code: "H334", text: "May cause allergy or asthma symptoms or breathing difficulties if inhaled" },
      { code: "H317", text: "May cause an allergic skin reaction" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P261", text: "Avoid breathing vapors." },
        { code: "P272", text: "Contaminated work clothing should not be allowed out of the workplace." },
        { code: "P280", text: "Wear protective gloves/eye protection." },
        { code: "P284", text: "In case of inadequate ventilation, wear respiratory protection." },
      ],
      response: [
        { code: "P302+P352", text: "IF ON SKIN: Wash with plenty of water." },
        { code: "P304+P340", text: "IF INHALED: Remove person to fresh air and keep at rest in a comfortable position for breathing." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
        { code: "P342+P311", text: "If experiencing respiratory symptoms: Call a POISON CENTER/doctor." },
      ],
      storage: [{ code: "P403+P233", text: "Store in a well-ventilated place. Keep container tightly closed." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for at least 15 minutes. Do not rub. Cured adhesive on skin around eyes may be removed with petroleum jelly. Seek medical attention.",
      skin: "Do not pull bonded skin apart. Soak in warm soapy water and gently peel apart. Acetone may help dissolve uncured adhesive.",
      inhalation: "Move to fresh air. If breathing difficulty develops, seek medical attention. Individuals with asthma may be more sensitive.",
      ingestion: "Do NOT induce vomiting. Product foams and expands in moist environments. Seek immediate medical attention.",
    },
    ppe_required: {
      eyes: "Safety glasses (ANSI Z87.1)",
      hands: "Disposable nitrile gloves. Adhesive bonds skin rapidly.",
      respiratory: "Use with adequate ventilation. Organic vapor respirator for prolonged use.",
      body: "Protective clothing to prevent skin contact",
    },
    physical_properties: {
      appearance: "Brown/amber viscous liquid",
      odor: "Slight chemical odor",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: null,
      boiling_point: ">392\u00b0F (>200\u00b0C)",
      vapor_pressure: "<0.01 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, dry area. Keep container tightly closed \u2014 moisture causes curing. Do not freeze. Use within 12 months of opening.",
    incompatible_materials: ["Water (causes foaming/curing)", "Alcohols", "Amines"],
    cas_numbers: ["9009-54-5"],
    un_number: null,
    nfpa_diamond: { health: 2, fire: 1, reactivity: 1, special: null },
  },

  // 18. DAP Caulk
  {
    product_name: "DAP Alex Plus All Purpose Acrylic Latex Caulk",
    manufacturer: "DAP Global Inc.",
    signal_word: null,
    pictogram_codes: [],
    hazard_statements: [],
    precautionary_statements: {
      prevention: [{ code: "P264", text: "Wash hands thoroughly after handling." }],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for 15 minutes. If irritation persists, seek medical advice.",
      skin: "Wash with soap and water. Product may be difficult to remove once cured.",
      inhalation: "Move to fresh air if mild irritation occurs. Not a significant hazard.",
      ingestion: "Rinse mouth. Drink water. Seek medical advice if large amount ingested.",
    },
    ppe_required: {
      eyes: "Safety glasses when using overhead",
      hands: "Disposable gloves recommended to keep hands clean",
      respiratory: "Ensure adequate ventilation. Not normally required.",
      body: null,
    },
    physical_properties: {
      appearance: "White/off-white paste",
      odor: "Mild acrylic odor",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "8.0-9.0",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: null,
    },
    storage_requirements: "Store between 40-100\u00b0F. Protect from freezing. Keep container sealed when not in use.",
    incompatible_materials: ["Strong oxidizers"],
    cas_numbers: ["65997-15-1"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },

  // 19. Kilz Primer
  {
    product_name: "KILZ Original Multi-Surface Primer",
    manufacturer: "Masterchem Industries (KILZ)",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H304", text: "May be fatal if swallowed and enters airways" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
    ],
    precautionary_statements: {
      prevention: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P233", text: "Keep container tightly closed." },
        { code: "P280", text: "Wear protective gloves/eye protection." },
      ],
      response: [
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
        { code: "P331", text: "Do NOT induce vomiting." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [{ code: "P403+P235", text: "Store in a well-ventilated place. Keep cool." }],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for at least 15 minutes. Get medical attention.",
      skin: "Remove contaminated clothing. Wash skin thoroughly with soap and water.",
      inhalation: "Move to fresh air. If symptoms persist, get medical attention.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call a POISON CENTER or doctor immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile)",
      respiratory: "NIOSH-approved organic vapor respirator. Ensure adequate ventilation during application.",
      body: "Protective clothing. Chemical-resistant apron for large jobs.",
    },
    physical_properties: {
      appearance: "White liquid",
      odor: "Strong solvent odor (mineral spirits)",
      flash_point: "105\u00b0F (41\u00b0C)",
      ph: null,
      boiling_point: "300-400\u00b0F (149-204\u00b0C)",
      vapor_pressure: "2-5 mmHg @ 20\u00b0C",
    },
    storage_requirements: "Store in cool, well-ventilated area. Keep away from heat, sparks, and open flames. Keep container tightly closed.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    cas_numbers: ["64742-88-7", "8052-41-3"],
    un_number: "UN1263",
    nfpa_diamond: { health: 2, fire: 2, reactivity: 0, special: null },
  },

  // 20. Sherwin-Williams ProMar 200
  {
    product_name: "Sherwin-Williams ProMar 200 Interior Latex Flat",
    manufacturer: "Sherwin-Williams",
    signal_word: null,
    pictogram_codes: [],
    hazard_statements: [],
    precautionary_statements: {
      prevention: [
        { code: "P262", text: "Do not get in eyes, on skin, or on clothing." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
      ],
      response: [
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing." },
      ],
      storage: [],
      disposal: [{ code: "P501", text: "Dispose of contents/container in accordance with local/regional/national regulations." }],
    },
    first_aid: {
      eyes: "Flush with water for 15 minutes. If irritation persists, seek medical attention.",
      skin: "Wash with soap and water. Remove dried paint with waterless hand cleaner.",
      inhalation: "Move to fresh air. Ensure adequate ventilation when painting in enclosed areas.",
      ingestion: "Rinse mouth. Drink water. Call a physician if symptoms develop.",
    },
    ppe_required: {
      eyes: "Safety glasses for overhead or spray application",
      hands: "Latex or nitrile gloves to keep hands clean",
      respiratory: "Not required for brush/roller application with adequate ventilation. NIOSH-approved respirator for spray application.",
      body: null,
    },
    physical_properties: {
      appearance: "White/off-white liquid (tintable)",
      odor: "Low odor, mild",
      flash_point: ">200\u00b0F (>93\u00b0C)",
      ph: "8.5-9.5",
      boiling_point: "212\u00b0F (100\u00b0C)",
      vapor_pressure: null,
    },
    storage_requirements: "Store between 50-90\u00b0F. Protect from freezing. Keep container tightly closed. Store in dry area.",
    incompatible_materials: ["Strong oxidizers"],
    cas_numbers: ["13463-67-7", "1317-65-3"],
    un_number: null,
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
  },
];

// ══════════════════════════════════════════════════════════
// FUZZY MATCHING
// ══════════════════════════════════════════════════════════

function fuzzyMatch(
  aiName: string,
  knownName: string
): boolean {
  const a = aiName.toLowerCase().trim();
  const b = knownName.toLowerCase().trim();

  // Direct containment
  if (a.includes(b) || b.includes(a)) return true;

  // Shared words (3+)
  const aWords = a.split(/\s+/).filter((w) => w.length > 2);
  const bWords = b.split(/\s+/).filter((w) => w.length > 2);
  let shared = 0;
  for (const w of aWords) {
    if (bWords.some((bw) => bw.includes(w) || w.includes(bw))) shared++;
  }
  return shared >= 3;
}

function findKnownChemical(productName: string): KnownChemical | null {
  for (const known of KNOWN_CHEMICALS) {
    if (fuzzyMatch(productName, known.product_name)) return known;
  }
  return null;
}

// ══════════════════════════════════════════════════════════
// MERGE: known DB base + AI extraction overrides
// ══════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeResults(known: KnownChemical, ai: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged: Record<string, any> = { ...known };

  // AI overrides non-empty/non-null fields
  for (const key of Object.keys(ai)) {
    const val = ai[key];
    if (val === null || val === undefined) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === "string" && val.trim() === "") continue;

    // For nested objects, merge field-by-field
    if (typeof val === "object" && !Array.isArray(val) && typeof merged[key] === "object" && merged[key] !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mergedObj: Record<string, any> = { ...merged[key] };
      for (const subKey of Object.keys(val)) {
        const subVal = val[subKey];
        if (subVal !== null && subVal !== undefined) {
          if (Array.isArray(subVal) && subVal.length === 0) continue;
          if (typeof subVal === "string" && subVal.trim() === "") continue;
          mergedObj[subKey] = subVal;
        }
      }
      merged[key] = mergedObj;
    } else {
      merged[key] = val;
    }
  }

  return merged;
}

// ══════════════════════════════════════════════════════════
// ROUTE HANDLER
// ══════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mimeType } = body as { image: string; mimeType: string };
    const imageRaw = (body as { image: string }).image;

    if (!imageRaw || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType in request body" },
        { status: 400 }
      );
    }

    // Strip data URI prefix aggressively (data:image/jpeg;base64, or data:image/png;base64,)
    const cleanBase64 = imageRaw.replace(/^data:image\/\w+;base64,/, "");
    // Also handle if there's still a comma (other formats)
    const imageBase64 = cleanBase64.includes(",") ? cleanBase64.split(",")[1] : cleanBase64;

    console.log("[scan] Image base64 length:", imageBase64.length, "mimeType:", mimeType);

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[scan] ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    // Call Claude Vision API
    console.log("[scan] Calling Claude Vision API...");
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `You are a GHS chemical label data extraction system for workplace safety compliance. Analyze this product label photo and extract ALL visible information.

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):
{
  "product_name": "Full product name as printed on label",
  "manufacturer": "Company name",
  "signal_word": "DANGER" or "WARNING" or null,
  "pictogram_codes": ["GHS02", "GHS07"],
  "hazard_statements": [{"code": "H226", "text": "Flammable liquid and vapor"}],
  "precautionary_statements": {
    "prevention": [{"code": "P210", "text": "Keep away from heat/sparks/open flames"}],
    "response": [{"code": "P301+P310", "text": "IF SWALLOWED: Call poison center"}],
    "storage": [{"code": "P403", "text": "Store in well-ventilated place"}],
    "disposal": [{"code": "P501", "text": "Dispose per local regulations"}]
  },
  "first_aid": {
    "eyes": "Flush with water for 15 minutes...",
    "skin": "Remove contaminated clothing, wash with soap...",
    "inhalation": "Move to fresh air...",
    "ingestion": "Do not induce vomiting, call poison center..."
  },
  "ppe_required": {
    "eyes": "Chemical splash goggles",
    "hands": "Nitrile gloves",
    "respiratory": "Half-face respirator with OV cartridge",
    "body": "Chemical-resistant apron"
  },
  "physical_properties": {
    "appearance": "Clear liquid",
    "odor": "Solvent-like",
    "flash_point": "-4°F (-20°C)",
    "ph": null,
    "boiling_point": "104°F (40°C)",
    "vapor_pressure": "175 mmHg at 68°F"
  },
  "storage_requirements": "Cool, well-ventilated area away from ignition sources",
  "incompatible_materials": ["Strong oxidizers", "Strong acids"],
  "cas_numbers": ["67-64-1"],
  "un_number": "UN1090",
  "nfpa_diamond": {"health": 2, "fire": 3, "reactivity": 0, "special": null},
  "confidence": 0.95,
  "fields_uncertain": ["flash_point"]
}

Rules:
- Extract ONLY what is visible on the label. Do not invent data.
- If a field is not visible, set it to null or empty array.
- For pictograms, use standard GHS codes: GHS01 (Exploding Bomb), GHS02 (Flame), GHS03 (Flame Over Circle), GHS04 (Gas Cylinder), GHS05 (Corrosion), GHS06 (Skull & Crossbones), GHS07 (Exclamation Mark), GHS08 (Health Hazard), GHS09 (Environment).
- Set confidence between 0 and 1 based on label clarity and completeness.
- List any fields you're uncertain about in fields_uncertain.`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text();
      console.error("[scan] Claude API error — status:", claudeResponse.status);
      console.error("[scan] Claude API error — body:", errBody);

      if (claudeResponse.status === 401) {
        return NextResponse.json(
          { error: "Invalid ANTHROPIC_API_KEY. Check your API key in .env.local." },
          { status: 500 }
        );
      }
      if (claudeResponse.status === 400) {
        return NextResponse.json(
          { error: `Bad request to AI service: ${errBody.substring(0, 200)}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `AI service error (${claudeResponse.status}). Please try again.` },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();

    // Extract text content from Claude's response
    let textContent = "";
    for (const block of claudeData.content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }

    console.log("[scan] Raw Claude response text:", textContent.substring(0, 500));

    // Aggressively strip markdown code fences
    let cleaned = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Extract JSON substring: find first { and last }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    console.log("[scan] Cleaned text for parsing:", cleaned.substring(0, 500));

    // Parse JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aiResult: Record<string, any>;
    try {
      aiResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[scan] JSON parse error:", parseErr);
      console.error("[scan] Full cleaned text that failed to parse:", cleaned);
      return NextResponse.json(
        { error: "Failed to parse AI response. Try a clearer photo." },
        { status: 500 }
      );
    }

    console.log("[scan] Parsed AI result — product_name:", aiResult.product_name);
    console.log("[scan] Parsed AI result — manufacturer:", aiResult.manufacturer, "| signal_word:", aiResult.signal_word);
    console.log("[scan] Parsed AI result — keys:", Object.keys(aiResult).join(", "));
    console.log("[scan] Parsed AI result — hazard_statements:", aiResult.hazard_statements?.length ?? 0, "| pictograms:", aiResult.pictogram_codes?.length ?? 0);
    console.log("[scan] Parsed AI result — confidence:", aiResult.confidence);
    console.log("[scan] Parsed AI result — first_aid:", JSON.stringify(aiResult.first_aid)?.substring(0, 200));
    console.log("[scan] Parsed AI result — ppe_required:", JSON.stringify(aiResult.ppe_required)?.substring(0, 200));

    // Fuzzy match against known chemicals
    const productName = aiResult.product_name || "";
    const knownMatch = findKnownChemical(productName);
    if (knownMatch) {
      console.log("[scan] Matched known chemical:", knownMatch.product_name);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalResult: Record<string, any>;
    if (knownMatch) {
      // Merge: known as base, AI overrides where it found data
      finalResult = mergeResults(knownMatch, aiResult);
    } else {
      finalResult = aiResult;
    }

    // Ensure confidence and fields_uncertain exist
    if (!finalResult.confidence) finalResult.confidence = aiResult.confidence ?? 0.5;
    if (!finalResult.fields_uncertain) finalResult.fields_uncertain = aiResult.fields_uncertain ?? [];

    console.log("[scan] Final result — product_name:", finalResult.product_name, "| manufacturer:", finalResult.manufacturer);
    console.log("[scan] Final result — signal_word:", finalResult.signal_word, "| pictograms:", finalResult.pictogram_codes?.length ?? 0, "| hazards:", finalResult.hazard_statements?.length ?? 0);
    console.log("[scan] Final result — confidence:", finalResult.confidence);
    console.log("[scan] Final result JSON (first 1000 chars):", JSON.stringify(finalResult).substring(0, 1000));

    // ── Auto SDS Lookup (check Supabase first, then API fallback) ──────────
    const productNameForLookup = finalResult.product_name || "";
    const manufacturerForLookup = finalResult.manufacturer || "";

    if (productNameForLookup && manufacturerForLookup) {
      // Step 1: Check Supabase cache (fast, free)
      let supabaseHit = false;
      try {
        const cached = await lookupSDS(productNameForLookup, manufacturerForLookup);
        if (cached && cached.confidence > 0.5 && cached.sds_url) {
          console.log("[scan] Supabase cache HIT for SDS:", productNameForLookup, "→", cached.sds_url);
          finalResult.sds_lookup_result = {
            sds_url: cached.sds_url,
            sds_source: cached.sds_source || "ShieldSDS Database",
            manufacturer_sds_portal: cached.manufacturer_sds_portal || null,
            confidence: cached.confidence,
            notes: "Found in ShieldSDS shared database (cached)",
          };
          finalResult.sds_url = cached.sds_url;
          finalResult.sds_status = "current";
          finalResult.sds_uploaded = true;
          if (cached.manufacturer_sds_portal) {
            finalResult.manufacturer_sds_portal = cached.manufacturer_sds_portal;
          }
          supabaseHit = true;
        }
      } catch (cacheErr) {
        console.log("[scan] Supabase lookup failed:", cacheErr instanceof Error ? cacheErr.message : "unknown");
      }

      // Step 2: Fall back to API route if Supabase missed
      if (!supabaseHit) {
        try {
          console.log("[scan] Supabase cache MISS — calling sds-lookup API for:", productNameForLookup);
          const origin = request.nextUrl.origin;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const sdsRes = await fetch(`${origin}/api/chemical/sds-lookup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_name: productNameForLookup,
              manufacturer: manufacturerForLookup,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (sdsRes.ok) {
            const sdsData = await sdsRes.json();
            console.log("[scan] SDS lookup result:", JSON.stringify(sdsData).substring(0, 300));
            finalResult.sds_lookup_result = sdsData;

            if (sdsData.sds_url && (sdsData.confidence ?? 0) > 0.7) {
              finalResult.sds_url = sdsData.sds_url;
              finalResult.sds_status = "current";
              finalResult.sds_uploaded = true;
              console.log("[scan] SDS auto-linked:", sdsData.sds_url);
            } else {
              finalResult.sds_status = "missing";
              if (sdsData.manufacturer_sds_portal) {
                finalResult.manufacturer_sds_portal = sdsData.manufacturer_sds_portal;
              }
            }
          } else {
            console.log("[scan] SDS lookup failed with status:", sdsRes.status);
            finalResult.sds_lookup_result = null;
          }
        } catch (sdsErr) {
          console.log("[scan] SDS lookup timed out or errored:", sdsErr instanceof Error ? sdsErr.message : "unknown");
          finalResult.sds_lookup_result = null;
        }
      }
    }

    return NextResponse.json(finalResult);
  } catch (err) {
    console.error("[scan] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
