import type {
  Chemical,
  Employee,
  Location,
  TrainingRecord,
  LabelRecord,
} from "./types";

// ── Storage Keys ──────────────────────────────────────────
const KEYS = {
  chemicals: "shieldsds-chemicals",
  employees: "shieldsds-employees",
  locations: "shieldsds-locations",
  trainingRecords: "shieldsds-training-records",
  labels: "shieldsds-labels",
} as const;

// ── Helpers ───────────────────────────────────────────────
function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error(`[ShieldSDS] Failed to write to localStorage key: ${key}`);
  }
}

function genId(): string {
  return crypto.randomUUID();
}

// ══════════════════════════════════════════════════════════
// CHEMICALS
// ══════════════════════════════════════════════════════════
export function getChemicals(): Chemical[] {
  return readStore<Chemical>(KEYS.chemicals);
}

export function getChemical(id: string): Chemical | null {
  return getChemicals().find((c) => c.id === id) ?? null;
}

export function addChemical(chemical: Omit<Chemical, "id">): Chemical {
  const entry: Chemical = { ...chemical, id: genId() };
  const all = getChemicals();
  all.push(entry);
  writeStore(KEYS.chemicals, all);
  return entry;
}

export function updateChemical(
  id: string,
  updates: Partial<Chemical>
): Chemical | null {
  const all = getChemicals();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, id };
  writeStore(KEYS.chemicals, all);
  return all[idx];
}

export function deleteChemical(id: string): boolean {
  const all = getChemicals();
  const filtered = all.filter((c) => c.id !== id);
  if (filtered.length === all.length) return false;
  writeStore(KEYS.chemicals, filtered);
  return true;
}

// ══════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════
export function getEmployees(): Employee[] {
  return readStore<Employee>(KEYS.employees);
}

export function getEmployee(id: string): Employee | null {
  return getEmployees().find((e) => e.id === id) ?? null;
}

export function addEmployee(employee: Omit<Employee, "id">): Employee {
  const entry: Employee = { ...employee, id: genId() };
  const all = getEmployees();
  all.push(entry);
  writeStore(KEYS.employees, all);
  return entry;
}

export function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Employee | null {
  const all = getEmployees();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, id };
  writeStore(KEYS.employees, all);
  return all[idx];
}

// ══════════════════════════════════════════════════════════
// LOCATIONS
// ══════════════════════════════════════════════════════════
export function getLocations(): Location[] {
  return readStore<Location>(KEYS.locations);
}

export function addLocation(location: Omit<Location, "id">): Location {
  const entry: Location = { ...location, id: genId() };
  const all = getLocations();
  all.push(entry);
  writeStore(KEYS.locations, all);
  return entry;
}

// ══════════════════════════════════════════════════════════
// TRAINING RECORDS
// ══════════════════════════════════════════════════════════
export function getTrainingRecords(): TrainingRecord[] {
  return readStore<TrainingRecord>(KEYS.trainingRecords);
}

export function addTrainingRecord(
  record: Omit<TrainingRecord, "id">
): TrainingRecord {
  const entry: TrainingRecord = { ...record, id: genId() };
  const all = getTrainingRecords();
  all.push(entry);
  writeStore(KEYS.trainingRecords, all);
  return entry;
}

export function getRecordsByEmployee(employeeId: string): TrainingRecord[] {
  return getTrainingRecords().filter((r) => r.employee_id === employeeId);
}

// ══════════════════════════════════════════════════════════
// LABEL RECORDS
// ══════════════════════════════════════════════════════════
export function getLabelRecords(): LabelRecord[] {
  return readStore<LabelRecord>(KEYS.labels);
}

export function addLabelRecord(record: Omit<LabelRecord, "id">): LabelRecord {
  const entry: LabelRecord = { ...record, id: genId() };
  const all = getLabelRecords();
  all.push(entry);
  writeStore(KEYS.labels, all);
  return entry;
}

// ══════════════════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════════════════

