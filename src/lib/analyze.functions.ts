import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const analyzeProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string; vendorHint?: string }) => input)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured. Please contact support." };
    }

    const systemPrompt = `You are an expert product cataloger for small Indian local vendors (handloom, food, hardware, crafts, groceries). Given a product photo, you produce a complete, ready-to-publish listing. Be specific to what you SEE in the image. Avoid generic filler. Hindi must be natural Devanagari, not transliteration.`;

    const userText = `Analyze the product in this image and return a complete catalog entry.${
      data.vendorHint ? `\n\nVendor hint: ${data.vendorHint}` : ""
    }`;

    const tool = {
      type: "function",
      function: {
        name: "create_listing",
        description: "Create a complete product listing from the image.",
        parameters: {
          type: "object",
          properties: {
            product_name_en: { type: "string", description: "Short catchy English product name (max 8 words)." },
            product_name_hi: { type: "string", description: "Product name in Hindi (Devanagari script)." },
            category: { type: "string", description: "Best-fit single category, e.g. Handloom, Food, Hardware, Grocery, Handicraft, Apparel." },
            tags: { type: "array", items: { type: "string" }, description: "5-8 search tags, lowercase, English." },
            description_en: { type: "string", description: "SEO-friendly English description, 2-3 short paragraphs, sensory and specific." },
            description_hi: { type: "string", description: "Hindi description in Devanagari, 2-3 short paragraphs." },
            price_min_inr: { type: "number", description: "Competitive lower price bracket in INR." },
            price_max_inr: { type: "number", description: "Competitive upper price bracket in INR." },
            price_reasoning: { type: "string", description: "One sentence on how the price bracket was decided." },
            social_caption: { type: "string", description: "Ready-to-share WhatsApp/Instagram caption in mixed Hindi+English with 4-6 relevant hashtags and 2-3 emojis." },
          },
          required: [
            "product_name_en",
            "product_name_hi",
            "category",
            "tags",
            "description_en",
            "description_hi",
            "price_min_inr",
            "price_max_inr",
            "price_reasoning",
            "social_caption",
          ],
          additionalProperties: false,
        },
      },
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "create_listing" } },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { ok: false as const, error: "Too many requests. Please wait a moment and try again." };
        if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." };
        const t = await res.text();
        console.error("AI gateway error", res.status, t);
        return { ok: false as const, error: `AI request failed (${res.status}).` };
      }

      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0];
      const args = call?.function?.arguments;
      if (!args) return { ok: false as const, error: "AI returned an empty response." };
      const parsed = JSON.parse(args);

      // Save to the vendor's catalog
      const { supabase, userId } = context;
      const { data: saved, error } = await supabase
        .from("listings")
        .insert({
          user_id: userId,
          product_name_en: parsed.product_name_en,
          product_name_hi: parsed.product_name_hi,
          category: parsed.category,
          tags: parsed.tags ?? [],
          description_en: parsed.description_en,
          description_hi: parsed.description_hi,
          price_min_inr: parsed.price_min_inr,
          price_max_inr: parsed.price_max_inr,
          price_reasoning: parsed.price_reasoning ?? null,
          social_caption: parsed.social_caption,
          image_url: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save listing", error);
        return { ok: true as const, listing: parsed, savedId: null };
      }

      return { ok: true as const, listing: parsed, savedId: saved.id as string };
    } catch (e) {
      console.error("analyzeProduct failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listMyListings error", error);
      return { listings: [] as never[] };
    }
    return { listings: data ?? [] };
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("listings").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { shop_name?: string | null; full_name?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        shop_name: data.shop_name ?? null,
        full_name: data.full_name ?? null,
      })
      .eq("id", userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });