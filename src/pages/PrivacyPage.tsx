import { useEffect } from "react";
import MarketingLayout from "@/components/MarketingLayout";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy — TradePulse";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "TradePulse Privacy Policy. We don't collect emails, don't sell data, and free-tier trades never leave your device.");
  }, []);

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="font-body text-xs text-muted-foreground mb-1"><strong className="text-foreground">Last Updated:</strong> May 14, 2026</p>
        <p className="font-body text-xs text-muted-foreground mb-8"><strong className="text-foreground">Effective Date:</strong> May 14, 2026</p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-8">
          We respect your privacy. This Privacy Policy describes how TradePulse ("we," "us") collects, uses, and protects information when you use our Service.
        </p>

        {/* TL;DR */}
        <div className="rounded-xl bg-card border border-border p-5 mb-8">
          <p className="font-mono-label text-[10px] font-medium uppercase tracking-widest text-primary mb-3">TL;DR — the short version</p>
          <ul className="space-y-2 font-body text-sm text-muted-foreground">
            <li><strong className="text-foreground">Free tier:</strong> Your trades are stored locally in your browser. We don't see them. We don't collect your email. We don't know who you are.</li>
            <li><strong className="text-foreground">Pro tier:</strong> Your wallet address is used to verify payment. Optional cloud sync of trade data is stored in Supabase, encrypted in transit.</li>
            <li><strong className="text-foreground">Voice:</strong> Audio you record is sent to ElevenLabs (for transcription) and Anthropic (for parsing). We don't keep recordings.</li>
            <li><strong className="text-foreground">Analytics:</strong> We use Vercel Analytics for anonymous, aggregate usage data. No personal profiling.</li>
            <li><strong className="text-foreground">We never sell your data.</strong></li>
          </ul>
        </div>

        <hr className="border-border my-8" />

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">1. Information We Collect</h2>

          <h3 className="font-display text-base font-bold text-foreground mt-6 mb-2">a. Free-tier users</h3>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li><strong className="text-foreground">Trade entries you enter or speak:</strong> Stored locally on your device (browser localStorage / IndexedDB). Never transmitted to our servers.</li>
            <li><strong className="text-foreground">Voice audio:</strong> Transmitted to our AI service providers (see Section 3) for transcription and parsing. Not stored by us.</li>
          </ul>

          <h3 className="font-display text-base font-bold text-foreground mt-6 mb-2">b. Pro-tier users</h3>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li><strong className="text-foreground">Wallet address:</strong> Used to verify your Pro purchase. Stored in Supabase.</li>
            <li><strong className="text-foreground">Trade data (if you enable cloud sync):</strong> Stored in Supabase, encrypted in transit.</li>
          </ul>

          <h3 className="font-display text-base font-bold text-foreground mt-6 mb-2">c. All users (automatically collected)</h3>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li><strong className="text-foreground">Usage data via Vercel Analytics:</strong> Anonymous page views and performance metrics. No cookies that identify you personally.</li>
            <li><strong className="text-foreground">Standard request data:</strong> IP address, browser type, and referrer (logged by our hosting provider for security and operational purposes; not used for marketing).</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">2. Information We Do NOT Collect</h2>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li>We do not require email addresses, names, or phone numbers.</li>
            <li>We do not collect or store wallet private keys, seed phrases, or passwords.</li>
            <li>We do not access your wallet beyond verifying the payment transaction.</li>
            <li>We do not sell, rent, or trade your data.</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">3. Third-Party Service Providers</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
            We use the following providers, who may process data on our behalf:
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-display text-xs font-bold text-foreground">Provider</th>
                  <th className="text-left py-2 pr-4 font-display text-xs font-bold text-foreground">Purpose</th>
                  <th className="text-left py-2 font-display text-xs font-bold text-foreground">Data Processed</th>
                </tr>
              </thead>
              <tbody className="font-body text-muted-foreground">
                {[
                  ["ElevenLabs", "Speech-to-text transcription", "Voice audio (transient)"],
                  ["Anthropic (Claude)", "Parsing transcribed text into structured trade fields", "Text transcripts (transient)"],
                  ["Supabase", "Pro account management; optional cloud sync", "Wallet address; encrypted trade data"],
                  ["Vercel", "Hosting, analytics, edge functions", "Standard HTTP request data; anonymous usage"],
                ].map(([provider, purpose, data]) => (
                  <tr key={provider} className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground align-top">{provider}</td>
                    <td className="py-2 pr-4 align-top">{purpose}</td>
                    <td className="py-2 align-top">{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            Each provider has its own privacy policy. We have selected providers that, to our knowledge, do not train their models on user-submitted data through their commercial APIs.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">4. How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li>To provide the core voice-to-journal functionality.</li>
            <li>To verify Pro tier purchases.</li>
            <li>To improve performance and fix bugs (via anonymous analytics).</li>
            <li>To process refund and support requests when you contact us.</li>
          </ul>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            We do <strong className="text-foreground">not</strong> use your data for advertising, profiling, or sale.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">5. Your Rights</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            Depending on where you live, you may have rights under the GDPR (EU/UK), CCPA (California), or similar laws, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li><strong className="text-foreground">Access:</strong> Request a copy of any data we hold about you.</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your data. Free-tier trade data is on your device — you can clear it from Settings → Delete All Data.</li>
            <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong className="text-foreground">Portability:</strong> Export your data as CSV or JSON from Settings.</li>
            <li><strong className="text-foreground">Objection / Restriction:</strong> Object to or restrict certain processing.</li>
          </ul>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            To exercise these rights, email <a href="mailto:support@tradepulseapp.io" className="text-primary underline">support@tradepulseapp.io</a>. We will respond within 30 days.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">6. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1 font-body text-sm text-muted-foreground mb-3">
            <li><strong className="text-foreground">Free-tier trade data:</strong> Held on your device until you delete it.</li>
            <li><strong className="text-foreground">Pro-tier wallet + trade data:</strong> Retained while your account is active. Deleted within 30 days of a verified deletion request.</li>
            <li><strong className="text-foreground">Voice recordings:</strong> Not retained by us. Processed transiently and discarded.</li>
            <li><strong className="text-foreground">Analytics:</strong> Retained per Vercel's standard policy (typically 30 days for anonymous logs).</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">7. Security</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            We use HTTPS for all communications. Wallet authentication is handled cryptographically — we never see your private key. Pro data is encrypted in transit. However, no online service is 100% secure; you use TradePulse at your own risk.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">8. International Transfers</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            Our service providers are primarily based in the United States. By using TradePulse, you consent to your data being processed in the United States and any country where our providers operate.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">9. Children's Privacy</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            TradePulse is not intended for users under the age of 18. We do not knowingly collect data from minors.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">10. Changes to This Policy</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            We may update this Privacy Policy from time to time. Material changes will be announced on the Service. The "Last Updated" date will reflect the most recent revision.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground mt-10 mb-3">11. Contact</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            Questions, data requests, or concerns:{" "}
            <a href="mailto:support@tradepulseapp.io" className="text-primary underline">support@tradepulseapp.io</a>
          </p>
          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">
            TradePulse is operated independently by TheVeinGhost.
          </p>
        </section>

        <hr className="border-border my-8" />
        <p className="font-body text-xs text-muted-foreground italic">
          This document is a starting template, not legal advice. We recommend a licensed attorney review it before publication, especially for GDPR/CCPA compliance specifics.
        </p>
      </div>
    </MarketingLayout>
  );
}