const SEED_EMPLOYEES: Omit<Employee, "id">[] = [
  {
    // UP TO DATE: all 7 modules, trained ~3 months ago
    name: "Mike Rodriguez",
    role: "Owner / Manager",
    initial_training: "2024-01-15",
    last_training: "2025-11-25",
    status: "current",
    completed_modules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
    pending_modules: [],
  },
  {
    // DUE SOON: all 7 modules, trained ~11 months ago (due in ~30 days)
    name: "Carlos Mendez",
    role: "Body Tech",
    initial_training: "2024-03-22",
    last_training: "2025-03-20",
    status: "current",
    completed_modules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
    pending_modules: [],
  },
  {
    // OVERDUE: trained ~14 months ago, only 3 of 7 on current cycle
    name: "Marcus Thompson",
    role: "Painter",
    initial_training: "2024-06-10",
    last_training: "2024-12-15",
    status: "overdue",
    completed_modules: ["m1", "m2", "m3"],
    pending_modules: ["m4", "m5", "m6", "m7"],
  },
  {
    // NOT STARTED: new hire, no training
    name: "Jamie Reyes",
    role: "Detail Tech (New Hire)",
    initial_training: null,
    last_training: null,
    status: "pending",
    completed_modules: [],
    pending_modules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
  },
  {
    // UP TO DATE: all 7 modules, trained ~6 months ago
    name: "David Park",
    role: "Mechanic",
    initial_training: "2024-08-05",
    last_training: "2025-08-15",
    status: "current",
    completed_modules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
    pending_modules: [],
  },
];

