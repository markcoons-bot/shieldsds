"use client";

// @ts-nocheck — large inline-styled training component; strict TS types deferred to integration phase
import { useState, useEffect, useRef, useCallback } from "react";
import { getEmployee, updateEmployee, addTrainingRecord } from "@/lib/chemicals";

/* ═══════════════════════════════════════════════════════════════════
   SHIELDSDS HAZCOM TRAINING MODULE v2
   ─────────────────────────────────────
   Company Profile + Foundation Track (Modules 1-7)
   Interactive • Visual-First • Industry-Adaptive • OSHA Compliant
   
   Covers 29 CFR 1910.1200(h) training requirements:
   ✓ HazCom standard requirements
   ✓ Operations where hazardous chemicals are present
   ✓ Location/availability of written program, chemical lists, SDS
   ✓ Methods to detect hazardous chemicals
   ✓ Physical/health hazards of chemicals in work area
   ✓ Protective measures employees can take
   ✓ How to read/use labels and SDS
   ═══════════════════════════════════════════════════════════════════ */

// ── DESIGN TOKENS ──
const T = {
  navy: "#0B1426", navyMid: "#132039", navyLight: "#1A2D4D", navyCard: "#162240",
  amber: "#F5A623", amberBright: "#FFB938", amberDim: "#C4841A", amberGlow: "rgba(245,166,35,0.10)",
  good: "#34C759", goodBg: "rgba(52,199,89,0.12)", goodDim: "#2DA44E",
  warn: "#F5A623", warnBg: "rgba(245,166,35,0.12)",
  bad: "#E8453C", badBg: "rgba(232,69,60,0.12)",
  white: "#FFFFFF", ghost: "rgba(255,255,255,0.92)", muted: "rgba(255,255,255,0.55)",
  gray100: "#F7F8FA", gray200: "#E8ECF1", gray400: "#9CA3AF", gray500: "#6B7280",
  red: "#E8453C", redBg: "rgba(232,69,60,0.10)", redBorder: "#C73A33",
  blue: "#3B82F6", blueBg: "rgba(59,130,246,0.12)",
  purple: "#8B5CF6", purpleBg: "rgba(139,92,246,0.12)",
  font: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'DM Mono', 'Fira Code', monospace",
  radius: 14, radiusSm: 8, radiusLg: 20,
};

// ── INDUSTRY PROFILES ──
const INDUSTRIES = [
  { id:"auto-body", name:"Auto Body / Collision", icon:"🚗",
    desc:"Paint booths, solvents, isocyanates, body fillers",
    chemicals:["Basecoats","Clearcoats","Reducers/Thinners","Body Fillers","Brake Cleaners","Adhesive Promoters"],
    scenarios:["Spray booth isocyanate exposure","Solvent spill in mixing room","Flash fire from thinner vapors"],
    workAreas:["Paint Booth","Mixing Room","Body Bay","Detail Bay","Parts Washer Area"],
    commonPPE:["Supplied-air respirator","Chemical splash goggles","Nitrile gloves","Tyvek paint suit"],
    topHazards:["flame","health-hazard","skull-crossbones"] },
  { id:"janitorial", name:"Janitorial / Cleaning", icon:"🧹",
    desc:"Disinfectants, degreasers, floor strippers, quaternary ammonium",
    chemicals:["Disinfectants","Degreasers","Floor Strippers","Glass Cleaners","Quaternary Ammonium","Bleach"],
    scenarios:["Mixing bleach with ammonia cleaner","Chemical splash while mopping","Burns from undiluted stripper"],
    workAreas:["Supply Closet","Restrooms","Common Areas","Kitchen","Loading Dock"],
    commonPPE:["Safety goggles","Chemical-resistant gloves","Face shield","Rubber apron"],
    topHazards:["corrosion","exclamation","health-hazard"] },
  { id:"contractor", name:"General Contractor", icon:"🔨",
    desc:"Adhesives, sealants, concrete treatments, paints",
    chemicals:["Construction Adhesives","Sealants","Concrete Sealers","Spray Paints","Caulks","Epoxies"],
    scenarios:["Adhesive fumes in enclosed crawlspace","Solvent contact during cleanup","Silica dust during concrete cutting"],
    workAreas:["Job Site","Tool Trailer","Material Storage","Mixing Area","Enclosed Space"],
    commonPPE:["Half-face respirator","Safety glasses","Leather work gloves","Steel-toe boots"],
    topHazards:["flame","exclamation","health-hazard"] },
  { id:"salon", name:"Nail Salon / Beauty", icon:"💅",
    desc:"Acetone, formaldehyde, acrylics, toluene-based products",
    chemicals:["Acetone","Acrylic Monomer (MMA/EMA)","Nail Polish","Gel Removers","Sanitizers","Hair Dye"],
    scenarios:["Acetone spill near client","Poor ventilation with acrylic fumes","Skin sensitization from monomer"],
    workAreas:["Manicure Station","Pedicure Station","Chemical Storage","Ventilation Zone"],
    commonPPE:["N95 respirator","Nitrile gloves","Safety glasses","Local exhaust ventilation"],
    topHazards:["flame","exclamation","health-hazard"] },
  { id:"manufacturing", name:"Manufacturing / Fab", icon:"🏭",
    desc:"Cutting fluids, lubricants, welding gases, acids, solvents",
    chemicals:["Cutting Fluids","Lubricants","Welding Gases","Hydrochloric Acid","Degreasers","Coolants"],
    scenarios:["Coolant mist inhalation at CNC","Acid splash during tank cleaning","Compressed gas cylinder leak"],
    workAreas:["CNC Floor","Welding Bay","Assembly Line","Chemical Storage","QC Lab"],
    commonPPE:["Full-face respirator","Welding helmet","Chemical apron","Steel-toe boots","Hearing protection"],
    topHazards:["corrosion","gas-cylinder","flame"] },
  { id:"property", name:"Property Management", icon:"🏢",
    desc:"Pool chemicals, HVAC treatments, pest control, maintenance",
    chemicals:["Pool Chlorine","HVAC Coil Cleaners","Paint/Stain","Pest Control Products","Drain Cleaners","Refrigerants"],
    scenarios:["Chlorine gas in pool equipment room","Mixing incompatible drain cleaners","Paint fumes in occupied unit"],
    workAreas:["Pool Room","Maintenance Shop","Tenant Units","HVAC Closet","Grounds"],
    commonPPE:["Chemical splash goggles","Rubber gloves","Half-face respirator","Rubber apron"],
    topHazards:["corrosion","exclamation","gas-cylinder"] },
  { id:"restaurant", name:"Restaurant / Food Service", icon:"🍳",
    desc:"Sanitizers, degreasers, oven cleaners, pest control",
    chemicals:["Quaternary Sanitizers","Degreasers","Oven Cleaners","Drain Treatments","Bleach Solutions","Pest Sprays"],
    scenarios:["Oven cleaner burns during deep clean","Sanitizer in eyes from splash-back","Mixing cleaning products"],
    workAreas:["Kitchen","Dish Pit","Storage Room","Grease Trap Area","Dining Floor"],
    commonPPE:["Chemical splash goggles","Nitrile gloves","Rubber apron","Face shield"],
    topHazards:["corrosion","exclamation","health-hazard"] },
  { id:"other", name:"Other Industry", icon:"⚙️",
    desc:"Custom chemical inventory — we'll adapt to your needs",
    chemicals:["Solvents","Acids/Bases","Compressed Gases","Adhesives","Cleaning Products","Paints/Coatings"],
    scenarios:["Chemical spill in work area","Inhalation exposure","Skin or eye contact"],
    workAreas:["Work Area","Storage","Office","Loading Area"],
    commonPPE:["Safety glasses","Chemical-resistant gloves","Respirator","Protective clothing"],
    topHazards:["flame","exclamation","health-hazard"] },
];

// ── OFFICIAL GHS PICTOGRAMS (accurate reproductions of UN standard artwork) ──
// Each pictogram is rendered as a red-bordered diamond with black symbol inside white background
// These match the standardized symbols per the UN GHS Rev.7 / OSHA HCS 2012

const ghsDiamond = (innerSvg: string) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(45 100 100)">
    <rect x="30" y="30" width="140" height="140" fill="white" stroke="#BF0000" stroke-width="8" rx="4"/>
  </g>
  ${innerSvg}
</svg>`;

const GHS_PICTOGRAMS = [
  { id:"flame", code:"GHS02", name:"Flame", 
    meaning:"Flammable liquids, solids, gases, aerosols. Also pyrophoric materials, self-heating, and substances that emit flammable gas on contact with water.",
    examples:"Gasoline, acetone, spray paints, thinners, many solvents",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,100)">
      <path d="M0,-42 C-6,-30 -22,-18 -22,2 C-22,16 -14,28 0,32 C-4,20 2,12 10,6 C14,2 16,8 14,16 C22,10 28,0 28,-8 C28,-24 14,-36 0,-42Z" fill="#000" stroke="none"/>
    </g>`) },

  { id:"skull-crossbones", code:"GHS06", name:"Skull & Crossbones",
    meaning:"Acute toxicity (fatal or toxic). Can cause death or severe illness from single or short-term exposure through ingestion, skin contact, or inhalation.",
    examples:"Methanol, hydrogen cyanide, certain pesticides, strong acids",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,88)">
      <ellipse cx="0" cy="0" rx="22" ry="20" fill="#000"/>
      <ellipse cx="-8" cy="-4" rx="6" ry="6.5" fill="white"/>
      <ellipse cx="8" cy="-4" rx="6" ry="6.5" fill="white"/>
      <ellipse cx="-8" cy="-3" rx="3" ry="3.5" fill="#000"/>
      <ellipse cx="8" cy="-3" rx="3" ry="3.5" fill="#000"/>
      <path d="M-7,10 Q-4,8 0,10 Q4,8 7,10" fill="none" stroke="white" stroke-width="1.5"/>
      <line x1="-5" y1="8" x2="-5" y2="14" stroke="white" stroke-width="1.2"/>
      <line x1="0" y1="9" x2="0" y2="14" stroke="white" stroke-width="1.2"/>
      <line x1="5" y1="8" x2="5" y2="14" stroke="white" stroke-width="1.2"/>
      <path d="M-30,22 L30,22" stroke="#000" stroke-width="6" stroke-linecap="round"/>
      <path d="M-22,14 L22,34" stroke="#000" stroke-width="6" stroke-linecap="round"/>
      <path d="M22,14 L-22,34" stroke="#000" stroke-width="6" stroke-linecap="round"/>
    </g>`) },

  { id:"corrosion", code:"GHS05", name:"Corrosion",
    meaning:"Causes severe skin burns, serious eye damage, or corrodes metals. Contact can destroy living tissue on contact.",
    examples:"Sulfuric acid, sodium hydroxide (lye), hydrochloric acid, drain cleaners",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,90)">
      <path d="M-18,-22 L-8,-22 L-8,-12 C-8,-8 -4,-4 0,-4 L0,-4 C-14,-4 -18,6 -18,14 L-18,18 L18,18 L18,14 C18,6 14,-4 0,-4 L0,-4 C4,-4 8,-8 8,-12 L8,-22 L18,-22 L18,-28 L-18,-28 Z" fill="#000"/>
      <path d="M-20,22 L-14,22 C-14,22 -10,22 -10,26 L-10,32 L-20,32 Z" fill="#000"/>
      <path d="M14,22 L20,22 L20,32 L10,32 L10,26 C10,22 14,22 14,22Z" fill="#000"/>
      <circle cx="-4" cy="-16" r="2" fill="#000" opacity="0.5"/>
      <circle cx="8" cy="-10" r="1.5" fill="#000" opacity="0.5"/>
    </g>`) },

  { id:"exclamation", code:"GHS07", name:"Exclamation Mark",
    meaning:"Irritant (skin and eye), skin sensitizer, acute toxicity (harmful), narcotic effects, respiratory tract irritant.",
    examples:"Many cleaning products, some adhesives, paint thinners, detergents",
    color: "#000",
    svg: ghsDiamond(`<g transform="translate(100,96)">
      <rect x="-6" y="-38" width="12" height="44" rx="6" fill="#000"/>
      <circle cx="0" cy="18" r="7" fill="#000"/>
    </g>`) },

  { id:"health-hazard", code:"GHS08", name:"Health Hazard",
    meaning:"Carcinogen, respiratory sensitizer, reproductive toxicity, target organ toxicity (single/repeated exposure), mutagenicity, aspiration hazard.",
    examples:"Isocyanates, crystalline silica, benzene, formaldehyde, asbestos",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,96)">
      <path d="M0,-34 L6,-34 L6,-10 L18,-10 L18,-4 L6,-4 L6,6 L14,6 L14,14 L4,14 L4,28 L-4,28 L-4,14 L-14,14 L-14,6 L-6,6 L-6,-4 L-18,-4 L-18,-10 L-6,-10 L-6,-34 Z" fill="#000"/>
      <circle cx="0" cy="-28" r="8" fill="#000"/>
      <path d="M-4,-16 L-10,-4 L-6,-4 L-6,6 L-2,6 L-2,-12 Z" fill="white"/>
      <path d="M-10,4 L-14,14 L-6,14 L-6,6 Z" fill="white" opacity="0.6"/>
    </g>`) },

  { id:"exploding-bomb", code:"GHS01", name:"Exploding Bomb",
    meaning:"Explosive. Self-reactive substances and organic peroxides that may cause fire, explosion, or blast effects.",
    examples:"Organic peroxides, some hardeners, ammonium nitrate, TNT",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,98)">
      <circle cx="0" cy="4" r="16" fill="#000"/>
      <path d="M4,-12 Q8,-22 2,-28 Q8,-26 14,-30 Q10,-22 16,-18 Q10,-16 12,-10" fill="#000" stroke="#000" stroke-width="2"/>
      <path d="M-8,-4 L-4,-10 L2,-4 L6,-12 L10,-2 L6,4" fill="none" stroke="white" stroke-width="1.5"/>
      <line x1="12" y1="-30" x2="16" y2="-34" stroke="#000" stroke-width="2"/>
      <line x1="16" y1="-28" x2="20" y2="-30" stroke="#000" stroke-width="1.5"/>
      <line x1="10" y1="-34" x2="12" y2="-38" stroke="#000" stroke-width="1.5"/>
    </g>`) },

  { id:"flame-over-circle", code:"GHS03", name:"Flame Over Circle",
    meaning:"Oxidizer. Can cause or intensify fire. May cause combustion of other materials without an ignition source.",
    examples:"Hydrogen peroxide, nitric acid, pool shock (calcium hypochlorite)",
    color: T.bad,
    svg: ghsDiamond(`<g transform="translate(100,100)">
      <circle cx="0" cy="12" r="16" fill="#000"/>
      <path d="M0,-38 C-4,-28 -16,-16 -16,0 C-16,10 -10,18 0,22 C-2,14 4,8 10,2 C12,0 14,4 12,10 C18,6 22,0 22,-4 C22,-18 10,-30 0,-38Z" fill="#000" stroke="none"/>
    </g>`) },

  { id:"gas-cylinder", code:"GHS04", name:"Gas Cylinder",
    meaning:"Contains gas under pressure. May explode if heated. Liquefied gas may cause cryogenic burns or injury.",
    examples:"Compressed oxygen, nitrogen, acetylene, argon, CO2 tanks",
    color: "#000",
    svg: ghsDiamond(`<g transform="translate(100,96)">
      <rect x="-12" y="-18" width="24" height="46" rx="12" fill="#000"/>
      <rect x="-4" y="-30" width="8" height="14" rx="2" fill="#000"/>
      <line x1="-8" y1="-18" x2="8" y2="-18" stroke="#000" stroke-width="3"/>
      <rect x="-16" y="20" width="32" height="4" rx="2" fill="#000"/>
    </g>`) },

  { id:"environment", code:"GHS09", name:"Environment",
    meaning:"Hazardous to aquatic environment. May cause long-lasting harmful effects to aquatic life. (Non-mandatory in U.S.)",
    examples:"Certain pesticides, heavy metal compounds, oil products, some solvents",
    color: "#000",
    svg: ghsDiamond(`<g transform="translate(100,92)">
      <path d="M-24,18 Q-16,8 -8,14 Q0,18 8,12 Q16,8 24,18" fill="none" stroke="#000" stroke-width="3"/>
      <path d="M-24,24 Q-16,14 -8,20 Q0,24 8,18 Q16,14 24,24" fill="#000" opacity="0.3"/>
      <path d="M-6,-28 C-6,-28 -20,-8 -20,4 C-20,12 -14,18 -6,18 C-2,18 1,16 3,14 L3,14 C-1,10 -8,4 -8,-6" fill="#000"/>
      <path d="M6,-20 C6,-20 -4,-4 -4,6 C-4,12 0,16 6,16 C10,16 14,12 14,6 C14,-4 6,-20 6,-20Z" fill="#000"/>
    </g>`) },
];

// ── MODULE DEFINITIONS ──
const MODULES = [
  { id:"m1", title:"Your Right to Know", subtitle:"Why this training exists & your legal rights", duration:"5 min", icon:"⚖️", color:T.amber, slides:3 },
  { id:"m2", title:"The GHS System", subtitle:"9 pictograms, signal words & hazard classes", duration:"7 min", icon:"💎", color:T.bad, slides:4 },
  { id:"m3", title:"Reading a Chemical Label", subtitle:"Anatomy of a GHS label with your products", duration:"7 min", icon:"🏷️", color:T.blue, slides:4 },
  { id:"m4", title:"Understanding the SDS", subtitle:"16 sections — finding what saves your life", duration:"8 min", icon:"📋", color:T.purple, slides:4 },
  { id:"m5", title:"Protecting Yourself — PPE", subtitle:"Right gear for the job, every time", duration:"7 min", icon:"🛡️", color:T.good, slides:4 },
  { id:"m6", title:"When Things Go Wrong", subtitle:"Spill, exposure & emergency response", duration:"7 min", icon:"🚨", color:T.bad, slides:4 },
  { id:"m7", title:"Your Shop's HazCom Program", subtitle:"Your chemicals, your locations, your plan", duration:"5 min", icon:"📍", color:T.amberBright, slides:4 },
];

