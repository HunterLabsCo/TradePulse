import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a trade journal parser for crypto/memecoin traders. Given a raw voice transcript from a trader logging a trade entry, extract structured data using the parse_trade_entry tool.

Rules:
- Token names are crypto tokens (e.g., BONK, PEPE, WIF, MULERUN). They may be misspelled by voice recognition — infer the correct name.
- Chain defaults to "SOL" unless the trader mentions Ethereum/ETH/Base/Arbitrum.
- Market cap may be stated as "68K MC" or "eighty point seven K market cap" — normalize to a string like "68K" or "80.7K".
- Position size is usually stated in SOL or ETH (e.g., "1.4 SOL").
- Emotional states must be chosen from this exact list: confident, calm, focused, patient, in-the-zone, anxious, nervous, rushed, frustrated, revenge-mindset, greedy, fearful, overconfident, fomo, distracted, interrupted, uncertain, conflicted.
- Detect emotional language even if implicit (e.g., "took this at work" → rushed/interrupted, "feeling good" → confident, "I just went for it" → fomo).
- Quick tags to detect: Interrupted, Work trade, Full session, Pre-set orders, Above MC ceiling, Non-compliant, Chased / FOMO, Best setup, Clean execution.
- If a field is not mentioned, omit it (return null or empty).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Parse this trade entry transcript:\n\n"${transcript}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_trade_entry",
              description: "Extract structured trade entry data from a voice transcript",
              parameters: {
                type: "object",
                properties: {
                  tokenName: { type: "string", description: "Token/coin name" },
                  chain: { type: "string", enum: ["SOL", "ETH", "BASE", "ARB"] },
                  entryMarketCap: { type: "string", description: "Market cap at entry, e.g. 80.7K" },
                  entryPrice: { type: "string", description: "Entry price if mentioned" },
                  positionSize: { type: "string", description: "Position size, e.g. 1.4 SOL" },
                  setupType: { type: "string", description: "Setup type if mentioned" },
                  narrativeType: { type: "string", description: "Narrative category if mentioned" },
                  volumeConfirmed: { type: "boolean", description: "Whether volume was confirmed" },
                  walletConfirmed: { type: "boolean", description: "Whether wallet tracking was confirmed" },
                  interruptionStatus: { type: "string", enum: ["interrupted", "clean"] },
                  sessionType: { type: "string", enum: ["work-trade", "full-session"] },
                  emotionalStates: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "confident", "calm", "focused", "patient", "in-the-zone",
                        "anxious", "nervous", "rushed", "frustrated", "revenge-mindset",
                        "greedy", "fearful", "overconfident",
                        "fomo", "distracted", "interrupted", "uncertain", "conflicted",
                      ],
                    },
                    description: "Detected emotional states",
                  },
                  quickTags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Applicable quick tags",
                  },
                },
                required: ["tokenName"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_trade_entry" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-trade error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
