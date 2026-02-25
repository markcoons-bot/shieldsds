export interface HazardStatement {
  code: string;
  text: string;
}

export interface PrecautionaryStatements {
  prevention: HazardStatement[];
  response: HazardStatement[];
  storage: HazardStatement[];
  disposal: HazardStatement[];
}

export interface FirstAidInfo {
  eyes: string | null;
  skin: string | null;
  inhalation: string | null;
  ingestion: string | null;
}

export interface PPERequirements {
  eyes: string | null;
  hands: string | null;
  respiratory: string | null;
  body: string | null;
}

export interface PhysicalProperties {
  appearance: string | null;
  odor: string | null;
  flash_point: string | null;
  ph: string | null;
  boiling_point: string | null;
  vapor_pressure: string | null;
}

export interface NFPADiamond {
  health: number;
  fire: number;
  reactivity: number;
  special: string | null;
}

export interface Chemical {
  id: string;
  product_name: string;
  manufacturer: string;
  cas_numbers: string[];
  un_number: string | null;
  signal_word: "DANGER" | "WARNING" | null;
  pictogram_codes: string[];
  hazard_statements: HazardStatement[];
  precautionary_statements: PrecautionaryStatements;
  first_aid: FirstAidInfo;
  ppe_required: PPERequirements;
  storage_requirements: string;
  incompatible_materials: string[];
  physical_properties: PhysicalProperties;
  nfpa_diamond: NFPADiamond | null;
  location: string;
  container_type: string;
  container_count: number;
  labeled: boolean;
  label_printed_date: string | null;
  sds_url: string | null;
  sds_uploaded: boolean;
  sds_date: string | null;
  sds_status: "current" | "missing" | "expired";
  added_date: string;
  added_by: string;
  added_method: "scan" | "manual" | "import";
  scan_image_url: string | null;
  scan_confidence: number | null;
  last_updated: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  initial_training: string | null;
  last_training: string | null;
  status: "current" | "overdue" | "pending";
  completed_modules: string[];
  pending_modules: string[];
}

export interface Location {
  id: string;
  name: string;
  chemical_ids: string[];
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  module_id: string;
  completed_date: string;
  score: number;
  certificate_data: {
    employee_name: string;
    company_name: string;
    industry: string;
    date: string;
  } | null;
}

export interface LabelRecord {
  id: string;
  chemical_id: string;
  label_size: "full" | "small" | "minimal";
  printed_date: string | null;
  copies: number;
}
