// ─── Types ────────────────────────────────────────────────────────────────────

export type GHSPictogram =
  | "flame"
  | "oxidizer"
  | "compressed-gas"
  | "corrosion"
  | "skull"
  | "exclamation"
  | "health-hazard"
  | "environment"
  | "exploding-bomb";

export type SignalWord = "Danger" | "Warning" | "None";
export type SDSStatus = "current" | "review" | "missing";
export type TrainingStatus = "completed" | "overdue" | "not-started" | "in-progress";
export type EmployeeStatus = "current" | "overdue" | "pending";

export interface SDSEntry {
  id: string;
  productName: string;
  manufacturer: string;
  productCode: string;
  signalWord: SignalWord;
  storageLocation: string;
  sdsDate: string;
  sdsStatus: SDSStatus;
  sdsRevision: string;
  dateAdded: string;
  category: string;
  pictograms: GHSPictogram[];
  hazardStatements: string[];
  precautionaryStatements: string[];
  ppe: {
    eyes: string;
    skin: string;
    respiratory: string;
    hands: string;
  };
  firstAid: {
    inhalation: string;
    skin: string;
    eyes: string;
    ingestion: string;
  };
  storage: string;
  supplierAddress: string;
  supplierPhone: string;
  secondaryContainers: number;
  secondaryLabeled: boolean;
  // Phase 5 — Real SDS data fields
  composition: { ingredient: string; casNumber: string; concentration: string }[];
  flashPoint: string;
  appearance: string;
  odor: string;
  storageRequirements: string;
  spillProcedures: string;
  fireFighting: { extinguishingMedia: string; specialHazards: string };
}

export interface EmployeeTraining {
  courseId: string;
  status: TrainingStatus;
  completedDate?: string;
  dueDate?: string;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: EmployeeStatus;
  color: string;
  hireDate: string;
  trainings: EmployeeTraining[];
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  required: boolean;
}

export interface InventoryItem {
  id: string;
  product: string;
  sdsId: string;
  location: string;
  containers: number;
  containerType: string;
  labeled: boolean;
  sds: boolean;
}

export interface NonRoutineTask {
  id: string;
  task: string;
  location: string;
  frequency: string;
  hazards: string[];
  precautions: string[];
  requiredPPE: string[];
}

// ─── GHS Pictogram Labels ─────────────────────────────────────────────────────

export const ghsPictogramLabels: Record<GHSPictogram, string> = {
  flame: "Flammable",
  oxidizer: "Oxidizer",
  "compressed-gas": "Gas Under Pressure",
  corrosion: "Corrosive",
  skull: "Acute Toxicity",
  exclamation: "Irritant / Harmful",
  "health-hazard": "Health Hazard",
  environment: "Environmental Hazard",
  "exploding-bomb": "Explosive",
};

// ─── Shop Info ────────────────────────────────────────────────────────────────

export const shopInfo = {
  name: "Mike's Auto Body",
  address: "1847 Pacific Coast Hwy",
  city: "Long Beach",
  state: "CA",
  zip: "90806",
  phone: "(562) 555-0147",
  owner: "Mike Rodriguez",
  ownerPhone: "(562) 555-0147",
  ownerEmail: "mike@mikesautobody.com",
  location: "Main",
  emergencyContacts: {
    fire: "911",
    police: "911",
    poisonControl: "1-800-222-1222",
    nearestHospital: {
      name: "Long Beach Medical Center",
      address: "1720 Termino Ave, Long Beach, CA 90804",
      phone: "(562) 933-2000",
      distance: "1.2 miles",
    },
  },
};

// ─── SDS Entries (31 products) ────────────────────────────────────────────────

