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
- Setup type — use the MOST SPECIFIC match: "EMA Pullback" (EMAs trending, price pulled back to EMA, EMA support), "Breakout" (price breaking resistance/range), "Volume Spike Entry" (sudden volume surge), "Wallet Signal" (smart wallet / tracked wallet triggered entry), "Narrative Play" (story/theme driven), "Dip Buy" (buying a dip/drop), "Momentum" (pure momentum, no EMA or pullback mentioned). If none fit, use "Custom". Prefer "EMA Pullback" when EMAs are explicitly mentioned as a reason for entry.
- Confirmation signals: detect any mentioned. Return as an array from: "Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition", "EMA Cross", "RSI", "Other".
  - "RSI" → trader mentions RSI, RSI levels, RSI holding, oversold/overbought via RSI
  - "EMA Cross" → trader mentions EMA cross, EMAs crossed, golden cross
  - "Volume" → volume holding, volume spike, volume confirming
  - "Wallets" → tracked wallets, smart wallets, wallet activity
  - "Social / Twitter" → community, Twitter/X, posts, tweets, social sentiment
  - "Chart Pattern" → chart patterns, candlestick patterns, support/resistance, trendlines
  - "Gut / Intuition" → gut feeling, intuition, felt right
- Indicators used: if the trader mentions any technical indicators (RSI, MACD, VWAP, EMA values like "EMA 21", Bollinger Bands, etc.) put them in indicatorsUsed as a comma-separated string (e.g. "RSI 7, EMA 21"). RSI appearing in the transcript always goes here AND in confirmationSignals.
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
                  setupType: { type: "string", description: "Setup type: EMA Pullback, Breakout, Volume Spike Entry, Wallet Signal, Narrative Play, Dip Buy, Momentum, or Custom" },
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
