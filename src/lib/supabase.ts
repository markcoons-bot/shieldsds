import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Supabase Client (lazy init to avoid build-time errors) ──────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// ── SDS Database Row Type ──────────────────────────────────────────────────
export interface SDSRecord {
  id: string;
  product_name: string;
  manufacturer: string | null;
  sds_url: string | null;
  sds_source: string | null;
  manufacturer_sds_portal: string | null;
  signal_word: string | null;
  pictogram_codes: string[];
  hazard_statements: string[];
  cas_numbers: string[];
  un_number: string | null;
  ghs_categories: string[];
  industry_tags: string[];
  confidence: number;
  lookup_date: string;
  created_at: string;
}

// ── Lookup SDS from Supabase shared database ───────────────────────────────
export async function lookupSDS(
  productName: string,
  manufacturer?: string
): Promise<SDSRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Try exact match on product_name
    const { data: exact } = await supabase
      .from("sds_database")
      .select("*")
      .eq("product_name", productName)
      .limit(1)
      .maybeSingle();

    if (exact) return exact as SDSRecord;

    // 2. Try case-insensitive match
    const { data: ilike } = await supabase
      .from("sds_database")
      .select("*")
      .ilike("product_name", productName)
      .limit(1)
      .maybeSingle();

    if (ilike) return ilike as SDSRecord;

    // 3. Try partial match (product_name contains search term)
    const searchTerm = productName
      .replace(/[%_]/g, "")
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");

    const { data: partial } = await supabase
      .from("sds_database")
      .select("*")
      .ilike("product_name", `%${searchTerm}%`)
      .limit(5);

    if (partial && partial.length > 0) {
      // If manufacturer provided, prefer matching manufacturer
      if (manufacturer) {
        const mfgMatch = partial.find(
          (r) =>
            r.manufacturer &&
            r.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
        );
        if (mfgMatch) return mfgMatch as SDSRecord;
      }
      return partial[0] as SDSRecord;
    }

    return null;
  } catch (err) {
    console.error("[supabase] lookupSDS error:", err);
    return null;
  }
}

// ── Insert SDS result into Supabase (cache for future lookups) ─────────────
export async function cacheSDS(record: {
  product_name: string;
  manufacturer: string;
  sds_url: string | null;
  sds_source: string | null;
  manufacturer_sds_portal: string | null;
  signal_word?: string | null;
  pictogram_codes?: string[];
  hazard_statements?: string[];
  cas_numbers?: string[];
  un_number?: string | null;
  ghs_categories?: string[];
  industry_tags?: string[];
  confidence: number;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("sds_database").insert({
      product_name: record.product_name,
      manufacturer: record.manufacturer,
      sds_url: record.sds_url,
      sds_source: record.sds_source,
      manufacturer_sds_portal: record.manufacturer_sds_portal,
      signal_word: record.signal_word || null,
      pictogram_codes: record.pictogram_codes || [],
      hazard_statements: record.hazard_statements || [],
      cas_numbers: record.cas_numbers || [],
      un_number: record.un_number || null,
      ghs_categories: record.ghs_categories || [],
      industry_tags: record.industry_tags || [],
      confidence: record.confidence,
    });

    if (error) {
      console.error("[supabase] cacheSDS insert error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[supabase] cacheSDS error:", err);
    return false;
  }
}