// ── QUIZ DATA (industry-adaptive) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getQuizzes = (industry: string | null, companyName: string): Record<string, any[]> => {
  const ind = INDUSTRIES.find(i => i.id === industry) || INDUSTRIES[0];
  return {
    m1: [
      { q: `Under OSHA's HazCom standard, when must ${ind.name.toLowerCase()} workers receive chemical training?`,
        opts: ["Only during annual reviews","Before initial assignment AND when new hazards are introduced","Only after an incident occurs","Within 90 days of hire"],
        correct: 1, explain: "OSHA requires training at initial assignment AND whenever a new chemical hazard is introduced. There's no grace period — training must happen before exposure." },
      { q: "Which of the following is an employer's responsibility under HazCom?",
        opts: ["Providing SDS for every hazardous chemical on site","Letting employees choose their own PPE","Reporting all chemicals to the EPA monthly","Training employees only if they ask for it"],
        correct: 0, explain: "Employers MUST maintain Safety Data Sheets for every hazardous chemical present and make them readily available to all employees." },
      { q: `As a worker at a ${ind.name.toLowerCase()} operation, which of these is YOUR legal right?`,
        opts: ["Refusing any task that involves chemicals","Accessing the SDS for any chemical you work with","Choosing not to attend safety training","Bringing your own chemicals from home"],
        correct: 1, explain: "You have the legal right to access Safety Data Sheets for any chemical in your workplace. This is the foundation of the 'Right to Know' standard." },
    ],
    m2: [
      { q: "How many GHS hazard pictograms exist in the standardized system?",
        opts: ["5","7","9","12"],
        correct: 2, explain: "There are exactly 9 GHS pictograms. Eight are mandatory in the U.S. (the Environment pictogram is non-mandatory). Each represents a specific hazard category." },
      { q: `Which pictogram would you most likely see on ${ind.chemicals[0]?.toLowerCase() || "chemicals"} used in your ${ind.workAreas[0]?.toLowerCase() || "work area"}?`,
        opts: ["Skull & Crossbones — acute toxicity","Health Hazard — long-term health effects","Flame — flammable material","Gas Cylinder — pressurized contents"],
        correct: ind.topHazards[0]==="flame"?2 : ind.topHazards[0]==="corrosion"?0 : ind.topHazards[0]==="health-hazard"?1 : ind.topHazards[0]==="gas-cylinder"?3 : 2,
        explain: `Based on your industry (${ind.name}), the chemicals you work with most commonly carry this pictogram. Always check the actual label — products can have multiple pictograms.` },
      { q: "What is the difference between DANGER and WARNING signal words?",
        opts: ["DANGER is red, WARNING is orange","DANGER means more severe hazard, WARNING means less severe","They mean the same thing in different languages","DANGER is for liquids, WARNING is for solids"],
        correct: 1, explain: "DANGER indicates more severe hazards (could be fatal or cause serious injury). WARNING indicates less severe but still significant hazards. A product never has both." },
    ],
    m3: [
      { q: "Which of these is NOT a required element on a GHS chemical label?",
        opts: ["Product identifier (name)","Hazard pictograms","Supplier's annual revenue","Precautionary statements"],
        correct: 2, explain: "GHS labels require: product identifier, signal word, hazard statement(s), precautionary statement(s), pictogram(s), and supplier information. Financial data is never on a label." },
      { q: `You find a container of ${ind.chemicals[1] || "a chemical product"} in the ${ind.workAreas[0] || "work area"} with no label. What should you do?`,
        opts: ["Use it carefully and look up info later","Don't use it — report it to your supervisor immediately","Smell it to identify the contents","Ask a coworker what they think it is"],
        correct: 1, explain: "NEVER use an unlabeled chemical. OSHA requires every container to have a label. An unlabeled container is a violation — report it immediately so it can be properly identified and labeled." },
      { q: "What does a 'precautionary statement' on a label tell you?",
        opts: ["The price of the product","How to prevent exposure, what to do if exposed, and how to store/dispose of the chemical","The chemical's manufacturing date","Which country the chemical was made in"],
        correct: 1, explain: "Precautionary statements are your action guide — they tell you prevention measures, first aid if exposed, proper storage conditions, and disposal requirements." },
      { q: "A secondary container (like a spray bottle you filled from a larger jug) must be labeled when:",
        opts: ["Only if it contains more than 1 gallon","Only if it's left overnight","If anyone other than the person who filled it might use it","Secondary containers never need labels"],
        correct: 2, explain: "If the chemical leaves your immediate control — meaning someone else might encounter it — the secondary container MUST be labeled with at minimum the product name and hazards." },
    ],
    m4: [
      { q: "How many sections does a GHS-compliant Safety Data Sheet (SDS) have?",
        opts: ["8","12","16","20"],
        correct: 2, explain: "Every SDS has exactly 16 sections in a standardized order set by GHS. This consistent format means once you learn it, you can navigate ANY chemical's SDS." },
      { q: `You splash ${ind.chemicals[0] || "a chemical"} in your eye at the ${ind.workAreas[0] || "work area"}. Which SDS section do you need FIRST?`,
        opts: ["Section 1 — Identification","Section 4 — First-Aid Measures","Section 9 — Physical Properties","Section 16 — Other Information"],
        correct: 1, explain: "Section 4: First-Aid Measures tells you exactly what to do for eye contact, skin contact, inhalation, and ingestion. In an emergency, this is the section that matters most." },
      { q: "Which SDS section tells you what PPE to wear when handling a chemical?",
        opts: ["Section 2 — Hazard Identification","Section 7 — Handling and Storage","Section 8 — Exposure Controls / PPE","Section 15 — Regulatory Information"],
        correct: 2, explain: "Section 8 covers exposure limits AND personal protective equipment. It tells you the exact type of gloves, respirator, eye protection, and clothing needed." },
      { q: "Your supervisor asks you to look up the flash point of a solvent. Which SDS section has this?",
        opts: ["Section 3 — Composition","Section 5 — Fire-Fighting Measures","Section 9 — Physical and Chemical Properties","Section 14 — Transport Information"],
        correct: 2, explain: "Section 9 contains all physical/chemical properties including flash point, boiling point, vapor pressure, pH, and more. Section 5 (Fire-Fighting) covers how to fight a fire, not the flash point itself." },
    ],
    m5: [
      { q: `What determines which type of gloves you should wear when handling ${ind.chemicals[0] || "a chemical"}?`,
        opts: ["Whatever is available in the supply closet","The chemical's SDS Section 8 specifies the glove material","The thickest gloves are always safest","Glove color indicates chemical resistance"],
        correct: 1, explain: "SDS Section 8 specifies the exact glove material (nitrile, butyl rubber, neoprene, etc.) that resists that specific chemical. A latex glove that stops one chemical may dissolve in another." },
      { q: "When should PPE be inspected?",
        opts: ["Once a year during the safety audit","Before each use","Only after a chemical exposure","Only when it looks damaged"],
        correct: 1, explain: "PPE must be inspected BEFORE each use. A tiny pinhole in a glove or a cracked respirator cartridge can mean the difference between protection and exposure. Make it a habit." },
      { q: `In a ${ind.workAreas[0] || "work area"}, which PPE decision is MOST important to get right?`,
        opts: ["Matching PPE color to your uniform","Selecting the right respiratory protection for the chemical vapors present","Choosing the most expensive brand","Using the same PPE for all chemicals"],
        correct: 1, explain: "Respiratory protection is often the most critical PPE decision because inhalation is the fastest route of chemical entry into the body. The wrong cartridge provides zero protection — it's worse than useless because it creates a false sense of safety." },
    ],
    m6: [
      { q: `${ind.chemicals[1] || "A chemical"} spills on the floor of the ${ind.workAreas[0] || "work area"}. What is your FIRST action?`,
        opts: ["Mop it up immediately","Alert others in the area and assess the hazard","Leave the building and call 911","Take a photo for documentation"],
        correct: 1, explain: "First: alert nearby workers to stay clear. Then assess — is it a small spill you can handle with proper PPE, or a large release requiring evacuation? Acting without assessing can put you in danger." },
      { q: "A coworker gets a chemical splash on their skin and it's burning. The eyewash station is 30 feet away. What do you do?",
        opts: ["Walk them to the eyewash station","Start flushing with the nearest clean water source immediately","Apply burn cream from the first aid kit","Wait for emergency responders"],
        correct: 1, explain: "Seconds matter with chemical burns. Use the NEAREST clean water source to begin flushing immediately — sink, hose, shower, water bottle. Don't waste time reaching a distant eyewash when any clean water will help." },
      { q: "Which of these determines whether a spill requires evacuation versus in-house cleanup?",
        opts: ["Whether the boss is watching","The chemical's hazard level, quantity spilled, and whether you have proper cleanup equipment and PPE","The time of day","Whether it happened indoors or outdoors"],
        correct: 1, explain: "A small spill of a low-hazard cleaner with proper supplies? Handle it. A large spill of a highly toxic or flammable chemical without proper PPE or containment? Evacuate and call for help. The SDS Section 6 guides this decision." },
      { q: `After a chemical exposure incident at your ${ind.name.toLowerCase()} workplace, what documentation is required?`,
        opts: ["No documentation needed if nobody was hurt","An incident report including chemical name, exposure type, first aid given, and follow-up actions","Only a verbal report to the supervisor","Documentation is only needed for OSHA inspections"],
        correct: 1, explain: "Every exposure incident must be documented — even minor ones. Records should include the chemical involved, how exposure happened, first aid provided, and medical follow-up. This protects both the employee and employer." },
    ],
    m7: [
      { q: `Where can you access the Safety Data Sheets for chemicals used at ${companyName || "your company"}?`,
        opts: ["Only the supervisor has access","They're available through the company's written HazCom program — physical binder, digital system, or both","They're only available from the manufacturer's website","SDS are only needed during OSHA inspections"],
        correct: 1, explain: "Your employer must make SDS accessible to all employees at all times during the work shift. This can be a physical binder, a digital system like ShieldSDS, or both — but you must be able to access them without asking permission." },
      { q: "When must your employer's written HazCom program be updated?",
        opts: ["Once a year at annual review","Whenever a new hazardous chemical is introduced to the workplace","Only when OSHA conducts an inspection","Every 5 years"],
        correct: 1, explain: "The written HazCom program must be updated whenever new chemicals are introduced, work processes change, or new hazards are identified. It's a living document, not a one-time filing." },
      { q: `A new chemical product arrives at your ${ind.workAreas[0] || "work area"} that you've never used before. What must happen BEFORE you use it?`,
        opts: ["Nothing — just read the label and start working","You must receive training on the new chemical's hazards, PPE requirements, and emergency procedures","Wait 30 days for the chemical to be approved","Ask a coworker who has used it before"],
        correct: 1, explain: "OSHA requires training BEFORE exposure to any new chemical hazard. Your employer must train you on the specific hazards, required PPE, emergency procedures, and where to find the SDS — before you handle it." },
    ],
  };
};

// ── STORAGE KEYS ──
const STORAGE_KEY = "shieldsds-training-v2";

// ── STYLE HELPERS ──
const S = {
  btn: (bg=T.amber, fg=T.navy, disabled=false) => ({
    padding:"14px 28px", background: disabled ? T.navyLight : bg, color: disabled ? T.muted : fg,
    border:"none", borderRadius:T.radius, fontFamily:T.font, fontSize:15, fontWeight:700,
    cursor: disabled?"not-allowed":"pointer", transition:"all 0.2s", letterSpacing:"0.01em",
    opacity: disabled ? 0.5 : 1, display:"inline-flex", alignItems:"center", gap:8,
  }),
  btnOutline: (c=T.amber) => ({
    padding:"12px 24px", background:"transparent", color:c,
    border:`2px solid ${c}`, borderRadius:T.radius, fontFamily:T.font, fontSize:14, fontWeight:600,
    cursor:"pointer", transition:"all 0.2s",
  }),
  card: (bg=T.navyCard) => ({
    background:bg, borderRadius:T.radiusLg, padding:24, border:`1px solid rgba(255,255,255,0.06)`,
  }),
  cardGlow: (c=T.amber) => ({
    background:T.navyCard, borderRadius:T.radiusLg, padding:24,
    border:`1px solid ${c}33`, boxShadow:`0 0 20px ${c}11`,
  }),
  tag: (bg=T.amberGlow, fg=T.amber) => ({
    display:"inline-block", padding:"4px 12px", background:bg, color:fg,
    borderRadius:20, fontSize:12, fontWeight:600, letterSpacing:"0.04em",
  }),
  heading: (size=28) => ({
    fontSize:size, fontWeight:800, color:T.white, margin:0, lineHeight:1.2, letterSpacing:"-0.02em",
  }),
  sub: (size=15) => ({
    fontSize:size, color:T.muted, margin:0, lineHeight:1.6,
  }),
  grid: (cols="repeat(auto-fit, minmax(260px, 1fr))", gap=16) => ({
    display:"grid", gridTemplateColumns:cols, gap,
  }),
  flexCenter: { display:"flex", alignItems:"center", justifyContent:"center" },
  flexBetween: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  flexCol: { display:"flex", flexDirection:"column" },
  fadeIn: { animation:"shieldFadeIn 0.4s ease" },
};

