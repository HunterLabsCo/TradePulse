import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a trade journal parser for crypto/memecoin traders. Given a raw voice transcript from a trader logging a trade entry, extract structured data using the parse_trade_entry tool.

Rules:
- **Token name**: Extract ONLY the token ticker or short name (1-4 words max). It is typically the first proper noun spoken after words like "entering", "entered", "bought", "buying", "getting into", "aping". Examples: "BONK", "PEPE", "WIF", "MULERUN", "PEPEKING". Do NOT include surrounding phrases like "platform pump fund" — only the ticker itself.
- Chain defaults to "SOL" unless the trader mentions Ethereum/ETH/Base/Arbitrum.
- Market cap may be stated as "68K MC" or "eighty point seven K market cap" — normalize to a string like "68K" or "80.7K".
- Position size is usually stated in SOL or ETH (e.g., "1.4 SOL").
- Setup type — choose EXACTLY one of these values (use the label verbatim):
  - "Migrated Confirmation" → token just migrated/graduated, entry after migration confirmation
  - "Pre-Migration PVP" → entry before migration, playing the pump before it migrates
  - "Wallet Signal" → smart wallet / tracked wallet triggered the entry
  - "Narrative Play" → story/theme/meta driven entry (AI narrative, meme cycle, sector play)
  - "Breakout" → price breaking out of resistance or a range
  - "Dip Buy / Pullback" → buying a dip, pullback, or retracement (including EMA pullback)
  - "Volume Spike" → sudden volume surge triggered entry
  - "Momentum Chase" → pure momentum entry, trending strongly upward, no other specific trigger
  - "Custom" → use ONLY if none of the above fit, then describe in narrativeType
  Note: if trader mentions EMA support or EMA holding → use "Dip Buy / Pullback". If trending upward with RSI/momentum language → use "Momentum Chase".
- Confirmation signals — CRITICAL: detect ALL mentioned signals. Return as an array from: "Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition", "EMA Cross", "RSI", "Other".
  - "RSI" → ANY mention of RSI, RSI levels, RSI holding, RSI trending, overbought, oversold via RSI — ALWAYS include this if RSI appears anywhere in the transcript
  - "EMA Cross" → trader mentions EMA cross, EMAs crossed, golden cross
  - "Volume" → volume holding, volume spike, volume confirming
  - "Wallets" → tracked wallets, smart wallets, wallet activity, major wallet
  - "Social / Twitter" → community, Twitter/X, posts, tweets, social sentiment
  - "Chart Pattern" → chart patterns, candlestick patterns, support/resistance, trendlines
  - "Gut / Intuition" → gut feeling, intuition, felt right
- Indicators used — CRITICAL: if the trader mentions ANY technical indicator word, put it in indicatorsUsed. This includes: RSI (any RSI mention), MACD, VWAP, EMA with a number (e.g. "EMA 21"), Bollinger Bands, volume indicators. Return as comma-separated string (e.g. "RSI, EMA 21"). If RSI is mentioned anywhere in the transcript, it MUST appear in both indicatorsUsed AND confirmationSignals.
- Session type: detect from context. Options: "full-session" (uninterrupted), "partially-interrupted" (brief interruptions), "intermittently-interrupted" (frequent interruptions), "work-trade" (trading at work), "mobile-only" (phone trading), "forced-exit-risk" (known interruption coming).
- Emotional states must be chosen from this exact list: confident, calm, focused, patient, in-the-zone, anxious, nervous, rushed, frustrated, revenge-mindset, greedy, fearful, overconfident, fomo, distracted, interrupted, uncertain, conflicted, disciplined, hesitant, impulsive, euphoric, detached, sharp, tired.
- Detect emotional language even if implicit (e.g., "took this at work" → rushed/interrupted, "feeling good" → confident, "I just went for it" → fomo/impulsive, "I'm exhausted" → tired).
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
                  tokenName: { type: "string", description: "Token ticker/name only (1-4 words max)" },
                  chain: { type: "string", enum: ["SOL", "ETH", "BASE", "ARB"] },
                  entryMarketCap: { type: "string", description: "Market cap at entry, e.g. 80.7K" },
                  positionSize: { type: "string", description: "Position size, e.g. 1.4 SOL" },
                  setupType: { type: "string", enum: ["Migrated Confirmation", "Pre-Migration PVP", "Wallet Signal", "Narrative Play", "Breakout", "Dip Buy / Pullback", "Volume Spike", "Momentum Chase", "Custom"], description: "Setup type — must be one of the enum values exactly" },
                  narrativeType: { type: "string", description: "Narrative category if mentioned" },
                  confirmationSignals: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition", "EMA Cross", "RSI", "Other"],
                    },
                    description: "Detected confirmation signals",
                  },
                  indicatorsUsed: {
                    type: "string",
                    description: "Technical indicators mentioned (e.g. 'RSI 7, EMA 21, MACD'). Comma-separated. Omit if none mentioned.",
                  },
                  sessionType: {
                    type: "string",
                    enum: ["full-session", "partially-interrupted", "intermittently-interrupted", "work-trade", "mobile-only", "forced-exit-risk"],
                    description: "Session status",
                  },
                  emotionalStates: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "confident", "calm", "focused", "patient", "in-the-zone",
                        "anxious", "nervous", "rushed", "frustrated", "revenge-mindset",
                        "greedy", "fearful", "overconfident",
                        "fomo", "distracted", "interrupted", "uncertain", "conflicted",
                        "disciplined", "hesitant", "impulsive", "euphoric", "detached", "sharp", "tired",
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