const SEED_CHEMICALS: Omit<Chemical, "id">[] = [
  // ── 1. CRC Brakleen ────────────────────────────────────
  {
    product_name: "CRC Brakleen Brake Parts Cleaner",
    manufacturer: "CRC Industries",
    cas_numbers: ["67-64-1", "141-78-6"],
    un_number: "UN1993",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H304",
        text: "May be fatal if swallowed and enters airways",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P261",
          text: "Avoid breathing dust/fume/gas/mist/vapors/spray.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/protective clothing/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P301+P310",
          text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor.",
        },
        {
          code: "P331",
          text: "Do NOT induce vomiting.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
      ],
      storage: [
        {
          code: "P403+P235",
          text: "Store in a well-ventilated place. Keep cool.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Rinse cautiously with water for at least 15 minutes. Remove contact lenses if present. Seek medical attention if irritation persists.",
      skin: "Remove contaminated clothing. Wash skin thoroughly with soap and water. Seek medical attention if irritation develops.",
      inhalation:
        "Move to fresh air immediately. If breathing is difficult, administer oxygen. Call a physician if symptoms persist.",
      ingestion:
        "Do NOT induce vomiting. Rinse mouth with water. Call a POISON CENTER or doctor immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Nitrile gloves, minimum 8 mil thickness",
      respiratory:
        "Use in well-ventilated area. If ventilation inadequate, use NIOSH-approved organic vapor respirator.",
      body: "Chemical-resistant apron recommended for prolonged use",
    },
    storage_requirements:
      "Store in cool, well-ventilated area away from ignition sources. Keep container tightly closed. Store away from oxidizers.",
    incompatible_materials: [
      "Strong oxidizers",
      "Strong acids",
      "Strong bases",
    ],
    physical_properties: {
      appearance: "Clear, colorless liquid",
      odor: "Mild ketone/ester odor",
      flash_point: "-4°F (-20°C)",
      ph: null,
      boiling_point: "133°F (56°C)",
      vapor_pressure: "184 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 1, fire: 3, reactivity: 0, special: null },
    location: "Bay 2 Mechanical",
    container_type: "Aerosol Can",
    container_count: 6,
    labeled: true,
    label_printed_date: "2025-11-15",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-03-01",
    sds_status: "current",
    added_date: "2025-08-10",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-01-15",
  },

  // ── 2. PPG DBC Basecoat White ──────────────────────────
  {
    product_name: "PPG DBC Basecoat White",
    manufacturer: "PPG Industries",
    cas_numbers: ["67-64-1", "123-86-4", "110-43-0"],
    un_number: "UN1263",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H304",
        text: "May be fatal if swallowed and enters airways",
      },
      {
        code: "H372",
        text: "Causes damage to organs through prolonged or repeated exposure",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P233",
          text: "Keep container tightly closed.",
        },
        {
          code: "P240",
          text: "Ground and bond container and receiving equipment.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/protective clothing/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P303+P361+P353",
          text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
        {
          code: "P301+P310",
          text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor.",
        },
      ],
      storage: [
        {
          code: "P403+P235",
          text: "Store in a well-ventilated place. Keep cool.",
        },
        {
          code: "P405",
          text: "Store locked up.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush eyes with water for at least 15 minutes, lifting upper and lower eyelids. Get medical attention.",
      skin: "Remove contaminated clothing. Wash with soap and water. If irritation persists, get medical attention.",
      inhalation:
        "Move to fresh air. If not breathing, give artificial respiration. Get medical attention immediately.",
      ingestion:
        "Do NOT induce vomiting. Get medical attention immediately. Aspiration hazard.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles or safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile or butyl rubber gloves",
      respiratory:
        "NIOSH-approved organic vapor respirator with P100 particulate filter. Use supplied-air respirator in confined spaces.",
      body: "Paint suit or chemical-resistant coveralls. Use in spray booth with proper ventilation.",
    },
    storage_requirements:
      "Store in cool, dry, well-ventilated area away from heat, sparks, and open flame. Keep containers tightly closed and grounded. Store between 60-80°F.",
    incompatible_materials: [
      "Strong oxidizers",
      "Strong acids",
      "Amines",
      "Alkalis",
    ],
    physical_properties: {
      appearance: "White pigmented liquid",
      odor: "Solvent odor",
      flash_point: "27°F (-3°C)",
      ph: null,
      boiling_point: "133°F (56°C)",
      vapor_pressure: "170 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 2, fire: 3, reactivity: 0, special: null },
    location: "Paint Mixing Room",
    container_type: "Quart Can",
    container_count: 4,
    labeled: true,
    label_printed_date: "2025-12-01",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-06-15",
    sds_status: "current",
    added_date: "2025-09-01",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-02-10",
  },

  // ── 3. PPG DBC Basecoat Black ──────────────────────────
  {
    product_name: "PPG DBC Basecoat Black",
    manufacturer: "PPG Industries",
    cas_numbers: ["67-64-1", "123-86-4", "1333-86-4"],
    un_number: "UN1263",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07", "GHS08"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H304",
        text: "May be fatal if swallowed and enters airways",
      },
      {
        code: "H351",
        text: "Suspected of causing cancer (inhalation)",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P201",
          text: "Obtain special instructions before use.",
        },
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/protective clothing/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P303+P361+P353",
          text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower.",
        },
        {
          code: "P308+P313",
          text: "IF exposed or concerned: Get medical advice/attention.",
        },
      ],
      storage: [
        {
          code: "P403+P235",
          text: "Store in a well-ventilated place. Keep cool.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush eyes with water for at least 15 minutes. Get medical attention.",
      skin: "Remove contaminated clothing. Wash thoroughly with soap and water.",
      inhalation:
        "Move to fresh air. If not breathing, give artificial respiration. Get medical attention.",
      ingestion:
        "Do NOT induce vomiting. Call a POISON CENTER or doctor immediately.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Nitrile or butyl rubber gloves",
      respiratory:
        "NIOSH-approved organic vapor respirator with P100 particulate filter",
      body: "Paint suit or chemical-resistant coveralls",
    },
    storage_requirements:
      "Store in cool, dry, well-ventilated area. Keep away from heat, sparks, and open flame. Ground all containers.",
    incompatible_materials: ["Strong oxidizers", "Strong acids", "Amines"],
    physical_properties: {
      appearance: "Black pigmented liquid",
      odor: "Solvent odor",
      flash_point: "27°F (-3°C)",
      ph: null,
      boiling_point: "133°F (56°C)",
      vapor_pressure: "170 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 2, fire: 3, reactivity: 0, special: null },
    location: "Paint Mixing Room",
    container_type: "Quart Can",
    container_count: 3,
    labeled: true,
    label_printed_date: "2025-12-01",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-06-15",
    sds_status: "current",
    added_date: "2025-09-01",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-02-10",
  },

  // ── 4. 3M Super 77 Spray Adhesive ─────────────────────
  {
    product_name: "3M Super 77 Multipurpose Spray Adhesive",
    manufacturer: "3M Company",
    cas_numbers: ["75-28-5", "67-64-1", "142-82-5"],
    un_number: "UN1950",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS04", "GHS07", "GHS08"],
    hazard_statements: [
      {
        code: "H222",
        text: "Extremely flammable aerosol",
      },
      {
        code: "H229",
        text: "Pressurized container: May burst if heated",
      },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H304",
        text: "May be fatal if swallowed and enters airways",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P211",
          text: "Do not spray on an open flame or other ignition source.",
        },
        {
          code: "P251",
          text: "Do not pierce or burn, even after use.",
        },
        {
          code: "P261",
          text: "Avoid breathing spray.",
        },
      ],
      response: [
        {
          code: "P301+P310",
          text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor.",
        },
        {
          code: "P331",
          text: "Do NOT induce vomiting.",
        },
      ],
      storage: [
        {
          code: "P410+P412",
          text: "Protect from sunlight. Do not expose to temperatures exceeding 50°C/122°F.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush with large amounts of water. If irritation persists, get medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing. If skin irritation occurs, get medical advice.",
      inhalation:
        "Move person to fresh air. If you feel unwell, call a POISON CENTER/doctor.",
      ingestion:
        "Do NOT induce vomiting. Call a POISON CENTER or doctor immediately. Aspiration hazard.",
    },
    ppe_required: {
      eyes: "Safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile gloves",
      respiratory:
        "Use with adequate ventilation. If ventilation is poor, use NIOSH-approved organic vapor respirator.",
      body: "No special body protection required for normal use",
    },
    storage_requirements:
      "Store in cool, well-ventilated area. Do not expose to temperatures above 122°F (50°C). Protect from sunlight. Keep away from ignition sources.",
    incompatible_materials: ["Strong oxidizers", "Heat sources"],
    physical_properties: {
      appearance: "Aerosol spray, clear to light yellow",
      odor: "Petroleum solvent odor",
      flash_point: "-156°F (-104°C) (propellant)",
      ph: null,
      boiling_point: "95°F (35°C)",
      vapor_pressure: ">250 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 1, fire: 4, reactivity: 0, special: null },
    location: "Bay 1 Body Work",
    container_type: "Aerosol Can",
    container_count: 3,
    labeled: true,
    label_printed_date: "2025-11-20",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-01-10",
    sds_status: "current",
    added_date: "2025-08-10",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-01-05",
  },

  // ── 5. Acetone Technical Grade ─────────────────────────
  {
    product_name: "Acetone Technical Grade",
    manufacturer: "Klean-Strip",
    cas_numbers: ["67-64-1"],
    un_number: "UN1090",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS07"],
    hazard_statements: [
      { code: "H225", text: "Highly flammable liquid and vapor" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H302",
        text: "Harmful if swallowed",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P233",
          text: "Keep container tightly closed.",
        },
        {
          code: "P240",
          text: "Ground and bond container and receiving equipment.",
        },
        {
          code: "P241",
          text: "Use explosion-proof electrical/ventilating/lighting equipment.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
        {
          code: "P337+P313",
          text: "If eye irritation persists: Get medical advice/attention.",
        },
      ],
      storage: [
        {
          code: "P403+P235",
          text: "Store in a well-ventilated place. Keep cool.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush with plenty of water for at least 15 minutes, lifting eyelids. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Prolonged contact may cause drying/cracking. Apply moisturizer.",
      inhalation:
        "Move to fresh air. If dizziness occurs, lie down and rest. Seek medical attention if symptoms persist.",
      ingestion:
        "Rinse mouth. Do NOT induce vomiting. Get medical attention.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Nitrile gloves (acetone degrades latex — do NOT use latex gloves)",
      respiratory:
        "Organic vapor respirator if above PEL (750 ppm TWA). Use in well-ventilated area.",
      body: "Chemical-resistant apron for large-volume handling",
    },
    storage_requirements:
      "Store in tightly closed containers in cool, dry, well-ventilated area. Keep away from heat, sparks, open flame. Ground all containers when transferring. Flammable liquid storage cabinet recommended.",
    incompatible_materials: [
      "Strong oxidizers",
      "Strong acids",
      "Strong bases",
      "Amines",
      "Chloroform",
    ],
    physical_properties: {
      appearance: "Clear, colorless liquid",
      odor: "Sweet, pungent, mint-like odor",
      flash_point: "-4°F (-20°C)",
      ph: "7 (neutral)",
      boiling_point: "133°F (56.1°C)",
      vapor_pressure: "184 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 1, fire: 3, reactivity: 0, special: null },
    location: "Paint Mixing Room",
    container_type: "Gallon Can",
    container_count: 2,
    labeled: true,
    label_printed_date: "2025-12-05",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2023-11-01",
    sds_status: "current",
    added_date: "2025-08-10",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-01-15",
  },

  // ── 6. Bondo Body Filler ───────────────────────────────
  {
    product_name: "Bondo Body Filler",
    manufacturer: "3M / Bondo",
    cas_numbers: ["100-42-5", "14807-96-6", "13397-24-5"],
    un_number: null,
    signal_word: "WARNING",
    pictogram_codes: ["GHS02", "GHS07"],
    hazard_statements: [
      {
        code: "H226",
        text: "Flammable liquid and vapor",
      },
      { code: "H315", text: "Causes skin irritation" },
      {
        code: "H317",
        text: "May cause an allergic skin reaction",
      },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H332", text: "Harmful if inhaled" },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P261",
          text: "Avoid breathing dust/fume/gas/mist/vapors/spray.",
        },
        {
          code: "P272",
          text: "Contaminated work clothing should not be allowed out of the workplace.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/protective clothing/eye protection.",
        },
      ],
      response: [
        {
          code: "P302+P352",
          text: "IF ON SKIN: Wash with plenty of water.",
        },
        {
          code: "P333+P313",
          text: "If skin irritation or rash occurs: Get medical advice/attention.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
      ],
      storage: [
        {
          code: "P403+P235",
          text: "Store in a well-ventilated place. Keep cool.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush with water for 15 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Remove contaminated clothing. If allergic reaction develops, seek medical attention.",
      inhalation:
        "Move to fresh air. If breathing difficulty persists, seek medical attention.",
      ingestion:
        "Rinse mouth with water. Do not induce vomiting. Seek medical attention if significant amount ingested.",
    },
    ppe_required: {
      eyes: "Safety glasses with side shields (ANSI Z87.1)",
      hands: "Nitrile gloves. Avoid skin contact — styrene is a sensitizer.",
      respiratory:
        "Use in well-ventilated area. Dust mask (N95) when sanding cured filler. Organic vapor respirator if ventilation is inadequate.",
      body: "Work clothing that covers arms. Disposable coveralls when sanding.",
    },
    storage_requirements:
      "Store in cool, dry area between 60-80°F. Keep container closed. Keep hardener separate. Shelf life approximately 2 years unopened.",
    incompatible_materials: [
      "Peroxides (hardener) — store separately",
      "Strong oxidizers",
      "Strong acids",
    ],
    physical_properties: {
      appearance: "Gray/tan paste",
      odor: "Styrene odor",
      flash_point: "88°F (31°C)",
      ph: null,
      boiling_point: "293°F (145°C) (styrene)",
      vapor_pressure: "5 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 2, fire: 2, reactivity: 1, special: null },
    location: "Bay 1 Body Work",
    container_type: "Quart Can",
    container_count: 2,
    labeled: true,
    label_printed_date: "2025-11-20",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-02-01",
    sds_status: "current",
    added_date: "2025-08-15",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2026-01-10",
  },

  // ── 7. Meguiar's D120 All Purpose Cleaner ──────────────
  {
    product_name: "Meguiar's D120 All Purpose Cleaner Plus",
    manufacturer: "Meguiar's Inc.",
    cas_numbers: ["111-76-2", "68439-46-3"],
    un_number: null,
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P264",
          text: "Wash hands thoroughly after handling.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/eye protection.",
        },
      ],
      response: [
        {
          code: "P301+P312",
          text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell.",
        },
        {
          code: "P302+P352",
          text: "IF ON SKIN: Wash with plenty of water.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
      ],
      storage: [
        {
          code: "P405",
          text: "Store locked up.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush with plenty of water for at least 15 minutes. Get medical attention if irritation persists.",
      skin: "Wash with soap and water. Get medical advice if irritation develops.",
      inhalation: "Move to fresh air. Not typically a concern at room temperature.",
      ingestion:
        "Rinse mouth. Drink 1-2 glasses of water. Do not induce vomiting. Call a physician.",
    },
    ppe_required: {
      eyes: "Safety glasses (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile or rubber)",
      respiratory: "None required under normal use conditions",
      body: null,
    },
    storage_requirements:
      "Store at room temperature. Keep container closed. Protect from freezing.",
    incompatible_materials: ["Strong oxidizers", "Strong acids"],
    physical_properties: {
      appearance: "Purple liquid",
      odor: "Mild, pleasant",
      flash_point: ">200°F (>93°C)",
      ph: "12.0-13.0",
      boiling_point: "212°F (100°C)",
      vapor_pressure: "17 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
    location: "Detail Bay",
    container_type: "Gallon Jug",
    container_count: 2,
    labeled: false,
    label_printed_date: null,
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2023-09-15",
    sds_status: "current",
    added_date: "2025-10-01",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2025-12-20",
  },

  // ── 8. Rust-Oleum Professional Primer ──────────────────
  {
    product_name: "Rust-Oleum Professional Primer Spray",
    manufacturer: "Rust-Oleum Corporation",
    cas_numbers: ["67-64-1", "68476-86-8", "13463-67-7"],
    un_number: "UN1950",
    signal_word: "DANGER",
    pictogram_codes: ["GHS02", "GHS04", "GHS07", "GHS08"],
    hazard_statements: [
      {
        code: "H222",
        text: "Extremely flammable aerosol",
      },
      {
        code: "H229",
        text: "Pressurized container: May burst if heated",
      },
      { code: "H315", text: "Causes skin irritation" },
      { code: "H319", text: "Causes serious eye irritation" },
      { code: "H336", text: "May cause drowsiness or dizziness" },
      {
        code: "H351",
        text: "Suspected of causing cancer (inhalation)",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P201",
          text: "Obtain special instructions before use.",
        },
        {
          code: "P210",
          text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        },
        {
          code: "P211",
          text: "Do not spray on an open flame or other ignition source.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P308+P313",
          text: "IF exposed or concerned: Get medical advice/attention.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
      ],
      storage: [
        {
          code: "P410+P412",
          text: "Protect from sunlight. Do not expose to temperatures exceeding 50°C/122°F.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush immediately with water for at least 15 minutes. Seek medical attention.",
      skin: "Remove contaminated clothing. Wash skin with soap and water.",
      inhalation:
        "Move to fresh air immediately. If breathing difficulty occurs, give oxygen and get medical attention.",
      ingestion:
        "Do NOT induce vomiting. Seek immediate medical attention.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles (ANSI Z87.1)",
      hands: "Chemical-resistant gloves (nitrile)",
      respiratory:
        "NIOSH-approved organic vapor respirator with particulate pre-filter. Required in poorly ventilated areas.",
      body: "Protective clothing to prevent skin contact. Use in spray booth with proper ventilation.",
    },
    storage_requirements:
      "Store in cool, well-ventilated area. Do not store above 120°F. Protect from sunlight. Keep away from ignition sources.",
    incompatible_materials: [
      "Strong oxidizers",
      "Strong acids",
      "Open flames",
    ],
    physical_properties: {
      appearance: "Gray aerosol spray",
      odor: "Solvent odor",
      flash_point: "-156°F (-104°C) (propellant)",
      ph: null,
      boiling_point: "133°F (56°C)",
      vapor_pressure: ">250 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 2, fire: 4, reactivity: 0, special: null },
    location: "Bay 1 Body Work",
    container_type: "Aerosol Can",
    container_count: 4,
    labeled: false,
    label_printed_date: null,
    sds_url: null,
    sds_uploaded: false,
    sds_date: null,
    sds_status: "missing",
    added_date: "2025-09-20",
    added_by: "Carlos Mendez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2025-12-01",
  },

  // ── 9. Simple Green All-Purpose Cleaner ────────────────
  {
    product_name: "Simple Green All-Purpose Cleaner",
    manufacturer: "Sunshine Makers, Inc.",
    cas_numbers: ["111-76-2"],
    un_number: null,
    signal_word: "WARNING",
    pictogram_codes: ["GHS07"],
    hazard_statements: [
      { code: "H302", text: "Harmful if swallowed" },
      { code: "H319", text: "Causes serious eye irritation" },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P264",
          text: "Wash hands thoroughly after handling.",
        },
        {
          code: "P270",
          text: "Do not eat, drink or smoke when using this product.",
        },
        {
          code: "P280",
          text: "Wear eye protection.",
        },
      ],
      response: [
        {
          code: "P301+P312",
          text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
        {
          code: "P330",
          text: "Rinse mouth.",
        },
      ],
      storage: [
        {
          code: "P405",
          text: "Store locked up.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Flush with water for 15-20 minutes. Seek medical attention if irritation continues.",
      skin: "Rinse with water. Generally non-irritating to skin.",
      inhalation:
        "Move to fresh air. Not expected to be an inhalation hazard.",
      ingestion:
        "Rinse mouth. Drink a glass of water. Contact physician if discomfort occurs.",
    },
    ppe_required: {
      eyes: "Safety glasses (ANSI Z87.1) recommended",
      hands: "Rubber or nitrile gloves for prolonged use",
      respiratory: "None required under normal use conditions",
      body: null,
    },
    storage_requirements:
      "Store at room temperature in original container. Keep out of reach of children. Protect from freezing.",
    incompatible_materials: ["Strong oxidizers"],
    physical_properties: {
      appearance: "Green liquid",
      odor: "Mild, sassafras-like",
      flash_point: ">200°F (>93°C)",
      ph: "8.5-9.5",
      boiling_point: "212°F (100°C)",
      vapor_pressure: "17 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 1, fire: 0, reactivity: 0, special: null },
    location: "Janitor Closet",
    container_type: "Gallon Jug",
    container_count: 1,
    labeled: true,
    label_printed_date: "2025-10-15",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2024-05-01",
    sds_status: "current",
    added_date: "2025-10-05",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2025-12-15",
  },

  // ── 10. Zep Heavy-Duty Citrus Degreaser ────────────────
  {
    product_name: "Zep Heavy-Duty Citrus Degreaser",
    manufacturer: "Zep Inc.",
    cas_numbers: ["5989-27-5", "68439-46-3", "111-76-2"],
    un_number: null,
    signal_word: "DANGER",
    pictogram_codes: ["GHS05", "GHS07"],
    hazard_statements: [
      {
        code: "H314",
        text: "Causes severe skin burns and eye damage",
      },
      {
        code: "H318",
        text: "Causes serious eye damage",
      },
      { code: "H302", text: "Harmful if swallowed" },
      {
        code: "H317",
        text: "May cause an allergic skin reaction",
      },
    ],
    precautionary_statements: {
      prevention: [
        {
          code: "P260",
          text: "Do not breathe mist/vapors/spray.",
        },
        {
          code: "P264",
          text: "Wash hands thoroughly after handling.",
        },
        {
          code: "P280",
          text: "Wear protective gloves/protective clothing/eye protection/face protection.",
        },
      ],
      response: [
        {
          code: "P301+P330+P331",
          text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting.",
        },
        {
          code: "P303+P361+P353",
          text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water/shower.",
        },
        {
          code: "P305+P351+P338",
          text: "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
        },
        {
          code: "P310",
          text: "Immediately call a POISON CENTER/doctor.",
        },
      ],
      storage: [
        {
          code: "P405",
          text: "Store locked up.",
        },
      ],
      disposal: [
        {
          code: "P501",
          text: "Dispose of contents/container in accordance with local/regional/national regulations.",
        },
      ],
    },
    first_aid: {
      eyes: "Immediately flush with plenty of water for at least 20 minutes. Get medical attention immediately — corrosive product.",
      skin: "Immediately flush with water for at least 20 minutes. Remove all contaminated clothing. Get medical attention.",
      inhalation:
        "Move to fresh air. If breathing difficulty occurs, seek medical attention.",
      ingestion:
        "Do NOT induce vomiting. Rinse mouth. Immediately call a POISON CENTER or doctor. Corrosive — may cause internal burns.",
    },
    ppe_required: {
      eyes: "Chemical splash goggles AND face shield (ANSI Z87.1) — product is corrosive",
      hands: "Chemical-resistant gloves (butyl rubber or neoprene, minimum 14 mil)",
      respiratory:
        "NIOSH-approved respirator if mist is generated. Not usually required for liquid pouring.",
      body: "Chemical-resistant apron. Full body protection for large spill cleanup.",
    },
    storage_requirements:
      "Store in original container in a cool, dry, locked area. Keep away from metals — corrosive to aluminum and zinc. Separate from acids and oxidizers.",
    incompatible_materials: [
      "Strong acids",
      "Strong oxidizers",
      "Aluminum",
      "Zinc",
      "Tin",
      "Reactive metals",
    ],
    physical_properties: {
      appearance: "Yellow-orange liquid",
      odor: "Strong citrus odor",
      flash_point: "138°F (59°C)",
      ph: "11.5-12.5",
      boiling_point: "212°F (100°C)",
      vapor_pressure: "17 mmHg @ 20°C",
    },
    nfpa_diamond: { health: 3, fire: 1, reactivity: 0, special: null },
    location: "Bay 2 Mechanical",
    container_type: "Gallon Jug",
    container_count: 1,
    labeled: true,
    label_printed_date: "2025-11-10",
    sds_url: null,
    sds_uploaded: true,
    sds_date: "2022-08-01",
    sds_status: "expired",
    added_date: "2025-08-10",
    added_by: "Mike Rodriguez",
    added_method: "manual",
    scan_image_url: null,
    scan_confidence: null,
    last_updated: "2025-12-01",
  },
];

const SEED_LOCATIONS: Omit<Location, "id">[] = [
  { name: "Paint Booth A", chemical_ids: [] },
  { name: "Paint Mixing Room", chemical_ids: [] },
  { name: "Bay 1 Body Work", chemical_ids: [] },
  { name: "Bay 2 Mechanical", chemical_ids: [] },
  { name: "Bay 3 Detail", chemical_ids: [] },
  { name: "Detail Bay", chemical_ids: [] },
  { name: "Janitor Closet", chemical_ids: [] },
];

// ══════════════════════════════════════════════════════════
// SEED + INIT
// ══════════════════════════════════════════════════════════

export function seedDemoData(): void {
  // Seed employees
  const employees: Employee[] = SEED_EMPLOYEES.map((e) => ({
    ...e,
    id: genId(),
  }));
  writeStore(KEYS.employees, employees);

  // Seed chemicals
  const chemicals: Chemical[] = SEED_CHEMICALS.map((c) => ({
    ...c,
    id: genId(),
  }));
  writeStore(KEYS.chemicals, chemicals);

  // Seed locations and wire chemical IDs
  const locations: Location[] = SEED_LOCATIONS.map((loc) => ({
    ...loc,
    id: genId(),
    chemical_ids: chemicals
      .filter((c) => c.location === loc.name)
      .map((c) => c.id),
  }));
  writeStore(KEYS.locations, locations);

  // Seed some training records for employees who have completed modules
  const trainingRecords: TrainingRecord[] = [];
  for (const emp of employees) {
    for (const modId of emp.completed_modules) {
      trainingRecords.push({
        id: genId(),
        employee_id: emp.id,
        module_id: modId,
        completed_date:
          emp.last_training || new Date().toISOString().split("T")[0],
        score: 85 + Math.floor(Math.random() * 16), // 85-100
        certificate_data:
          emp.completed_modules.length >= 6
            ? {
                employee_name: emp.name,
                company_name: "Mike's Auto Body",
                industry: "auto_body",
                date:
                  emp.last_training ||
                  new Date().toISOString().split("T")[0],
              }
            : null,
      });
    }
  }
  writeStore(KEYS.trainingRecords, trainingRecords);

  // Seed label records for chemicals that are labeled
  const labelRecords: LabelRecord[] = chemicals
    .filter((c) => c.labeled && c.label_printed_date)
    .map((c) => ({
      id: genId(),
      chemical_id: c.id,
      label_size: "full" as const,
      printed_date: c.label_printed_date,
      copies: c.container_count,
    }));
  writeStore(KEYS.labels, labelRecords);
}

export function initializeStore(): void {
  // Only seed if no data exists yet
  const existing = readStore<Chemical>(KEYS.chemicals);
  if (existing.length === 0) {
    seedDemoData();
  }
}