// ── MAIN COMPONENT ──
export default function ShieldSDSTraining() {
  // ── STATE ──
  const [phase, setPhase] = useState("welcome"); // welcome | profile | modules | training | quiz | certificate
  const [industry, setIndustry] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeeCount, setEmployeeCount] = useState(5);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedPictogram, setSelectedPictogram] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matchGame, setMatchGame] = useState<any>({ current:0, score:0, answered:false, selected:null });
  const [transitioning, setTransitioning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [justCompletedAll, setJustCompletedAll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── PERSISTENCE: Load saved state ──
  useEffect(() => {
    const loadState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const empParam = params.get("employee");
        const viewParam = params.get("view");

        // ── EMPLOYEE MODE: check FIRST, before any localStorage ──
        if (empParam) {
          setEmployeeId(empParam);
          const emp = getEmployee(empParam);
          if (emp) {
            setEmployeeName(emp.name);
            setCompanyName("Mike's Auto Body");
            setIndustry("auto-body");
            // Load employee's completed modules
            const empModules = emp.completed_modules.filter(m => m.startsWith("m"));
            if (empModules.length > 0) setCompletedModules(empModules);

            // Bulletproof all-7-complete check
            const allDone = ["m1","m2","m3","m4","m5","m6","m7"].every(m =>
              emp.completed_modules.includes(m)
            );

            if (allDone || viewParam === "certificate") {
              setPhase("certificate");
            } else {
              setPhase("modules");
            }
            // Skip localStorage entirely for employee-linked sessions
            setLoaded(true);
            return;
          }
        }

        // ── STANDALONE MODE: load from localStorage ──
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.industry) setIndustry(saved.industry);
          if (saved.employeeName) setEmployeeName(saved.employeeName);
          if (saved.companyName) setCompanyName(saved.companyName);
          if (saved.employeeCount) setEmployeeCount(saved.employeeCount);
          if (saved.completedModules?.length) setCompletedModules(saved.completedModules);
          // Resume at the right phase
          if (saved.completedModules?.length === 7) {
            setPhase("certificate");
          } else if (saved.industry && saved.employeeName) {
            setPhase("modules");
          }
        }
      } catch {
        // No saved state — fresh start
      }
      setLoaded(true);
    };
    loadState();
  }, []);

  // ── PERSISTENCE: Save state on changes ──
  const saveState = useCallback((overrides: Record<string, unknown> = {}) => {
    const state = {
      industry, employeeName, companyName, employeeCount, completedModules,
      lastAccessed: new Date().toISOString(),
      ...overrides,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* silent fail */ }
  }, [industry, employeeName, companyName, employeeCount, completedModules]);

  // ── TRANSITIONS ──
  const transitionTo = useCallback((newPhase: string, delay=300) => {
    setTransitioning(true);
    setTimeout(() => {
      setPhase(newPhase);
      setTransitioning(false);
      contentRef.current?.scrollTo?.({ top:0 });
      window.scrollTo?.({ top:0, behavior:"smooth" });
    }, delay);
  }, []);

  // ── QUIZ HANDLER ──
  const submitQuiz = () => {
    if (!currentModule) return;
    const quizData = getQuizzes(industry, companyName)?.[currentModule];
    if (!quizData) return;
    let correct = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quizData.forEach((q: any, i: number) => { if (quizAnswers[i] === q.correct) correct++; });
    const score = Math.round((correct / quizData.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score >= 80) {
      const updated = Array.from(new Set([...completedModules, currentModule].filter(Boolean))) as string[];
      if (updated.length === 7 && completedModules.length < 7) {
        setJustCompletedAll(true);
      }
      setCompletedModules(updated);
      saveState({ completedModules: updated });

      // Part B: Update employee record if linked from training page
      if (employeeId) {
        try {
          const emp = getEmployee(employeeId);
          if (emp) {
            const newCompleted = Array.from(new Set([...emp.completed_modules, currentModule]));
            const newPending = emp.pending_modules.filter(m => m !== currentModule);
            const today = new Date().toISOString().split("T")[0];
            updateEmployee(employeeId, {
              completed_modules: newCompleted,
              pending_modules: newPending,
              last_training: today,
              initial_training: emp.initial_training || today,
              ...(newCompleted.length >= 7 ? { status: "current" as const } : {}),
            });
            addTrainingRecord({
              employee_id: employeeId,
              module_id: currentModule,
              completed_date: today,
              score: score,
              certificate_data: newCompleted.length >= 7 ? {
                employee_name: emp.name,
                company_name: companyName || "Mike's Auto Body",
                industry: industry || "auto-body",
                date: today,
              } : null,
            });
          }
        } catch { /* silent fail — training still completes locally */ }
      }
    }
  };

  // ── START MODULE ──
  const startModule = (modId: string) => {
    setCurrentModule(modId);
    setCurrentSlide(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setSelectedPictogram(null);
    setMatchGame({ current:0, score:0, answered:false, selected:null });
    transitionTo("training");
  };

  // ── FINISH MODULE SLIDES → GO TO QUIZ ──
  const goToQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    transitionTo("quiz");
  };

  // ── AFTER QUIZ ──
  const afterQuiz = () => {
    if (completedModules.length === 7 && justCompletedAll) {
      // Just finished the 7th module — show certificate celebration
      setJustCompletedAll(false);
      transitionTo("certificate");
    } else {
      // Still modules remaining or refresher — back to module picker
      transitionTo("modules");
    }
  };

  // ── RESET (for retake) ──
  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const ind = INDUSTRIES.find(i => i.id === industry) || INDUSTRIES[0];

  // ── Don't render until storage check complete ──
  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:T.navy, ...S.flexCenter }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🛡️</div>
        <div style={{ color:T.muted, fontFamily:T.font }}>Loading your training...</div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDER: WELCOME SCREEN
  // ════════════════════════════════════════════════════
  const renderWelcome = () => (
    <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s" }}>
      {/* Hero */}
      <div style={{ textAlign:"center", padding:"48px 20px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:`radial-gradient(ellipse at 50% 0%, ${T.amber}15 0%, transparent 70%)`, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:56, marginBottom:12 }}>🛡️</div>
          <h1 style={{ ...S.heading(36), marginBottom:12 }}>
            <span style={{ color:T.amber }}>Shield</span>SDS Training
          </h1>
          <p style={{ ...S.sub(17), maxWidth:520, margin:"0 auto 8px", color:T.ghost }}>
            Interactive HazCom training that actually matters — built around <em>your</em> chemicals, <em>your</em> industry, <em>your</em> team.
          </p>
          <p style={{ ...S.sub(13), color:T.muted }}>
            Meets OSHA 29 CFR 1910.1200(h) training documentation requirements
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:"flex", justifyContent:"center", gap:32, padding:"0 20px 32px", flexWrap:"wrap" }}>
        {[
          { n:"7", label:"Core Modules" },
          { n:"~45", label:"Minutes Total" },
          { n:"9", label:"GHS Pictograms" },
          { n:"100%", label:"Industry-Specific" },
        ].map((s,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:800, color:T.amber, fontFamily:T.font }}>{s.n}</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* What you'll learn */}
      <div style={{ padding:"0 20px 32px", maxWidth:680, margin:"0 auto" }}>
        <div style={{ ...S.card(T.navyMid), padding:28 }}>
          <h3 style={{ ...S.heading(18), marginBottom:16 }}>What You&apos;ll Learn</h3>
          <div style={{ ...S.grid("1fr 1fr", 12) }}>
            {[
              { icon:"⚖️", text:"Your legal rights under OSHA" },
              { icon:"💎", text:"Reading GHS pictograms & labels" },
              { icon:"📋", text:"Finding critical info in an SDS" },
              { icon:"🛡️", text:"Choosing the right PPE" },
              { icon:"🚨", text:"Spill & exposure response" },
              { icon:"📍", text:"Your shop's specific chemicals" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0" }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <span style={{ fontSize:14, color:T.ghost, fontFamily:T.font }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Infographic: Why this matters */}
      <div style={{ padding:"0 20px 32px", maxWidth:680, margin:"0 auto" }}>
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.bad}18, ${T.navyCard})`, border:`1px solid ${T.bad}33`, padding:28 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
            <div style={{ fontSize:36, lineHeight:1 }}>⚠️</div>
            <div>
              <h3 style={{ ...S.heading(17), color:T.amberBright, marginBottom:8 }}>Why Chemical Safety Training Matters</h3>
              <div style={{ ...S.grid("1fr 1fr 1fr", 16), marginTop:12 }}>
                {[
                  { stat:"~50,000", desc:"chemical-related injuries per year in U.S. workplaces" },
                  { stat:"#2", desc:"HazCom is OSHA's 2nd most-cited violation every year" },
                  { stat:"$14K+", desc:"average OSHA fine per serious HazCom violation" },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:T.white, fontFamily:T.font }}>{s.stat}</div>
                    <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4, lineHeight:1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign:"center", padding:"0 20px 48px" }}>
        <button onClick={() => transitionTo("profile")} style={{ ...S.btn(T.amber, T.navy), fontSize:17, padding:"16px 40px" }}>
          Start Your Training →
        </button>
        <p style={{ ...S.sub(12), marginTop:12 }}>Progress saves automatically — come back anytime</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDER: COMPANY PROFILE SETUP
  // ════════════════════════════════════════════════════
  const renderProfile = () => (
    <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s", padding:"32px 20px", maxWidth:720, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <span style={S.tag()}>STEP 1 OF 2</span>
        <h2 style={{ ...S.heading(28), marginTop:12 }}>Select Your Industry</h2>
        <p style={S.sub()}>This customizes your entire training with relevant chemicals, scenarios, and PPE.</p>
      </div>

      {/* Industry grid */}
      <div style={{ ...S.grid("repeat(auto-fit, minmax(200px, 1fr))", 12), marginBottom:32 }}>
        {INDUSTRIES.map(ind => {
          const active = industry === ind.id;
          return (
            <button key={ind.id} onClick={() => setIndustry(ind.id)} style={{
              ...S.card(active ? T.navyLight : T.navyCard),
              border: active ? `2px solid ${T.amber}` : `1px solid rgba(255,255,255,0.06)`,
              cursor:"pointer", textAlign:"left", transition:"all 0.2s",
              boxShadow: active ? `0 0 24px ${T.amber}22` : "none",
            }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{ind.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color: active ? T.amber : T.white, fontFamily:T.font, marginBottom:4 }}>{ind.name}</div>
              <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.4 }}>{ind.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Industry preview */}
      {industry && (
        <div style={{ ...S.cardGlow(T.amber), marginBottom:32, animation:"shieldFadeIn 0.3s ease" }}>
          <div style={{ ...S.flexBetween, marginBottom:16 }}>
            <h3 style={S.heading(17)}>
              {INDUSTRIES.find(i=>i.id===industry)?.icon} Training Preview: {INDUSTRIES.find(i=>i.id===industry)?.name}
            </h3>
          </div>
          <div style={{ ...S.grid("1fr 1fr", 20) }}>
            <div>
              <div style={{ ...S.tag(T.badBg, T.bad), marginBottom:8 }}>COMMON SCENARIOS</div>
              {INDUSTRIES.find(i=>i.id===industry)?.scenarios.map((s,i) => (
                <div key={i} style={{ fontSize:13, color:T.ghost, fontFamily:T.font, padding:"4px 0", display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ color:T.amber, fontSize:14, lineHeight:1 }}>▸</span> {s}
                </div>
              ))}
            </div>
            <div>
              <div style={{ ...S.tag(T.goodBg, T.good), marginBottom:8 }}>YOUR PPE</div>
              {INDUSTRIES.find(i=>i.id===industry)?.commonPPE.map((p,i) => (
                <div key={i} style={{ fontSize:13, color:T.ghost, fontFamily:T.font, padding:"4px 0", display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ color:T.good, fontSize:14, lineHeight:1 }}>✓</span> {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee info */}
      {industry && (
        <div style={{ ...S.card(), marginBottom:32, animation:"shieldFadeIn 0.3s ease" }}>
          <span style={S.tag()}>STEP 2 OF 2</span>
          <h3 style={{ ...S.heading(17), marginTop:12, marginBottom:16 }}>Employee & Company Info</h3>
          <div style={{ ...S.grid("1fr 1fr", 16) }}>
            <div>
              <label style={{ fontSize:12, color:T.muted, fontFamily:T.font, display:"block", marginBottom:6 }}>Your Name *</label>
              <input value={employeeName} onChange={e => setEmployeeName(e.target.value)} placeholder="First and Last Name"
                style={{ width:"100%", padding:"12px 16px", background:T.navyMid, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:T.radiusSm, color:T.white, fontFamily:T.font, fontSize:15, outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:T.muted, fontFamily:T.font, display:"block", marginBottom:6 }}>Company Name *</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your Business Name"
                style={{ width:"100%", padding:"12px 16px", background:T.navyMid, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:T.radiusSm, color:T.white, fontFamily:T.font, fontSize:15, outline:"none", boxSizing:"border-box" }}
              />
            </div>
          </div>
          <div style={{ marginTop:16 }}>
            <label style={{ fontSize:12, color:T.muted, fontFamily:T.font, display:"block", marginBottom:6 }}>Number of Employees: <strong style={{ color:T.amber }}>{employeeCount}</strong></label>
            <input type="range" min={1} max={100} value={employeeCount} onChange={e => setEmployeeCount(+e.target.value)}
              style={{ width:"100%", accentColor:T.amber }}
            />
          </div>
        </div>
      )}

      {/* Continue */}
      {industry && employeeName.trim() && companyName.trim() && (
        <div style={{ textAlign:"center", animation:"shieldFadeIn 0.3s ease" }}>
          <button onClick={() => { saveState(); transitionTo("modules"); }} style={{ ...S.btn(T.amber, T.navy), fontSize:16, padding:"16px 36px" }}>
            Begin Foundation Track →
          </button>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDER: MODULE OVERVIEW (Smart Module Picker)
  // ════════════════════════════════════════════════════
  const renderModuleOverview = () => {
    const progressPct = Math.round((completedModules.length / 7) * 100);
    const incompleteModules = MODULES.filter(m => !completedModules.includes(m.id));
    const completedModuleList = MODULES.filter(m => completedModules.includes(m.id));
    const allDone = completedModules.length === 7;
    const noneStarted = completedModules.length === 0;
    const almostDone = completedModules.length >= 5 && !allDone;
    const lastModule = incompleteModules.length === 1;

    // Header text
    const headerText = allDone ? "🎉 Training Complete!" : noneStarted ? "Welcome! Let\u2019s Get Started" : almostDone ? "Almost Done!" : "Complete Your Training";
    const subText = allDone
      ? "Your training is current. Select any module below for a refresher."
      : noneStarted
        ? `Hi ${employeeName.split(" ")[0]}! Complete all 7 modules to earn your HazCom certificate.`
        : lastModule
          ? `One module left, ${employeeName.split(" ")[0]}! Finish it to complete your training.`
          : `Hi ${employeeName.split(" ")[0]}! ${7 - completedModules.length} modules remaining.`;

    // Module card renderer
    const renderModCard = (mod: typeof MODULES[0], opts: { highlight?: boolean; dimmed?: boolean } = {}) => {
      const done = completedModules.includes(mod.id);
      const isHighlight = opts.highlight && !done;
      return (
        <div key={mod.id} style={{
          ...S.card(done ? T.navyCard : isHighlight ? T.navyLight : T.navyLight),
          display:"flex", alignItems:"center", gap:16, padding: isHighlight ? "20px 24px" : "16px 20px",
          border: isHighlight ? `2px solid ${T.amber}88` : done ? `1px solid ${T.good}33` : `1px solid rgba(255,255,255,0.08)`,
          boxShadow: isHighlight ? `0 0 24px ${T.amber}22` : "none",
          cursor:"pointer", transition:"all 0.2s",
        }} onClick={() => startModule(mod.id)}>
          <div style={{
            width: isHighlight ? 56 : 48, height: isHighlight ? 56 : 48, borderRadius:12, ...S.flexCenter,
            background: done ? T.goodBg : T.amberGlow,
            fontSize: isHighlight ? 28 : 24, flexShrink:0,
          }}>
            {done ? "✅" : mod.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ ...S.flexBetween }}>
              <span style={{ fontSize: isHighlight ? 17 : 15, fontWeight:700, color: done ? T.good : T.ghost, fontFamily:T.font }}>{mod.title}</span>
              <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>{mod.duration}</span>
            </div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:2 }}>{mod.subtitle}</div>
          </div>
          <div>
            {done && <span style={{ ...S.tag(T.goodBg, T.good), fontSize:10 }}>PASSED</span>}
            {!done && <span style={{ ...S.tag(T.amberGlow, T.amber), fontSize: isHighlight ? 12 : 10 }}>START →</span>}
          </div>
        </div>
      );
    };

    return (
      <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s", padding:"32px 20px", maxWidth:720, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h2 style={{ ...S.heading(allDone ? 28 : 24), marginBottom:8 }}>{headerText}</h2>
          <p style={{ ...S.sub(14), maxWidth:480, margin:"0 auto" }}>{subText}</p>
          {!allDone && (
            <p style={{ ...S.sub(12), marginTop:4 }}>
              {ind.icon} {ind.name} · {employeeName}
            </p>
          )}
        </div>

        {/* Progress bar (not shown when all done) */}
        {!allDone && (
          <div style={{ marginBottom:28 }}>
            <div style={{ ...S.flexBetween, marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.ghost, fontFamily:T.font }}>{completedModules.length} of 7 complete</span>
              <span style={{ fontSize:12, fontWeight:700, color: progressPct >= 70 ? T.good : T.amber, fontFamily:T.font }}>{progressPct}%</span>
            </div>
            <div style={{ background:T.navyLight, borderRadius:8, height:10, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progressPct}%`, background:`linear-gradient(90deg, ${T.amber}, ${progressPct >= 70 ? T.good : T.amberBright})`, borderRadius:8, transition:"width 0.6s ease" }} />
            </div>
          </div>
        )}

        {/* ── ALL COMPLETE: Certificate + Refresher ── */}
        {allDone && (
          <>
            {/* Certificate CTA */}
            <div style={{ ...S.card(T.goodBg), padding:28, border:`1px solid ${T.good}44`, textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎓</div>
              <h3 style={{ ...S.heading(20), color:T.good, marginBottom:8 }}>All 7 Modules Passed</h3>
              <p style={{ ...S.sub(13), marginBottom:20 }}>
                {employeeName} has completed OSHA HazCom Safety Training.
              </p>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={() => transitionTo("certificate")} style={{ ...S.btn(T.good, T.white), fontSize:15 }}>
                  🎓 View Certificate
                </button>
                <button onClick={() => {
                  const certEl = document.getElementById("shield-certificate");
                  if (certEl) { window.print?.(); return; }
                  transitionTo("certificate");
                  setTimeout(() => window.print?.(), 500);
                }} style={S.btnOutline(T.good)}>
                  🖨️ Print Certificate
                </button>
              </div>
            </div>

            {/* Refresher section */}
            <div style={{ marginBottom:8 }}>
              <h3 style={{ ...S.heading(18), marginBottom:4 }}>Refresher Training</h3>
              <p style={{ ...S.sub(13), marginBottom:16 }}>Select any module below for a review. Completing a quiz updates your training date.</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {MODULES.map(mod => (
                <div key={mod.id} style={{
                  ...S.card(T.navyLight), display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                  border:`1px solid rgba(255,255,255,0.06)`, cursor:"pointer", transition:"all 0.2s",
                }} onClick={() => startModule(mod.id)}>
                  <div style={{ width:40, height:40, borderRadius:10, ...S.flexCenter, background:T.amberGlow, fontSize:20, flexShrink:0 }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:T.ghost, fontFamily:T.font }}>{mod.title}</span>
                    <div style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>{mod.duration}</div>
                  </div>
                  <span style={{ ...S.tag(T.amberGlow, T.amber), fontSize:10 }}>REVIEW →</span>
                </div>
              ))}
            </div>

            {/* Back to training */}
            {employeeId && (
              <div style={{ textAlign:"center", marginTop:24 }}>
                <a href="/training" style={{ color:T.muted, fontSize:13, fontFamily:T.font, textDecoration:"none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                  ← Back to Training Dashboard
                </a>
              </div>
            )}
          </>
        )}

        {/* ── INCOMPLETE: Show modules to do ── */}
        {!allDone && (
          <>
            {/* Last module callout */}
            {lastModule && (
              <div style={{ ...S.card(T.amberGlow), padding:"14px 20px", marginBottom:16, border:`1px solid ${T.amber}44`, textAlign:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:T.amber, fontFamily:T.font }}>
                  🏁 Last module! Complete this to finish your training and earn your certificate.
                </span>
              </div>
            )}

            {/* Incomplete module cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
              {incompleteModules.map((mod, idx) => renderModCard(mod, {
                highlight: lastModule || (noneStarted && idx === 0),
              }))}
            </div>

            {/* Completed modules — collapsible */}
            {completedModuleList.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompletedSection(!showCompletedSection)}
                  style={{
                    background:"none", border:"none", cursor:"pointer", padding:"10px 0",
                    display:"flex", alignItems:"center", gap:8, width:"100%",
                    fontFamily:T.font, fontSize:14, fontWeight:600, color:T.good,
                  }}
                >
                  <span>✅ Completed ({completedModuleList.length} of 7)</span>
                  <span style={{ fontSize:10, color:T.muted, transition:"transform 0.2s", transform: showCompletedSection ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                </button>
                {showCompletedSection && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, paddingLeft:8, animation:"shieldFadeIn 0.2s ease" }}>
                    {completedModuleList.map(mod => (
                      <div key={mod.id} style={{
                        display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
                        background:T.navyCard, borderRadius:T.radiusSm, border:`1px solid ${T.good}22`,
                        cursor:"pointer", transition:"all 0.2s",
                      }} onClick={() => startModule(mod.id)}>
                        <span style={{ fontSize:16 }}>✅</span>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:T.good, fontFamily:T.font }}>{mod.title}</span>
                        </div>
                        <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>Passed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Save indicator */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <p style={{ ...S.sub(12) }}>💾 Progress saves automatically — close and return anytime</p>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // MODULE SLIDE CONTENT
  // ════════════════════════════════════════════════════

  // Helper: Interactive label element for Module 3
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LabelElement = ({ n, label, color, detail, example, children, sel, setSel }: { n: number; label: string; color: string; detail: string; example: string; children?: any; sel: string | null; setSel: (v: string | null) => void }) => {
    const isOpen = sel === `label-${n}`;
    return (
      <div style={{ marginBottom:12, position:"relative" }}>
        <div 
          onClick={() => setSel(isOpen ? null : `label-${n}`)}
          style={{
            padding:"10px 14px", borderRadius:T.radiusSm, cursor:"pointer", transition:"all 0.2s",
            border: isOpen ? `2px solid ${color}` : `1.5px dashed ${color}55`,
            background: isOpen ? `${color}10` : "transparent",
          }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{
              width:24, height:24, borderRadius:12, ...S.flexCenter, flexShrink:0,
              background:color, color:"white", fontSize:12, fontWeight:800, fontFamily:T.font,
            }}>{n}</div>
            <span style={{ fontSize:12, fontWeight:700, color, fontFamily:T.font, letterSpacing:"0.03em" }}>{label}</span>
          </div>
          {children}
        </div>
        {isOpen && (
          <div style={{ marginTop:6, padding:"10px 14px", background:T.navyMid, borderRadius:T.radiusSm, border:`1px solid ${color}33`, animation:"shieldFadeIn 0.25s ease" }}>
            <div style={{ fontSize:12, color:T.ghost, fontFamily:T.font, lineHeight:1.6, marginBottom:4 }}>{detail}</div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, fontStyle:"italic" }}>{example}</div>
          </div>
        )}
      </div>
    );
  };

  const getModuleSlides = (moduleId: string) => {
    if (moduleId === "m1") return getModule1Slides();
    if (moduleId === "m2") return getModule2Slides();
    if (moduleId === "m3") return getModule3Slides();
    if (moduleId === "m4") return getModule4Slides();
    if (moduleId === "m5") return getModule5Slides();
    if (moduleId === "m6") return getModule6Slides();
    if (moduleId === "m7") return getModule7Slides();
    return [<div key="placeholder" style={{ textAlign:"center", padding:48 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🚧</div>
      <h3 style={S.heading(22)}>Coming in Next Build</h3>
      <p style={S.sub()}>This module&apos;s interactive content is being developed.</p>
    </div>];
  };

  // ── MODULE 1: YOUR RIGHT TO KNOW ──
  const getModule1Slides = () => {
    return [
      // SLIDE 1: The Hook
      <div key="m1s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.bad}12, ${T.navyCard})`, border:`1px solid ${T.bad}22`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>⚠️</div>
            <h3 style={{ ...S.heading(22), color:T.amberBright }}>Every year, thousands of workers are injured by chemicals they didn&apos;t know were dangerous.</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:500, margin:"0 auto 24px" }}>
            That&apos;s why OSHA created the Hazard Communication Standard — your legal right to know every hazard in your workplace.
          </p>
          <div style={{ ...S.grid("1fr 1fr 1fr", 12) }}>
            {[
              { icon:"🔍", title:"KNOW the hazards", desc:"Every chemical you work with has documented dangers" },
              { icon:"🛡️", title:"KNOW the protection", desc:"The right PPE and safety measures for each chemical" },
              { icon:"🚨", title:"KNOW the response", desc:"What to do if something goes wrong — spills, exposure, fire" },
            ].map((p,i) => (
              <div key={i} style={{ ...S.card(T.navyMid), textAlign:"center", padding:20 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{p.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:6 }}>{p.title}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...S.card(T.navyMid), padding:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>💡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>This isn&apos;t just a regulation</strong> — it&apos;s your personal shield. The more you know about the chemicals around you, the safer you and your coworkers go home every night.
          </span>
        </div>
      </div>,

      // SLIDE 2: What OSHA Requires
      <div key="m1s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.blueBg, T.blue)}>OSHA 29 CFR 1910.1200</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>The Hazard Communication Standard</h3>
          <p style={{ ...S.sub(14), marginTop:8 }}>
            Also known as the &quot;Right to Know&quot; law — here&apos;s what your employer MUST provide:
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { num:"1", title:"Written HazCom Program", desc:"A documented plan describing how your workplace handles chemical safety — chemical list, labeling procedures, training schedule.", icon:"📝", color:T.amber },
            { num:"2", title:"Safety Data Sheets (SDS)", desc:"A detailed 16-section document for EVERY hazardous chemical on site. Must be accessible to you at all times — not locked in an office.", icon:"📋", color:T.blue },
            { num:"3", title:"Container Labels", desc:"Every chemical container must have a GHS-compliant label showing the product name, hazard pictograms, signal word, and precautionary statements.", icon:"🏷️", color:T.purple },
            { num:"4", title:"Employee Training", desc:"That's what you're doing right now! Training before you work with chemicals, and whenever a NEW chemical is brought in.", icon:"🎓", color:T.good },
          ].map((item,i) => (
            <div key={i} style={{ ...S.card(T.navyMid), display:"flex", gap:16, padding:18, alignItems:"flex-start" }}>
              <div style={{
                width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0,
                background:`${item.color}18`, border:`1px solid ${item.color}44`,
              }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:T.font, marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:13, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(), background:`${T.amber}10`, border:`1px solid ${T.amber}33`, marginTop:16, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Key Point:</strong> If your employer can&apos;t show you an SDS for a chemical you work with, that&apos;s a violation. You have the right to request it.
          </span>
        </div>
      </div>,

      // SLIDE 3: Your Rights (Industry-specific)
      <div key="m1s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.goodBg, T.good)}>YOUR RIGHTS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>As a {ind.name} Worker, You Have the Right To:</h3>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {[
            `Access SDS for every chemical in your ${ind.workAreas[0] || "work area"} — at any time`,
            "Receive training BEFORE being exposed to any new chemical hazard",
            "Know the specific health risks of every chemical you handle",
            "Refuse work with a chemical until you've received proper training",
            "File a complaint with OSHA if your employer isn't following HazCom requirements — retaliation is illegal",
          ].map((right, i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 16px", background:T.navyMid, borderRadius:T.radiusSm, border:`1px solid ${T.good}22` }}>
              <span style={{ color:T.good, fontSize:18, lineHeight:1, flexShrink:0 }}>✓</span>
              <span style={{ fontSize:14, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>{right}</span>
            </div>
          ))}
        </div>

        {/* Industry callout */}
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.amber}10, ${T.navyCard})`, border:`1px solid ${T.amber}33`, padding:20 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <span style={{ fontSize:28, flexShrink:0 }}>{ind.icon}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:6 }}>
                In your industry ({ind.name}), you may encounter:
              </div>
              <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.7 }}>
                {ind.chemicals.join(" · ")}
              </div>
              <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:8, lineHeight:1.5 }}>
                Each of these has specific hazards, and you have the right to know about every single one. In the next modules, you&apos;ll learn exactly how to read the labels and SDS for these products.
              </div>
            </div>
          </div>
        </div>
      </div>,
    ];
  };

  // ── MODULE 2: THE GHS SYSTEM ──
  const getModule2Slides = () => {
    const matchChallenges = [
      { desc: "This chemical can catch fire easily and burns rapidly", answer: "flame" },
      { desc: "Long-term exposure may cause cancer or organ damage", answer: "health-hazard" },
      { desc: "Contact causes severe skin burns or eye damage", answer: "corrosion" },
    ];
    
    return [
      // SLIDE 1: Signal Words
      <div key="m2s1">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.badBg, T.bad)}>GHS BASICS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Two Words That Tell You Everything</h3>
          <p style={S.sub()}>Every GHS label has one of two signal words — and they&apos;re NOT interchangeable.</p>
        </div>

        <div style={{ ...S.grid("1fr 1fr", 16), marginBottom:24 }}>
          <div style={{ ...S.card(), background:`${T.bad}15`, border:`2px solid ${T.bad}`, textAlign:"center", padding:28 }}>
            <div style={{ fontSize:36, fontWeight:900, color:T.bad, fontFamily:T.font, letterSpacing:"0.1em", marginBottom:12 }}>⚠️ DANGER</div>
            <div style={{ fontSize:14, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>
              Reserved for the <strong style={{ color:T.bad }}>most severe</strong> hazards. This chemical could be fatal, cause serious injury, or is highly flammable/explosive.
            </div>
            <div style={{ marginTop:12, padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
              <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>Example: concentrated acids, isocyanates, methanol</span>
            </div>
          </div>
          <div style={{ ...S.card(), background:`${T.amber}10`, border:`2px solid ${T.amber}`, textAlign:"center", padding:28 }}>
            <div style={{ fontSize:36, fontWeight:900, color:T.amber, fontFamily:T.font, letterSpacing:"0.1em", marginBottom:12 }}>⚠️ WARNING</div>
            <div style={{ fontSize:14, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>
              For <strong style={{ color:T.amber }}>less severe</strong> but still significant hazards. Can cause irritation, minor burns, or health effects.
            </div>
            <div style={{ marginTop:12, padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
              <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>Example: many cleaners, adhesives, some paints</span>
            </div>
          </div>
        </div>

        <div style={{ ...S.card(T.navyMid), padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>💡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Key Rule:</strong> A chemical label will NEVER show both DANGER and WARNING. Only the more severe signal word appears. No signal word? The product may still have pictograms — always check!
          </span>
        </div>
      </div>,

      // SLIDE 2: Interactive Pictogram Gallery
      <div key="m2s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.badBg, T.bad)}>THE 9 GHS PICTOGRAMS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Tap Any Symbol to Learn What It Means</h3>
          <p style={S.sub()}>These red diamonds appear on chemical labels worldwide. Each one warns of a specific type of hazard.</p>
        </div>

        <div style={{ ...S.grid("repeat(auto-fit, minmax(90px, 1fr))", 10), marginBottom:20 }}>
          {GHS_PICTOGRAMS.map(p => {
            const active = selectedPictogram === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPictogram(active ? null : p.id)} style={{
                background: active ? `${T.bad}20` : T.navyMid,
                border: active ? `2px solid ${T.bad}` : `1px solid rgba(255,255,255,0.08)`,
                borderRadius:T.radius, padding:10, cursor:"pointer", textAlign:"center",
                transition:"all 0.2s", transform: active ? "scale(1.05)" : "scale(1)",
              }}>
                <div style={{ width:60, height:60, margin:"0 auto 6px" }}
                  dangerouslySetInnerHTML={{ __html: p.svg }} />
                <div style={{ fontSize:10, color: active ? T.amberBright : T.muted, fontFamily:T.font, fontWeight:600 }}>
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedPictogram && (() => {
          const p = GHS_PICTOGRAMS.find(pg => pg.id === selectedPictogram);
          if (!p) return null;
          return (
            <div style={{ ...S.cardGlow(T.bad), padding:20, animation:"shieldFadeIn 0.3s ease" }}>
              <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:80, height:80, flexShrink:0 }} dangerouslySetInnerHTML={{ __html: p.svg }} />
                <div>
                  <div style={{ ...S.flexBetween, marginBottom:4 }}>
                    <span style={{ fontSize:17, fontWeight:700, color:T.white, fontFamily:T.font }}>{p.name}</span>
                    <span style={{ ...S.tag(T.badBg, T.bad), fontSize:10 }}>{p.code}</span>
                  </div>
                  <p style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6, margin:"8px 0" }}>{p.meaning}</p>
                  <div style={{ padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                    <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>
                      <strong style={{ color:T.amber }}>Common examples:</strong> {p.examples}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {!selectedPictogram && (
          <div style={{ textAlign:"center", padding:16, color:T.muted, fontFamily:T.font, fontSize:13, border:`1px dashed rgba(255,255,255,0.1)`, borderRadius:T.radius }}>
            👆 Tap a pictogram above to see its meaning and examples
          </div>
        )}
      </div>,

      // SLIDE 3: Matching Game
      <div key="m2s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>INTERACTIVE EXERCISE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Match the Hazard to the Pictogram</h3>
          <p style={S.sub()}>Read the hazard description, then tap the correct pictogram.</p>
        </div>

        {matchGame.current < matchChallenges.length ? (
          <div>
            {/* Progress */}
            <div style={{ ...S.flexBetween, marginBottom:16 }}>
              <span style={{ fontSize:13, color:T.muted, fontFamily:T.font }}>
                Challenge {matchGame.current + 1} of {matchChallenges.length}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font }}>
                Score: {matchGame.score}/{matchGame.current + (matchGame.answered ? 1 : 0)}
              </span>
            </div>

            {/* Description */}
            <div style={{ ...S.card(T.navyMid), padding:20, marginBottom:20, textAlign:"center" }}>
              <div style={{ fontSize:15, color:T.ghost, fontFamily:T.font, lineHeight:1.6 }}>
                &quot;{matchChallenges[matchGame.current].desc}&quot;
              </div>
            </div>

            {/* Pictogram choices */}
            <div style={{ ...S.grid("repeat(auto-fit, minmax(80px, 1fr))", 8), marginBottom:20 }}>
              {GHS_PICTOGRAMS.filter(p => !["environment","gas-cylinder","exploding-bomb"].includes(p.id) || p.id === matchChallenges[matchGame.current].answer).slice(0,6).map(p => {
                const isCorrect = p.id === matchChallenges[matchGame.current].answer;
                const isSelected = matchGame.selected === p.id;
                const showResult = matchGame.answered;
                let borderColor = "rgba(255,255,255,0.08)";
                let bg = T.navyMid;
                if (showResult && isCorrect) { borderColor = T.good; bg = T.goodBg; }
                else if (showResult && isSelected && !isCorrect) { borderColor = T.bad; bg = T.badBg; }
                else if (isSelected && !showResult) { borderColor = T.amber; bg = T.amberGlow; }

                return (
                  <button key={p.id} disabled={matchGame.answered} onClick={() => {
                    const correct = p.id === matchChallenges[matchGame.current].answer;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setMatchGame((prev: any) => ({
                      ...prev, selected: p.id, answered: true,
                      score: correct ? prev.score + 1 : prev.score,
                    }));
                  }} style={{
                    background:bg, border:`2px solid ${borderColor}`, borderRadius:T.radius,
                    padding:8, cursor: matchGame.answered ? "default" : "pointer", textAlign:"center",
                    transition:"all 0.2s", opacity: showResult && !isCorrect && !isSelected ? 0.4 : 1,
                  }}>
                    <div style={{ width:50, height:50, margin:"0 auto 4px" }} dangerouslySetInnerHTML={{ __html: p.svg }} />
                    <div style={{ fontSize:9, color:T.muted, fontFamily:T.font, fontWeight:600 }}>{p.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {matchGame.answered && (
              <div style={{ animation:"shieldFadeIn 0.3s ease" }}>
                <div style={{
                  ...S.card(matchGame.selected === matchChallenges[matchGame.current].answer ? T.goodBg : T.badBg),
                  padding:16, marginBottom:16, display:"flex", gap:12, alignItems:"center",
                  border: `1px solid ${matchGame.selected === matchChallenges[matchGame.current].answer ? T.good : T.bad}44`,
                }}>
                  <span style={{ fontSize:24 }}>{matchGame.selected === matchChallenges[matchGame.current].answer ? "✅" : "❌"}</span>
                  <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
                    {matchGame.selected === matchChallenges[matchGame.current].answer 
                      ? "Correct! You identified the right pictogram."
                      : `Not quite — the correct answer is the ${GHS_PICTOGRAMS.find(pg=>pg.id===matchChallenges[matchGame.current].answer)?.name} pictogram.`}
                  </span>
                </div>
                <div style={{ textAlign:"center" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <button onClick={() => setMatchGame((prev: any) => ({ ...prev, current: prev.current + 1, answered: false, selected: null }))}
                    style={S.btn(T.amber, T.navy)}>
                    {matchGame.current < matchChallenges.length - 1 ? "Next Challenge →" : "See Results →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Match game complete */
          <div style={{ textAlign:"center", ...S.card(T.navyMid), padding:32 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{matchGame.score === matchChallenges.length ? "🏆" : matchGame.score >= 2 ? "👏" : "📚"}</div>
            <h3 style={S.heading(20)}>
              {matchGame.score === matchChallenges.length ? "Perfect Score!" : `${matchGame.score}/${matchChallenges.length} Correct`}
            </h3>
            <p style={{ ...S.sub(14), marginTop:8 }}>
              {matchGame.score === matchChallenges.length
                ? "You know your pictograms! You'll see these on every chemical label."
                : "Don't worry — you'll get more practice as you go. The quiz will test your understanding."}
            </p>
          </div>
        )}
      </div>,

      // SLIDE 4: Industry-specific pictograms
      <div key="m2s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.amberGlow, T.amber)}>{ind.icon} YOUR INDUSTRY</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Pictograms You&apos;ll See Most Often</h3>
          <p style={S.sub()}>Based on your industry ({ind.name}), here are the pictograms most commonly found on your products.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {ind.topHazards.map((hazId, i) => {
            const p = GHS_PICTOGRAMS.find(pg => pg.id === hazId);
            if (!p) return null;
            return (
              <div key={i} style={{ ...S.card(T.navyMid), display:"flex", gap:16, padding:16, alignItems:"center" }}>
                <div style={{ width:64, height:64, flexShrink:0 }} dangerouslySetInnerHTML={{ __html: p.svg }} />
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:T.font, marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{p.meaning.split(".")[0]}.</div>
                  <div style={{ marginTop:6 }}>
                    <span style={{ ...S.tag(T.amberGlow, T.amber), fontSize:10 }}>Common on: {ind.chemicals.slice(0,3).join(", ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...S.card(), background:`${T.amber}08`, border:`1px solid ${T.amber}22`, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>💡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Remember:</strong> A single product can show multiple pictograms. When you see more than one, the chemical has multiple types of hazards — pay attention to ALL of them.
          </span>
        </div>
      </div>,
    ];
  };

  // ── MODULE 3: READING A CHEMICAL LABEL ──
  const getModule3Slides = () => {
    const sampleChemical = ind.chemicals[0] || "All-Purpose Cleaner";
    const sampleChemical2 = ind.chemicals[1] || "Degreaser";

    return [
      // SLIDE 1: Why Labels Matter
      <div key="m3s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.blue}12, ${T.navyCard})`, border:`1px solid ${T.blue}22`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🏷️</div>
            <h3 style={{ ...S.heading(22), color:T.amberBright }}>The Label Is Your First Line of Defense</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:520, margin:"0 auto 24px" }}>
            Before you open any container — read the label. It takes 30 seconds and could save your life.
          </p>
          <div style={{ ...S.grid("1fr 1fr", 12) }}>
            {[
              { icon:"⚡", stat:"#1 Cause", desc:"Missing or ignored labels are the #1 cause of chemical accidents in the workplace" },
              { icon:"⏱️", stat:"30 sec", desc:"That's all it takes to scan a label and identify the hazards before you start working" },
            ].map((s,i) => (
              <div key={i} style={{ ...S.card(T.navyMid), textAlign:"center", padding:20 }}>
                <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:T.amber, fontFamily:T.font }}>{s.stat}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:4, lineHeight:1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...S.card(T.navyMid), padding:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>💡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>In your industry ({ind.name}):</strong> Products like {sampleChemical} and {sampleChemical2} all have GHS labels — even if they look &quot;harmless.&quot; Learn to read them.
          </span>
        </div>
      </div>,

      // SLIDE 2: Anatomy of a GHS Label (Interactive)
      <div key="m3s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.blueBg, T.blue)}>LABEL ANATOMY</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>The 6 Required Elements of a GHS Label</h3>
          <p style={S.sub()}>Every GHS-compliant label MUST include all six of these elements. Tap each to learn more.</p>
        </div>

        {/* Interactive label mockup */}
        <div style={{ ...S.card(), background:"#fefefe", border:`2px solid ${T.navyLight}`, padding:0, overflow:"hidden", borderRadius:T.radius, marginBottom:16 }}>
          {/* Label header */}
          <div style={{ background:"#1a1a1a", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, fontWeight:800, color:"white", fontFamily:T.font, letterSpacing:"0.04em" }}>
              SAMPLE GHS LABEL
            </span>
            <span style={{ fontSize:11, color:"#888", fontFamily:T.font }}>Tap numbered elements ↓</span>
          </div>
          <div style={{ padding:20 }}>
            {/* Row 1: Product ID + Signal Word */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <LabelElement n={1} label="Product Identifier" color={T.blue}
                detail="The chemical name or product name exactly matching what's on the SDS. This is how you look it up."
                example={`e.g., "${sampleChemical}"`}
                sel={selectedPictogram} setSel={setSelectedPictogram}>
                <div style={{ fontSize:18, fontWeight:800, color:"#1a1a1a", fontFamily:T.font }}>{sampleChemical}</div>
                <div style={{ fontSize:11, color:"#888", fontFamily:T.font }}>Product Code: SDS-2024-001</div>
              </LabelElement>
              <LabelElement n={2} label="Signal Word" color={T.bad}
                detail="Either DANGER (severe) or WARNING (less severe). Never both. Tells you the severity at a glance."
                example="DANGER = could kill you. WARNING = could hurt you."
                sel={selectedPictogram} setSel={setSelectedPictogram}>
                <div style={{ fontSize:20, fontWeight:900, color:"#CC0000", fontFamily:T.font, letterSpacing:"0.1em" }}>⚠️ DANGER</div>
              </LabelElement>
            </div>
            {/* Row 2: Pictograms */}
            <LabelElement n={3} label="Hazard Pictograms" color={T.bad}
              detail="Red diamond symbols showing hazard types. A product can have multiple pictograms — each one represents a different hazard category."
              example={`${sampleChemical} might show Flame + Health Hazard + Exclamation Mark`}
              sel={selectedPictogram} setSel={setSelectedPictogram}>
              <div style={{ display:"flex", gap:8, padding:"4px 0" }}>
                {ind.topHazards.map((hid,i) => {
                  const p = GHS_PICTOGRAMS.find(pg=>pg.id===hid);
                  return p ? <div key={i} style={{ width:48, height:48 }} dangerouslySetInnerHTML={{ __html: p.svg }} /> : null;
                })}
              </div>
            </LabelElement>
            {/* Row 3: Hazard Statements */}
            <LabelElement n={4} label="Hazard Statement(s)" color={T.purple}
              detail="Standardized phrases describing the nature of the hazard. These are assigned by the chemical's classification — manufacturers can't change the wording."
              example="e.g., 'Highly flammable liquid and vapor' (H226) or 'Causes serious eye damage' (H318)"
              sel={selectedPictogram} setSel={setSelectedPictogram}>
              <div style={{ fontSize:12, color:"#333", fontFamily:T.font, lineHeight:1.6, padding:"4px 0" }}>
                <div>H226: Highly flammable liquid and vapor</div>
                <div>H315: Causes skin irritation</div>
                <div>H335: May cause respiratory irritation</div>
              </div>
            </LabelElement>
            {/* Row 4: Precautionary Statements */}
            <LabelElement n={5} label="Precautionary Statement(s)" color={T.good}
              detail="Your ACTION GUIDE — tells you how to prevent exposure, what to do if exposed, how to store, and how to dispose. These are the most practical part of the label."
              example="e.g., 'Wear protective gloves/eye protection' (P280) or 'IF IN EYES: Rinse cautiously with water' (P351)"
              sel={selectedPictogram} setSel={setSelectedPictogram}>
              <div style={{ fontSize:12, color:"#333", fontFamily:T.font, lineHeight:1.6, padding:"4px 0" }}>
                <div><strong>Prevention:</strong> Keep away from heat/sparks. Wear protective gloves.</div>
                <div><strong>Response:</strong> IF IN EYES: Rinse cautiously with water for several minutes.</div>
                <div><strong>Storage:</strong> Store in cool, well-ventilated place. Keep container tightly closed.</div>
                <div><strong>Disposal:</strong> Dispose of contents per local regulations.</div>
              </div>
            </LabelElement>
            {/* Row 5: Supplier */}
            <LabelElement n={6} label="Supplier Identification" color={T.amber}
              detail="Name, address, and phone number of the manufacturer or distributor. Critical for getting emergency information or requesting a full SDS."
              example="The company that makes or distributes the chemical"
              sel={selectedPictogram} setSel={setSelectedPictogram}>
              <div style={{ fontSize:12, color:"#555", fontFamily:T.font, lineHeight:1.5, padding:"4px 0" }}>
                <div><strong>ChemCorp Industries, LLC</strong></div>
                <div>1234 Industrial Blvd, Suite 100, Houston, TX 77001</div>
                <div>Emergency: (800) 555-0199</div>
              </div>
            </LabelElement>
          </div>
        </div>
        <div style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>🎯</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>Tap the numbered circles on each label element to see a detailed explanation of what it means and why it matters.</span>
        </div>
      </div>,

      // SLIDE 3: Secondary Containers & Common Mistakes
      <div key="m3s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.warnBg, T.warn)}>CRITICAL RULE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Secondary Container Labeling</h3>
          <p style={S.sub()}>This is where most workplaces get cited. When you transfer chemicals to a new container, it MUST be labeled.</p>
        </div>

        {/* Scenario cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <div style={{ ...S.card(), background:`${T.good}10`, border:`1px solid ${T.good}33`, padding:18 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:24, flexShrink:0 }}>✅</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.good, fontFamily:T.font, marginBottom:6 }}>COMPLIANT</div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6 }}>
                  You pour {sampleChemical2} into a spray bottle, write the product name and &quot;DANGER — Flammable, Skin Irritant&quot; on a label, and stick it on the bottle.
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...S.card(), background:`${T.bad}10`, border:`1px solid ${T.bad}33`, padding:18 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:24, flexShrink:0 }}>❌</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.bad, fontFamily:T.font, marginBottom:6 }}>VIOLATION</div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6 }}>
                  You pour the same chemical into an unmarked spray bottle and leave it on the shelf. A coworker picks it up — no idea what&apos;s inside.
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...S.card(), background:`${T.amber}08`, border:`1px solid ${T.amber}33`, padding:18 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:24, flexShrink:0 }}>⚠️</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:6 }}>THE EXCEPTION</div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6 }}>
                  You pour a chemical for <em>immediate use</em> and it never leaves your control — you use it, then clean the container. This is the only situation where a secondary label isn&apos;t strictly required. But best practice? Label it anyway.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card(T.navyMid), padding:16 }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:10 }}>Minimum Secondary Label Requirements:</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              "Product name (matching the SDS)",
              "Hazard warnings (signal word + key hazards)",
              "If using the full GHS format: all 6 label elements",
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ color:T.amber, fontSize:14 }}>▸</span>
                <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>,

      // SLIDE 4: Real-World Label Reading Exercise
      <div key="m3s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>PRACTICE SCENARIO</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Reading a Real Label — {ind.name}</h3>
          <p style={S.sub()}>You&apos;re about to use {sampleChemical} for the first time. Walk through the label check.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { step:1, title:"CHECK: Product Identifier", question:`Does the container say "${sampleChemical}" clearly?`, why:"This is how you'll match it to the correct SDS if something goes wrong.", icon:"🔍" },
            { step:2, title:"CHECK: Signal Word", question:"Is it DANGER or WARNING?", why:"This tells you the severity. DANGER means extra caution — slow down and read everything.", icon:"⚠️" },
            { step:3, title:"CHECK: Pictograms", question:`Which red diamonds do you see? Count them.`, why:`In ${ind.name}, you'll commonly see ${ind.topHazards.length} pictograms on products like this. Each one means a different hazard type.`, icon:"💎" },
            { step:4, title:"CHECK: Hazard Statements", question:"What specific hazards are listed?", why:"These tell you exactly HOW the chemical can hurt you — flammable? corrosive? toxic by inhalation?", icon:"📖" },
            { step:5, title:"CHECK: Precautionary Statements", question:"What PPE does it say to wear? What if it contacts skin?", why:`This is your action plan. For ${ind.name} workers, the Prevention and Response sections are critical — they tell you what PPE to wear and what to do if exposure happens.`, icon:"🛡️" },
            { step:6, title:"CHECK: Supplier Info", question:"Is there an emergency phone number?", why:"If the SDS isn't available and someone is exposed, this number connects you to emergency poison/safety info.", icon:"📞" },
          ].map((item,i) => (
            <div key={i} style={{ ...S.card(T.navyMid), padding:16, display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:40, height:40, borderRadius:10, ...S.flexCenter, flexShrink:0,
                background:`${T.blue}18`, border:`1px solid ${T.blue}44`, fontSize:20 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ ...S.tag(T.blueBg, T.blue), fontSize:10 }}>STEP {item.step}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font }}>{item.title}</span>
                </div>
                <div style={{ fontSize:13, color:T.amber, fontFamily:T.font, marginBottom:4, fontStyle:"italic" }}>{item.question}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{item.why}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(), background:`${T.good}10`, border:`1px solid ${T.good}33`, marginTop:16, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>✅</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.good }}>Make this a habit:</strong> Every time you pick up a chemical container — even one you&apos;ve used before — glance at the label. Formulations change. Labels get updated. 30 seconds of reading beats 30 days of recovery.
          </span>
        </div>
      </div>,
    ];
  };

  // ── MODULE 4: UNDERSTANDING THE SDS ──
  const getModule4Slides = () => {
    const sampleChemical = ind.chemicals[0] || "All-Purpose Cleaner";
    // SDS section data — the core of this module
    const sdsSections = [
      { n:1,  title:"Identification", icon:"🏷️", critical:false, desc:"Product name, manufacturer info, emergency phone number, recommended use." },
      { n:2,  title:"Hazard(s) Identification", icon:"⚠️", critical:true, desc:"Signal word, pictograms, hazard & precautionary statements. The label info in full detail." },
      { n:3,  title:"Composition / Ingredients", icon:"🧪", critical:false, desc:"Chemical ingredients and their concentrations. What's actually in the product." },
      { n:4,  title:"First-Aid Measures", icon:"🚑", critical:true, desc:"What to do for eye contact, skin contact, inhalation, and ingestion. Your emergency playbook." },
      { n:5,  title:"Fire-Fighting Measures", icon:"🔥", critical:false, desc:"Suitable extinguishing media, special hazards from fire, protective equipment for firefighters." },
      { n:6,  title:"Accidental Release", icon:"🧹", critical:true, desc:"What to do if the chemical spills or leaks — containment, cleanup, protective gear needed." },
      { n:7,  title:"Handling & Storage", icon:"📦", critical:false, desc:"Safe handling practices, conditions for safe storage, incompatible materials." },
      { n:8,  title:"Exposure Controls / PPE", icon:"🛡️", critical:true, desc:"Occupational exposure limits, engineering controls, specific PPE: gloves, respirator, goggles, clothing." },
      { n:9,  title:"Physical & Chemical Properties", icon:"🔬", critical:false, desc:"Appearance, odor, pH, flash point, boiling point, vapor pressure, solubility." },
      { n:10, title:"Stability & Reactivity", icon:"⚗️", critical:false, desc:"Chemical stability, conditions to avoid, incompatible materials, hazardous decomposition products." },
      { n:11, title:"Toxicological Info", icon:"☠️", critical:false, desc:"Routes of exposure, acute/chronic health effects, LD50/LC50 data, carcinogenicity." },
      { n:12, title:"Ecological Info", icon:"🌿", critical:false, desc:"Environmental impact, aquatic toxicity, biodegradability. (Not OSHA-regulated.)" },
      { n:13, title:"Disposal Considerations", icon:"🗑️", critical:false, desc:"Proper disposal methods and container handling. Follow local regulations." },
      { n:14, title:"Transport Information", icon:"🚛", critical:false, desc:"DOT/IATA shipping name, hazard class, packing group for transport." },
      { n:15, title:"Regulatory Information", icon:"📜", critical:false, desc:"U.S. and international regulatory status — TSCA, SARA, state regulations." },
      { n:16, title:"Other Information", icon:"ℹ️", critical:false, desc:"Date of preparation/revision, abbreviation key, disclaimer." },
    ];

    return [
      // SLIDE 1: What is an SDS?
      <div key="m4s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.purple}12, ${T.navyCard})`, border:`1px solid ${T.purple}22`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>📋</div>
            <h3 style={{ ...S.heading(22), color:T.amberBright }}>The Safety Data Sheet: Your Chemical Encyclopedia</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:540, margin:"0 auto 20px" }}>
            If the label is the summary, the SDS is the full story. Every hazardous chemical has one — 16 sections, same order, every time.
          </p>
          <div style={{ ...S.grid("1fr 1fr 1fr", 12) }}>
            {[
              { stat:"16", label:"Standardized sections", sub:"Same order for every chemical" },
              { stat:"~15", label:"Pages average", sub:"Detailed safety information" },
              { stat:"24/7", label:"Access required", sub:"You can request any SDS anytime" },
            ].map((s,i) => (
              <div key={i} style={{ ...S.card(T.navyMid), textAlign:"center", padding:16 }}>
                <div style={{ fontSize:24, fontWeight:800, color:T.amber, fontFamily:T.font }}>{s.stat}</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.ghost, fontFamily:T.font, marginTop:4 }}>{s.label}</div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:T.font, marginTop:2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...S.card(T.navyMid), padding:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>💡</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Key distinction:</strong> The <em>label</em> is on the container for quick reference. The <em>SDS</em> is the detailed document you pull up when you need specifics — first aid procedures, exact PPE type, exposure limits, spill cleanup.
          </span>
        </div>
      </div>,

      // SLIDE 2: The 16 Sections Overview
      <div key="m4s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>ALL 16 SECTIONS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>SDS Section Map</h3>
          <p style={S.sub()}>Sections highlighted in amber are the ones you&apos;ll use most often in emergencies and daily work.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {sdsSections.map((sec) => (
            <div key={sec.n} style={{
              display:"flex", gap:12, alignItems:"center", padding:"10px 14px",
              background: sec.critical ? `${T.amber}10` : T.navyMid,
              border: sec.critical ? `1px solid ${T.amber}33` : `1px solid rgba(255,255,255,0.04)`,
              borderRadius:T.radiusSm, transition:"all 0.2s",
            }}>
              <div style={{
                width:30, height:30, borderRadius:8, ...S.flexCenter, flexShrink:0,
                background: sec.critical ? T.amber : "rgba(255,255,255,0.08)",
                color: sec.critical ? T.navy : T.muted,
                fontSize:12, fontWeight:800, fontFamily:T.font,
              }}>{sec.n}</div>
              <span style={{ fontSize:16, flexShrink:0 }}>{sec.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color: sec.critical ? T.amber : T.ghost, fontFamily:T.font }}>{sec.title}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, lineHeight:1.4, marginTop:2 }}>{sec.desc}</div>
              </div>
              {sec.critical && <span style={{ ...S.tag(T.amberGlow, T.amber), fontSize:9, flexShrink:0 }}>KEY</span>}
            </div>
          ))}
        </div>
      </div>,

      // SLIDE 3: The 4 Critical Sections Deep Dive
      <div key="m4s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.badBg, T.bad)}>MUST KNOW</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>The 4 Sections That Could Save Your Life</h3>
          <p style={S.sub()}>You don&apos;t need to memorize all 16 sections — but you MUST know where to find these four.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Section 2 */}
          <div style={{ ...S.card(), border:`1px solid ${T.bad}33`, padding:20, background:`${T.bad}08` }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0, background:T.badBg, fontSize:20 }}>⚠️</div>
              <div>
                <div style={{ ...S.flexBetween, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:T.bad, fontFamily:T.font }}>Section 2 — Hazard Identification</span>
                  <span style={{ ...S.tag(T.badBg, T.bad), fontSize:10 }}>KNOW THIS</span>
                </div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6, marginBottom:8 }}>
                  The expanded version of the label. Lists ALL hazard classifications, ALL pictograms, complete hazard statements, and complete precautionary statements. When a label seems unclear, Section 2 gives you the full picture.
                </div>
                <div style={{ padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>
                    <strong style={{ color:T.amber }}>When to use:</strong> When you need the complete hazard picture beyond what&apos;s on the small container label.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div style={{ ...S.card(), border:`1px solid ${T.good}33`, padding:20, background:`${T.good}08` }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0, background:T.goodBg, fontSize:20 }}>🚑</div>
              <div>
                <div style={{ ...S.flexBetween, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:T.good, fontFamily:T.font }}>Section 4 — First-Aid Measures</span>
                  <span style={{ ...S.tag(T.goodBg, T.good), fontSize:10 }}>EMERGENCY</span>
                </div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6, marginBottom:8 }}>
                  Exact first-aid instructions broken down by exposure route: eyes, skin, inhalation, ingestion. Also lists symptoms to watch for and notes for medical professionals.
                </div>
                <div style={{ padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>
                    <strong style={{ color:T.amber }}>{ind.name} example:</strong> If {sampleChemical} splashes in an employee&apos;s eyes, Section 4 tells you: flush with water for 15-20 minutes, remove contacts, seek medical attention.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div style={{ ...S.card(), border:`1px solid ${T.amber}33`, padding:20, background:`${T.amber}08` }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0, background:T.warnBg, fontSize:20 }}>🧹</div>
              <div>
                <div style={{ ...S.flexBetween, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:T.amber, fontFamily:T.font }}>Section 6 — Accidental Release / Spills</span>
                  <span style={{ ...S.tag(T.warnBg, T.amber), fontSize:10 }}>SPILL RESPONSE</span>
                </div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6, marginBottom:8 }}>
                  Step-by-step spill cleanup: personal precautions, protective equipment needed, containment methods, cleanup techniques, and environmental precautions.
                </div>
                <div style={{ padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>
                    <strong style={{ color:T.amber }}>{ind.name} example:</strong> A jug of {ind.chemicals[2] || sampleChemical} tips over in the {ind.workAreas[1] || "storage area"}. Section 6 tells you what absorbent to use, whether to ventilate, and how to dispose of the waste.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div style={{ ...S.card(), border:`1px solid ${T.blue}33`, padding:20, background:`${T.blue}08` }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0, background:T.blueBg, fontSize:20 }}>🛡️</div>
              <div>
                <div style={{ ...S.flexBetween, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:T.blue, fontFamily:T.font }}>Section 8 — Exposure Controls / PPE</span>
                  <span style={{ ...S.tag(T.blueBg, T.blue), fontSize:10 }}>DAILY USE</span>
                </div>
                <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.6, marginBottom:8 }}>
                  Occupational exposure limits (OELs), engineering controls (like ventilation), and SPECIFIC PPE: glove material and thickness, respirator type and cartridge, eye protection type, and protective clothing.
                </div>
                <div style={{ padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>
                    <strong style={{ color:T.amber }}>{ind.name} PPE example:</strong> For {ind.commonPPE.slice(0,2).join(" and ")} — Section 8 confirms the exact specifications. Not just &quot;wear gloves&quot; but which TYPE of glove resists that specific chemical.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,

      // SLIDE 4: SDS Lookup Exercise
      <div key="m4s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>PRACTICAL EXERCISE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>SDS Speed Drill — {ind.name}</h3>
          <p style={S.sub()}>For each workplace scenario, identify which SDS section you&apos;d look up FIRST.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {[
            { scenario: `A coworker gets ${sampleChemical} on their bare skin and it starts burning.`,
              answer: "Section 4", section:"First-Aid Measures", why:"Immediate medical response — tells you whether to flush with water, what NOT to do, when to call poison control.", color:T.good },
            { scenario: `You need to know what respirator cartridge to use before opening a new drum of ${ind.chemicals[2] || "solvent"}.`,
              answer: "Section 8", section:"Exposure Controls / PPE", why:"Lists the exact respirator type, cartridge, glove material, and other protective equipment specifications.", color:T.blue },
            { scenario: `A bottle breaks and ${ind.chemicals[1] || "cleaner"} is spreading across the ${ind.workAreas[0] || "floor"}.`,
              answer: "Section 6", section:"Accidental Release", why:"Spill containment and cleanup procedures — what absorbent to use, ventilation needs, disposal method.", color:T.amber },
            { scenario: `Your supervisor asks if ${sampleChemical} can be stored next to ${ind.chemicals[3] || "another chemical"}.`,
              answer: "Section 7 & 10", section:"Handling/Storage & Stability", why:"Section 7 covers storage conditions and Section 10 lists incompatible materials that could react dangerously.", color:T.purple },
          ].map((item, i) => (
            <div key={i} style={{ ...S.card(T.navyMid), padding:18 }}>
              <div style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.5, marginBottom:12, fontStyle:"italic" }}>
                &quot;{item.scenario}&quot;
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 14px", background:`${item.color}10`, borderRadius:T.radiusSm, border:`1px solid ${item.color}33` }}>
                <div style={{ fontSize:14, fontWeight:800, color:item.color, fontFamily:T.font, whiteSpace:"nowrap", flexShrink:0 }}>
                  → {item.answer}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ghost, fontFamily:T.font }}>{item.section}</div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:2, lineHeight:1.4 }}>{item.why}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(), background:`${T.good}08`, border:`1px solid ${T.good}33`, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.good }}>Pro tip:</strong> Bookmark or screenshot Sections 4, 6, and 8 for your most-used chemicals. In an emergency, you won&apos;t have time to scroll through 15 pages. Know where to jump.
          </span>
        </div>
      </div>,
    ];
  };

  // ── MODULE 5: PROTECTING YOURSELF — PPE ──
  const getModule5Slides = () => {
    // PPE categories data
    const ppeCategories = [
      { id:"eyes", title:"Eye & Face Protection", icon:"👓", color:T.blue,
        types:[
          { name:"Safety Glasses", use:"Splash protection from light chemical work", level:"Basic" },
          { name:"Chemical Splash Goggles", use:"Sealed protection against liquid splashes, mists, vapors", level:"Standard" },
          { name:"Face Shield + Goggles", use:"Full face protection for pouring, mixing, high-splash tasks", level:"Maximum" },
        ]},
      { id:"hands", title:"Hand Protection", icon:"🧤", color:T.good,
        types:[
          { name:"Nitrile Gloves", use:"General chemical resistance — solvents, oils, many acids", level:"Most Common" },
          { name:"Butyl Rubber Gloves", use:"Ketones, esters, strong acids — when nitrile isn't enough", level:"Specialty" },
          { name:"Neoprene Gloves", use:"Acids, bases, alcohols, petroleum products", level:"Heavy Duty" },
        ]},
      { id:"respiratory", title:"Respiratory Protection", icon:"😷", color:T.bad,
        types:[
          { name:"N95 Filtering Mask", use:"Particulates and dust — NOT effective against chemical vapors", level:"Particles Only" },
          { name:"Half-Face Respirator + Cartridge", use:"Chemical vapors and gases — cartridge must match the chemical", level:"Standard" },
          { name:"Supplied-Air Respirator (SAR)", use:"Oxygen-deficient or IDLH environments, spray painting with isocyanates", level:"Maximum" },
        ]},
      { id:"body", title:"Body Protection", icon:"🦺", color:T.amber,
        types:[
          { name:"Chemical-Resistant Apron", use:"Front-body protection during pouring, mixing, cleaning", level:"Basic" },
          { name:"Tyvek Coverall", use:"Full-body protection against particulates and light chemical splash", level:"Standard" },
          { name:"Chemical-Resistant Suit", use:"Hazmat response, immersion risk, highly toxic chemicals", level:"Maximum" },
        ]},
    ];

    return [
      // SLIDE 1: PPE Overview & Hierarchy
      <div key="m5s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.good}12, ${T.navyCard})`, border:`1px solid ${T.good}22`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🛡️</div>
            <h3 style={{ ...S.heading(22), color:T.amberBright }}>PPE: Your Last Line of Defense</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:520, margin:"0 auto 20px" }}>
            Personal Protective Equipment is critical — but it&apos;s the LAST resort, not the first. Here&apos;s the hierarchy:
          </p>
        </div>

        {/* Hierarchy of Controls */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
          {[
            { level:"1. ELIMINATION", desc:"Remove the chemical hazard entirely", example:`Can you use a water-based product instead of a solvent-based one?`, color:T.good, best:true },
            { level:"2. SUBSTITUTION", desc:"Replace with a less hazardous chemical", example:`Switch from a highly toxic degreaser to a less toxic alternative`, color:T.good, best:false },
            { level:"3. ENGINEERING CONTROLS", desc:"Isolate workers from the hazard", example:`Ventilation hoods, enclosed systems, local exhaust at the ${ind.workAreas[0] || "work area"}`, color:T.amber, best:false },
            { level:"4. ADMINISTRATIVE CONTROLS", desc:"Change work practices to reduce exposure", example:`Rotate tasks, limit exposure time, establish safe work procedures`, color:T.amber, best:false },
            { level:"5. PPE", desc:"Personal protective equipment — the final barrier", example:`${ind.commonPPE.slice(0,2).join(", ")} — when all other controls aren't enough`, color:T.bad, best:false },
          ].map((item, i) => (
            <div key={i} style={{
              display:"flex", gap:14, alignItems:"flex-start", padding:"12px 16px",
              background: item.best ? `${item.color}15` : T.navyMid,
              borderRadius:T.radiusSm,
              border: `1px solid ${item.color}${item.best ? '44' : '22'}`,
              borderLeft: `4px solid ${item.color}`,
            }}>
              <div style={{ width:28, height:28, borderRadius:8, ...S.flexCenter, flexShrink:0,
                background:`${item.color}22`, fontSize:14, fontWeight:800, color:item.color, fontFamily:T.font }}>
                {i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:item.color, fontFamily:T.font }}>{item.level}</div>
                <div style={{ fontSize:12, color:T.ghost, fontFamily:T.font, marginTop:2 }}>{item.desc}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4, fontStyle:"italic" }}>{item.example}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>⚡</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Key concept:</strong> PPE is #5 on the list for a reason — it&apos;s the least reliable control. A punctured glove fails instantly. Ventilation works 24/7 without human error.
          </span>
        </div>
      </div>,

      // SLIDE 2: PPE Categories Deep Dive (Interactive)
      <div key="m5s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.goodBg, T.good)}>PPE CATEGORIES</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Four Types of Protection — Tap to Explore</h3>
          <p style={S.sub()}>Each category has multiple levels. The right choice depends on the chemical and task.</p>
        </div>

        {/* Category selector */}
        <div style={{ ...S.grid("repeat(4, 1fr)", 8), marginBottom:16 }}>
          {ppeCategories.map(cat => {
            const active = selectedPictogram === `ppe-${cat.id}`;
            return (
              <button key={cat.id} onClick={() => setSelectedPictogram(active ? null : `ppe-${cat.id}`)} style={{
                ...S.card(active ? `${cat.color}15` : T.navyMid), padding:"12px 8px", textAlign:"center",
                border: active ? `2px solid ${cat.color}` : `1px solid rgba(255,255,255,0.06)`,
                cursor:"pointer", transition:"all 0.2s",
              }}>
                <div style={{ fontSize:28, marginBottom:4 }}>{cat.icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color: active ? cat.color : T.muted, fontFamily:T.font }}>{cat.title.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {(() => {
          const activeCat = ppeCategories.find(c => selectedPictogram === `ppe-${c.id}`);
          if (!activeCat) return (
            <div style={{ textAlign:"center", padding:24, color:T.muted, fontFamily:T.font, fontSize:13, border:`1px dashed rgba(255,255,255,0.1)`, borderRadius:T.radius }}>
              👆 Tap a category above to see PPE types and when to use them
            </div>
          );
          return (
            <div style={{ ...S.cardGlow(activeCat.color), padding:20, animation:"shieldFadeIn 0.3s ease" }}>
              <h4 style={{ fontSize:16, fontWeight:700, color:activeCat.color, fontFamily:T.font, marginBottom:14 }}>
                {activeCat.icon} {activeCat.title}
              </h4>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {activeCat.types.map((type, i) => (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 14px", background:T.navyMid, borderRadius:T.radiusSm }}>
                    <span style={{ ...S.tag(`${activeCat.color}22`, activeCat.color), fontSize:9, flexShrink:0, marginTop:2 }}>{type.level}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font }}>{type.name}</div>
                      <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:2 }}>{type.use}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>,

      // SLIDE 3: Your Industry's PPE Requirements
      <div key="m5s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.amberGlow, T.amber)}>{ind.icon} YOUR PPE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Standard PPE for {ind.name}</h3>
          <p style={S.sub()}>Based on the chemicals common in your industry, here&apos;s what you should be wearing.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {ind.commonPPE.map((ppe, i) => (
            <div key={i} style={{ ...S.card(T.navyMid), display:"flex", gap:14, padding:16, alignItems:"center" }}>
              <div style={{ width:44, height:44, borderRadius:12, ...S.flexCenter, flexShrink:0,
                background:T.goodBg, border:`1px solid ${T.good}44`, fontSize:22 }}>
                {["👓","🧤","😷","🦺","👢","🎧"][i] || "🛡️"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font }}>{ppe}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, marginTop:2 }}>
                  Required when handling: {ind.chemicals.slice(0, 3).join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Common mistakes */}
        <div style={{ ...S.card(), background:`${T.bad}08`, border:`1px solid ${T.bad}33`, padding:20 }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:T.bad, fontFamily:T.font, marginBottom:12 }}>❌ Common PPE Mistakes in {ind.name}</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { mistake:"Using the wrong glove material", fix:`Check SDS Section 8 — nitrile stops some chemicals but dissolves in others` },
              { mistake:"Wearing a dust mask for chemical vapors", fix:`Dust masks (N95) don't filter vapors. You need a respirator with the correct chemical cartridge` },
              { mistake:"Skipping eye protection for 'quick tasks'", fix:`Most eye injuries happen during tasks workers thought would 'only take a second'` },
              { mistake:"Reusing disposable PPE", fix:`Single-use gloves and respirator cartridges lose effectiveness — replace as directed` },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                <span style={{ color:T.bad, fontSize:13, flexShrink:0, marginTop:1 }}>✗</span>
                <div>
                  <span style={{ fontSize:12, fontWeight:600, color:T.ghost, fontFamily:T.font }}>{item.mistake}</span>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:T.font }}> → {item.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>,

      // SLIDE 4: PPE Decision Flowchart
      <div key="m5s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>DECISION GUIDE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Before You Handle Any Chemical — Ask These 5 Questions</h3>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {[
            { q:"1. What chemical am I working with?", action:"Check the container label for the product name", icon:"🏷️", color:T.blue },
            { q:"2. What are the hazards?", action:"Read the pictograms and signal word. DANGER = extra caution.", icon:"⚠️", color:T.bad },
            { q:"3. What PPE does the SDS require?", action:"SDS Section 8 lists exact glove type, respirator, eye protection needed", icon:"📋", color:T.purple },
            { q:"4. Is my PPE in good condition?", action:"Inspect before use — no tears, cracks, expired cartridges, or chemical residue", icon:"🔍", color:T.amber },
            { q:"5. Do I know the emergency procedures?", action:`Where's the eyewash? Spill kit? Exit route? SDS Section 4 for first aid.`, icon:"🚨", color:T.bad },
          ].map((item, i) => (
            <div key={i} style={{
              ...S.card(T.navyMid), display:"flex", gap:14, padding:16, alignItems:"flex-start",
              borderLeft:`4px solid ${item.color}`,
            }}>
              <div style={{ width:36, height:36, borderRadius:10, ...S.flexCenter, flexShrink:0,
                background:`${item.color}18`, fontSize:18 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font, marginBottom:4 }}>{item.q}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{item.action}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(), background:`${T.good}08`, border:`1px solid ${T.good}33`, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>✅</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.good }}>Make this automatic:</strong> These 5 questions should become muscle memory. Before you twist open a cap, pull on a trigger, or pour from a container — run through them. Every time.
          </span>
        </div>
      </div>,
    ];
  };

  // ── MODULE 6: WHEN THINGS GO WRONG — EMERGENCY RESPONSE ──
  const getModule6Slides = () => {
    return [
      // SLIDE 1: The First 60 Seconds
      <div key="m6s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.bad}15, ${T.navyCard})`, border:`1px solid ${T.bad}33`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🚨</div>
            <h3 style={{ ...S.heading(22), color:T.bad }}>The First 60 Seconds</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:520, margin:"0 auto 20px" }}>
            In a chemical emergency, what you do in the first minute determines the outcome. Panic is the enemy — preparation is the cure.
          </p>
          <div style={{ ...S.grid("1fr 1fr 1fr", 12) }}>
            {[
              { n:"1", action:"STOP", desc:"Stop the source if safe. Don't rush in.", color:T.bad },
              { n:"2", action:"ALERT", desc:"Warn others. Clear the area if needed.", color:T.amber },
              { n:"3", action:"RESPOND", desc:"Apply first aid, contain spill, or evacuate.", color:T.good },
            ].map((s,i) => (
              <div key={i} style={{ ...S.card(T.navyMid), textAlign:"center", padding:16, borderTop:`3px solid ${s.color}` }}>
                <div style={{ fontSize:28, fontWeight:900, color:s.color, fontFamily:T.font }}>{s.n}</div>
                <div style={{ fontSize:15, fontWeight:800, color:s.color, fontFamily:T.font, marginTop:4 }}>{s.action}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:6, lineHeight:1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>💡</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Never be a hero.</strong> If a spill is too large, too toxic, or you don&apos;t have proper PPE — evacuate and call for help. Your life is worth more than any cleanup.
          </span>
        </div>
      </div>,

      // SLIDE 2: Exposure Response by Route
      <div key="m6s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.badBg, T.bad)}>EXPOSURE RESPONSE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>4 Routes of Exposure — 4 Immediate Responses</h3>
          <p style={S.sub()}>How a chemical enters your body determines what you do. Learn all four.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { route:"EYE CONTACT", icon:"👁️", color:T.blue,
              immediate:"Flush with clean water for at least 15-20 minutes. Hold eyelids open. Remove contact lenses if present.",
              donts:"Don't rub eyes. Don't use eye drops unless SDS specifies. Don't delay flushing.",
              where:`Eyewash station in ${ind.workAreas[0] || "your work area"} — know where it is BEFORE you need it.` },
            { route:"SKIN CONTACT", icon:"✋", color:T.amber,
              immediate:"Remove contaminated clothing. Flush skin with water for 15-20 minutes. Wash with mild soap if available.",
              donts:"Don't use solvents to 'clean off' chemicals — they can drive chemicals deeper into skin. Don't apply creams unless directed by SDS.",
              where:"Emergency shower or nearest clean water source." },
            { route:"INHALATION", icon:"💨", color:T.bad,
              immediate:"Move to fresh air immediately. If person is not breathing, call 911 and begin CPR if trained. Loosen tight clothing.",
              donts:"Don't enter a contaminated area without respiratory protection to rescue someone. Call 911 first.",
              where:`Ventilated area or outside the ${ind.workAreas[0] || "building"}.` },
            { route:"INGESTION", icon:"🚫", color:T.purple,
              immediate:"Call Poison Control (1-800-222-1222) or 911 immediately. Do NOT induce vomiting unless specifically directed by medical professional.",
              donts:"Don't give anything by mouth to an unconscious person. Don't induce vomiting — some chemicals cause more damage coming back up.",
              where:"Call emergency services — this always requires professional medical attention." },
          ].map((item, i) => (
            <div key={i} style={{ ...S.card(T.navyMid), padding:18, borderLeft:`4px solid ${item.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:22 }}>{item.icon}</span>
                <span style={{ fontSize:15, fontWeight:800, color:item.color, fontFamily:T.font }}>{item.route}</span>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.good, fontFamily:T.font, marginBottom:3 }}>✅ DO:</div>
                <div style={{ fontSize:12, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>{item.immediate}</div>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.bad, fontFamily:T.font, marginBottom:3 }}>❌ DON&apos;T:</div>
                <div style={{ fontSize:12, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>{item.donts}</div>
              </div>
              <div style={{ padding:"6px 10px", background:`${item.color}10`, borderRadius:T.radiusSm }}>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>📍 {item.where}</div>
              </div>
            </div>
          ))}
        </div>
      </div>,

      // SLIDE 3: Spill Response
      <div key="m6s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.warnBg, T.warn)}>SPILL RESPONSE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Small Spill vs. Large Spill — Know the Difference</h3>
          <p style={S.sub()}>Not every spill requires evacuation. But every spill requires the RIGHT response.</p>
        </div>

        <div style={{ ...S.grid("1fr 1fr", 16), marginBottom:20 }}>
          {/* Small spill */}
          <div style={{ ...S.card(), background:`${T.amber}08`, border:`1px solid ${T.amber}33`, padding:20 }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>🟡</div>
              <div style={{ fontSize:16, fontWeight:800, color:T.amber, fontFamily:T.font }}>SMALL / INCIDENTAL SPILL</div>
              <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4 }}>You can handle with available supplies</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                "Put on proper PPE (gloves, goggles minimum)",
                "Contain the spill — prevent spreading",
                "Use appropriate absorbent material",
                "Clean up and dispose per SDS Section 13",
                "Ventilate the area if vapors present",
                "Report to supervisor and document",
              ].map((step, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ fontSize:12, fontWeight:800, color:T.amber, fontFamily:T.font, flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Large spill */}
          <div style={{ ...S.card(), background:`${T.bad}08`, border:`1px solid ${T.bad}33`, padding:20 }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>🔴</div>
              <div style={{ fontSize:16, fontWeight:800, color:T.bad, fontFamily:T.font }}>LARGE / HAZARDOUS SPILL</div>
              <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4 }}>Beyond your training or equipment</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                "EVACUATE the immediate area",
                "Alert all nearby workers — clear out",
                "Call 911 or your emergency number",
                "Do NOT attempt to clean up",
                "Move upwind / uphill from the spill",
                "Account for all personnel — no one re-enters",
              ].map((step, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ fontSize:12, fontWeight:800, color:T.bad, fontFamily:T.font, flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision factors */}
        <div style={{ ...S.card(T.navyMid), padding:16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:10 }}>How to Decide: Can I Handle This?</h4>
          <div style={{ ...S.grid("1fr 1fr", 12) }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.good, fontFamily:T.font, marginBottom:6 }}>Handle it yourself IF:</div>
              {["Small quantity (under 1 gallon)","You have proper PPE available","You have appropriate absorbent","Chemical is low-toxicity","Good ventilation present"].map((item,i) => (
                <div key={i} style={{ fontSize:11, color:T.ghost, fontFamily:T.font, padding:"2px 0", display:"flex", gap:6 }}>
                  <span style={{ color:T.good }}>✓</span> {item}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.bad, fontFamily:T.font, marginBottom:6 }}>EVACUATE if:</div>
              {["Large quantity or spreading fast","Highly toxic, flammable, or reactive","Lack proper PPE or cleanup supplies","Fire risk or vapors accumulating","Anyone is injured or symptomatic"].map((item,i) => (
                <div key={i} style={{ fontSize:11, color:T.ghost, fontFamily:T.font, padding:"2px 0", display:"flex", gap:6 }}>
                  <span style={{ color:T.bad }}>✗</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>,

      // SLIDE 4: Industry-Specific Emergency Scenarios
      <div key="m6s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.badBg, T.bad)}>{ind.icon} YOUR SCENARIOS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Emergency Scenarios: {ind.name}</h3>
          <p style={S.sub()}>Walk through these realistic situations for your workplace.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
          {ind.scenarios.map((scenario, i) => {
            const responses = [
              [ "Alert nearby workers and clear the immediate area",
                "Don appropriate PPE before approaching (check SDS Section 8)",
                "Assess: small/contained vs. large/spreading",
                "Apply first aid if anyone is exposed (SDS Section 4)",
                "Contain and clean if safe, or evacuate and call for help",
                "Report to supervisor and document the incident" ],
              [ "Stop work immediately and move away from the source",
                "Alert coworkers — verbal warning and visual signal",
                "Check if anyone has symptoms (dizziness, burning, nausea)",
                "Provide first aid: fresh air for inhalation, flush for contact",
                "Ventilate area or evacuate depending on severity",
                "Contact emergency services if symptoms are severe" ],
              [ "Do NOT attempt to handle without proper training and PPE",
                "Evacuate the area and prevent others from entering",
                "Call 911 or facility emergency number",
                "Account for all personnel at the assembly point",
                "Provide information to responders: chemical name, SDS location, quantity",
                "Do not re-enter until cleared by emergency responders" ],
            ];
            return (
              <div key={i} style={{ ...S.card(), background:`${T.bad}06`, border:`1px solid ${T.bad}22`, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={{ width:32, height:32, borderRadius:8, ...S.flexCenter, background:T.badBg, fontSize:16, fontWeight:800, color:T.bad, fontFamily:T.font }}>
                    {i+1}
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font, textTransform:"capitalize" }}>
                    {scenario}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, padding:"0 0 0 42px" }}>
                  {(responses[i] || responses[0]).map((step, si) => (
                    <div key={si} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:11, fontWeight:800, color:T.amber, fontFamily:T.font, flexShrink:0, width:16 }}>{si+1}.</span>
                      <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...S.card(), background:`${T.amber}08`, border:`1px solid ${T.amber}33`, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Preparation beats reaction.</strong> Walk your {ind.workAreas[0] || "work area"} today: locate the eyewash station, spill kit, fire extinguisher, emergency exits, and emergency phone numbers. When something goes wrong, you won&apos;t have time to search.
          </span>
        </div>
      </div>,
    ];
  };

  // ── MODULE 7: YOUR SHOP'S HAZCOM PROGRAM ──
  const getModule7Slides = () => {
    const chemCount = ind.chemicals.length;

    return [
      // SLIDE 1: What Is a Written HazCom Program?
      <div key="m7s1">
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.amber}12, ${T.navyCard})`, border:`1px solid ${T.amber}22`, marginBottom:20, padding:28 }}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>📍</div>
            <h3 style={{ ...S.heading(22), color:T.amberBright }}>Your Workplace HazCom Program</h3>
          </div>
          <p style={{ ...S.sub(15), textAlign:"center", color:T.ghost, maxWidth:540, margin:"0 auto 20px" }}>
            This is where everything comes together. Every workplace that uses hazardous chemicals MUST have a written Hazard Communication program — and every employee must know what&apos;s in it.
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {[
            { title:"Chemical Inventory List", desc:`A complete list of every hazardous chemical on site. For ${ind.name} operations, this includes products like ${ind.chemicals.slice(0,3).join(", ")}, and more. Currently tracking ${chemCount}+ product types.`, icon:"📝", color:T.amber },
            { title:"Safety Data Sheet Access", desc:`Where and how employees can access the SDS for any chemical — physical binder location, digital system (like ShieldSDS), or both. Must be available during every work shift without asking permission.`, icon:"📋", color:T.blue },
            { title:"Labeling Procedures", desc:"How containers are labeled at your facility — original manufacturer labels, secondary container labels, workplace labeling system. Who's responsible for maintaining labels.", icon:"🏷️", color:T.purple },
            { title:"Training Plan", desc:"When training happens (initial hire, new chemicals, annual refresher), who provides it, what it covers. This training you're completing right now is part of this requirement.", icon:"🎓", color:T.good },
            { title:"Non-Routine Tasks", desc:`Procedures for unusual tasks that involve chemical hazards — confined space work, maintenance on chemical lines, emergency repairs in the ${ind.workAreas[1] || "facility"}.`, icon:"⚠️", color:T.bad },
          ].map((item, i) => (
            <div key={i} style={{ ...S.card(T.navyMid), display:"flex", gap:14, padding:16, alignItems:"flex-start" }}>
              <div style={{ width:40, height:40, borderRadius:10, ...S.flexCenter, flexShrink:0,
                background:`${item.color}18`, border:`1px solid ${item.color}44`, fontSize:20 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font, marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:12, color:T.muted, fontFamily:T.font, lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>💡</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Your right:</strong> You can ask to see your employer&apos;s written HazCom program at any time. If they can&apos;t produce one, that&apos;s an OSHA violation.
          </span>
        </div>
      </div>,

      // SLIDE 2: Your Chemical Inventory
      <div key="m7s2">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.amberGlow, T.amber)}>{ind.icon} YOUR CHEMICALS</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Chemical Inventory — {ind.name}</h3>
          <p style={S.sub()}>These are the types of hazardous chemicals commonly found in your workplace. Each one has an SDS you must be able to access.</p>
        </div>

        <div style={{ ...S.grid("repeat(auto-fit, minmax(200px, 1fr))", 10), marginBottom:20 }}>
          {ind.chemicals.map((chem, i) => {
            const hazard = ind.topHazards[i % ind.topHazards.length];
            const picto = GHS_PICTOGRAMS.find(p => p.id === hazard);
            return (
              <div key={i} style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:10, alignItems:"center" }}>
                {picto && <div style={{ width:32, height:32, flexShrink:0 }} dangerouslySetInnerHTML={{ __html: picto.svg }} />}
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, fontFamily:T.font }}>{chem}</div>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:T.font, marginTop:2 }}>{picto?.name || "Check SDS"}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Work areas */}
        <div style={{ ...S.card(), background:`${T.blue}08`, border:`1px solid ${T.blue}22`, padding:20, marginBottom:16 }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:T.blue, fontFamily:T.font, marginBottom:12 }}>📍 Where Chemicals Are Used in Your Facility</h4>
          <div style={{ ...S.grid("repeat(auto-fit, minmax(140px, 1fr))", 8) }}>
            {ind.workAreas.map((area, i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 12px", background:T.navyMid, borderRadius:T.radiusSm }}>
                <span style={{ color:T.blue, fontSize:14 }}>▸</span>
                <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>{area}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...S.card(T.navyMid), padding:14, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>⚡</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>When this changes:</strong> Whenever a new chemical is brought into your workplace, your employer must update the inventory, make the SDS available, and train you BEFORE you work with it.
          </span>
        </div>
      </div>,

      // SLIDE 3: Know Your Safety Resources
      <div key="m7s3">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.goodBg, T.good)}>KNOW YOUR RESOURCES</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Safety Infrastructure Checklist</h3>
          <p style={S.sub()}>Before your next shift, confirm you know the location of every one of these.</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {[
            { item:"SDS Access Point", desc:"Physical binder, computer terminal, or mobile app where you can pull up any SDS", icon:"📋", critical:true },
            { item:"Eyewash Station", desc:"Must reach within 10 seconds of travel from any area where corrosive chemicals are used", icon:"👁️", critical:true },
            { item:"Emergency Shower", desc:"Full-body drench capability for large chemical exposures — know how to activate it", icon:"🚿", critical:true },
            { item:"Spill Kit(s)", desc:"Location of absorbent materials, containment supplies, and disposal bags", icon:"🧹", critical:true },
            { item:"Fire Extinguisher", desc:"Know the type (ABC, CO2, etc.) and location nearest to your work area", icon:"🧯", critical:true },
            { item:"First Aid Kit", desc:"Stocked and inspected regularly — know what's inside before you need it", icon:"🚑", critical:false },
            { item:"Emergency Exit Routes", desc:"Primary and secondary evacuation routes from your work area", icon:"🚪", critical:true },
            { item:"Assembly Point", desc:"Where to gather after evacuation so everyone can be accounted for", icon:"📍", critical:false },
            { item:"Emergency Phone Numbers", desc:"911, Poison Control (1-800-222-1222), facility emergency contacts, supervisor", icon:"📞", critical:true },
            { item:"PPE Storage", desc:"Where clean, inspected PPE is stored and available for your use", icon:"🛡️", critical:false },
          ].map((item, i) => (
            <div key={i} style={{
              display:"flex", gap:12, alignItems:"center", padding:"10px 14px",
              background: T.navyMid, borderRadius:T.radiusSm,
              borderLeft: item.critical ? `3px solid ${T.amber}` : `3px solid rgba(255,255,255,0.08)`,
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color: item.critical ? T.amber : T.ghost, fontFamily:T.font }}>{item.item}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:1 }}>{item.desc}</div>
              </div>
              {item.critical && <span style={{ ...S.tag(T.amberGlow, T.amber), fontSize:9, flexShrink:0 }}>CRITICAL</span>}
            </div>
          ))}
        </div>

        <div style={{ ...S.card(), background:`${T.good}08`, border:`1px solid ${T.good}33`, padding:16, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>✅</span>
          <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.good }}>Action item:</strong> Walk your facility TODAY and locate each of these resources. If any are missing, damaged, or inaccessible — report it to your supervisor.
          </span>
        </div>
      </div>,

      // SLIDE 4: Your Commitment + Training Summary
      <div key="m7s4">
        <div style={{ marginBottom:20 }}>
          <span style={S.tag(T.goodBg, T.good)}>FINAL MODULE</span>
          <h3 style={{ ...S.heading(20), marginTop:12 }}>Training Summary & Your Commitment</h3>
          <p style={S.sub()}>Here&apos;s everything you&apos;ve learned across all 7 modules — your complete HazCom knowledge base.</p>
        </div>

        {/* Summary of all 7 modules */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 14px", background:T.navyMid, borderRadius:T.radiusSm }}>
              <span style={{ fontSize:20 }}>{mod.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font }}>{mod.title}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>{mod.subtitle}</div>
              </div>
              <span style={{ color:T.good, fontSize:14 }}>✓</span>
            </div>
          ))}
        </div>

        {/* Commitment card */}
        <div style={{ ...S.card(), background:`linear-gradient(135deg, ${T.amber}10, ${T.good}08)`, border:`1px solid ${T.amber}33`, padding:24, marginBottom:16 }}>
          <h4 style={{ fontSize:16, fontWeight:800, color:T.amberBright, fontFamily:T.font, textAlign:"center", marginBottom:16 }}>
            Your Safety Commitment
          </h4>
          <div style={{ fontSize:14, color:T.ghost, fontFamily:T.font, lineHeight:1.8, textAlign:"center", maxWidth:500, margin:"0 auto" }}>
            As a trained employee at <strong style={{ color:T.amber }}>{companyName || "my company"}</strong>, I understand:
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:16 }}>
            {[
              "I have the right to know about every chemical hazard in my workplace",
              "I will read chemical labels BEFORE using any product",
              "I know how to access and read a Safety Data Sheet",
              "I will wear the correct PPE as specified by the SDS",
              "I know what to do in a chemical emergency — first aid, spill response, evacuation",
              "I will report any missing labels, inaccessible SDS, or safety concerns to my supervisor",
              "I understand that new chemical training is required whenever new products are introduced",
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"6px 12px" }}>
                <span style={{ color:T.good, fontSize:14, flexShrink:0 }}>✓</span>
                <span style={{ fontSize:13, color:T.ghost, fontFamily:T.font, lineHeight:1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ongoing obligations */}
        <div style={{ ...S.card(T.navyMid), padding:16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font, marginBottom:10 }}>📅 Ongoing Requirements</h4>
          <div style={{ ...S.grid("1fr 1fr", 12) }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.ghost, fontFamily:T.font, marginBottom:6 }}>YOUR EMPLOYER MUST:</div>
              {["Keep SDS current and accessible","Update the chemical inventory","Train on new chemicals before use","Maintain the written HazCom program","Provide required PPE at no cost to you"].map((item,i) => (
                <div key={i} style={{ fontSize:11, color:T.muted, fontFamily:T.font, padding:"2px 0", display:"flex", gap:6 }}>
                  <span style={{ color:T.amber }}>▸</span> {item}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.ghost, fontFamily:T.font, marginBottom:6 }}>YOU MUST:</div>
              {["Follow safe work procedures","Wear required PPE properly","Report hazards and incidents","Attend new chemical training","Never use unlabeled chemicals"].map((item,i) => (
                <div key={i} style={{ fontSize:11, color:T.muted, fontFamily:T.font, padding:"2px 0", display:"flex", gap:6 }}>
                  <span style={{ color:T.good }}>▸</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...S.card(), background:`${T.amber}08`, border:`1px solid ${T.amber}33`, padding:14, marginTop:12, display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>🎓</span>
          <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>
            <strong style={{ color:T.amber }}>Almost done!</strong> Pass the final quiz to complete your HazCom Foundation Training and receive your certificate. Note: your employer is still responsible for a brief site-specific walkthrough showing you the actual locations of SDS, eyewash, spill kits, and exits at your facility.
          </span>
        </div>
      </div>,
    ];
  };

  // ════════════════════════════════════════════════════
  // RENDER: TRAINING (Module Content)
  // ════════════════════════════════════════════════════
  const renderTraining = () => {
    const mod = MODULES.find(m => m.id === currentModule);
    const slides = getModuleSlides(currentModule || "");
    const totalSlides = slides.length;
    const isLastSlide = currentSlide >= totalSlides - 1;

    return (
      <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s" }} ref={contentRef}>
        {/* Sticky header */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:T.navy, borderBottom:`1px solid rgba(255,255,255,0.06)`, padding:"12px 20px" }}>
          <div style={{ ...S.flexBetween, maxWidth:720, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={() => transitionTo("modules")} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:18, padding:0 }}>←</button>
              <span style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font }}>{mod?.icon} {mod?.title}</span>
            </div>
            <span style={S.tag()}>
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ maxWidth:720, margin:"8px auto 0", background:T.navyLight, borderRadius:4, height:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${((currentSlide+1)/totalSlides)*100}%`, background:T.amber, borderRadius:4, transition:"width 0.4s ease" }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:"24px 20px", maxWidth:720, margin:"0 auto" }}>
          <div style={{ animation:"shieldFadeIn 0.3s ease" }} key={`${currentModule}-${currentSlide}`}>
            {slides[currentSlide]}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding:"16px 20px 32px", maxWidth:720, margin:"0 auto" }}>
          <div style={{ ...S.flexBetween }}>
            <button onClick={() => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1); }}
              disabled={currentSlide === 0}
              style={S.btnOutline(currentSlide === 0 ? T.navyLight : T.muted)}>
              ← Back
            </button>
            {isLastSlide ? (
              <button onClick={goToQuiz} style={S.btn(T.amber, T.navy)}>
                Take the Quiz →
              </button>
            ) : (
              <button onClick={() => setCurrentSlide(currentSlide + 1)} style={S.btn(T.amber, T.navy)}>
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // RENDER: QUIZ
  // ════════════════════════════════════════════════════
  const renderQuiz = () => {
    const quizData = getQuizzes(industry, companyName)?.[currentModule || ""] || [];
    const mod = MODULES.find(m => m.id === currentModule);

    return (
      <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s", padding:"32px 20px", maxWidth:720, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <span style={S.tag(T.purpleBg, T.purple)}>ASSESSMENT</span>
          <h2 style={{ ...S.heading(22), marginTop:12 }}>{mod?.icon} {mod?.title} — Quiz</h2>
          <p style={S.sub()}>Score 80% or higher to pass. You need {Math.ceil(quizData.length * 0.8)}/{quizData.length} correct.</p>
        </div>

        {/* Questions */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {quizData.map((q: any, qi: number) => (
            <div key={qi} style={{ ...S.card(T.navyMid), padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.white, fontFamily:T.font, marginBottom:14, lineHeight:1.5 }}>
                <span style={{ color:T.amber, marginRight:8 }}>Q{qi+1}.</span>{q.q}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {q.opts.map((opt: string, oi: number) => {
                  const selected = quizAnswers[qi] === oi;
                  const isCorrect = quizSubmitted && oi === q.correct;
                  const isWrong = quizSubmitted && selected && oi !== q.correct;
                  let bg = T.navyCard;
                  let border = "rgba(255,255,255,0.06)";
                  let textColor = T.ghost;
                  if (!quizSubmitted && selected) { bg = T.amberGlow; border = T.amber; textColor = T.amber; }
                  if (isCorrect) { bg = T.goodBg; border = T.good; textColor = T.good; }
                  if (isWrong) { bg = T.badBg; border = T.bad; textColor = T.bad; }

                  return (
                    <button key={oi} disabled={quizSubmitted} onClick={() => setQuizAnswers(prev => ({...prev, [qi]:oi}))}
                      style={{
                        display:"flex", alignItems:"center", gap:12, padding:"12px 16px", textAlign:"left",
                        background:bg, border:`1.5px solid ${border}`, borderRadius:T.radiusSm,
                        cursor: quizSubmitted ? "default" : "pointer", transition:"all 0.2s",
                        fontFamily:T.font, fontSize:14, color:textColor,
                      }}>
                      <div style={{
                        width:24, height:24, borderRadius:12, ...S.flexCenter, flexShrink:0,
                        background: isCorrect ? T.good : isWrong ? T.bad : selected ? T.amber : "rgba(255,255,255,0.08)",
                        color: (isCorrect || isWrong || selected) ? T.white : T.muted,
                        fontSize:12, fontWeight:700,
                      }}>
                        {isCorrect ? "✓" : isWrong ? "✗" : String.fromCharCode(65+oi)}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {/* Explanation after submit */}
              {quizSubmitted && (
                <div style={{ marginTop:12, padding:"10px 14px", background:`${T.blue}12`, borderRadius:T.radiusSm, border:`1px solid ${T.blue}22` }}>
                  <span style={{ fontSize:12, color:T.ghost, fontFamily:T.font }}>💡 {q.explain}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit / Result */}
        <div style={{ marginTop:28, textAlign:"center" }}>
          {!quizSubmitted ? (
            <button onClick={submitQuiz}
              disabled={Object.keys(quizAnswers).length < quizData.length}
              style={S.btn(T.amber, T.navy, Object.keys(quizAnswers).length < quizData.length)}>
              Submit Answers
            </button>
          ) : (() => {
            const score = quizScore ?? 0;
            return (
            <div style={{ ...S.card(score >= 80 ? T.goodBg : T.badBg), padding:24, border:`1px solid ${score>=80 ? T.good : T.bad}44`, animation:"shieldFadeIn 0.3s ease" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>{score >= 80 ? "✅" : "📚"}</div>
              <h3 style={{ ...S.heading(20), color: score >= 80 ? T.good : T.bad }}>
                {score >= 80 ? "Module Complete!" : "Not quite — try again"}
              </h3>
              <p style={{ ...S.sub(13), marginTop:8, marginBottom:16 }}>
                {score >= 80
                  ? `Great work, ${employeeName.split(" ")[0]}! You passed with ${score}%.`
                  : `You scored ${score}% — you need 80% to pass. Review the material and try again — you've got this!`}
              </p>
              {score >= 80 ? (
                <button onClick={afterQuiz} style={S.btn(T.good, T.white)}>
                  {completedModules.length >= 7 && !employeeId ? "🎓 Get Certificate" : "← Back to Modules"}
                </button>
              ) : (
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                  <button onClick={() => { setCurrentSlide(0); transitionTo("training"); }} style={S.btnOutline(T.muted)}>
                    Review Module
                  </button>
                  <button onClick={retakeQuiz} style={S.btn(T.amber, T.navy)}>
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          ); })()}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // RENDER: CERTIFICATE
  // ════════════════════════════════════════════════════
  const printCertificate = () => {
    const certDate = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const moduleNames = MODULES.map(m => m.title);
    const w = window.open("", "_blank");
    if (!w) { window.print?.(); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${employeeName}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',system-ui,sans-serif; background:white; display:flex; align-items:center; justify-content:center; min-height:100vh; }
        .cert { width:7.5in; padding:0.75in; border:3px solid #B8860B; position:relative; }
        .corner { position:absolute; width:30px; height:30px; }
        .corner.tl { top:12px; left:12px; border-top:2px solid #B8860B; border-left:2px solid #B8860B; }
        .corner.tr { top:12px; right:12px; border-top:2px solid #B8860B; border-right:2px solid #B8860B; }
        .corner.bl { bottom:12px; left:12px; border-bottom:2px solid #B8860B; border-left:2px solid #B8860B; }
        .corner.br { bottom:12px; right:12px; border-bottom:2px solid #B8860B; border-right:2px solid #B8860B; }
        .brand { font-size:14px; letter-spacing:0.2em; color:#B8860B; font-weight:600; margin-bottom:8px; }
        h1 { font-size:28px; font-weight:800; color:#1a1a1a; margin-bottom:4px; }
        .divider { width:60px; height:2px; background:#B8860B; margin:12px auto 20px; }
        .certifies { font-size:14px; color:#666; margin-bottom:16px; }
        .name { font-size:26px; font-weight:800; color:#1a1a1a; border-bottom:2px solid #B8860B; display:inline-block; padding:0 24px 8px; }
        .company { font-size:13px; color:#888; margin:8px 0 20px; }
        .desc { font-size:14px; color:#444; line-height:1.6; margin-bottom:16px; }
        .osha { font-size:13px; color:#B8860B; font-weight:600; margin-bottom:20px; }
        .modules { margin:16px auto; max-width:360px; text-align:left; }
        .modules .mod { font-size:12px; color:#444; padding:3px 0; display:flex; gap:8px; }
        .meta { display:flex; justify-content:center; gap:40px; margin:20px 0; flex-wrap:wrap; }
        .meta > div { text-align:center; }
        .meta .label { font-size:10px; color:#888; letter-spacing:0.05em; }
        .meta .value { font-size:13px; font-weight:700; color:#1a1a1a; }
        .footer { font-size:10px; color:#aaa; line-height:1.5; margin-top:20px; }
        @media print { body { min-height:auto; } @page { size:letter; margin:0.5in; } }
      </style>
    </head><body>
      <div class="cert">
        <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
        <div style="text-align:center">
          <div class="brand">SHIELDSDS</div>
          <h1>Certificate of Completion</h1>
          <div class="divider"></div>
          <p class="certifies">This certifies that</p>
          <p class="name">${employeeName}</p>
          <p class="company">${companyName || "Mike's Auto Body"}</p>
          <p class="desc">Has successfully completed <strong>OSHA HazCom Safety Training</strong><br/>covering all 7 required modules with passing assessments.</p>
          <p class="osha">29 CFR 1910.1200(h) Compliant</p>
          <div class="modules">
            ${moduleNames.map(n => `<div class="mod"><span>✅</span><span>${n}</span></div>`).join("")}
          </div>
          <div class="meta">
            <div><div class="label">DATE</div><div class="value">${certDate}</div></div>
            <div><div class="label">INDUSTRY</div><div class="value">${ind.name}</div></div>
            <div><div class="label">PROVIDER</div><div class="value">ShieldSDS</div></div>
          </div>
          <div class="footer">
            Training documentation per OSHA 29 CFR 1910.1200(h)<br/>
            This certificate documents completion of HazCom training content.<br/>
            Employers retain responsibility for site-specific supplemental training.
          </div>
        </div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const renderCertificate = () => (
    <div style={{ ...S.fadeIn, opacity: transitioning ? 0 : 1, transition:"opacity 0.3s", padding:"32px 20px" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:56, marginBottom:8 }}>🎉</div>
        <h2 style={S.heading(28)}>Congratulations, {employeeName.split(" ")[0]}!</h2>
        <p style={S.sub()}>You&apos;ve completed all 7 HazCom Safety Training modules.</p>
      </div>

      {/* Certificate */}
      <div id="shield-certificate" style={{
        maxWidth:680, margin:"0 auto", background:"#FFFEF8", borderRadius:4,
        border:"3px solid #B8860B", padding:48, position:"relative", color:"#1a1a1a",
      }}>
        {/* Corner decorations */}
        {["top:12px;left:12px","top:12px;right:12px","bottom:12px;left:12px","bottom:12px;right:12px"].map((pos,i) => (
          <div key={i} style={{ position:"absolute", ...Object.fromEntries(pos.split(";").map(p => p.split(":"))), width:30, height:30,
            borderTop: i<2?"2px solid #B8860B":"none", borderBottom: i>=2?"2px solid #B8860B":"none",
            borderLeft: i%2===0?"2px solid #B8860B":"none", borderRight: i%2===1?"2px solid #B8860B":"none" }} />
        ))}

        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:14, letterSpacing:"0.2em", color:"#B8860B", fontFamily:T.font, fontWeight:600, marginBottom:8 }}>SHIELDSDS</div>
          <h2 style={{ fontSize:28, fontWeight:800, color:"#1a1a1a", fontFamily:T.font, margin:"0 0 4px", letterSpacing:"-0.01em" }}>
            Certificate of Completion
          </h2>
          <div style={{ width:60, height:2, background:"#B8860B", margin:"12px auto 20px" }} />

          <p style={{ fontSize:14, color:"#666", fontFamily:T.font, margin:"0 0 16px" }}>This certifies that</p>
          <p style={{ fontSize:26, fontWeight:800, color:"#1a1a1a", fontFamily:T.font, margin:"0 0 4px", borderBottom:"2px solid #B8860B", display:"inline-block", padding:"0 24px 8px" }}>
            {employeeName}
          </p>
          <p style={{ fontSize:13, color:"#888", fontFamily:T.font, margin:"8px 0 20px" }}>{companyName}</p>

          <p style={{ fontSize:14, color:"#444", fontFamily:T.font, margin:"0 0 12px", lineHeight:1.6 }}>
            Has successfully completed <strong>OSHA HazCom Safety Training</strong><br />
            covering all 7 required modules with passing assessments.
          </p>

          <p style={{ fontSize:13, color:"#B8860B", fontFamily:T.font, fontWeight:600, margin:"0 0 20px" }}>
            29 CFR 1910.1200(h) Compliant
          </p>

          {/* Module list */}
          <div style={{ display:"inline-block", textAlign:"left", margin:"0 auto 20px" }}>
            {MODULES.map(mod => (
              <div key={mod.id} style={{ fontSize:12, color:"#444", fontFamily:T.font, padding:"3px 0", display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ color:"#34C759" }}>✅</span>
                <span>{mod.title}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", justifyContent:"center", gap:32, margin:"20px 0", flexWrap:"wrap" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#888", fontFamily:T.font, letterSpacing:"0.05em" }}>DATE</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", fontFamily:T.font }}>{new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#888", fontFamily:T.font, letterSpacing:"0.05em" }}>INDUSTRY</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", fontFamily:T.font }}>{ind.name}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#888", fontFamily:T.font, letterSpacing:"0.05em" }}>PROVIDER</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", fontFamily:T.font }}>ShieldSDS</div>
            </div>
          </div>

          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:10, color:"#aaa", fontFamily:T.font, lineHeight:1.5 }}>
              Training documentation per OSHA 29 CFR 1910.1200(h)<br />
              This certificate documents completion of HazCom training content.<br />
              Employers retain responsibility for site-specific supplemental training and program implementation.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ textAlign:"center", marginTop:24, display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <button onClick={printCertificate} style={S.btn(T.amber, T.navy)}>🖨️ Print Certificate</button>
        <button onClick={() => { transitionTo("modules"); }} style={S.btnOutline(T.muted)}>🔄 Refresher Training</button>
        {employeeId && (
          <a href="/training" style={{ ...S.btnOutline(T.muted), textDecoration:"none", display:"inline-flex", alignItems:"center" }}>
            ← Back to Training
          </a>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:T.navy, fontFamily:T.font, color:T.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        @keyframes shieldFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; }
        input:focus { border-color:${T.amber} !important; box-shadow:0 0 0 2px ${T.amber}33 !important; }
        button:hover:not(:disabled) { filter:brightness(1.1); }
        @media print {
          body { background:white !important; }
          #shield-certificate { border:2px solid #B8860B !important; }
          button, [style*="sticky"] { display:none !important; }
        }
        @media (max-width:600px) {
          h1 { font-size:28px !important; }
          h2 { font-size:22px !important; }
        }
      `}</style>

      {/* ── PERSISTENT HEADER BAR ── */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        background:`${T.navy}ee`, backdropFilter:"blur(12px)",
        borderBottom:`1px solid rgba(255,255,255,0.06)`,
        padding:"10px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <a href="/training" style={{ display:"flex", alignItems:"center", gap:6, color:T.muted, fontSize:13, fontFamily:T.font, textDecoration:"none", cursor:"pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = T.white)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
          ← Exit Training
        </a>
        <span style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.font, letterSpacing:0.5 }}>
          ShieldSDS Training{employeeId && employeeName ? ` — ${employeeName}` : ""}
        </span>
        <span style={{ fontSize:12, color:T.muted, fontFamily:T.font, minWidth:120, textAlign:"right" }}>
          {phase === "training" || phase === "quiz"
            ? (MODULES.find(m => m.id === currentModule)?.title || "Module")
            : phase === "certificate" ? "Certificate" : "Module Select"}
        </span>
      </div>

      {phase === "welcome" && renderWelcome()}
      {phase === "profile" && renderProfile()}
      {phase === "modules" && renderModuleOverview()}
      {phase === "training" && renderTraining()}
      {phase === "quiz" && renderQuiz()}
      {phase === "certificate" && renderCertificate()}
    </div>
  );
}