export const sdsEntries: SDSEntry[] = [
  // ── Paint Systems (8) ────────────────────────────────────────────────────────
  {
    id: "1",
    productName: "PPG Deltron DBC Basecoat (White)",
    manufacturer: "PPG Industries",
    productCode: "DBC",
    signalWord: "Danger",
    storageLocation: "Paint Booth A",
    sdsDate: "2025-09-15",
    sdsStatus: "current",
    sdsRevision: "Rev 7",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "health-hazard", "exclamation"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
      "H351: Suspected of causing cancer",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces — No smoking",
      "P261: Avoid breathing mist/vapours/spray",
      "P280: Wear protective gloves/eye protection/face protection",
      "P304+P340: IF INHALED: Remove person to fresh air and keep comfortable for breathing",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Chemical splash goggles",
      skin: "Full protective suit",
      respiratory: "Supplied-air respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If breathing is difficult, give oxygen. Seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing. If irritation persists, seek medical attention.",
      eyes: "Rinse cautiously with water for at least 15 minutes. Remove contact lenses if present. Seek medical attention.",
      ingestion: "Do NOT induce vomiting. Rinse mouth with water. Seek immediate medical attention.",
    },
    storage: "Store in a well-ventilated place. Keep container tightly closed. Store between 60-80\u00B0F.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 2,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Toluene", casNumber: "108-88-3", concentration: "15–25%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "10–15%" },
      { ingredient: "Light Aromatic Solvent Naphtha", casNumber: "64742-95-6", concentration: "10–20%" },
      { ingredient: "Titanium Dioxide", casNumber: "13463-67-7", concentration: "10–20%" },
      { ingredient: "Methyl Amyl Ketone", casNumber: "110-43-0", concentration: "5–10%" },
    ],
    flashPoint: "40°F (4°C)",
    appearance: "White opaque liquid",
    odor: "Strong aromatic solvent odor",
    storageRequirements: "Store in well-ventilated area away from heat and ignition sources. Keep container tightly closed. Store between 40–100°F (4–38°C). Ground containers during transfer.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent (vermiculite, sand). Collect in approved waste containers. Do not flush to drain or waterways.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog. Do NOT use direct water stream.", specialHazards: "Flammable vapors may travel to ignition source and flash back. Closed containers may explode when heated. Toxic decomposition products: CO, CO₂." },
  },
  {
    id: "2",
    productName: "PPG Deltron DBC Basecoat (Black)",
    manufacturer: "PPG Industries",
    productCode: "DBC",
    signalWord: "Danger",
    storageLocation: "Paint Booth A",
    sdsDate: "2025-09-15",
    sdsStatus: "current",
    sdsRevision: "Rev 7",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "health-hazard", "exclamation"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
      "H361: Suspected of damaging fertility or the unborn child",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces — No smoking",
      "P261: Avoid breathing mist/vapours/spray",
      "P280: Wear protective gloves/eye protection/face protection",
      "P304+P340: IF INHALED: Remove person to fresh air and keep comfortable for breathing",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Chemical splash goggles",
      skin: "Full protective suit",
      respiratory: "Supplied-air respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If breathing is difficult, give oxygen. Seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse cautiously with water for at least 15 minutes. Remove contact lenses if present.",
      ingestion: "Do NOT induce vomiting. Rinse mouth with water. Seek immediate medical attention.",
    },
    storage: "Store in a well-ventilated place. Keep container tightly closed. Store between 60-80\u00B0F.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Toluene", casNumber: "108-88-3", concentration: "15–25%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "10–15%" },
      { ingredient: "Light Aromatic Solvent Naphtha", casNumber: "64742-95-6", concentration: "10–20%" },
      { ingredient: "Carbon Black", casNumber: "1333-86-4", concentration: "1–5%" },
      { ingredient: "Methyl Amyl Ketone", casNumber: "110-43-0", concentration: "5–10%" },
    ],
    flashPoint: "40°F (4°C)",
    appearance: "Black opaque liquid",
    odor: "Strong aromatic solvent odor",
    storageRequirements: "Store in well-ventilated area away from heat and ignition sources. Keep container tightly closed. Store between 40–100°F (4–38°C). Ground containers during transfer.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent (vermiculite, sand). Collect in approved waste containers. Do not flush to drain or waterways.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog. Do NOT use direct water stream.", specialHazards: "Flammable vapors may travel to ignition source and flash back. Closed containers may explode when heated. Toxic decomposition products: CO, CO₂." },
  },
  {
    id: "3",
    productName: "PPG DCU2021 Concept Clearcoat",
    manufacturer: "PPG Industries",
    productCode: "DCU2021",
    signalWord: "Danger",
    storageLocation: "Paint Booth A",
    sdsDate: "2025-10-10",
    sdsStatus: "current",
    sdsRevision: "Rev 6",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "health-hazard", "exclamation"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H332: Harmful if inhaled",
      "H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces — No smoking",
      "P261: Avoid breathing mist/vapours/spray",
      "P280: Wear protective gloves/eye protection/face protection",
      "P304+P340: IF INHALED: Remove person to fresh air and keep comfortable for breathing",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Chemical splash goggles",
      skin: "Full protective suit",
      respiratory: "Supplied-air respirator (isocyanates)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Remove to fresh air immediately. If breathing is difficult, administer oxygen. Call a physician.",
      skin: "Remove contaminated clothing. Wash skin with soap and water for 15 minutes.",
      eyes: "Flush with water for at least 15 minutes. Seek medical attention immediately.",
      ingestion: "Do NOT induce vomiting. Call poison center or physician immediately.",
    },
    storage: "Store in a well-ventilated place. Keep away from heat and ignition sources. Keep container tightly closed.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "n-Butyl Acetate", casNumber: "123-86-4", concentration: "20–30%" },
      { ingredient: "Light Aromatic Solvent Naphtha", casNumber: "64742-95-6", concentration: "15–25%" },
      { ingredient: "HDI Polyisocyanate (Desmodur)", casNumber: "28182-81-2", concentration: "10–15%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "5–10%" },
      { ingredient: "Ethyl 3-Ethoxypropionate", casNumber: "763-69-9", concentration: "5–10%" },
    ],
    flashPoint: "77°F (25°C)",
    appearance: "Clear liquid",
    odor: "Moderate solvent odor",
    storageRequirements: "Store in well-ventilated area away from heat and moisture. Keep container tightly closed. Store between 40–100°F. Contains isocyanates — keep away from water/moisture which accelerates curing.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Wear supplied-air respirator (isocyanate hazard). Absorb with inert material. Collect in approved waste container. Decontaminate spill area with dilute ammonia solution.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog. Do NOT use direct water stream.", specialHazards: "Thermal decomposition produces toxic isocyanate vapors, CO, CO₂, NOx. Flammable vapors may travel to ignition source." },
  },
  {
    id: "4",
    productName: "PPG DT870 Reducer (Medium Temp)",
    manufacturer: "PPG Industries",
    productCode: "DT870",
    signalWord: "Danger",
    storageLocation: "Paint Mixing Room",
    sdsDate: "2025-08-18",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P233: Keep container tightly closed",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes. Seek medical attention if irritation persists.",
      ingestion: "Do NOT induce vomiting. Seek medical attention immediately.",
    },
    storage: "Store in cool, well-ventilated area away from heat and ignition sources. Keep container tightly closed.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Toluene", casNumber: "108-88-3", concentration: "30–40%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "20–30%" },
      { ingredient: "Methanol", casNumber: "67-56-1", concentration: "5–10%" },
      { ingredient: "Ethyl Acetate", casNumber: "141-78-6", concentration: "10–15%" },
      { ingredient: "Ethylbenzene", casNumber: "100-41-4", concentration: "3–7%" },
    ],
    flashPoint: "40°F (4°C)",
    appearance: "Clear colorless liquid",
    odor: "Strong aromatic solvent odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat and ignition sources. Keep container tightly closed. Ground containers during pouring/transfer. Store between 40–100°F.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved waste containers. Prevent entry into drains or waterways.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, alcohol-resistant foam, water fog.", specialHazards: "Highly flammable. Vapors may form explosive mixtures with air. Vapors heavier than air — may travel along ground to ignition source. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "5",
    productName: "PPG DP48LF Epoxy Primer",
    manufacturer: "PPG Industries",
    productCode: "DP48LF",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-11-05",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H226: Flammable liquid and vapour",
      "H315: Causes skin irritation",
      "H317: May cause an allergic skin reaction",
      "H319: Causes serious eye irritation",
      "H335: May cause respiratory irritation",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames",
      "P261: Avoid breathing mist/vapours/spray",
      "P272: Contaminated work clothing should not be allowed out of the workplace",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      skin: "Wash with soap and water. If allergic reaction develops, seek medical attention.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a dry, well-ventilated area. Keep container tightly closed.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "15–20%" },
      { ingredient: "Bisphenol A Epoxy Resin", casNumber: "25068-38-6", concentration: "20–30%" },
      { ingredient: "n-Butanol", casNumber: "71-36-3", concentration: "5–10%" },
      { ingredient: "Ethylbenzene", casNumber: "100-41-4", concentration: "3–7%" },
      { ingredient: "Talc", casNumber: "14807-96-6", concentration: "5–10%" },
    ],
    flashPoint: "81°F (27°C)",
    appearance: "Colored liquid (various primer colors)",
    odor: "Mild solvent odor",
    storageRequirements: "Store in dry, well-ventilated area. Keep container tightly closed. Store between 60–80°F. Avoid moisture which can cause curing. Separate from oxidizers and strong acids.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Absorb with inert absorbent material. Collect in approved waste container. Do not allow to enter drains.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Flammable vapors may travel to ignition source. Containers may rupture when heated. Toxic decomposition: CO, CO₂, epoxy fumes." },
  },
  {
    id: "6",
    productName: "PPG DX330 Wax & Grease Remover",
    manufacturer: "PPG Industries",
    productCode: "DX330",
    signalWord: "Danger",
    storageLocation: "Bay 3",
    sdsDate: "2025-08-28",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Paint Systems",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H304: May be fatal if swallowed and enters airways",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P261: Avoid breathing vapours",
      "P280: Wear protective gloves/eye protection",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call poison center immediately.",
    },
    storage: "Store in a cool, well-ventilated area away from heat and ignition sources.",
    supplierAddress: "PPG Industries, 19699 Progress Dr, Strongsville, OH 44149",
    supplierPhone: "(800) 647-6050",
    secondaryContainers: 2,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Naphtha, Petroleum, Light Aliphatic", casNumber: "64742-89-8", concentration: "60–80%" },
      { ingredient: "Isopropanol", casNumber: "67-63-0", concentration: "1–5%" },
    ],
    flashPoint: "105°F (41°C)",
    appearance: "Clear colorless liquid",
    odor: "Petroleum solvent odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat and ignition sources. Keep container tightly closed. Store between 40–100°F.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Absorb with inert absorbent material (vermiculite, sand). Collect in approved waste containers. Prevent entry into drains. May be fatal if swallowed — aspiration hazard.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog. Do NOT use direct water stream.", specialHazards: "Highly flammable. Vapors heavier than air — may travel along ground to ignition source. Aspiration hazard. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "7",
    productName: "Axalta Cromax Pro WB2030 Basecoat",
    manufacturer: "Axalta Coating Systems",
    productCode: "WB2030",
    signalWord: "Warning",
    storageLocation: "Paint Booth A",
    sdsDate: "2025-12-14",
    sdsStatus: "current",
    sdsRevision: "Rev 3",
    dateAdded: "2025-08-20",
    category: "Paint Systems",
    pictograms: ["exclamation", "health-hazard"],
    hazardStatements: [
      "H319: Causes serious eye irritation",
      "H335: May cause respiratory irritation",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P261: Avoid breathing mist/vapours/spray",
      "P271: Use only outdoors or in a well-ventilated area",
      "P280: Wear protective gloves/eye protection",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse cautiously with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a well-ventilated place. Keep container tightly closed. Protect from freezing.",
    supplierAddress: "Axalta Coating Systems, 200 Wilmington West Chester Pike, Chadds Ford, PA 19317",
    supplierPhone: "(855) 292-5824",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "30–40%" },
      { ingredient: "Propylene Glycol Monomethyl Ether", casNumber: "107-98-2", concentration: "5–10%" },
      { ingredient: "2-Butoxyethanol", casNumber: "111-76-2", concentration: "1–5%" },
      { ingredient: "Acrylic Polymer Emulsion", casNumber: "Proprietary", concentration: "20–30%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "Pigmented liquid (various colors)",
    odor: "Mild chemical odor",
    storageRequirements: "Store in well-ventilated area. Keep container tightly closed. Protect from freezing — store above 40°F (4°C). Store below 100°F.",
    spillProcedures: "Absorb with inert material. Collect in approved waste containers. Flush residual with water. Prevent entry into drains or waterways.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Waterborne product — low fire hazard. Thermal decomposition may produce CO, CO₂, acrid fumes. Use SCBA in enclosed fire situations." },
  },
  {
    id: "8",
    productName: "BASF Glasurit 923-210 HS Clearcoat",
    manufacturer: "BASF Coatings",
    productCode: "923-210",
    signalWord: "Danger",
    storageLocation: "Paint Booth A",
    sdsDate: "2026-01-01",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2026-02-10",
    category: "Paint Systems",
    pictograms: ["flame", "health-hazard", "exclamation"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H332: Harmful if inhaled",
      "H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P261: Avoid breathing vapours",
      "P280: Wear protective gloves/eye/face protection",
      "P304+P340: IF INHALED: Remove person to fresh air",
      "P403+P235: Store in a well-ventilated place. Keep cool",
    ],
    ppe: {
      eyes: "Chemical splash goggles",
      skin: "Full protective suit",
      respiratory: "Supplied-air respirator (isocyanates)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Remove to fresh air immediately. If breathing is difficult, administer oxygen.",
      skin: "Remove contaminated clothing. Wash with soap and water for 15 minutes.",
      eyes: "Flush with water for at least 15 minutes. Seek medical attention.",
      ingestion: "Do NOT induce vomiting. Call poison center immediately.",
    },
    storage: "Store in a well-ventilated place away from ignition sources. Keep cool. Keep container tightly closed.",
    supplierAddress: "BASF Corporation, 26701 Telegraph Rd, Southfield, MI 48033",
    supplierPhone: "(800) 825-3000",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "n-Butyl Acetate", casNumber: "123-86-4", concentration: "20–30%" },
      { ingredient: "Solvent Naphtha (petroleum), light aromatic", casNumber: "64742-95-6", concentration: "10–20%" },
      { ingredient: "HDI Polyisocyanate", casNumber: "28182-81-2", concentration: "10–20%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "5–10%" },
      { ingredient: "Ethylbenzene", casNumber: "100-41-4", concentration: "1–5%" },
    ],
    flashPoint: "77°F (25°C)",
    appearance: "Clear liquid",
    odor: "Solvent odor",
    storageRequirements: "Store in well-ventilated area away from ignition sources and moisture. Keep cool. Keep container tightly closed. Store between 40–100°F. Contains isocyanates — moisture causes gassing and curing.",
    spillProcedures: "Eliminate ignition sources. Wear supplied-air respirator (isocyanate hazard). Absorb with inert material. Collect in approved waste container. Decontaminate with dilute ammonia solution.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Thermal decomposition produces toxic isocyanate vapors, CO, CO₂, NOx. Flammable liquid. Containers may rupture when heated." },
  },

  // ── Solvents & Cleaners (6) ──────────────────────────────────────────────────
  {
    id: "9",
    productName: "CRC Brakleen 05089 Non-Chlorinated",
    manufacturer: "CRC Industries",
    productCode: "05089",
    signalWord: "Danger",
    storageLocation: "Bay 2",
    sdsDate: "2025-09-15",
    sdsStatus: "current",
    sdsRevision: "Rev 6",
    dateAdded: "2025-06-15",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H304: May be fatal if swallowed and enters airways",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P251: Do not pierce or burn, even after use",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
      "P280: Wear protective gloves/eye protection",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Chemical-resistant apron",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air immediately. If breathing is difficult, give oxygen. Call physician.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse cautiously with water for at least 15 minutes. Seek medical attention.",
      ingestion: "Do NOT induce vomiting. Call poison center immediately.",
    },
    storage: "Store in a cool, well-ventilated place. Keep away from heat and ignition sources.",
    supplierAddress: "CRC Industries, 885 Louis Dr, Warminster, PA 18974",
    supplierPhone: "(800) 521-3168",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Heptane", casNumber: "142-82-5", concentration: "40–70%" },
      { ingredient: "Acetone", casNumber: "67-64-1", concentration: "20–30%" },
      { ingredient: "Propane (propellant)", casNumber: "74-98-6", concentration: "5–10%" },
      { ingredient: "Carbon Dioxide (propellant)", casNumber: "124-38-9", concentration: "1–5%" },
    ],
    flashPoint: "-4°F (-20°C)",
    appearance: "Clear colorless aerosol spray",
    odor: "Petroleum / solvent odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat and ignition sources. Pressurized container — do not expose to temperatures exceeding 120°F (49°C). Do not pierce or burn, even after use.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb liquid residue with inert absorbent. Collect in approved waste containers. Extremely flammable — aspiration hazard. Do not flush to drain.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam. Do NOT use water stream — may spread fire.", specialHazards: "Extremely flammable aerosol. Pressurized containers may explode when heated. Aspiration hazard. Vapors heavier than air. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "10",
    productName: "Klean-Strip Acetone",
    manufacturer: "Klean-Strip",
    productCode: "GAC18",
    signalWord: "Danger",
    storageLocation: "Paint Mixing Room",
    sdsDate: "2025-12-01",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-06-15",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P233: Keep container tightly closed",
      "P240: Ground/bond container and receiving equipment",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
      "P303+P361+P353: IF ON SKIN: Remove contaminated clothing. Rinse skin with water/shower",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes. Seek medical attention if irritation persists.",
      ingestion: "Do NOT induce vomiting. Call poison center.",
    },
    storage: "Store in a cool, well-ventilated area away from heat and ignition sources. Ground containers during transfer.",
    supplierAddress: "Klean-Strip, P.O. Box 1879, Memphis, TN 38101",
    supplierPhone: "(800) 398-3892",
    secondaryContainers: 2,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Acetone", casNumber: "67-64-1", concentration: "100%" },
    ],
    flashPoint: "-4°F (-20°C)",
    appearance: "Clear colorless liquid",
    odor: "Sweet, pungent ketone odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat, sparks, and open flames. Keep container tightly closed. Ground/bond container and receiving equipment during transfer. Store between 40–100°F.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved containers. Prevent entry into drains or waterways. Highly flammable — vapors form explosive mixtures with air.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, alcohol-resistant foam, water fog.", specialHazards: "Highly flammable liquid and vapor. Flash point -4°F. Vapors heavier than air — may travel to ignition source and flash back. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "11",
    productName: "3M General Purpose Adhesive Cleaner 08984",
    manufacturer: "3M Company",
    productCode: "08984",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-10-12",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H304: May be fatal if swallowed and enters airways",
      "H336: May cause drowsiness or dizziness",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
      "P280: Wear protective gloves/eye protection",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, get medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Call poison center immediately. Aspiration hazard.",
    },
    storage: "Store in a cool, well-ventilated place. Keep away from ignition sources. Keep container tightly closed.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Heptane", casNumber: "142-82-5", concentration: "60–80%" },
      { ingredient: "Naphtha, Petroleum, Light Aliphatic", casNumber: "64742-89-8", concentration: "15–25%" },
    ],
    flashPoint: "25°F (-4°C)",
    appearance: "Clear colorless liquid",
    odor: "Petroleum solvent odor",
    storageRequirements: "Store in cool, well-ventilated place. Keep away from heat and ignition sources. Keep container tightly closed. Store between 40–100°F.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved waste containers. Aspiration hazard — do not flush to drain.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam. Do NOT use water stream.", specialHazards: "Highly flammable. Aspiration hazard — may be fatal if swallowed and enters airways. Vapors heavier than air. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "12",
    productName: "Klean-Strip Lacquer Thinner",
    manufacturer: "Klean-Strip",
    productCode: "GML170",
    signalWord: "Danger",
    storageLocation: "Paint Mixing Room",
    sdsDate: "2025-11-20",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-09-01",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H304: May be fatal if swallowed and enters airways",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
      "H361: Suspected of damaging fertility or the unborn child",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P233: Keep container tightly closed",
      "P261: Avoid breathing vapours",
      "P280: Wear protective gloves/eye protection",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
      "P308+P313: IF exposed or concerned: Get medical advice/attention",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call poison center immediately.",
    },
    storage: "Store in a cool, well-ventilated place away from heat and ignition sources.",
    supplierAddress: "Klean-Strip, P.O. Box 1879, Memphis, TN 38101",
    supplierPhone: "(800) 398-3892",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Toluene", casNumber: "108-88-3", concentration: "30–50%" },
      { ingredient: "Methanol", casNumber: "67-56-1", concentration: "10–20%" },
      { ingredient: "Acetone", casNumber: "67-64-1", concentration: "10–20%" },
      { ingredient: "2-Butanone (MEK)", casNumber: "78-93-3", concentration: "5–15%" },
      { ingredient: "Ethyl Acetate", casNumber: "141-78-6", concentration: "5–10%" },
    ],
    flashPoint: "10°F (-12°C)",
    appearance: "Clear colorless liquid",
    odor: "Strong mixed solvent odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat, sparks, and flames. Keep container tightly closed. Ground/bond during transfer. Store between 40–100°F.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved waste containers. Aspiration hazard. Prevent entry into drains or waterways.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, alcohol-resistant foam, water fog.", specialHazards: "Highly flammable. Aspiration hazard — may be fatal if swallowed. Vapors heavier than air — explosive mixtures with air. Toxic decomposition: CO, CO₂. Methanol produces formaldehyde upon combustion." },
  },
  {
    id: "13",
    productName: "Wurth Brake & Parts Cleaner",
    manufacturer: "Wurth USA",
    productCode: "0890117",
    signalWord: "Danger",
    storageLocation: "Bay 2",
    sdsDate: "2025-10-05",
    sdsStatus: "current",
    sdsRevision: "Rev 3",
    dateAdded: "2025-10-15",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation", "compressed-gas"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P211: Do not spray on an open flame or other ignition source",
      "P251: Do not pierce or burn, even after use",
      "P271: Use only outdoors or in a well-ventilated area",
      "P410+P412: Protect from sunlight. Do not expose to temperatures exceeding 50\u00B0C/122\u00B0F",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Organic vapor respirator (enclosed spaces)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse cautiously with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, well-ventilated place. Protect from sunlight. Do not expose to temperatures exceeding 122\u00B0F.",
    supplierAddress: "Wurth USA, 93 Grant St, Ramsey, NJ 07446",
    supplierPhone: "(800) 872-7899",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Acetone", casNumber: "67-64-1", concentration: "50–70%" },
      { ingredient: "Heptane", casNumber: "142-82-5", concentration: "15–25%" },
      { ingredient: "Propane (propellant)", casNumber: "74-98-6", concentration: "5–10%" },
      { ingredient: "Butane (propellant)", casNumber: "106-97-8", concentration: "3–7%" },
    ],
    flashPoint: "-4°F (-20°C)",
    appearance: "Clear colorless aerosol spray",
    odor: "Strong solvent / ketone odor",
    storageRequirements: "Store in cool, well-ventilated area. Pressurized container — do not expose to temperatures exceeding 122°F (50°C). Do not pierce or burn. Protect from sunlight.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb liquid residue with inert absorbent. Collect in approved waste containers. Extremely flammable.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam.", specialHazards: "Extremely flammable aerosol. Pressurized container may explode when heated. Vapors heavier than air — may travel to ignition source. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "14",
    productName: "SEM Solve 38353",
    manufacturer: "SEM Products",
    productCode: "38353",
    signalWord: "Danger",
    storageLocation: "Bay 3",
    sdsDate: "2025-11-20",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-11-01",
    category: "Solvents & Cleaners",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H225: Highly flammable liquid and vapour",
      "H304: May be fatal if swallowed and enters airways",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P233: Keep container tightly closed",
      "P261: Avoid breathing vapours",
      "P280: Wear protective gloves/eye protection",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call poison center immediately.",
    },
    storage: "Store in a cool, well-ventilated area away from heat and ignition sources. Keep container tightly closed.",
    supplierAddress: "SEM Products, 1685 Overview Dr, Rock Hill, SC 29730",
    supplierPhone: "(800) 831-1122",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "VM&P Naphtha", casNumber: "64742-89-8", concentration: "80–100%" },
    ],
    flashPoint: "107°F (42°C)",
    appearance: "Clear colorless liquid",
    odor: "Petroleum solvent odor",
    storageRequirements: "Store in cool, well-ventilated area away from heat and ignition sources. Keep container tightly closed. Store between 40–100°F.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved waste containers. Aspiration hazard. Prevent entry into drains.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Flammable liquid. Aspiration hazard. Vapors heavier than air — may travel to ignition source. Toxic decomposition: CO, CO₂." },
  },

  // ── Body Fillers & Adhesives (6) ─────────────────────────────────────────────
  {
    id: "15",
    productName: "3M Bondo 261 Lightweight Filler",
    manufacturer: "3M / Bondo",
    productCode: "261",
    signalWord: "Warning",
    storageLocation: "Bay 1",
    sdsDate: "2025-08-14",
    sdsStatus: "current",
    sdsRevision: "Rev 6",
    dateAdded: "2025-06-15",
    category: "Body Fillers & Adhesives",
    pictograms: ["exclamation", "health-hazard"],
    hazardStatements: [
      "H315: Causes skin irritation",
      "H317: May cause an allergic skin reaction",
      "H319: Causes serious eye irritation",
      "H335: May cause respiratory irritation",
    ],
    precautionaryStatements: [
      "P261: Avoid breathing dust/vapours",
      "P272: Contaminated work clothing should not be allowed out of the workplace",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
      "P314: Get medical advice/attention if you feel unwell",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Dust/organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, dry, well-ventilated area. Keep away from heat and ignition sources.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Calcium Carbonate", casNumber: "471-34-1", concentration: "30–40%" },
      { ingredient: "Talc", casNumber: "14807-96-6", concentration: "15–25%" },
      { ingredient: "Unsaturated Polyester Resin", casNumber: "Proprietary", concentration: "20–30%" },
      { ingredient: "Styrene Monomer", casNumber: "100-42-5", concentration: "15–25%" },
    ],
    flashPoint: "90°F (32°C)",
    appearance: "Cream to gray thick paste",
    odor: "Styrene odor",
    storageRequirements: "Store in cool, dry, well-ventilated area. Keep away from heat and ignition sources. Keep container tightly closed to prevent styrene evaporation. Store between 60–80°F.",
    spillProcedures: "Ventilate area. Scrape up excess material. Absorb residue with inert absorbent. Collect in approved waste containers. Avoid breathing dust/vapors.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Flammable due to styrene monomer content. Thermal decomposition produces CO, CO₂, styrene vapors, acrid smoke. May generate static charge — ground all equipment." },
  },
  {
    id: "16",
    productName: "Evercoat Rage Gold 112",
    manufacturer: "Evercoat (ITW)",
    productCode: "112",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-09-22",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Body Fillers & Adhesives",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H226: Flammable liquid and vapour",
      "H315: Causes skin irritation",
      "H319: Causes serious eye irritation",
      "H332: Harmful if inhaled",
      "H372: Causes damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames",
      "P261: Avoid breathing dust/vapours",
      "P280: Wear protective gloves/eye protection",
      "P314: Get medical advice/attention if you feel unwell",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Dust/organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, dry place. Keep container tightly closed.",
    supplierAddress: "Evercoat, 6600 Cornell Rd, Cincinnati, OH 45242",
    supplierPhone: "(800) 247-3932",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Unsaturated Polyester Resin", casNumber: "Proprietary", concentration: "25–35%" },
      { ingredient: "Styrene Monomer", casNumber: "100-42-5", concentration: "20–30%" },
      { ingredient: "Talc", casNumber: "14807-96-6", concentration: "20–30%" },
      { ingredient: "Calcium Carbonate", casNumber: "471-34-1", concentration: "10–15%" },
    ],
    flashPoint: "88°F (31°C)",
    appearance: "Yellow / gold thick paste",
    odor: "Strong styrene odor",
    storageRequirements: "Store in cool, dry place. Keep container tightly closed. Avoid heat, sparks, and open flame. Store between 60–80°F. Keep away from oxidizing agents.",
    spillProcedures: "Ventilate area. Scrape up excess material. Absorb with inert absorbent. Collect in approved waste containers. Avoid breathing dust/vapors from sanding cured product.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Flammable due to styrene content. Thermal decomposition: CO, CO₂, styrene vapors, acrid smoke." },
  },
  {
    id: "17",
    productName: "3M 08693 Panel Bond Adhesive",
    manufacturer: "3M Company",
    productCode: "08693",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-07-08",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-06-15",
    category: "Body Fillers & Adhesives",
    pictograms: ["exclamation", "health-hazard"],
    hazardStatements: [
      "H315: Causes skin irritation",
      "H317: May cause an allergic skin reaction",
      "H319: Causes serious eye irritation",
      "H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled",
      "H335: May cause respiratory irritation",
    ],
    precautionaryStatements: [
      "P261: Avoid breathing vapours",
      "P272: Contaminated work clothing should not be allowed out of the workplace",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
      "P304+P340: IF INHALED: Remove person to fresh air",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If breathing difficulty, seek medical attention.",
      skin: "Wash with soap and water. If irritation or rash occurs, get medical advice.",
      eyes: "Rinse cautiously with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, dry place. Keep container tightly closed.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Bisphenol A Epoxy Resin", casNumber: "25068-38-6", concentration: "30–50%" },
      { ingredient: "Calcium Carbonate", casNumber: "471-34-1", concentration: "10–20%" },
      { ingredient: "Fumed Silica", casNumber: "112945-52-5", concentration: "1–5%" },
      { ingredient: "Aliphatic Amine Hardener", casNumber: "Proprietary", concentration: "10–20%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "Colored paste (Part A: green, Part B: white)",
    odor: "Mild amine / chemical odor",
    storageRequirements: "Store in cool, dry place. Keep container tightly closed. Store between 60–80°F. Separate Part A and Part B from acids and oxidizers.",
    spillProcedures: "Ventilate area. Scrape up and absorb with inert absorbent. Collect in approved waste containers. Avoid skin contact — may cause sensitization.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Thermal decomposition may produce CO, CO₂, NOx, amine vapors. Use SCBA in fire situations." },
  },
  {
    id: "18",
    productName: "SEM Dual-Mix Panel Bond 39747",
    manufacturer: "SEM Products",
    productCode: "39747",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-11-30",
    sdsStatus: "current",
    sdsRevision: "Rev 3",
    dateAdded: "2025-12-01",
    category: "Body Fillers & Adhesives",
    pictograms: ["exclamation", "health-hazard"],
    hazardStatements: [
      "H315: Causes skin irritation",
      "H317: May cause an allergic skin reaction",
      "H319: Causes serious eye irritation",
      "H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled",
    ],
    precautionaryStatements: [
      "P261: Avoid breathing vapours",
      "P272: Contaminated work clothing should not be allowed out of the workplace",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
      "P304+P340: IF INHALED: Remove person to fresh air",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If breathing difficulty, seek medical attention.",
      skin: "Wash with soap and water. If irritation or rash occurs, get medical advice.",
      eyes: "Rinse cautiously with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, dry place. Keep container tightly closed.",
    supplierAddress: "SEM Products, 1685 Overview Dr, Rock Hill, SC 29730",
    supplierPhone: "(800) 831-1122",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Epoxy Resin (Bisphenol A)", casNumber: "25068-38-6", concentration: "40–50%" },
      { ingredient: "Calcium Carbonate", casNumber: "471-34-1", concentration: "15–25%" },
      { ingredient: "Fumed Silica", casNumber: "112945-52-5", concentration: "1–5%" },
      { ingredient: "Modified Amine Hardener", casNumber: "Proprietary", concentration: "15–20%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "Colored paste",
    odor: "Mild amine / chemical odor",
    storageRequirements: "Store in cool, dry place. Keep container tightly closed. Store between 60–80°F.",
    spillProcedures: "Ventilate area. Scrape up and absorb with inert absorbent. Collect in approved waste containers. Avoid skin contact — potential sensitizer.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Thermal decomposition: CO, CO₂, NOx, amine vapors." },
  },
  {
    id: "19",
    productName: "U-POL Dolphin Glaze",
    manufacturer: "U-POL Ltd",
    productCode: "DOLPHIN",
    signalWord: "Warning",
    storageLocation: "Bay 3",
    sdsDate: "2025-10-18",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-06-15",
    category: "Body Fillers & Adhesives",
    pictograms: ["exclamation", "health-hazard"],
    hazardStatements: [
      "H226: Flammable liquid and vapour",
      "H315: Causes skin irritation",
      "H319: Causes serious eye irritation",
      "H361: Suspected of damaging fertility or the unborn child",
      "H372: Causes damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames",
      "P261: Avoid breathing vapours",
      "P280: Wear protective gloves/eye protection",
      "P308+P313: IF exposed or concerned: Get medical advice/attention",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Protective coveralls",
      respiratory: "Dust mask",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, dry, well-ventilated area away from heat and ignition sources.",
    supplierAddress: "U-POL Ltd, Denington Ind. Estate, Wellingborough, NN8 2QH, UK",
    supplierPhone: "(954) 958-1999",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Unsaturated Polyester Resin", casNumber: "Proprietary", concentration: "30–40%" },
      { ingredient: "Styrene Monomer", casNumber: "100-42-5", concentration: "15–25%" },
      { ingredient: "Talc", casNumber: "14807-96-6", concentration: "20–30%" },
      { ingredient: "Calcium Carbonate", casNumber: "471-34-1", concentration: "5–10%" },
    ],
    flashPoint: "90°F (32°C)",
    appearance: "Blue-green paste",
    odor: "Styrene odor",
    storageRequirements: "Store in cool, dry, well-ventilated area away from heat and ignition sources. Keep container tightly closed. Store between 60–80°F.",
    spillProcedures: "Ventilate area. Scrape up excess material. Absorb with inert absorbent. Collect in approved waste containers. Avoid breathing dust/vapors.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog.", specialHazards: "Flammable due to styrene monomer content. Thermal decomposition: CO, CO₂, styrene vapors." },
  },
  {
    id: "20",
    productName: "3M Super 77 Spray Adhesive",
    manufacturer: "3M Company",
    productCode: "77",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-10-01",
    sdsStatus: "current",
    sdsRevision: "Rev 7",
    dateAdded: "2025-10-10",
    category: "Body Fillers & Adhesives",
    pictograms: ["flame", "exclamation", "health-hazard", "compressed-gas"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H304: May be fatal if swallowed and enters airways",
      "H336: May cause drowsiness or dizziness",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P211: Do not spray on an open flame or other ignition source",
      "P251: Do not pierce or burn, even after use",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call poison center immediately.",
    },
    storage: "Store in a cool, well-ventilated place. Protect from sunlight. Do not expose to temperatures exceeding 120\u00B0F.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Dimethyl Ether (propellant)", casNumber: "115-10-6", concentration: "25–35%" },
      { ingredient: "Heptane", casNumber: "142-82-5", concentration: "15–25%" },
      { ingredient: "Cyclohexane", casNumber: "110-82-7", concentration: "10–20%" },
      { ingredient: "Synthetic Rubber Adhesive", casNumber: "Proprietary", concentration: "5–15%" },
    ],
    flashPoint: "-42°F (-41°C) propellant",
    appearance: "Clear amber liquid spray",
    odor: "Petroleum / ether odor",
    storageRequirements: "Store in cool, well-ventilated place. Pressurized container — do not expose to temperatures exceeding 120°F. Protect from sunlight. Do not pierce or burn.",
    spillProcedures: "Eliminate all ignition sources. Ventilate area. Absorb liquid residue with inert absorbent. Collect in approved waste containers. Aspiration hazard.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam. Do NOT use water stream.", specialHazards: "Extremely flammable aerosol. Pressurized container — may explode when heated. Aspiration hazard. Vapors heavier than air — may travel to ignition source." },
  },

  // ── Detail & Finishing (3) ───────────────────────────────────────────────────
  {
    id: "21",
    productName: "Meguiar's M105 Ultra-Cut Compound",
    manufacturer: "Meguiar's Inc.",
    productCode: "M105",
    signalWord: "Warning",
    storageLocation: "Detail Bay",
    sdsDate: "2025-12-10",
    sdsStatus: "current",
    sdsRevision: "Rev 3",
    dateAdded: "2025-06-15",
    category: "Detail & Finishing",
    pictograms: ["exclamation"],
    hazardStatements: [
      "H319: Causes serious eye irritation",
    ],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
      "P280: Wear eye/face protection",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
      "P337+P313: If eye irritation persists: Get medical advice/attention",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air if irritation occurs.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes. Seek medical attention if irritation persists.",
      ingestion: "Rinse mouth. Do not induce vomiting. Seek medical attention if symptoms occur.",
    },
    storage: "Store at room temperature in original container. Keep container tightly closed.",
    supplierAddress: "Meguiar's Inc., 17991 Mitchell South, Irvine, CA 92614",
    supplierPhone: "(800) 347-5700",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "40–60%" },
      { ingredient: "Aluminum Oxide", casNumber: "1344-28-1", concentration: "15–30%" },
      { ingredient: "Mineral Oil", casNumber: "8042-47-5", concentration: "5–15%" },
      { ingredient: "Kaolin Clay", casNumber: "1332-58-7", concentration: "1–5%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "White cream / liquid",
    odor: "Mild, nearly odorless",
    storageRequirements: "Store at room temperature (60–80°F) in original container. Keep container tightly closed. Protect from freezing.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush residual with water. Slippery when spilled.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Water-based product. May produce irritating smoke upon combustion at extreme temperatures." },
  },
  {
    id: "22",
    productName: "Meguiar's M205 Ultra Finishing Polish",
    manufacturer: "Meguiar's Inc.",
    productCode: "M205",
    signalWord: "None",
    storageLocation: "Detail Bay",
    sdsDate: "2025-12-10",
    sdsStatus: "current",
    sdsRevision: "Rev 2",
    dateAdded: "2025-06-15",
    category: "Detail & Finishing",
    pictograms: [],
    hazardStatements: [],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air if irritation occurs.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Rinse mouth. Seek medical attention if symptoms occur.",
    },
    storage: "Store at room temperature in original container. Keep container tightly closed.",
    supplierAddress: "Meguiar's Inc., 17991 Mitchell South, Irvine, CA 92614",
    supplierPhone: "(800) 347-5700",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "50–70%" },
      { ingredient: "Aluminum Oxide", casNumber: "1344-28-1", concentration: "5–15%" },
      { ingredient: "Mineral Oil", casNumber: "8042-47-5", concentration: "5–10%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "White cream / liquid",
    odor: "Nearly odorless",
    storageRequirements: "Store at room temperature in original container. Keep container tightly closed. Protect from freezing.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush residual with water. Slippery when spilled.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Water-based product. Minimal fire hazard." },
  },
  {
    id: "23",
    productName: "3M Perfect-It Rubbing Compound 06085",
    manufacturer: "3M Company",
    productCode: "06085",
    signalWord: "Warning",
    storageLocation: "Detail Bay",
    sdsDate: "2025-11-22",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Detail & Finishing",
    pictograms: ["exclamation"],
    hazardStatements: [
      "H319: Causes serious eye irritation",
      "H335: May cause respiratory irritation",
    ],
    precautionaryStatements: [
      "P261: Avoid breathing dust",
      "P264: Wash hands thoroughly after handling",
      "P280: Wear eye/face protection",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Dust mask (when sanding)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Rinse mouth. Seek medical attention if symptoms occur.",
    },
    storage: "Store at room temperature. Keep container tightly closed.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "40–60%" },
      { ingredient: "Aluminum Oxide", casNumber: "1344-28-1", concentration: "10–25%" },
      { ingredient: "Mineral Oil", casNumber: "8042-47-5", concentration: "5–15%" },
      { ingredient: "Amorphous Silica", casNumber: "7631-86-9", concentration: "1–5%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "Off-white liquid / paste",
    odor: "Mild odor",
    storageRequirements: "Store at room temperature. Keep container tightly closed. Protect from freezing.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush residual with water. Slippery when spilled.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Water-based product. May produce irritating particulate upon combustion." },
  },

  // ── Shop Chemicals (8) ──────────────────────────────────────────────────────
  {
    id: "24",
    productName: "WD-40 Multi-Use Product",
    manufacturer: "WD-40 Company",
    productCode: "49000",
    signalWord: "Danger",
    storageLocation: "Bay 2",
    sdsDate: "2026-01-01",
    sdsStatus: "current",
    sdsRevision: "Rev 8",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["flame", "exclamation", "compressed-gas", "health-hazard"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H304: May be fatal if swallowed and enters airways",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P251: Do not pierce or burn, even after use",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required (use in ventilated area)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Aspiration hazard. Call poison center immediately.",
    },
    storage: "Store in a cool, dry, well-ventilated area. Do not expose to temperatures exceeding 120\u00B0F.",
    supplierAddress: "WD-40 Company, 9715 Businesspark Ave, San Diego, CA 92131",
    supplierPhone: "(888) 324-7596",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "LVP Aliphatic Hydrocarbon", casNumber: "64742-47-8", concentration: "45–50%" },
      { ingredient: "Petroleum Base Oil", casNumber: "64742-65-0", concentration: "15–25%" },
      { ingredient: "Aliphatic Hydrocarbon", casNumber: "64742-47-8", concentration: "<10%" },
      { ingredient: "Carbon Dioxide (propellant)", casNumber: "124-38-9", concentration: "2–3%" },
    ],
    flashPoint: "122°F (50°C) liquid content",
    appearance: "Light amber liquid aerosol",
    odor: "Mild petroleum odor",
    storageRequirements: "Store in cool, dry, well-ventilated area. Do not expose to temperatures exceeding 120°F (49°C). Pressurized container — do not pierce or burn, even after use.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Absorb with inert absorbent. Collect in approved waste containers. Aspiration hazard. Prevent entry into drains.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam, water fog. Do NOT use water stream.", specialHazards: "Extremely flammable aerosol. Pressurized container — may explode when heated. Aspiration hazard — may be fatal if swallowed. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "25",
    productName: "Zep Heavy-Duty Citrus Degreaser",
    manufacturer: "Zep, Inc.",
    productCode: "ZUCIT128",
    signalWord: "Warning",
    storageLocation: "Janitor Closet",
    sdsDate: "2025-12-15",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["exclamation"],
    hazardStatements: [
      "H315: Causes skin irritation",
      "H319: Causes serious eye irritation",
    ],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air if irritation occurs.",
      skin: "Wash with soap and water.",
      eyes: "Rinse cautiously with water for at least 15 minutes. Get medical advice if irritation persists.",
      ingestion: "Rinse mouth. Drink water. Seek medical attention if symptoms occur.",
    },
    storage: "Store in original container. Keep container tightly closed. Store at room temperature.",
    supplierAddress: "Zep, Inc., 3330 Cumberland Blvd SE #700, Atlanta, GA 30339",
    supplierPhone: "(877) 428-9937",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "d-Limonene", casNumber: "5989-27-5", concentration: "5–10%" },
      { ingredient: "2-Butoxyethanol", casNumber: "111-76-2", concentration: "1–5%" },
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "60–80%" },
      { ingredient: "Surfactants (proprietary blend)", casNumber: "Proprietary", concentration: "5–10%" },
    ],
    flashPoint: ">150°F (>66°C)",
    appearance: "Yellow liquid",
    odor: "Strong citrus odor",
    storageRequirements: "Store in original container. Keep container tightly closed. Store at room temperature (60–80°F). Keep away from heat and direct sunlight.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush area with water. Slippery when spilled. Prevent entry into drains.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Combustible liquid at elevated temperatures. d-Limonene vapors are flammable. Thermal decomposition: CO, CO₂." },
  },
  {
    id: "26",
    productName: "Simple Green Industrial Cleaner",
    manufacturer: "Sunshine Makers, Inc.",
    productCode: "13005",
    signalWord: "None",
    storageLocation: "Janitor Closet",
    sdsDate: "2025-11-10",
    sdsStatus: "current",
    sdsRevision: "Rev 6",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: [],
    hazardStatements: [],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required",
      hands: "Optional nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air if irritation occurs.",
      skin: "Wash with water.",
      eyes: "Rinse cautiously with water for at least 15 minutes. Get medical advice if irritation persists.",
      ingestion: "Rinse mouth. Drink water. Seek medical attention if symptoms occur.",
    },
    storage: "Store in original container. Keep container tightly closed. Store at room temperature.",
    supplierAddress: "Sunshine Makers, Inc., 15922 Pacific Coast Hwy, Huntington Beach, CA 92649",
    supplierPhone: "(800) 228-0709",
    secondaryContainers: 2,
    secondaryLabeled: true,
    composition: [
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "80–90%" },
      { ingredient: "2-Butoxyethanol", casNumber: "111-76-2", concentration: "1–4%" },
      { ingredient: "Sodium Citrate", casNumber: "6132-04-3", concentration: "1–3%" },
      { ingredient: "Tetrapotassium Pyrophosphate", casNumber: "7320-34-5", concentration: "<1%" },
    ],
    flashPoint: "None (water-based)",
    appearance: "Green liquid",
    odor: "Sassafras-like / mild herbal odor",
    storageRequirements: "Store in original container. Keep container tightly closed. Store at room temperature. Protect from freezing.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush area with water. Slippery when spilled.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Water-based product — essentially non-flammable. No special fire hazards." },
  },
  {
    id: "27",
    productName: "Purple Power Industrial Degreaser",
    manufacturer: "Aiken Chemical Company",
    productCode: "4320P",
    signalWord: "Warning",
    storageLocation: "Parts Washer Station",
    sdsDate: "2025-10-01",
    sdsStatus: "current",
    sdsRevision: "Rev 3",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["exclamation"],
    hazardStatements: [
      "H315: Causes skin irritation",
      "H319: Causes serious eye irritation",
    ],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
      "P280: Wear protective gloves/eye protection",
      "P302+P352: IF ON SKIN: Wash with plenty of soap and water",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Chemical-resistant apron",
      respiratory: "Not required",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air if irritation occurs.",
      skin: "Wash with soap and water. Remove contaminated clothing.",
      eyes: "Rinse cautiously with water for at least 15 minutes.",
      ingestion: "Rinse mouth. Seek medical attention if symptoms occur.",
    },
    storage: "Store in original container. Keep container tightly closed.",
    supplierAddress: "Aiken Chemical Company, 1000 S Cedar St, Greenville, SC 29601",
    supplierPhone: "(800) 845-2085",
    secondaryContainers: 1,
    secondaryLabeled: true,
    composition: [
      { ingredient: "2-Butoxyethanol", casNumber: "111-76-2", concentration: "5–10%" },
      { ingredient: "Sodium Hydroxide", casNumber: "1310-73-2", concentration: "1–5%" },
      { ingredient: "Water", casNumber: "7732-18-5", concentration: "70–85%" },
      { ingredient: "Surfactants (proprietary blend)", casNumber: "Proprietary", concentration: "1–5%" },
    ],
    flashPoint: ">200°F (>93°C)",
    appearance: "Purple liquid",
    odor: "Mild chemical / alkaline odor",
    storageRequirements: "Store in original container. Keep container tightly closed. Store between 40–100°F. Keep from freezing.",
    spillProcedures: "Absorb with inert absorbent material. Collect in waste container. Flush area with water. Slippery when spilled. Alkaline — avoid contact with eyes.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, foam.", specialHazards: "Not classified as flammable. Water-based product. Alkaline — may release irritating fumes when heated." },
  },
  {
    id: "28",
    productName: "Prestone Extended Life Antifreeze",
    manufacturer: "Prestone Products",
    productCode: "AF2100",
    signalWord: "Danger",
    storageLocation: "Bay 2",
    sdsDate: "2025-09-01",
    sdsStatus: "current",
    sdsRevision: "Rev 5",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["skull", "exclamation"],
    hazardStatements: [
      "H301: Toxic if swallowed",
      "H319: Causes serious eye irritation",
    ],
    precautionaryStatements: [
      "P264: Wash hands thoroughly after handling",
      "P270: Do not eat, drink or smoke when using this product",
      "P280: Wear protective gloves/eye protection",
      "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER",
      "P330: Rinse mouth",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Seek medical attention if symptoms persist.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Call poison center immediately. Do NOT induce vomiting unless directed by medical personnel.",
    },
    storage: "Store in original container. Keep container tightly closed. Store in a cool, dry area.",
    supplierAddress: "Prestone Products, 69 Eagle Rd, Danbury, CT 06810",
    supplierPhone: "(888) 269-0750",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Ethylene Glycol", casNumber: "107-21-1", concentration: "90–95%" },
      { ingredient: "Diethylene Glycol", casNumber: "111-46-6", concentration: "1–5%" },
      { ingredient: "Sodium 2-Ethylhexanoate", casNumber: "19766-89-3", concentration: "<1%" },
    ],
    flashPoint: "240°F (116°C)",
    appearance: "Yellow / green liquid",
    odor: "Mild sweet odor",
    storageRequirements: "Store in original container in cool, dry area. Keep container tightly closed. Keep out of reach of children and animals — toxic if swallowed.",
    spillProcedures: "Absorb with inert absorbent (sand, vermiculite). Collect in approved waste containers. Flush area with water. Toxic to animals — do not allow to pool where animals can access. Prevent entry into drains.",
    fireFighting: { extinguishingMedia: "Water spray, dry chemical, CO₂, alcohol-resistant foam.", specialHazards: "Combustible at elevated temperatures. Toxic decomposition: CO, CO₂, aldehydes. Ethylene glycol is toxic — avoid contact." },
  },
  {
    id: "29",
    productName: "CRC QD Electronic Cleaner",
    manufacturer: "CRC Industries",
    productCode: "05103",
    signalWord: "Danger",
    storageLocation: "Bay 2",
    sdsDate: "2025-11-15",
    sdsStatus: "current",
    sdsRevision: "Rev 4",
    dateAdded: "2025-11-20",
    category: "Shop Chemicals",
    pictograms: ["flame", "compressed-gas", "exclamation"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H280: Contains gas under pressure; may explode if heated",
      "H336: May cause drowsiness or dizziness",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P211: Do not spray on an open flame or other ignition source",
      "P251: Do not pierce or burn, even after use",
      "P261: Avoid breathing vapours",
      "P410+P403: Protect from sunlight. Store in a well-ventilated place",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Not required (use in ventilated area)",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, well-ventilated place. Protect from sunlight.",
    supplierAddress: "CRC Industries, 885 Louis Dr, Warminster, PA 18974",
    supplierPhone: "(800) 521-3168",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "1,1-Difluoroethane (HFC-152a)", casNumber: "75-37-6", concentration: "60–80%" },
      { ingredient: "Carbon Dioxide (propellant)", casNumber: "124-38-9", concentration: "10–15%" },
      { ingredient: "Dimethyl Ether", casNumber: "115-10-6", concentration: "5–15%" },
    ],
    flashPoint: "-62°F (-52°C) propellant",
    appearance: "Clear colorless aerosol spray",
    odor: "Faint ethereal odor",
    storageRequirements: "Store in cool, well-ventilated place. Pressurized container — do not expose to temperatures exceeding 120°F. Protect from sunlight. Do not pierce or burn.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Allow vapors to dissipate. Product evaporates quickly — no residue. If liquid collects, absorb with inert absorbent.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam.", specialHazards: "Extremely flammable aerosol. Pressurized container may explode when heated. Gas under pressure. Vapors heavier than air. Decomposition: CO, CO₂, HF (hydrogen fluoride)." },
  },
  {
    id: "30",
    productName: "Rust-Oleum Professional Primer",
    manufacturer: "Rust-Oleum Corporation",
    productCode: "7582838",
    signalWord: "Danger",
    storageLocation: "Detail Bay",
    sdsDate: "\u2014",
    sdsStatus: "missing",
    sdsRevision: "\u2014",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["flame", "exclamation", "health-hazard"],
    hazardStatements: [
      "H222: Extremely flammable aerosol",
      "H229: Pressurized container: May burst if heated",
      "H319: Causes serious eye irritation",
      "H336: May cause drowsiness or dizziness",
      "H373: May cause damage to organs through prolonged or repeated exposure",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P251: Do not pierce or burn, even after use",
      "P261: Avoid breathing vapours",
      "P271: Use only outdoors or in a well-ventilated area",
    ],
    ppe: {
      eyes: "Safety glasses",
      skin: "Not required",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. If symptoms persist, seek medical attention.",
      skin: "Wash with soap and water.",
      eyes: "Rinse with water for at least 15 minutes.",
      ingestion: "Do NOT induce vomiting. Seek medical attention.",
    },
    storage: "Store in a cool, well-ventilated place away from heat and ignition sources.",
    supplierAddress: "Rust-Oleum Corporation, 11 Hawthorn Pkwy, Vernon Hills, IL 60061",
    supplierPhone: "(800) 553-8444",
    secondaryContainers: 1,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Acetone", casNumber: "67-64-1", concentration: "20–30%" },
      { ingredient: "Xylene (mixed isomers)", casNumber: "1330-20-7", concentration: "5–10%" },
      { ingredient: "n-Butyl Acetate", casNumber: "123-86-4", concentration: "5–10%" },
      { ingredient: "Titanium Dioxide", casNumber: "13463-67-7", concentration: "10–15%" },
      { ingredient: "Propane (propellant)", casNumber: "74-98-6", concentration: "10–15%" },
    ],
    flashPoint: "-4°F (-20°C) propellant",
    appearance: "Gray liquid aerosol spray",
    odor: "Strong solvent odor",
    storageRequirements: "Store in cool, well-ventilated place away from heat and ignition sources. Pressurized container — do not expose to temperatures exceeding 120°F. Do not pierce or burn.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Absorb liquid with inert absorbent. Collect in approved waste containers. Prevent entry into drains.",
    fireFighting: { extinguishingMedia: "Dry chemical, CO₂, foam. Do NOT use water stream.", specialHazards: "Extremely flammable aerosol. Pressurized container — may explode when heated. Vapors heavier than air — may travel to ignition source. Toxic decomposition: CO, CO₂." },
  },
  {
    id: "31",
    productName: "3M Bondo Body Filler Hardener (MEKP)",
    manufacturer: "3M Company",
    productCode: "20188",
    signalWord: "Danger",
    storageLocation: "Bay 1",
    sdsDate: "2025-07-15",
    sdsStatus: "current",
    sdsRevision: "Rev 6",
    dateAdded: "2025-06-15",
    category: "Shop Chemicals",
    pictograms: ["corrosion", "flame", "exclamation"],
    hazardStatements: [
      "H226: Flammable liquid and vapour",
      "H242: Heating may cause a fire",
      "H302: Harmful if swallowed",
      "H312: Harmful in contact with skin",
      "H314: Causes severe skin burns and eye damage",
      "H332: Harmful if inhaled",
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames",
      "P234: Keep only in original container",
      "P260: Do not breathe vapours",
      "P280: Wear protective gloves/eye protection/face protection",
      "P303+P361+P353: IF ON SKIN: Remove contaminated clothing. Rinse skin with water",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes",
    ],
    ppe: {
      eyes: "Chemical splash goggles",
      skin: "Chemical-resistant apron",
      respiratory: "Organic vapor respirator",
      hands: "Nitrile gloves",
    },
    firstAid: {
      inhalation: "Move to fresh air. Call physician if symptoms persist.",
      skin: "Remove contaminated clothing immediately. Rinse skin with water for at least 20 minutes. Seek medical attention.",
      eyes: "Flush with water for at least 20 minutes. Seek immediate medical attention.",
      ingestion: "Do NOT induce vomiting. Rinse mouth. Call poison center immediately.",
    },
    storage: "Store in original container in a cool, dry, well-ventilated area. Keep away from heat. Do not store above 80\u00B0F.",
    supplierAddress: "3M Center, St. Paul, MN 55144",
    supplierPhone: "(800) 364-3577",
    secondaryContainers: 0,
    secondaryLabeled: false,
    composition: [
      { ingredient: "Methyl Ethyl Ketone Peroxide (MEKP)", casNumber: "1338-23-4", concentration: "30–50%" },
      { ingredient: "Dimethyl Phthalate", casNumber: "131-11-3", concentration: "40–60%" },
    ],
    flashPoint: "200°F (93°C)",
    appearance: "Clear to slightly yellow liquid",
    odor: "Pungent, acrid chemical odor",
    storageRequirements: "Store in original container in cool, dry, well-ventilated area. Keep away from heat — do not store above 80°F (27°C). Keep away from accelerators, reducing agents, and combustible materials. Organic peroxide — may decompose violently if overheated.",
    spillProcedures: "Eliminate ignition sources. Ventilate area. Do NOT return spilled material to container. Absorb with inert absorbent. Collect in approved waste containers. Corrosive — avoid skin/eye contact. Rinse spill area with water.",
    fireFighting: { extinguishingMedia: "Water spray or fog, dry chemical. Do NOT use CO₂ (may not be effective on organic peroxide fires).", specialHazards: "Organic peroxide — may accelerate fire. Heating may cause fire or explosion. Corrosive to skin and eyes. Decomposition: CO, CO₂, organic acid fumes. Self-accelerating decomposition temperature (SADT) hazard." },
  },
];

