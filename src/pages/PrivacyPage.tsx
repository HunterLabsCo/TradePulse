import { useEffect } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { setPageMeta } from "@/lib/page-meta";
import { ROUTE_META } from "@/prerender/route-meta";
import { C } from "@/components/marketing/theme";

export default function PrivacyPage() {
  useEffect(() => {
    setPageMeta({ ...ROUTE_META["/privacy"], path: "/privacy" });
  }, []);

  const h2 = "mt-10 mb-3 font-sans text-2xl font-bold";
  const h2Style = { color: C.text, letterSpacing: "-0.02em" } as const;
  const h3 = "mt-6 mb-2 font-sans text-base font-medium";
  const p = "mb-3 font-sans text-sm leading-relaxed";
  const ul = "mb-3 list-disc space-y-1 pl-5 font-sans text-sm";
  const strong = { color: C.text } as const;

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Privacy</p>
        <h1 className="mb-2 font-sans text-[2.5rem] font-bold leading-[1.1]" style={{ color: C.text, letterSpacing: "-0.03em" }}>
          Privacy Policy
        </h1>
        <p className="mb-1 font-sans text-xs" style={{ color: C.textDim }}><strong style={strong}>Last Updated:</strong> June 24, 2026</p>
        <p className="mb-8 font-sans text-xs" style={{ color: C.textDim }}><strong style={strong}>Effective Date:</strong> June 24, 2026</p>
        <p className="mb-8 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          We respect your privacy. This Privacy Policy describes how TradePulse ("we," "us") collects, uses, and protects information when you use our Service.
        </p>

        {/* TL;DR */}
        <div className="mb-8 rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>TL;DR — the short version</p>
          <ul className="space-y-2 font-sans text-sm" style={{ color: C.textDim }}>
            <li><strong style={strong}>Free tier:</strong> Your trades are stored locally in your browser. We don't see them. We don't collect your email. We don't know who you are.</li>
            <li><strong style={strong}>Pro tier:</strong> Your wallet address is used to verify payment. Optional cloud sync of trade data is stored in Supabase, encrypted in transit.</li>
            <li><strong style={strong}>Voice:</strong> Transcription happens in your browser using its built-in speech recognition (the Web Speech API), which may send your audio to your browser's vendor — for example Google (Chrome) or Apple (Safari). We never receive or store your audio. Only the resulting text is sent to Anthropic to structure it into trade fields.</li>
            <li><strong style={strong}>Analytics:</strong> We use Vercel Analytics for anonymous, aggregate usage data. No personal profiling.</li>
            <li><strong style={strong}>We never sell your data.</strong></li>
          </ul>
        </div>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <section>
          <h2 className={h2} style={h2Style}>1. Information We Collect</h2>

          <h3 className={h3} style={{ color: C.text }}>a. Free-tier users</h3>
          <ul className={ul} style={{ color: C.textDim }}>
            <li><strong style={strong}>Trade entries you enter or speak:</strong> Stored locally on your device (browser localStorage / IndexedDB). Never transmitted to our servers.</li>
            <li><strong style={strong}>Voice audio:</strong> Transcribed by your browser's built-in speech recognition (the Web Speech API). Depending on your browser and device, your browser may send the audio to its vendor (e.g. Google or Apple) for processing — this happens within your browser and the audio is never sent to or stored by us. Only the resulting text transcript is sent to our parsing provider (see Section 3).</li>
          </ul>

          <h3 className={h3} style={{ color: C.text }}>b. Pro-tier users</h3>
          <ul className={ul} style={{ color: C.textDim }}>
            <li><strong style={strong}>Wallet address:</strong> Used to verify your Pro purchase. Stored in Supabase.</li>
            <li><strong style={strong}>Trade data (if you enable cloud sync):</strong> Stored in Supabase, encrypted in transit.</li>
          </ul>

          <h3 className={h3} style={{ color: C.text }}>c. All users (automatically collected)</h3>
          <ul className={ul} style={{ color: C.textDim }}>
            <li><strong style={strong}>Usage data via Vercel Analytics:</strong> Anonymous page views and performance metrics. No cookies that identify you personally.</li>
            <li><strong style={strong}>Standard request data:</strong> IP address, browser type, and referrer (logged by our hosting provider for security and operational purposes; not used for marketing).</li>
          </ul>

          <h2 className={h2} style={h2Style}>2. Information We Do NOT Collect</h2>
          <ul className={ul} style={{ color: C.textDim }}>
            <li>We do not require email addresses, names, or phone numbers.</li>
            <li>We do not collect or store wallet private keys, seed phrases, or passwords.</li>
            <li>We do not access your wallet beyond verifying the payment transaction.</li>
            <li>We do not sell, rent, or trade your data.</li>
          </ul>

          <h2 className={h2} style={h2Style}>3. Third-Party Service Providers</h2>
          <p className={p} style={{ color: C.textDim }}>
            We use the following providers, who may process data on our behalf:
          </p>
          <div className="mb-6 overflow-x-auto rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: C.border }}>
                  <th className="py-2 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Provider</th>
                  <th className="py-2 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Purpose</th>
                  <th className="py-2 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Data Processed</th>
                </tr>
              </thead>
              <tbody className="font-sans">
                {[
                  ["Your browser's vendor (e.g. Google / Apple)", "Speech-to-text via your browser's built-in Web Speech API", "Voice audio (handled by your browser; never sent to us)"],
                  ["Anthropic (Claude)", "Parsing transcribed text into structured trade fields", "Text transcripts (transient)"],
                  ["Supabase", "Pro account management; optional cloud sync", "Wallet address; encrypted trade data"],
                  ["Vercel", "Hosting, analytics, edge functions", "Standard HTTP request data; anonymous usage"],
                ].map(([provider, purpose, data]) => (
                  <tr key={provider} className="border-b" style={{ borderColor: C.border }}>
                    <td className="py-2 pr-4 align-top font-medium" style={{ color: C.text }}>{provider}</td>
                    <td className="py-2 pr-4 align-top" style={{ color: C.textDim }}>{purpose}</td>
                    <td className="py-2 align-top" style={{ color: C.textDim }}>{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={p} style={{ color: C.textDim }}>
            Each provider has its own privacy policy. We have selected providers that, to our knowledge, do not train their models on user-submitted data through their commercial APIs.
          </p>

          <h2 className={h2} style={h2Style}>4. How We Use Information</h2>
          <ul className={ul} style={{ color: C.textDim }}>
            <li>To provide the core voice-to-journal functionality.</li>
            <li>To verify Pro tier purchases.</li>
            <li>To improve performance and fix bugs (via anonymous analytics).</li>
            <li>To process refund and support requests when you contact us.</li>
          </ul>
          <p className={p} style={{ color: C.textDim }}>
            We do <strong style={strong}>not</strong> use your data for advertising, profiling, or sale.
          </p>

          <h2 className={h2} style={h2Style}>5. Your Rights</h2>
          <p className={p} style={{ color: C.textDim }}>
            Depending on where you live, you may have rights under the GDPR (EU/UK), CCPA (California), or similar laws, including:
          </p>
          <ul className={ul} style={{ color: C.textDim }}>
            <li><strong style={strong}>Access:</strong> Request a copy of any data we hold about you.</li>
            <li><strong style={strong}>Deletion:</strong> Request deletion of your data. Free-tier trade data is on your device — you can clear it from Settings → Delete All Data.</li>
            <li><strong style={strong}>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong style={strong}>Portability:</strong> Export your data as CSV or JSON from Settings.</li>
            <li><strong style={strong}>Objection / Restriction:</strong> Object to or restrict certain processing.</li>
          </ul>
          <p className={p} style={{ color: C.textDim }}>
            To exercise these rights, email <a href="mailto:rickybob99999@gmail.com" className="underline" style={{ color: C.primary }}>rickybob99999@gmail.com</a>. We will respond within 30 days.
          </p>

          <h2 className={h2} style={h2Style}>6. Data Retention</h2>
          <ul className={ul} style={{ color: C.textDim }}>
            <li><strong style={strong}>Free-tier trade data:</strong> Held on your device until you delete it.</li>
            <li><strong style={strong}>Pro-tier wallet + trade data:</strong> Retained while your account is active. Deleted within 30 days of a verified deletion request.</li>
            <li><strong style={strong}>Voice recordings:</strong> Never received or stored by us. Audio is processed by your browser's speech recognition and is not transmitted to our servers.</li>
            <li><strong style={strong}>Analytics:</strong> Retained per Vercel's standard policy (typically 30 days for anonymous logs).</li>
          </ul>

          <h2 className={h2} style={h2Style}>7. Security</h2>
          <p className={p} style={{ color: C.textDim }}>
            We use HTTPS for all communications. Wallet authentication is handled cryptographically — we never see your private key. Pro data is encrypted in transit. However, no online service is 100% secure; you use TradePulse at your own risk.
          </p>

          <h2 className={h2} style={h2Style}>8. International Transfers</h2>
          <p className={p} style={{ color: C.textDim }}>
            Our service providers are primarily based in the United States. By using TradePulse, you consent to your data being processed in the United States and any country where our providers operate.
          </p>

          <h2 className={h2} style={h2Style}>9. Children's Privacy</h2>
          <p className={p} style={{ color: C.textDim }}>
            TradePulse is not intended for users under the age of 18. We do not knowingly collect data from minors.
          </p>

          <h2 className={h2} style={h2Style}>10. Changes to This Policy</h2>
          <p className={p} style={{ color: C.textDim }}>
            We may update this Privacy Policy from time to time. Material changes will be announced on the Service. The "Last Updated" date will reflect the most recent revision.
          </p>

          <h2 className={h2} style={h2Style}>11. Contact</h2>
          <p className={p} style={{ color: C.textDim }}>
            Questions, data requests, or concerns:{" "}
            <a href="mailto:rickybob99999@gmail.com" className="underline" style={{ color: C.primary }}>rickybob99999@gmail.com</a>
          </p>
          <p className={p} style={{ color: C.textDim }}>
            TradePulse is operated independently by TheVeinGhost.
          </p>
        </section>

        <hr className="my-8" style={{ borderColor: C.border }} />
        <p className="font-sans text-xs italic" style={{ color: C.textDim }}>
          This document is a starting template, not legal advice. We recommend a licensed attorney review it before publication, especially for GDPR/CCPA compliance specifics.
        </p>
      </div>
    </MarketingLayout>
  );
}
