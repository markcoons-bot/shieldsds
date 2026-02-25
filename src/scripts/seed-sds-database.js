#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * ShieldSDS — Seed SDS Database
 * Looks up SDS info for 300 common workplace chemicals via Anthropic API with web search,
 * then stores results in Supabase for instant future lookups.
 *
 * Usage: node src/scripts/seed-sds-database.js
 *
 * Resume-safe: skips chemicals already in the database.
 */

const { createClient } = require("@supabase/supabase-js");

// ── Config ──────────────────────────────────────────────────────────────────
// Load .env.local if available (for local development)
try { require("dotenv").config({ path: ".env.local" }); } catch { /* dotenv not required */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL (or set in .env.local)");
  console.error("  SUPABASE_SERVICE_ROLE_KEY (or set in .env.local)");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DELAY_MS = 5000; // 5s between API calls (retries handle rate limits)
const MAX_RETRIES = 5;

// ── Chemical List (300) ─────────────────────────────────────────────────────
const CHEMICALS = [
  // AUTO BODY / COLLISION REPAIR (50)
  { product_name: "CRC Brakleen Brake Parts Cleaner", manufacturer: "CRC Industries", industry_tags: ["auto-body", "automotive"] },
  { product_name: "PPG DBC Basecoat", manufacturer: "PPG Industries", industry_tags: ["auto-body"] },
  { product_name: "3M Super 77 Multipurpose Spray Adhesive", manufacturer: "3M", industry_tags: ["auto-body", "construction", "general"] },
  { product_name: "Bondo Body Filler", manufacturer: "3M/Bondo", industry_tags: ["auto-body"] },
  { product_name: "Meguiar's D120 All Purpose Cleaner", manufacturer: "Meguiar's", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Rust-Oleum Professional Primer Spray", manufacturer: "Rust-Oleum", industry_tags: ["auto-body", "construction", "general"] },
  { product_name: "DuPont ChromaPremier Pro Basecoat", manufacturer: "Axalta", industry_tags: ["auto-body"] },
  { product_name: "SEM Color Coat Flexible Coating", manufacturer: "SEM Products", industry_tags: ["auto-body"] },
  { product_name: "3M Automotive Adhesive Remover", manufacturer: "3M", industry_tags: ["auto-body"] },
  { product_name: "PPG Deltron DBC Basecoat", manufacturer: "PPG Industries", industry_tags: ["auto-body"] },
  { product_name: "Sherwin-Williams Ultra 7000 Basecoat", manufacturer: "Sherwin-Williams", industry_tags: ["auto-body"] },
  { product_name: "BASF Glasurit 55 Line Basecoat", manufacturer: "BASF", industry_tags: ["auto-body"] },
  { product_name: "3M Super Silicone Spray", manufacturer: "3M", industry_tags: ["auto-body", "general"] },
  { product_name: "CRC QD Electronic Cleaner", manufacturer: "CRC Industries", industry_tags: ["auto-body", "manufacturing"] },
  { product_name: "Evercoat Rage Gold Body Filler", manufacturer: "Evercoat/ITW", industry_tags: ["auto-body"] },
  { product_name: "3M Scotch-Weld Structural Adhesive", manufacturer: "3M", industry_tags: ["auto-body", "manufacturing"] },
  { product_name: "U-POL Raptor Bedliner Kit", manufacturer: "U-POL", industry_tags: ["auto-body"] },
  { product_name: "SEM Trim Black Spray Paint", manufacturer: "SEM Products", industry_tags: ["auto-body"] },
  { product_name: "Transtar 2-in-1 Primer", manufacturer: "Transtar Autobody Technologies", industry_tags: ["auto-body"] },
  { product_name: "Norton Speed Grip Adhesive", manufacturer: "Norton/Saint-Gobain", industry_tags: ["auto-body"] },
  { product_name: "Spies Hecker Permahyd Hi-TEC Basecoat", manufacturer: "Axalta", industry_tags: ["auto-body"] },
  { product_name: "3M Panel Bond Adhesive", manufacturer: "3M", industry_tags: ["auto-body"] },
  { product_name: "POR-15 Rust Preventive Coating", manufacturer: "POR-15", industry_tags: ["auto-body", "general"] },
  { product_name: "Eastwood Rust Encapsulator", manufacturer: "Eastwood", industry_tags: ["auto-body"] },
  { product_name: "3M Dynatron Bondo-Hair Filler", manufacturer: "3M", industry_tags: ["auto-body"] },
  { product_name: "WD-40 Specialist Degreaser", manufacturer: "WD-40 Company", industry_tags: ["auto-body", "manufacturing", "general"] },
  { product_name: "Wurth Brake Cleaner", manufacturer: "Wurth", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Sikkens Autobase Plus Basecoat", manufacturer: "AkzoNobel", industry_tags: ["auto-body"] },
  { product_name: "PPG Envirobase High Performance Basecoat", manufacturer: "PPG Industries", industry_tags: ["auto-body"] },
  { product_name: "Martin Senour Automotive Finishes", manufacturer: "Sherwin-Williams", industry_tags: ["auto-body"] },
  { product_name: "Dupli-Color Perfect Match Paint", manufacturer: "Dupli-Color/Sherwin-Williams", industry_tags: ["auto-body", "automotive"] },
  { product_name: "3M General Purpose Adhesive Cleaner", manufacturer: "3M", industry_tags: ["auto-body", "general"] },
  { product_name: "CRC Mass Air Flow Sensor Cleaner", manufacturer: "CRC Industries", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Permatex Ultra Black Gasket Maker", manufacturer: "Permatex", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Permatex Thread Sealant", manufacturer: "Permatex", industry_tags: ["auto-body", "automotive", "manufacturing"] },
  { product_name: "Loctite Super Glue", manufacturer: "Henkel", industry_tags: ["auto-body", "general"] },
  { product_name: "JB Weld Original Cold Weld", manufacturer: "JB Weld", industry_tags: ["auto-body", "general"] },
  { product_name: "3M Rubbing Compound", manufacturer: "3M", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Meguiar's Ultimate Compound", manufacturer: "Meguiar's", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Chemical Guys V36 Optical Grade Cutting Polish", manufacturer: "Chemical Guys", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Mothers California Gold Clay Bar", manufacturer: "Mothers", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Adam's Polishes Iron Remover", manufacturer: "Adam's Polishes", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Griot's Garage Paint Sealant", manufacturer: "Griot's Garage", industry_tags: ["auto-body", "automotive"] },
  { product_name: "Turtle Wax Rubbing Compound", manufacturer: "Turtle Wax", industry_tags: ["auto-body", "automotive"] },
  { product_name: "3M Finesse-it Machine Polish", manufacturer: "3M", industry_tags: ["auto-body"] },
  { product_name: "Devilbiss Starting Line Spray Gun Cleaner", manufacturer: "DeVilbiss", industry_tags: ["auto-body"] },
  { product_name: "PPG D8115 Deltron Medium Thinner", manufacturer: "PPG Industries", industry_tags: ["auto-body"] },
  { product_name: "DuPont 3812S Nason Reducer", manufacturer: "Axalta", industry_tags: ["auto-body"] },
  { product_name: "Isopropyl Alcohol 99%", manufacturer: "various/generic", industry_tags: ["auto-body", "janitorial", "general"] },
  { product_name: "Acetone Technical Grade", manufacturer: "various/generic", industry_tags: ["auto-body", "construction", "general"] },

  // CONSTRUCTION / TRADES (50)
  { product_name: "QUIKRETE Concrete Mix", manufacturer: "QUIKRETE", industry_tags: ["construction"] },
  { product_name: "Gorilla Glue Original", manufacturer: "Gorilla Glue", industry_tags: ["construction", "general"] },
  { product_name: "DAP Alex Plus Caulk", manufacturer: "DAP", industry_tags: ["construction"] },
  { product_name: "Loctite PL Premium Construction Adhesive", manufacturer: "Henkel", industry_tags: ["construction"] },
  { product_name: "GREAT STUFF Gaps & Cracks Foam Sealant", manufacturer: "Dow/DuPont", industry_tags: ["construction"] },
  { product_name: "Liquid Nails Heavy Duty Construction Adhesive", manufacturer: "PPG Architectural", industry_tags: ["construction"] },
  { product_name: "Rust-Oleum Stops Rust Spray Paint", manufacturer: "Rust-Oleum", industry_tags: ["construction", "general"] },
  { product_name: "Kilz Original Primer", manufacturer: "Kilz/Masterchem", industry_tags: ["construction"] },
  { product_name: "Zinsser BIN Shellac-Based Primer", manufacturer: "Rust-Oleum/Zinsser", industry_tags: ["construction"] },
  { product_name: "Minwax Wood Finish Stain", manufacturer: "Minwax/Sherwin-Williams", industry_tags: ["construction"] },
  { product_name: "Thompson's WaterSeal Waterproofer", manufacturer: "Thompson's/Sherwin-Williams", industry_tags: ["construction"] },
  { product_name: "Sika Boom Expanding Foam", manufacturer: "Sika", industry_tags: ["construction"] },
  { product_name: "Henry 887 Tropi-Cool Roof Coating", manufacturer: "Henry Company", industry_tags: ["construction"] },
  { product_name: "Behr Premium Plus Interior Paint", manufacturer: "Behr", industry_tags: ["construction"] },
  { product_name: "Benjamin Moore Regal Select Paint", manufacturer: "Benjamin Moore", industry_tags: ["construction"] },
  { product_name: "Sherwin-Williams Duration Exterior Paint", manufacturer: "Sherwin-Williams", industry_tags: ["construction"] },
  { product_name: "Titebond III Ultimate Wood Glue", manufacturer: "Franklin International", industry_tags: ["construction"] },
  { product_name: "OSI Quad Max Sealant", manufacturer: "Henkel", industry_tags: ["construction"] },
  { product_name: "GE Silicone II Caulk", manufacturer: "GE Sealants", industry_tags: ["construction"] },
  { product_name: "Red Devil House & Home Caulk", manufacturer: "Red Devil", industry_tags: ["construction"] },
  { product_name: "Sakrete Concrete Crack Filler", manufacturer: "Sakrete/Quikrete", industry_tags: ["construction"] },
  { product_name: "Sashco Big Stretch Caulk", manufacturer: "Sashco", industry_tags: ["construction"] },
  { product_name: "Flex Seal Spray Rubber Sealant", manufacturer: "Flex Seal", industry_tags: ["construction", "general"] },
  { product_name: "Krylon Fusion All-In-One Spray Paint", manufacturer: "Krylon/Sherwin-Williams", industry_tags: ["construction", "general"] },
  { product_name: "Montana Gold Spray Paint", manufacturer: "Montana Cans", industry_tags: ["construction"] },
  { product_name: "Cabot Australian Timber Oil", manufacturer: "Cabot/Valspar", industry_tags: ["construction"] },
  { product_name: "Olympic Stain Solid Color", manufacturer: "Olympic/PPG", industry_tags: ["construction"] },
  { product_name: "Varathane Polyurethane", manufacturer: "Rust-Oleum", industry_tags: ["construction"] },
  { product_name: "General Finishes High Performance Top Coat", manufacturer: "General Finishes", industry_tags: ["construction"] },
  { product_name: "Zar Wood Stain", manufacturer: "UGL/United Gilsonite Labs", industry_tags: ["construction"] },
  { product_name: "Durabond 90 Joint Compound", manufacturer: "USG", industry_tags: ["construction"] },
  { product_name: "Sheetrock Brand Joint Compound", manufacturer: "USG", industry_tags: ["construction"] },
  { product_name: "Mapei Kerabond Thin-Set Mortar", manufacturer: "Mapei", industry_tags: ["construction"] },
  { product_name: "Custom Building Products Polyblend Grout", manufacturer: "Custom Building", industry_tags: ["construction"] },
  { product_name: "Ardex X77 Tile Adhesive", manufacturer: "Ardex", industry_tags: ["construction"] },
  { product_name: "Laticrete 254 Platinum Thin-Set", manufacturer: "Laticrete", industry_tags: ["construction"] },
  { product_name: "Weldwood Contact Cement", manufacturer: "DAP", industry_tags: ["construction"] },
  { product_name: "3M Hi-Strength 90 Spray Adhesive", manufacturer: "3M", industry_tags: ["construction", "general"] },
  { product_name: "Loctite Power Grab Express", manufacturer: "Henkel", industry_tags: ["construction"] },
  { product_name: "Sika AnchorFix 2 Anchoring Adhesive", manufacturer: "Sika", industry_tags: ["construction"] },
  { product_name: "Hilti HIT-RE 500 V3 Epoxy", manufacturer: "Hilti", industry_tags: ["construction"] },
  { product_name: "Simpson Strong-Tie SET-3G Epoxy", manufacturer: "Simpson Strong-Tie", industry_tags: ["construction"] },
  { product_name: "Tapcon Concrete Anchoring Adhesive", manufacturer: "Tapcon/ITW", industry_tags: ["construction"] },
  { product_name: "Blue Max Liquid Rubber Waterproofing", manufacturer: "Ames Research", industry_tags: ["construction"] },
  { product_name: "Drylok Masonry Waterproofer", manufacturer: "UGL", industry_tags: ["construction"] },
  { product_name: "RadonSeal Concrete Sealer", manufacturer: "RadonSeal", industry_tags: ["construction"] },
  { product_name: "Quikrete Concrete Sealer", manufacturer: "Quikrete", industry_tags: ["construction"] },
  { product_name: "Sika Level Self-Leveling Compound", manufacturer: "Sika", industry_tags: ["construction"] },
  { product_name: "Mapei Ultraplan Self-Leveling Compound", manufacturer: "Mapei", industry_tags: ["construction"] },
  { product_name: "Ardex K-301 Self-Leveling Compound", manufacturer: "Ardex", industry_tags: ["construction"] },

  // JANITORIAL / CLEANING (50)
  { product_name: "Simple Green All-Purpose Cleaner", manufacturer: "Sunshine Makers", industry_tags: ["janitorial", "general"] },
  { product_name: "Zep Heavy-Duty Citrus Degreaser", manufacturer: "Zep Inc", industry_tags: ["janitorial", "general"] },
  { product_name: "Pine-Sol Original Multi-Surface Cleaner", manufacturer: "Clorox", industry_tags: ["janitorial"] },
  { product_name: "Fabuloso Multi-Purpose Cleaner", manufacturer: "Colgate-Palmolive", industry_tags: ["janitorial"] },
  { product_name: "Clorox Disinfecting Bleach", manufacturer: "Clorox", industry_tags: ["janitorial", "general"] },
  { product_name: "Lysol Disinfectant Spray", manufacturer: "Reckitt Benckiser", industry_tags: ["janitorial", "general"] },
  { product_name: "Windex Glass Cleaner", manufacturer: "SC Johnson", industry_tags: ["janitorial", "general"] },
  { product_name: "Mr. Clean Multi-Surface Cleaner", manufacturer: "Procter & Gamble", industry_tags: ["janitorial"] },
  { product_name: "Comet Cleanser with Bleach", manufacturer: "Prestige Brands", industry_tags: ["janitorial"] },
  { product_name: "Ajax All Purpose Cleaner", manufacturer: "Colgate-Palmolive", industry_tags: ["janitorial"] },
  { product_name: "Dawn Professional Dish Soap", manufacturer: "Procter & Gamble", industry_tags: ["janitorial", "restaurant"] },
  { product_name: "Joy Dishwashing Liquid", manufacturer: "Procter & Gamble", industry_tags: ["janitorial", "restaurant"] },
  { product_name: "Cascade Professional Dishwasher Detergent", manufacturer: "Procter & Gamble", industry_tags: ["janitorial", "restaurant"] },
  { product_name: "Finish Powerball Dishwasher Tabs", manufacturer: "Reckitt Benckiser", industry_tags: ["janitorial"] },
  { product_name: "Tide Professional Laundry Detergent", manufacturer: "Procter & Gamble", industry_tags: ["janitorial"] },
  { product_name: "OxiClean Versatile Stain Remover", manufacturer: "Church & Dwight", industry_tags: ["janitorial"] },
  { product_name: "Murphy Oil Soap", manufacturer: "Colgate-Palmolive", industry_tags: ["janitorial"] },
  { product_name: "Pledge Multi-Surface Cleaner", manufacturer: "SC Johnson", industry_tags: ["janitorial"] },
  { product_name: "Scrubbing Bubbles Bathroom Cleaner", manufacturer: "SC Johnson", industry_tags: ["janitorial"] },
  { product_name: "Soft Scrub with Bleach", manufacturer: "Henkel", industry_tags: ["janitorial"] },
  { product_name: "Bar Keepers Friend Cleanser", manufacturer: "SerVaas Laboratories", industry_tags: ["janitorial", "restaurant"] },
  { product_name: "CLR Calcium Lime Rust Remover", manufacturer: "Jelmar", industry_tags: ["janitorial", "general"] },
  { product_name: "Lime-A-Way Hard Water Stain Remover", manufacturer: "Reckitt Benckiser", industry_tags: ["janitorial"] },
  { product_name: "Iron Out Rust Stain Remover", manufacturer: "Summit Brands", industry_tags: ["janitorial"] },
  { product_name: "Kaboom Shower Tub & Tile Cleaner", manufacturer: "Church & Dwight", industry_tags: ["janitorial"] },
  { product_name: "ZEP Acidic Toilet Bowl Cleaner", manufacturer: "Zep Inc", industry_tags: ["janitorial"] },
  { product_name: "Lysol Toilet Bowl Cleaner", manufacturer: "Reckitt Benckiser", industry_tags: ["janitorial"] },
  { product_name: "Clorox Toilet Bowl Cleaner", manufacturer: "Clorox", industry_tags: ["janitorial"] },
  { product_name: "Betco pH7Q Dual Neutral Disinfectant", manufacturer: "Betco", industry_tags: ["janitorial"] },
  { product_name: "Spartan Chemical BioRenewables Glass Cleaner", manufacturer: "Spartan Chemical", industry_tags: ["janitorial"] },
  { product_name: "Diversey Virex II 256 Disinfectant", manufacturer: "Diversey/Solenis", industry_tags: ["janitorial"] },
  { product_name: "Ecolab Oasis Pro All Purpose Cleaner", manufacturer: "Ecolab", industry_tags: ["janitorial", "restaurant"] },
  { product_name: "SC Johnson Professional TruShot Disinfectant", manufacturer: "SC Johnson", industry_tags: ["janitorial"] },
  { product_name: "Purell Professional Surface Disinfectant", manufacturer: "GOJO Industries", industry_tags: ["janitorial"] },
  { product_name: "Clorox Healthcare Hydrogen Peroxide Cleaner", manufacturer: "Clorox", industry_tags: ["janitorial"] },
  { product_name: "Virox Accel TB Disinfectant", manufacturer: "Diversey", industry_tags: ["janitorial"] },
  { product_name: "Microban 24 Multi-Purpose Cleaner", manufacturer: "Procter & Gamble", industry_tags: ["janitorial"] },
  { product_name: "Method All-Purpose Cleaner", manufacturer: "Method/SC Johnson", industry_tags: ["janitorial"] },
  { product_name: "Seventh Generation Disinfecting Multi-Surface Cleaner", manufacturer: "Unilever", industry_tags: ["janitorial"] },
  { product_name: "Mrs. Meyer's Clean Day Multi-Surface Cleaner", manufacturer: "SC Johnson", industry_tags: ["janitorial"] },
  { product_name: "Goo Gone Original Liquid", manufacturer: "Weiman Products", industry_tags: ["janitorial", "general"] },
  { product_name: "WD-40 Original Formula", manufacturer: "WD-40 Company", industry_tags: ["janitorial", "manufacturing", "general"] },
  { product_name: "3-IN-ONE Multi-Purpose Oil", manufacturer: "WD-40 Company", industry_tags: ["general"] },
  { product_name: "PB Blaster Penetrating Catalyst", manufacturer: "Blaster Chemical", industry_tags: ["automotive", "manufacturing", "general"] },
  { product_name: "Krud Kutter Original Cleaner Degreaser", manufacturer: "Rust-Oleum", industry_tags: ["janitorial", "general"] },
  { product_name: "Purple Power Industrial Strength Degreaser", manufacturer: "Aiken Chemical", industry_tags: ["janitorial", "automotive"] },
  { product_name: "SuperClean Tough Task Degreaser", manufacturer: "SuperClean Brands", industry_tags: ["janitorial", "automotive"] },
  { product_name: "Mean Green Industrial Strength Degreaser", manufacturer: "CR Brands", industry_tags: ["janitorial"] },
  { product_name: "Spray Nine Heavy Duty Cleaner", manufacturer: "Permatex", industry_tags: ["janitorial", "automotive"] },
  { product_name: "ZEP Fast 505 Cleaner & Degreaser", manufacturer: "Zep Inc", industry_tags: ["janitorial"] },

  // MANUFACTURING / INDUSTRIAL (50)
  { product_name: "CRC 5-56 Multi-Purpose Lubricant", manufacturer: "CRC Industries", industry_tags: ["manufacturing"] },
  { product_name: "LPS 1 Greaseless Lubricant", manufacturer: "LPS Laboratories", industry_tags: ["manufacturing"] },
  { product_name: "Tap Magic Cutting Fluid", manufacturer: "Steco", industry_tags: ["manufacturing"] },
  { product_name: "Castrol Syntilo 9913 Coolant", manufacturer: "Castrol/BP", industry_tags: ["manufacturing"] },
  { product_name: "Master Chemical Trim C270 Coolant", manufacturer: "Master Chemical", industry_tags: ["manufacturing"] },
  { product_name: "Fuchs Ecocut Cutting Oil", manufacturer: "Fuchs Lubricants", industry_tags: ["manufacturing"] },
  { product_name: "Shell Tellus S2 MX Hydraulic Oil", manufacturer: "Shell", industry_tags: ["manufacturing"] },
  { product_name: "Mobil DTE 25 Hydraulic Oil", manufacturer: "ExxonMobil", industry_tags: ["manufacturing"] },
  { product_name: "Chevron Rando HDZ Hydraulic Oil", manufacturer: "Chevron", industry_tags: ["manufacturing"] },
  { product_name: "SKF LGMT 2 Bearing Grease", manufacturer: "SKF", industry_tags: ["manufacturing"] },
  { product_name: "Shell Gadus S2 V220 Grease", manufacturer: "Shell", industry_tags: ["manufacturing"] },
  { product_name: "Mobil Polyrex EM Grease", manufacturer: "ExxonMobil", industry_tags: ["manufacturing"] },
  { product_name: "3M Novec Contact Cleaner", manufacturer: "3M", industry_tags: ["manufacturing"] },
  { product_name: "CRC Lectra-Motive Electric Parts Cleaner", manufacturer: "CRC Industries", industry_tags: ["manufacturing", "automotive"] },
  { product_name: "Chemtronics Electro-Wash PX Cleaner", manufacturer: "Chemtronics", industry_tags: ["manufacturing"] },
  { product_name: "Loctite 242 Medium Strength Threadlocker", manufacturer: "Henkel", industry_tags: ["manufacturing", "automotive"] },
  { product_name: "Loctite 271 High Strength Threadlocker", manufacturer: "Henkel", industry_tags: ["manufacturing"] },
  { product_name: "Loctite 609 Retaining Compound", manufacturer: "Henkel", industry_tags: ["manufacturing"] },
  { product_name: "Permatex Indian Head Gasket Shellac", manufacturer: "Permatex", industry_tags: ["manufacturing", "automotive"] },
  { product_name: "Devcon Plastic Steel Epoxy", manufacturer: "ITW Devcon", industry_tags: ["manufacturing"] },
  { product_name: "Belzona 1111 Super Metal Epoxy", manufacturer: "Belzona", industry_tags: ["manufacturing"] },
  { product_name: "Dykem Steel Blue Layout Fluid", manufacturer: "ITW Dykem", industry_tags: ["manufacturing"] },
  { product_name: "Dykem Hi-Spot Blue Contact Ink", manufacturer: "ITW Dykem", industry_tags: ["manufacturing"] },
  { product_name: "Magnaflux Spotcheck SKL-SP Penetrant", manufacturer: "Magnaflux", industry_tags: ["manufacturing"] },
  { product_name: "Magnaflux Spotcheck SKD-S2 Developer", manufacturer: "Magnaflux", industry_tags: ["manufacturing"] },
  { product_name: "CRC Heavy Duty Corrosion Inhibitor", manufacturer: "CRC Industries", industry_tags: ["manufacturing"] },
  { product_name: "Cortec VpCI-377 Corrosion Inhibitor", manufacturer: "Cortec Corporation", industry_tags: ["manufacturing"] },
  { product_name: "Rust-Oleum Industrial Choice Spray Paint", manufacturer: "Rust-Oleum", industry_tags: ["manufacturing", "construction"] },
  { product_name: "Krylon Industrial Tough Coat", manufacturer: "Krylon/Sherwin-Williams", industry_tags: ["manufacturing"] },
  { product_name: "Sherwin-Williams Macropoxy 646", manufacturer: "Sherwin-Williams", industry_tags: ["manufacturing"] },
  { product_name: "PPG Amercoat 385 Epoxy", manufacturer: "PPG Industries", industry_tags: ["manufacturing"] },
  { product_name: "International Interthane 990", manufacturer: "AkzoNobel", industry_tags: ["manufacturing"] },
  { product_name: "Carboline Carboguard 893 Epoxy", manufacturer: "Carboline", industry_tags: ["manufacturing"] },
  { product_name: "3M Scotchkote Epoxy Coating", manufacturer: "3M", industry_tags: ["manufacturing"] },
  { product_name: "Henkel Bonderite M-CR 1200S Chromate", manufacturer: "Henkel", industry_tags: ["manufacturing"] },
  { product_name: "Chemetall Gardobond Pretreatment", manufacturer: "Chemetall/BASF", industry_tags: ["manufacturing"] },
  { product_name: "Lincoln Electric Stik Electrode E6011", manufacturer: "Lincoln Electric", industry_tags: ["manufacturing", "construction"] },
  { product_name: "Miller Welding Anti-Spatter Spray", manufacturer: "Miller/ITW", industry_tags: ["manufacturing"] },
  { product_name: "Walter Surface Technologies Bio-Circle L", manufacturer: "Walter", industry_tags: ["manufacturing"] },
  { product_name: "Wurth Rost Off Ice Penetrating Oil", manufacturer: "Wurth", industry_tags: ["manufacturing", "automotive"] },
  { product_name: "Molykote 111 Compound", manufacturer: "DuPont/Dow", industry_tags: ["manufacturing"] },
  { product_name: "Anti-Seize Technology Nickel Grade", manufacturer: "Anti-Seize Technology", industry_tags: ["manufacturing"] },
  { product_name: "Never-Seez Regular Grade Anti-Seize", manufacturer: "Bostik", industry_tags: ["manufacturing"] },
  { product_name: "Kluber Isoflex NBU 15 Grease", manufacturer: "Kluber Lubrication", industry_tags: ["manufacturing"] },
  { product_name: "Castrol Tribol GR 100-2 PD Grease", manufacturer: "Castrol/BP", industry_tags: ["manufacturing"] },
  { product_name: "Dow Corning 732 Silicone Sealant", manufacturer: "Dow", industry_tags: ["manufacturing", "construction"] },
  { product_name: "Momentive RTV108 Silicone Adhesive", manufacturer: "Momentive", industry_tags: ["manufacturing"] },
  { product_name: "Henkel Loctite 5900 Flange Sealant", manufacturer: "Henkel", industry_tags: ["manufacturing"] },
  { product_name: "3M Scotch-Seal 2084 Metal Sealant", manufacturer: "3M", industry_tags: ["manufacturing"] },
  { product_name: "Parker O-Lube Silicone Grease", manufacturer: "Parker Hannifin", industry_tags: ["manufacturing"] },

  // RESTAURANT / FOOD SERVICE (30)
  { product_name: "Ecolab Apex Power Plus Detergent", manufacturer: "Ecolab", industry_tags: ["restaurant"] },
  { product_name: "Ecolab Solid Power XL Dish Detergent", manufacturer: "Ecolab", industry_tags: ["restaurant"] },
  { product_name: "Diversey Suma Star D1 Hand Dish", manufacturer: "Diversey", industry_tags: ["restaurant"] },
  { product_name: "Diversey J-Fill Virex Plus Disinfectant", manufacturer: "Diversey", industry_tags: ["restaurant"] },
  { product_name: "Kay Chemical Sani-T-10 Sanitizer", manufacturer: "Ecolab/Kay", industry_tags: ["restaurant"] },
  { product_name: "Spartan Chemical SparClean Detergent", manufacturer: "Spartan Chemical", industry_tags: ["restaurant"] },
  { product_name: "Betco Symplicity Dish Detergent", manufacturer: "Betco", industry_tags: ["restaurant"] },
  { product_name: "US Chemical Presto Oven Cleaner", manufacturer: "US Chemical", industry_tags: ["restaurant"] },
  { product_name: "Ecolab Grease Express Degreaser", manufacturer: "Ecolab", industry_tags: ["restaurant"] },
  { product_name: "National Chemical Labs Cyclone Degreaser", manufacturer: "NCL", industry_tags: ["restaurant"] },
  { product_name: "Rochester Midland Enviro Care Floor Cleaner", manufacturer: "Rochester Midland", industry_tags: ["restaurant"] },
  { product_name: "Dawn Professional Manual Pot & Pan Detergent", manufacturer: "Procter & Gamble", industry_tags: ["restaurant"] },
  { product_name: "Boardwalk Glass Cleaner", manufacturer: "Boardwalk/Essendant", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Sterno Canned Heat", manufacturer: "Sterno", industry_tags: ["restaurant"] },
  { product_name: "Deep Fryer Boil Out Cleaner", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Quaternary Sanitizer Tablets", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Chlorine Sanitizer Solution", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Degreaser for Hoods and Vents", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Floor Degreaser Heavy Duty", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Hand Sanitizer 70% Ethanol", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial", "general"] },
  { product_name: "Rinse Aid Commercial Dishwasher", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Oven Cleaner Heavy Duty", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Grill Cleaner Industrial", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Stainless Steel Cleaner Polish", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Lime Scale Remover Commercial", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Drain Maintainer Enzyme-Based", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Bug Spray Indoor Commercial Grade", manufacturer: "various/generic", industry_tags: ["restaurant", "janitorial"] },
  { product_name: "Pest Control Bait Stations", manufacturer: "various/generic", industry_tags: ["restaurant"] },
  { product_name: "Refrigerant R-134a", manufacturer: "various/generic", industry_tags: ["restaurant", "automotive", "manufacturing"] },
  { product_name: "Propane Fuel Cylinder", manufacturer: "various/generic", industry_tags: ["restaurant", "construction", "general"] },

  // GENERAL / MULTI-INDUSTRY (40)
  { product_name: "Drano Max Gel Clog Remover", manufacturer: "SC Johnson", industry_tags: ["general", "janitorial"] },
  { product_name: "Goof Off Professional Strength", manufacturer: "WM Barr", industry_tags: ["general", "construction"] },
  { product_name: "Mineral Spirits", manufacturer: "various/generic", industry_tags: ["general", "construction", "auto-body"] },
  { product_name: "Denatured Alcohol", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Muriatic Acid (Hydrochloric Acid)", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Trisodium Phosphate (TSP)", manufacturer: "various/generic", industry_tags: ["general", "construction", "janitorial"] },
  { product_name: "Xylene Solvent", manufacturer: "various/generic", industry_tags: ["general", "construction", "auto-body"] },
  { product_name: "Toluene Solvent", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "MEK (Methyl Ethyl Ketone)", manufacturer: "various/generic", industry_tags: ["general", "manufacturing", "auto-body"] },
  { product_name: "Lacquer Thinner", manufacturer: "various/generic", industry_tags: ["general", "auto-body", "construction"] },
  { product_name: "Paint Thinner/Mineral Spirits", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Naphtha Solvent", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "Turpentine", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Methanol", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "Ethylene Glycol Antifreeze", manufacturer: "various/generic", industry_tags: ["general", "automotive"] },
  { product_name: "Propylene Glycol", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Sodium Hydroxide (Lye)", manufacturer: "various/generic", industry_tags: ["general", "manufacturing", "janitorial"] },
  { product_name: "Sulfuric Acid Battery Acid", manufacturer: "various/generic", industry_tags: ["general", "automotive", "manufacturing"] },
  { product_name: "Phosphoric Acid", manufacturer: "various/generic", industry_tags: ["general", "manufacturing", "janitorial"] },
  { product_name: "Nitric Acid", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "Hydrogen Peroxide 30% Industrial", manufacturer: "various/generic", industry_tags: ["general", "manufacturing", "janitorial"] },
  { product_name: "Ammonia Solution 10%", manufacturer: "various/generic", industry_tags: ["general", "janitorial"] },
  { product_name: "Bleach Sodium Hypochlorite 12.5%", manufacturer: "various/generic", industry_tags: ["general", "janitorial"] },
  { product_name: "Calcium Hypochlorite Pool Shock", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Ferric Chloride Etchant", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "Citric Acid Powder", manufacturer: "various/generic", industry_tags: ["general", "janitorial", "restaurant"] },
  { product_name: "Oxalic Acid", manufacturer: "various/generic", industry_tags: ["general", "janitorial"] },
  { product_name: "Boric Acid Powder", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Diatomaceous Earth", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Silica Gel Desiccant", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Activated Carbon Granular", manufacturer: "various/generic", industry_tags: ["general", "manufacturing"] },
  { product_name: "Portland Cement", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Plaster of Paris", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Fiberglass Resin Polyester", manufacturer: "various/generic", industry_tags: ["general", "auto-body", "construction"] },
  { product_name: "Epoxy Resin 2-Part General", manufacturer: "various/generic", industry_tags: ["general", "construction", "manufacturing"] },
  { product_name: "Polyurethane Foam 2-Part", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Super Glue Cyanoacrylate", manufacturer: "various/generic", industry_tags: ["general"] },
  { product_name: "Thread Seal Tape PTFE", manufacturer: "various/generic", industry_tags: ["general", "construction"] },
  { product_name: "Dielectric Grease", manufacturer: "various/generic", industry_tags: ["general", "automotive", "manufacturing"] },
  { product_name: "White Lithium Grease", manufacturer: "various/generic", industry_tags: ["general", "automotive", "manufacturing"] },

  // AUTOMOTIVE MAINTENANCE (30)
  { product_name: "Mobil 1 Synthetic Motor Oil 5W-30", manufacturer: "ExxonMobil", industry_tags: ["automotive"] },
  { product_name: "Valvoline Full Synthetic Motor Oil", manufacturer: "Valvoline", industry_tags: ["automotive"] },
  { product_name: "Castrol EDGE Full Synthetic", manufacturer: "Castrol/BP", industry_tags: ["automotive"] },
  { product_name: "Pennzoil Platinum Full Synthetic", manufacturer: "Shell/Pennzoil", industry_tags: ["automotive"] },
  { product_name: "Royal Purple HMX High Mileage Oil", manufacturer: "Royal Purple", industry_tags: ["automotive"] },
  { product_name: "Prestone Extended Life Antifreeze", manufacturer: "Prestone/KYK", industry_tags: ["automotive"] },
  { product_name: "Zerex G-05 Antifreeze", manufacturer: "Valvoline", industry_tags: ["automotive"] },
  { product_name: "Peak Long Life Antifreeze", manufacturer: "Old World Industries", industry_tags: ["automotive"] },
  { product_name: "Mobil 1 Synthetic ATF", manufacturer: "ExxonMobil", industry_tags: ["automotive"] },
  { product_name: "Valvoline MaxLife ATF", manufacturer: "Valvoline", industry_tags: ["automotive"] },
  { product_name: "Lucas Oil Transmission Fix", manufacturer: "Lucas Oil", industry_tags: ["automotive"] },
  { product_name: "Johnsen's Brake Parts Cleaner", manufacturer: "Technical Chemical", industry_tags: ["automotive"] },
  { product_name: "Gumout Carb and Choke Cleaner", manufacturer: "ITW Global Brands", industry_tags: ["automotive"] },
  { product_name: "Seafoam Motor Treatment", manufacturer: "Sea Foam Sales", industry_tags: ["automotive"] },
  { product_name: "Lucas Oil Fuel Treatment", manufacturer: "Lucas Oil", industry_tags: ["automotive"] },
  { product_name: "STA-BIL Fuel Stabilizer", manufacturer: "Gold Eagle", industry_tags: ["automotive"] },
  { product_name: "Marvel Mystery Oil", manufacturer: "Turtle Wax", industry_tags: ["automotive"] },
  { product_name: "Prestone Power Steering Fluid", manufacturer: "Prestone", industry_tags: ["automotive"] },
  { product_name: "DOT 3 Brake Fluid", manufacturer: "various/generic", industry_tags: ["automotive"] },
  { product_name: "DOT 4 Brake Fluid", manufacturer: "various/generic", industry_tags: ["automotive"] },
  { product_name: "Mobil 1 Synthetic Gear Lube 75W-90", manufacturer: "ExxonMobil", industry_tags: ["automotive"] },
  { product_name: "Lucas Oil Heavy Duty Gear Oil", manufacturer: "Lucas Oil", industry_tags: ["automotive"] },
  { product_name: "CRC Throttle Body Cleaner", manufacturer: "CRC Industries", industry_tags: ["automotive"] },
  { product_name: "Gunk Engine Degreaser", manufacturer: "RSC Chemical Solutions", industry_tags: ["automotive"] },
  { product_name: "Armor All Original Protectant", manufacturer: "Armor All/Spectrum Brands", industry_tags: ["automotive"] },
  { product_name: "Rain-X Windshield Washer Fluid", manufacturer: "ITW Global Brands", industry_tags: ["automotive"] },
  { product_name: "Blue DEF Diesel Exhaust Fluid", manufacturer: "Old World Industries", industry_tags: ["automotive"] },
  { product_name: "Hot Shot's Secret Diesel Extreme", manufacturer: "Lubrication Specialties", industry_tags: ["automotive"] },
  { product_name: "Techron Fuel System Cleaner", manufacturer: "Chevron", industry_tags: ["automotive"] },
  { product_name: "Royal Purple Max Clean Fuel System Cleaner", manufacturer: "Royal Purple", industry_tags: ["automotive"] },
];

// ── API Call ─────────────────────────────────────────────────────────────────

async function lookupSDS(productName, manufacturer) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "Find the SDS PDF URL for the given chemical product. Return ONLY JSON: {sds_url, sds_source, manufacturer_sds_portal, signal_word, pictogram_codes:[\"GHS02\",...], hazard_statements:[\"H225 - ...\"], cas_numbers:[], un_number, ghs_categories:[], confidence:0.0-1.0}",
        messages: [
          {
            role: "user",
            content: `SDS for: ${productName} by ${manufacturer}`,
          },
        ],
      }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const wait = retryAfter ? (parseInt(retryAfter, 10) + 5) * 1000 : attempt * 60000;
      console.log(`    ⏳ Rate limited (attempt ${attempt}/${MAX_RETRIES}), waiting ${Math.round(wait / 1000)}s...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();

    // Extract text content
    let textContent = "";
    for (const block of data.content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }

    // Strip markdown and extract JSON
    let cleaned = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleaned);
  }
  throw new Error("Max retries exceeded (rate limited)");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("ShieldSDS — SDS Database Seeding Script");
  console.log(`Total chemicals: ${CHEMICALS.length}`);
  console.log("=".repeat(60));
  console.log();

  // Check table exists by trying a simple query
  const { error: tableCheck } = await supabase
    .from("sds_database")
    .select("id")
    .limit(1);

  if (tableCheck) {
    console.error("❌ Table 'sds_database' does not exist or is not accessible.");
    console.error("Error:", tableCheck.message);
    console.log();
    console.log("Please create the table by running this SQL in the Supabase SQL Editor:");
    console.log("https://supabase.com/dashboard/project/vgkyenpkurjeayrufarw/sql");
    console.log();
    console.log(`-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS sds_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  manufacturer text,
  sds_url text,
  sds_source text,
  manufacturer_sds_portal text,
  signal_word text,
  pictogram_codes text[] DEFAULT '{}',
  hazard_statements text[] DEFAULT '{}',
  cas_numbers text[] DEFAULT '{}',
  un_number text,
  ghs_categories text[] DEFAULT '{}',
  industry_tags text[] DEFAULT '{}',
  confidence real DEFAULT 0,
  lookup_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security but allow public reads
ALTER TABLE sds_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON sds_database FOR SELECT USING (true);
CREATE POLICY "Allow service role insert" ON sds_database FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update" ON sds_database FOR UPDATE USING (true);

-- Create index for fast lookups
CREATE INDEX idx_sds_product_name ON sds_database USING gin (product_name gin_trgm_ops);
CREATE INDEX idx_sds_manufacturer ON sds_database (manufacturer);
CREATE INDEX idx_sds_industry_tags ON sds_database USING gin (industry_tags);`);
    console.log();
    console.log("After creating the table, run this script again.");
    process.exit(1);
  }

  console.log("✅ Connected to Supabase, table exists.");
  console.log();

  let found = 0;
  let notFound = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < CHEMICALS.length; i++) {
    const chem = CHEMICALS[i];
    const idx = `[${i + 1}/${CHEMICALS.length}]`;

    // Check if already in database (resume capability)
    const { data: existing } = await supabase
      .from("sds_database")
      .select("id")
      .eq("product_name", chem.product_name)
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log(`${idx} ${chem.product_name} — Already in database, skipping ⏭️`);
      skipped++;
      continue;
    }

    try {
      const result = await lookupSDS(chem.product_name, chem.manufacturer);

      // Insert into Supabase
      const { error: insertError } = await supabase.from("sds_database").insert({
        product_name: chem.product_name,
        manufacturer: chem.manufacturer,
        sds_url: result.sds_url || null,
        sds_source: result.sds_source || null,
        manufacturer_sds_portal: result.manufacturer_sds_portal || null,
        signal_word: result.signal_word || null,
        pictogram_codes: result.pictogram_codes || [],
        hazard_statements: result.hazard_statements || [],
        cas_numbers: result.cas_numbers || [],
        un_number: result.un_number || null,
        ghs_categories: result.ghs_categories || [],
        industry_tags: chem.industry_tags,
        confidence: result.confidence || 0,
      });

      if (insertError) {
        console.error(`${idx} ${chem.product_name} — INSERT ERROR: ${insertError.message}`);
        errors++;
      } else if (result.sds_url && (result.confidence || 0) > 0.5) {
        console.log(`${idx} ${chem.product_name} — SDS Found ✅ (confidence: ${result.confidence || 0})`);
        found++;
      } else {
        const portal = result.manufacturer_sds_portal ? `(portal: ${result.manufacturer_sds_portal})` : "(no portal)";
        console.log(`${idx} ${chem.product_name} — SDS Not Found ❌ ${portal}`);
        notFound++;
      }
    } catch (err) {
      console.error(`${idx} ${chem.product_name} — ERROR: ${err.message}`);
      errors++;
    }

    // Rate limiting
    if (i < CHEMICALS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  // Final summary
  const totalProcessed = found + notFound + errors;
  const estimatedCost = (totalProcessed * 0.015).toFixed(2); // rough estimate: ~$0.015 per search call

  console.log();
  console.log("=".repeat(60));
  console.log("SEEDING COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total chemicals:  ${CHEMICALS.length}`);
  console.log(`Skipped (cached): ${skipped}`);
  console.log(`Processed:        ${totalProcessed}`);
  console.log(`SDS Found:        ${found}`);
  console.log(`SDS Not Found:    ${notFound}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Est. API cost:    $${estimatedCost}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