// ─── Training Courses (8) ───────────────────────────────────────────────────

export const trainingCourses: TrainingCourse[] = [
  {
    id: "1",
    title: "HazCom Initial Orientation",
    description: "OSHA-required initial HazCom training for all employees \u2014 GHS overview, employee rights, chemical safety basics",
    duration: "15 min",
    required: true,
  },
  {
    id: "2",
    title: "SDS & Label Reading",
    description: "How to read a 16-section SDS and decode GHS label elements \u2014 pictograms, signal words, H/P statements",
    duration: "10 min",
    required: true,
  },
  {
    id: "3",
    title: "Isocyanate Safety for Painters",
    description: "Isocyanate hazards in clearcoats and primers \u2014 proper supplied-air respirator use, exposure monitoring, medical surveillance",
    duration: "12 min",
    required: false,
  },
  {
    id: "4",
    title: "Flammable Materials Handling",
    description: "Safe storage, handling, and transfer of flammable liquids \u2014 grounding/bonding, flammable cabinets, ignition source control",
    duration: "8 min",
    required: true,
  },
  {
    id: "5",
    title: "PPE Selection by Hazard Type",
    description: "Choosing and using proper PPE for chemical hazards \u2014 respirators, gloves, eye protection, coveralls",
    duration: "8 min",
    required: true,
  },
  {
    id: "6",
    title: "Spill Response Procedures",
    description: "Proper spill containment, cleanup procedures, fire extinguisher use, and emergency evacuation routes",
    duration: "10 min",
    required: true,
  },
  {
    id: "7",
    title: "New Chemical: PPG DBC Basecoat",
    description: "Hazards, PPE, and handling procedures for the PPG Deltron DBC basecoat system \u2014 triggered when product was added to inventory",
    duration: "5 min",
    required: false,
  },
  {
    id: "8",
    title: "New Chemical: BASF Glasurit 923-210",
    description: "Hazards, PPE, and handling procedures for the BASF Glasurit 923-210 HS Clearcoat \u2014 triggered Feb 10, 2026",
    duration: "5 min",
    required: false,
  },
];

