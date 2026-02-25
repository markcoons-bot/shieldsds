import { NextRequest, NextResponse } from "next/server";
import { lookupSDS, cacheSDS } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_name, manufacturer } = body as {
      product_name: string;
      manufacturer: string;
    };

    if (!product_name || !manufacturer) {
      return NextResponse.json(
        { error: "Missing product_name or manufacturer", manufacturer_sds_portal: null },
        { status: 400 }
      );
    }

    // ── Check Supabase cache first (zero API cost) ──────────────────────
    try {
      const cached = await lookupSDS(product_name, manufacturer);
      if (cached && cached.confidence > 0.5 && cached.sds_url) {
        console.log("[sds-lookup] Supabase cache HIT:", product_name, "→", cached.sds_url);
        return NextResponse.json({
          sds_url: cached.sds_url,
          sds_source: cached.sds_source || "ShieldSDS Database",
          manufacturer_sds_portal: cached.manufacturer_sds_portal || null,
          confidence: cached.confidence,
          notes: "Found in ShieldSDS shared database (cached)",
        });
      }
      if (cached) {
        console.log("[sds-lookup] Supabase partial match (low confidence or no URL), proceeding to API");
      }
    } catch (cacheErr) {
      console.log("[sds-lookup] Supabase lookup failed, proceeding to API:", cacheErr instanceof Error ? cacheErr.message : "unknown");
    }

    // ── Anthropic API lookup (fallback) ─────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured", manufacturer_sds_portal: null },
        { status: 500 }
      );
    }

    console.log("[sds-lookup] Supabase cache MISS — calling Anthropic API for:", product_name, "by", manufacturer);

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          },
        ],
        messages: [
          {
            role: "user",
            content:
              "Find the official Safety Data Sheet (SDS) PDF for this product:\n\n" +
              "Product: " + product_name + "\n" +
              "Manufacturer: " + manufacturer + "\n\n" +
              "Search for the official SDS document from the manufacturer's website. Return ONLY a JSON object with these fields (no markdown, no backticks, no explanation):\n" +
              "{\n" +
              '  "sds_url": "direct URL to the SDS PDF or SDS page",\n' +
              '  "sds_source": "where you found it (e.g. manufacturer website, SDS database)",\n' +
              '  "manufacturer_sds_portal": "URL to the manufacturer\'s general SDS search page",\n' +
              '  "confidence": 0.95,\n' +
              '  "notes": "any relevant notes"\n' +
              "}\n\n" +
              "If you cannot find the exact SDS, still provide the manufacturer_sds_portal URL where the owner could search for it manually. Set confidence lower if you're not certain it's the right product/version.",
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text();
      console.error("[sds-lookup] Claude API error:", claudeResponse.status, errBody.substring(0, 200));
      return NextResponse.json(
        { error: `AI service error (${claudeResponse.status})`, manufacturer_sds_portal: null },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();

    // Extract text content from Claude's response (skip tool_use and web_search_tool_result blocks)
    let textContent = "";
    for (const block of claudeData.content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }

    console.log("[sds-lookup] Raw response:", textContent.substring(0, 500));

    // Strip markdown code fences
    let cleaned = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Extract JSON: find first { to last }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: Record<string, any>;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error("[sds-lookup] JSON parse error. Cleaned text:", cleaned.substring(0, 300));
      return NextResponse.json(
        { error: "Failed to parse SDS lookup response", manufacturer_sds_portal: null },
        { status: 500 }
      );
    }

    console.log("[sds-lookup] Result:", JSON.stringify(result).substring(0, 500));

    // ── Cache result in Supabase for future lookups ─────────────────────
    if (result.sds_url || result.manufacturer_sds_portal) {
      cacheSDS({
        product_name,
        manufacturer,
        sds_url: result.sds_url || null,
        sds_source: result.sds_source || null,
        manufacturer_sds_portal: result.manufacturer_sds_portal || null,
        confidence: result.confidence ?? 0,
      }).then((ok) => {
        if (ok) console.log("[sds-lookup] Cached to Supabase:", product_name);
        else console.log("[sds-lookup] Supabase cache insert failed for:", product_name);
      }).catch(() => {});
    }

    return NextResponse.json({
      sds_url: result.sds_url || null,
      sds_source: result.sds_source || null,
      manufacturer_sds_portal: result.manufacturer_sds_portal || null,
      confidence: result.confidence ?? 0,
      notes: result.notes || null,
    });
  } catch (err) {
    console.error("[sds-lookup] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred", manufacturer_sds_portal: null },
      { status: 500 }
    );
  }
}