// ─── Employees ────────────────────────────────────────────────────────────────

export const employees: Employee[] = [
  {
    id: "1",
    name: "Mike Rodriguez",
    initials: "MR",
    role: "Owner / Manager",
    status: "current",
    color: "bg-blue-500",
    hireDate: "2019-03-15",
    trainings: [
      { courseId: "1", status: "completed", completedDate: "2025-08-15" },
      { courseId: "2", status: "completed", completedDate: "2025-08-15" },
      { courseId: "3", status: "completed", completedDate: "2025-08-20" },
      { courseId: "4", status: "completed", completedDate: "2025-09-05" },
      { courseId: "5", status: "completed", completedDate: "2025-09-05" },
      { courseId: "6", status: "completed", completedDate: "2025-09-10" },
      { courseId: "7", status: "completed", completedDate: "2026-02-18" },
      { courseId: "8", status: "completed", completedDate: "2026-02-12" },
    ],
  },
  {
    id: "2",
    name: "Carlos Mendez",
    initials: "CM",
    role: "Body Technician",
    status: "current",
    color: "bg-emerald-500",
    hireDate: "2024-03-22",
    trainings: [
      { courseId: "1", status: "completed", completedDate: "2024-03-25" },
      { courseId: "2", status: "completed", completedDate: "2024-03-25" },
      { courseId: "3", status: "completed", completedDate: "2024-04-02" },
      { courseId: "4", status: "completed", completedDate: "2025-09-05" },
      { courseId: "5", status: "completed", completedDate: "2024-04-02" },
      { courseId: "6", status: "completed", completedDate: "2024-04-05" },
      { courseId: "7", status: "completed", completedDate: "2026-02-18" },
      { courseId: "8", status: "completed", completedDate: "2026-02-12" },
    ],
  },
  {
    id: "3",
    name: "Marcus Thompson",
    initials: "MT",
    role: "Lead Painter",
    status: "overdue",
    color: "bg-orange-500",
    hireDate: "2024-06-10",
    trainings: [
      { courseId: "1", status: "completed", completedDate: "2024-06-12" },
      { courseId: "2", status: "completed", completedDate: "2024-06-12" },
      { courseId: "3", status: "completed", completedDate: "2024-06-18" },
      { courseId: "4", status: "completed", completedDate: "2025-09-05" },
      { courseId: "5", status: "completed", completedDate: "2024-06-18" },
      { courseId: "6", status: "completed", completedDate: "2024-06-20" },
      { courseId: "7", status: "overdue", dueDate: "2026-02-20" },
      { courseId: "8", status: "completed", completedDate: "2026-02-12" },
    ],
  },
  {
    id: "4",
    name: "Jamie Reyes",
    initials: "JR",
    role: "Detail Technician",
    status: "pending",
    color: "bg-purple-500",
    hireDate: "2026-01-27",
    trainings: [
      { courseId: "1", status: "in-progress", dueDate: "2026-02-28" },
      { courseId: "2", status: "not-started", dueDate: "2026-02-28" },
      { courseId: "3", status: "not-started" },
      { courseId: "4", status: "not-started", dueDate: "2026-03-05" },
      { courseId: "5", status: "not-started", dueDate: "2026-03-05" },
      { courseId: "6", status: "not-started", dueDate: "2026-03-05" },
      { courseId: "7", status: "not-started" },
      { courseId: "8", status: "not-started" },
    ],
  },
  {
    id: "5",
    name: "David Park",
    initials: "DP",
    role: "Mechanic",
    status: "current",
    color: "bg-cyan-500",
    hireDate: "2024-08-05",
    trainings: [
      { courseId: "1", status: "completed", completedDate: "2024-08-07" },
      { courseId: "2", status: "completed", completedDate: "2024-08-07" },
      { courseId: "3", status: "not-started" },
      { courseId: "4", status: "completed", completedDate: "2025-09-05" },
      { courseId: "5", status: "completed", completedDate: "2024-08-10" },
      { courseId: "6", status: "completed", completedDate: "2024-08-10" },
      { courseId: "7", status: "completed", completedDate: "2026-02-18" },
      { courseId: "8", status: "not-started" },
    ],
  },
  {
    id: "6",
    name: "Sarah Chen",
    initials: "SC",
    role: "Front Office / Parts",
    status: "current",
    color: "bg-pink-500",
    hireDate: "2025-04-10",
    trainings: [
      { courseId: "1", status: "completed", completedDate: "2025-04-12" },
      { courseId: "2", status: "completed", completedDate: "2025-04-12" },
      { courseId: "3", status: "not-started" },
      { courseId: "4", status: "completed", completedDate: "2025-09-05" },
      { courseId: "5", status: "completed", completedDate: "2025-04-15" },
      { courseId: "6", status: "completed", completedDate: "2025-04-15" },
      { courseId: "7", status: "completed", completedDate: "2026-02-18" },
      { courseId: "8", status: "completed", completedDate: "2026-02-12" },
    ],
  },
];

// ─── Inventory Items ──────────────────────────────────────────────────────────

export const inventoryItems: InventoryItem[] = [
  // Paint Booth A
  { id: "1", product: "PPG Deltron DBC Basecoat (White)", sdsId: "1", location: "Paint Booth A", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "2", product: "PPG Deltron DBC Basecoat (Black)", sdsId: "2", location: "Paint Booth A", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "3", product: "PPG DCU2021 Concept Clearcoat", sdsId: "3", location: "Paint Booth A", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "4", product: "Axalta Cromax Pro WB2030", sdsId: "7", location: "Paint Booth A", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "5", product: "BASF Glasurit 923-210 HS Clear", sdsId: "8", location: "Paint Booth A", containers: 1, containerType: "Quart can", labeled: true, sds: true },

  // Paint Mixing Room
  { id: "6", product: "PPG DT870 Reducer (Medium)", sdsId: "4", location: "Paint Mixing Room", containers: 3, containerType: "Gallon cans", labeled: true, sds: true },
  { id: "7", product: "Klean-Strip Acetone", sdsId: "10", location: "Paint Mixing Room", containers: 2, containerType: "Gallon jugs", labeled: true, sds: true },
  { id: "8", product: "Klean-Strip Lacquer Thinner", sdsId: "12", location: "Paint Mixing Room", containers: 2, containerType: "Gallon jugs", labeled: true, sds: true },

  // Bay 1
  { id: "9", product: "PPG DP48LF Epoxy Primer", sdsId: "5", location: "Bay 1", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "10", product: "3M Adhesive Cleaner 08984", sdsId: "11", location: "Bay 1", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "11", product: "3M Bondo 261 Lightweight Filler", sdsId: "15", location: "Bay 1", containers: 3, containerType: "Quart cans", labeled: true, sds: true },
  { id: "12", product: "Evercoat Rage Gold 112", sdsId: "16", location: "Bay 1", containers: 2, containerType: "Quart cans", labeled: true, sds: true },
  { id: "13", product: "3M Panel Bond 08693", sdsId: "17", location: "Bay 1", containers: 1, containerType: "Cartridge", labeled: true, sds: true },
  { id: "14", product: "SEM Dual-Mix Panel Bond 39747", sdsId: "18", location: "Bay 1", containers: 2, containerType: "Cartridges", labeled: true, sds: true },
  { id: "15", product: "3M Super 77 Spray Adhesive", sdsId: "20", location: "Bay 1", containers: 2, containerType: "Aerosol cans", labeled: true, sds: true },
  { id: "16", product: "3M Bondo Hardener (MEKP)", sdsId: "31", location: "Bay 1", containers: 3, containerType: "Tubes", labeled: true, sds: true },

  // Bay 2
  { id: "17", product: "CRC Brakleen 05089", sdsId: "9", location: "Bay 2", containers: 4, containerType: "Aerosol cans", labeled: true, sds: true },
  { id: "18", product: "Wurth Brake & Parts Cleaner", sdsId: "13", location: "Bay 2", containers: 3, containerType: "Aerosol cans", labeled: true, sds: true },
  { id: "19", product: "WD-40 Multi-Use Product", sdsId: "24", location: "Bay 2", containers: 2, containerType: "Aerosol cans", labeled: true, sds: true },
  { id: "20", product: "Prestone Extended Life Antifreeze", sdsId: "28", location: "Bay 2", containers: 2, containerType: "Gallon jugs", labeled: true, sds: true },
  { id: "21", product: "CRC QD Electronic Cleaner", sdsId: "29", location: "Bay 2", containers: 2, containerType: "Aerosol cans", labeled: true, sds: true },

  // Bay 3
  { id: "22", product: "PPG DX330 Wax & Grease Remover", sdsId: "6", location: "Bay 3", containers: 3, containerType: "Gallon jugs", labeled: true, sds: true },
  { id: "23", product: "SEM Solve 38353", sdsId: "14", location: "Bay 3", containers: 2, containerType: "Gallon jugs", labeled: true, sds: true },
  { id: "24", product: "U-POL Dolphin Glaze", sdsId: "19", location: "Bay 3", containers: 1, containerType: "Quart can", labeled: true, sds: true },

  // Detail Bay
  { id: "25", product: "Meguiar's M105 Ultra-Cut", sdsId: "21", location: "Detail Bay", containers: 1, containerType: "Quart bottle", labeled: true, sds: true },
  { id: "26", product: "Meguiar's M205 Ultra Finishing", sdsId: "22", location: "Detail Bay", containers: 1, containerType: "Quart bottle", labeled: true, sds: true },
  { id: "27", product: "3M Perfect-It Rubbing Compound", sdsId: "23", location: "Detail Bay", containers: 2, containerType: "Quart bottles", labeled: true, sds: true },
  { id: "28", product: "Rust-Oleum Professional Primer", sdsId: "30", location: "Detail Bay", containers: 3, containerType: "Aerosol cans", labeled: false, sds: false },

  // Parts Washer Station
  { id: "29", product: "Purple Power Industrial Degreaser", sdsId: "27", location: "Parts Washer Station", containers: 2, containerType: "5-gal pails", labeled: true, sds: true },

  // Janitor Closet
  { id: "30", product: "Zep Heavy-Duty Citrus Degreaser", sdsId: "25", location: "Janitor Closet", containers: 1, containerType: "Gallon jug", labeled: true, sds: true },
  { id: "31", product: "Simple Green Industrial Cleaner", sdsId: "26", location: "Janitor Closet", containers: 2, containerType: "Spray bottles", labeled: true, sds: true },

  // Front Office / Parts Storage
  { id: "32", product: "PPG DT870 Reducer (backup)", sdsId: "4", location: "Front Office / Parts Storage", containers: 1, containerType: "Gallon can", labeled: true, sds: true },
];

// ─── Computed: Inventory Locations ────────────────────────────────────────────

const locationNames = [
  "Paint Booth A",
  "Paint Mixing Room",
  "Bay 1",
  "Bay 2",
  "Bay 3",
  "Detail Bay",
  "Parts Washer Station",
  "Janitor Closet",
  "Front Office / Parts Storage",
];

export const inventoryLocations = locationNames.map((name) => {
  const items = inventoryItems.filter((i) => i.location === name);
  const totalContainers = items.reduce((sum, i) => sum + i.containers, 0);
  const labeledContainers = items.filter((i) => i.labeled).reduce((sum, i) => sum + i.containers, 0);
  return {
    name,
    chemicals: items.length,
    containers: totalContainers,
    labeled: labeledContainers,
    totalContainers,
  };
});

// ─── Non-Routine Tasks ────────────────────────────────────────────────────────

export const nonRoutineTasks: NonRoutineTask[] = [
  {
    id: "1",
    task: "Cleaning inside spray booth",
    location: "Paint Booth A",
    frequency: "Weekly or as needed between jobs",
    hazards: [
      "Chemical residue exposure (isocyanates, solvents)",
      "Accumulated overspray dust (inhalation hazard)",
      "Slippery surfaces from solvent residue",
    ],
    precautions: [
      "Ventilation system must be running during cleaning",
      "Allow booth to purge for 10 minutes before entry without supplied air",
      "Wet-wipe surfaces \u2014 do NOT dry sweep or blow with compressed air",
      "Bag and seal all waste per hazardous waste disposal procedures",
    ],
    requiredPPE: [
      "Supplied-air respirator or P100 with organic vapor cartridge",
      "Nitrile gloves",
      "Full protective suit (Tyvek or equivalent)",
      "Safety glasses",
    ],
  },
  {
    id: "2",
    task: "Changing parts washer solvent",
    location: "Parts Washer Station",
    frequency: "Monthly or when solvent is visibly contaminated",
    hazards: [
      "Splash hazard during draining and refilling",
      "Skin contact with used solvent (degreaser + contaminants)",
      "Slip hazard from spills",
    ],
    precautions: [
      "Use drum pump for transfer \u2014 no pouring from height",
      "Place absorbent pads around washer base before draining",
      "Drain used solvent into labeled waste drum",
      "Inspect washer basin for damage before refilling",
    ],
    requiredPPE: [
      "Chemical splash goggles",
      "Nitrile gloves (extended cuff)",
      "Chemical-resistant apron",
      "Steel-toe boots",
    ],
  },
  {
    id: "3",
    task: "Handling damaged or leaking containers",
    location: "Any storage area",
    frequency: "As encountered",
    hazards: [
      "Chemical exposure from leaking container",
      "Inhalation of vapors from open/damaged container",
      "Fire risk if flammable material is leaking",
    ],
    precautions: [
      "Do NOT move a leaking container if liquid is pooling \u2014 contain the spill first",
      "Consult SDS Section 6 (Accidental Release) for the specific chemical",
      "Use spill kit absorbent to contain leak before moving",
      "Transfer contents to compatible secondary container and label immediately",
      "Report to supervisor (Mike Rodriguez) and log in ShieldSDS",
    ],
    requiredPPE: [
      "Per SDS for the specific chemical",
      "Minimum: safety glasses, nitrile gloves, organic vapor respirator",
    ],
  },
  {
    id: "4",
    task: "Mixing custom paint formulas in mixing room",
    location: "Paint Mixing Room",
    frequency: "Daily during active paint jobs",
    hazards: [
      "Vapor exposure from open containers during mixing",
      "Flammable atmosphere from solvent vapors",
      "Skin contact with concentrated tints and reducers",
    ],
    precautions: [
      "Mixing room ventilation must be running \u2014 verify airflow before starting",
      "Keep containers closed when not actively pouring",
      "Use scale for accurate mixing \u2014 avoid overfilling cups",
      "No ignition sources in mixing room (phones, sparking tools)",
      "Clean spills immediately with shop towels, dispose in red oily waste can",
    ],
    requiredPPE: [
      "Organic vapor respirator",
      "Nitrile gloves",
      "Safety glasses",
      "Protective coveralls (when mixing isocyanate-containing products)",
    ],
  },
];

// ─── Program Version History ──────────────────────────────────────────────────

export const programVersionHistory = [
  {
    version: "3.2",
    date: "2026-02-20",
    author: "Sarah Chen",
    changes: "Added BASF Glasurit 923-210 HS Clearcoat, added PPG DBC Basecoat, updated employee roster (Jamie Reyes new hire)",
  },
  {
    version: "3.1",
    date: "2025-11-15",
    author: "Sarah Chen",
    changes: "Annual review \u2014 updated SDS dates, removed obsolete chemicals, verified training records",
  },
  {
    version: "3.0",
    date: "2025-03-10",
    author: "Mike Rodriguez",
    changes: "Major revision \u2014 migrated to ShieldSDS digital platform, updated all SDS records, restructured storage locations",
  },
];

// ─── Helper: Compute training stats ──────────────────────────────────────────

export function getEmployeeTrainingStats(emp: Employee) {
  const required = trainingCourses.filter((c) => c.required);
  const completed = emp.trainings.filter((t) => t.status === "completed").length;
  const total = emp.trainings.length;
  const requiredCompleted = emp.trainings.filter(
    (t) => t.status === "completed" && required.some((c) => c.id === t.courseId)
  ).length;
  return { completed, total, requiredCompleted, requiredTotal: required.length };
}

export function getTrainingCourseStats(courseId: string) {
  const completed = employees.filter((e) =>
    e.trainings.some((t) => t.courseId === courseId && t.status === "completed")
  ).length;
  return { completed, total: employees.length };
}

// ─── Helper: Compute compliance ──────────────────────────────────────────────

export function getComplianceData() {
  const totalSDS = sdsEntries.length;
  const currentSDS = sdsEntries.filter((s) => s.sdsStatus === "current").length;
  const missingSDS = sdsEntries.filter((s) => s.sdsStatus === "missing").length;
  const reviewSDS = sdsEntries.filter((s) => s.sdsStatus === "review").length;

  const totalContainers = inventoryItems.reduce((sum, i) => sum + i.containers, 0);
  const labeledContainers = inventoryItems.filter((i) => i.labeled).reduce((sum, i) => sum + i.containers, 0);
  const unlabeledItems = inventoryItems.filter((i) => !i.labeled);

  const totalEmployees = employees.length;
  const fullyTrained = employees.filter((e) => e.status === "current").length;
  const overdueEmployees = employees.filter((e) => e.status === "overdue");
  const pendingEmployees = employees.filter((e) => e.status === "pending");

  const checks = [
    { item: "Written HazCom Program", pass: true, weight: 15 },
    { item: "SDS Accessibility", pass: missingSDS === 0, weight: 20 },
    { item: "Container Labeling", pass: unlabeledItems.length === 0, weight: 20 },
    { item: "Employee Training", pass: overdueEmployees.length === 0 && pendingEmployees.length === 0, weight: 20 },
    { item: "Chemical Inventory", pass: true, weight: 15 },
    { item: "Multi-Employer Communication", pass: true, weight: 10 },
  ];

  const earned = checks.reduce((sum, c) => sum + (c.pass ? c.weight : c.weight * 0.5), 0);
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earned / total) * 100);

  return {
    score,
    totalSDS,
    currentSDS,
    missingSDS,
    reviewSDS,
    totalContainers,
    labeledContainers,
    unlabeledItems,
    totalEmployees,
    fullyTrained,
    overdueEmployees,
    pendingEmployees,
    checks,
  };
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export const recentActivity = [
  {
    id: "1",
    action: "SDS uploaded",
    detail: "BASF Glasurit 923-210 HS Clearcoat \u2014 added by Sarah C.",
    time: "2 hrs ago",
    type: "upload" as const,
  },
  {
    id: "2",
    action: "Training completed",
    detail: "Mike Rodriguez finished New Chemical: BASF Glasurit 923-210",
    time: "4 hrs ago",
    type: "training" as const,
  },
  {
    id: "3",
    action: "Label printed",
    detail: "Klean-Strip Acetone \u2014 Paint Mixing Room secondary label",
    time: "Yesterday",
    type: "label" as const,
  },
  {
    id: "4",
    action: "Missing SDS flagged",
    detail: "Rust-Oleum Professional Primer \u2014 no SDS on file",
    time: "Yesterday",
    type: "warning" as const,
  },
  {
    id: "5",
    action: "New hire added",
    detail: "Jamie Reyes \u2014 Detail Technician, training assigned",
    time: "3 days ago",
    type: "training" as const,
  },
  {
    id: "6",
    action: "Chemical added",
    detail: "BASF Glasurit 923-210 added to Paint Booth A inventory",
    time: "4 days ago",
    type: "chemical" as const,
  },
];

// ─── Action Items ─────────────────────────────────────────────────────────────

export const actionItems = [
  {
    id: "1",
    priority: "high" as const,
    title: "Missing SDS: Rust-Oleum Professional Primer",
    detail: "Chemical is in Detail Bay inventory. Request SDS from manufacturer or upload manually.",
  },
  {
    id: "2",
    priority: "medium" as const,
    title: "Training overdue: Marcus Thompson",
    detail: "New Chemical: PPG DBC Basecoat \u2014 due Feb 20, overdue",
  },
  {
    id: "3",
    priority: "medium" as const,
    title: "New hire training: Jamie Reyes",
    detail: "HazCom Initial Orientation in progress \u2014 5 required courses remaining",
  },
  {
    id: "4",
    priority: "low" as const,
    title: "Reprint labels: 1 container",
    detail: "Detail Bay: Rust-Oleum Professional Primer (3 aerosol cans, unlabeled)",
  },
];

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLog = [
  { time: "Feb 24, 2026 \u2014 9:30 AM", entry: "Training completed: Carlos Mendez \u2014 New Chemical: BASF Glasurit 923-210" },
  { time: "Feb 23, 2026 \u2014 3:15 PM", entry: "SDS uploaded: BASF Glasurit 923-210 HS Clearcoat (Sarah C.)" },
  { time: "Feb 22, 2026 \u2014 2:00 PM", entry: "Label printed: Klean-Strip Acetone secondary container label" },
  { time: "Feb 21, 2026 \u2014 11:00 AM", entry: "Training completed: Mike Rodriguez \u2014 New Chemical: PPG DBC Basecoat" },
  { time: "Feb 20, 2026 \u2014 4:45 PM", entry: "Written HazCom Program updated to v3.2 (Sarah C.)" },
  { time: "Feb 20, 2026 \u2014 2:30 PM", entry: "Training overdue alert: Marcus Thompson \u2014 New Chemical: PPG DBC Basecoat" },
  { time: "Feb 18, 2026 \u2014 10:15 AM", entry: "Training completed: Sarah Chen \u2014 New Chemical: PPG DBC Basecoat" },
  { time: "Feb 16, 2026 \u2014 3:00 PM", entry: "New chemical training triggered: PPG DBC Basecoat \u2014 assigned to all paint area workers" },
  { time: "Feb 12, 2026 \u2014 9:00 AM", entry: "Chemical added: BASF Glasurit 923-210 \u2014 Paint Booth A" },
  { time: "Feb 10, 2026 \u2014 1:30 PM", entry: "New chemical training triggered: BASF Glasurit 923-210 \u2014 assigned to paint booth workers" },
  { time: "Feb 5, 2026 \u2014 11:45 AM", entry: "Inventory reconciled: 32 items across 9 locations verified" },
  { time: "Jan 30, 2026 \u2014 3:30 PM", entry: "Missing SDS flagged: Rust-Oleum Professional Primer \u2014 vendor request sent" },
  { time: "Jan 27, 2026 \u2014 9:15 AM", entry: "New employee added: Jamie Reyes \u2014 Detail Technician" },
  { time: "Jan 27, 2026 \u2014 9:20 AM", entry: "Training assigned: Jamie Reyes \u2014 HazCom Initial Orientation + 4 required courses" },
  { time: "Jan 20, 2026 \u2014 2:00 PM", entry: "Label printed: SEM Dual-Mix Panel Bond 39747 secondary container label" },
  { time: "Jan 15, 2026 \u2014 10:00 AM", entry: "SDS uploaded: SEM Dual-Mix Panel Bond 39747 (Sarah C.)" },
];

// ─── Recent Labels ────────────────────────────────────────────────────────────

export const recentLabels = [
  { product: "Klean-Strip Acetone", sdsId: "10", size: "4\u00D73 GHS", date: "Today" },
  { product: "PPG Deltron DBC Basecoat (White)", sdsId: "1", size: "4\u00D73 GHS", date: "Yesterday" },
  { product: "CRC Brakleen 05089", sdsId: "9", size: "2\u00D71.5 Mini", date: "Yesterday" },
  { product: "3M Bondo 261 Lightweight Filler", sdsId: "15", size: "4\u00D73 GHS", date: "Feb 20" },
  { product: "Simple Green Industrial Cleaner", sdsId: "26", size: "QR-Only 1\u00D71", date: "Feb 19" },
  { product: "SEM Dual-Mix Panel Bond 39747", sdsId: "18", size: "Pipe Wrap", date: "Feb 18" },
  { product: "PPG DX330 Wax & Grease Remover", sdsId: "6", size: "4×3 GHS", date: "Feb 17" },
  { product: "Evercoat Rage Gold 112", sdsId: "16", size: "2×1.5 Mini", date: "Feb 15" },
  { product: "Purple Power Industrial Degreaser", sdsId: "27", size: "4×3 GHS", date: "Feb 14" },
  { product: "WD-40 Multi-Use Product", sdsId: "24", size: "QR-Only 1×1", date: "Feb 12" },
];

// ─── Self-Audit History (seed data) ──────────────────────────────────────────

export interface SelfAuditResult {
  id: string;
  date: string;
  score: number;
  checkedCount: number;
  totalItems: number;
  findings: { area: string; issue: string; resolved: boolean }[];
  auditor: string;
}

export const selfAuditHistory: SelfAuditResult[] = [
  {
    id: "audit-3",
    date: "2026-02-24",
    score: 88,
    checkedCount: 42,
    totalItems: 48,
    findings: [
      { area: "SDS Coverage", issue: "Rust-Oleum Professional Primer SDS missing", resolved: false },
      { area: "Labels", issue: "2 secondary containers in Bay 3 missing labels", resolved: false },
      { area: "Training", issue: "Marcus Thompson overdue on PPG DBC orientation", resolved: false },
      { area: "SDS Access", issue: "Paper backup binder missing 3 recent additions", resolved: true },
    ],
    auditor: "Mike Rodriguez",
  },
  {
    id: "audit-2",
    date: "2026-01-15",
    score: 82,
    checkedCount: 39,
    totalItems: 46,
    findings: [
      { area: "SDS Coverage", issue: "BASF Glasurit 923-210 SDS not yet uploaded", resolved: true },
      { area: "Labels", issue: "Acetone secondary container label faded — reprinted", resolved: true },
      { area: "Training", issue: "Jamie Reyes new hire training incomplete (3 courses)", resolved: true },
      { area: "Contractors", issue: "No contractor packet generated for Jan 10 visit", resolved: true },
      { area: "Emergency Equipment", issue: "Eyewash station in Bay 2 needs inspection tag update", resolved: true },
    ],
    auditor: "Sarah Chen",
  },
  {
    id: "audit-1",
    date: "2025-12-01",
    score: 75,
    checkedCount: 35,
    totalItems: 44,
    findings: [
      { area: "SDS Coverage", issue: "3 SDS documents expired — requested updated versions", resolved: true },
      { area: "Labels", issue: "5 secondary containers unlabeled in Paint Mixing Room", resolved: true },
      { area: "Training", issue: "2 employees missing initial HazCom orientation", resolved: true },
      { area: "Written Program", issue: "HazCom program not updated after adding new chemicals", resolved: true },
      { area: "SDS Access", issue: "Shop tablet not charging — replaced power cable", resolved: true },
      { area: "Emergency Equipment", issue: "Spill kit in Parts Storage low on absorbent", resolved: true },
    ],
    auditor: "Mike Rodriguez",
  },
];

// ─── Notifications (seed data) ───────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "sds" | "training" | "labels" | "osha" | "contractor";
  title: string;
  detail: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export const seedNotifications: Notification[] = [
  {
    id: "n1",
    type: "sds",
    title: "Missing SDS: Rust-Oleum Professional Primer",
    detail: "Vendor request sent 3 days ago — no response yet",
    time: "3 days ago",
    read: false,
    actionLabel: "Follow Up",
    actionHref: "/sds-library",
  },
  {
    id: "n2",
    type: "training",
    title: "Overdue Training: Marcus Thompson",
    detail: "PPG DBC Basecoat orientation — 14 days overdue",
    time: "14 days ago",
    read: false,
    actionLabel: "Send Reminder",
    actionHref: "/training",
  },
  {
    id: "n3",
    type: "labels",
    title: "Labels needed: 3 secondary containers",
    detail: "Bay 3 and Parts Washer Station have unlabeled containers",
    time: "2 days ago",
    read: false,
    actionLabel: "Print Labels",
    actionHref: "/labels",
  },
  {
    id: "n4",
    type: "osha",
    title: "OSHA Update: HazCom 2024 (GHS Rev 7)",
    detail: "Transition deadline approaching — review updated classification criteria",
    time: "1 week ago",
    read: false,
    actionLabel: "Learn More",
  },
  {
    id: "n5",
    type: "contractor",
    title: "Contractor visit: ABC Electrical",
    detail: "Scheduled for next week — safety packet not yet generated",
    time: "5 days ago",
    read: true,
    actionLabel: "Generate Packet",
    actionHref: "/contractors",
  },
];
