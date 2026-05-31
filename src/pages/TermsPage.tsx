import { useEffect } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { setPageMeta } from "@/lib/page-meta";
import { C } from "@/components/marketing/theme";

export default function TermsPage() {
  useEffect(() => {
    setPageMeta({
      title: "Terms of Service — TradePulse",
      description: "TradePulse Terms of Service. Review the terms governing your use of our voice-powered crypto trade journal.",
      path: "/terms",
    });
  }, []);

  const h2 = "mt-10 mb-3 font-sans text-2xl font-bold";
  const h2Style = { color: C.text, letterSpacing: "-0.02em" } as const;
  const p = "mb-3 font-sans text-sm leading-relaxed";
  const ul = "mb-3 list-disc space-y-1 pl-5 font-sans text-sm";
  const strong = { color: C.text } as const;

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Legal</p>
        <h1 className="mb-2 font-sans text-[2.5rem] font-bold leading-[1.1]" style={{ color: C.text, letterSpacing: "-0.03em" }}>
          Terms of Service
        </h1>
        <p className="mb-1 font-sans text-xs" style={{ color: C.textDim }}><strong style={strong}>Last Updated:</strong> May 14, 2026</p>
        <p className="mb-8 font-sans text-xs" style={{ color: C.textDim }}><strong style={strong}>Effective Date:</strong> May 14, 2026</p>
        <p className="mb-8 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          These Terms of Service ("Terms") govern your access to and use of TradePulse (the "Service"), operated by TheVeinGhost ("we," "us," or "our"). By accessing or using TradePulse, you agree to be bound by these Terms.
        </p>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <section>
          <h2 className={h2} style={h2Style}>1. Description of Service</h2>
          <p className={p} style={{ color: C.textDim }}>
            TradePulse is a voice-powered trade journal designed for active cryptocurrency traders. The Service allows users to log, organize, and analyze cryptocurrency trades using voice input parsed by AI. TradePulse is currently in Open Beta and is provided on an "as-is" basis.
          </p>

          <h2 className={h2} style={h2Style}>2. Acceptance of Terms</h2>
          <p className={p} style={{ color: C.textDim }}>By using TradePulse, you confirm that:</p>
          <ul className={ul} style={{ color: C.textDim }}>
            <li>You are at least 18 years old (or the age of majority in your jurisdiction);</li>
            <li>You have the legal capacity to enter into a binding agreement;</li>
            <li>You will use the Service in accordance with these Terms and applicable laws.</li>
          </ul>
          <p className={p} style={{ color: C.textDim }}>If you do not agree to these Terms, do not use the Service.</p>

          <h2 className={h2} style={h2Style}>3. Beta Notice</h2>
          <p className={p} style={{ color: C.textDim }}>
            TradePulse is in Open Beta. The Service may contain bugs, errors, or inaccuracies, and may be modified, suspended, or discontinued at any time without notice. Features may change. In rare cases, data may be lost. You use the Service at your own risk.
          </p>

          <h2 className={h2} style={h2Style}>4. Account and Access</h2>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>Free Tier.</strong> No account is required for free use. Your trade data is stored locally on your device. We do not collect personal information from free-tier users.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>Pro Tier.</strong> Pro users authenticate with a cryptocurrency wallet; account state may be managed by our service provider, Supabase. We do not store wallet private keys, passwords, or seed phrases.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            You are responsible for safeguarding the device, browser, and wallet used to access TradePulse.
          </p>

          <h2 className={h2} style={h2Style}>5. Pro Subscription, Payment, and Refunds</h2>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>Price.</strong> The Pro tier costs $99 USD (or USD-equivalent in supported cryptocurrencies — currently SOL or USDC) as a one-time payment. There is no recurring subscription.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>What you get.</strong> Lifetime access to the Pro feature set as offered on the date of purchase. Features may evolve.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>Refunds.</strong> We offer a <strong style={strong}>14-day money-back guarantee.</strong> To request a refund, email{" "}
            <a href="mailto:support@tradepulseapp.io" className="underline" style={{ color: C.primary }}>support@tradepulseapp.io</a>{" "}
            within 14 days of your purchase from the same wallet address used to purchase. Refunds are issued in the cryptocurrency originally used, returned to the originating wallet.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            <strong style={strong}>Charitable contributions.</strong> We have publicly committed to donating 50% of every Pro purchase to the three Connecticut-based organizations listed on our{" "}
            <a href="/giving" className="underline" style={{ color: C.primary }}>Giving page</a>. Refund requests reduce the donation pool accordingly.
          </p>

          <h2 className={h2} style={h2Style}>6. Acceptable Use</h2>
          <p className={p} style={{ color: C.textDim }}>You agree not to:</p>
          <ul className={ul} style={{ color: C.textDim }}>
            <li>Use TradePulse to log fraudulent, illegal, or fabricated trades;</li>
            <li>Reverse-engineer, scrape, or copy the Service;</li>
            <li>Use the Service to harass, defame, or harm others;</li>
            <li>Attempt to access accounts, data, or systems you are not authorized to access;</li>
            <li>Interfere with the operation of the Service.</li>
          </ul>

          <h2 className={h2} style={h2Style}>7. Intellectual Property</h2>
          <p className={p} style={{ color: C.textDim }}>
            TradePulse, including its software, design, copy, and branding, is owned by us. You may not copy, modify, distribute, or create derivative works without permission. Your trade data and voice recordings remain yours.
          </p>

          <h2 className={h2} style={h2Style}>8. Voice Data and AI Processing</h2>
          <p className={p} style={{ color: C.textDim }}>
            When you use voice logging, your audio is transmitted to third-party AI service providers — currently <strong style={strong}>ElevenLabs</strong> (for speech transcription) and <strong style={strong}>Anthropic</strong> (for parsing transcribed text into structured trade data). We do not retain voice recordings on our servers after parsing. Our service providers may transiently retain transmitted data per their own policies; we have selected providers that, to our knowledge, do not train on user-submitted data through their commercial APIs.
          </p>
          <p className={p} style={{ color: C.textDim }}>
            See our <a href="/privacy" className="underline" style={{ color: C.primary }}>Privacy Policy</a> for full details.
          </p>

          <h2 className={h2} style={h2Style}>9. NO FINANCIAL ADVICE</h2>
          <div className="mb-3 rounded-[6px] border p-5" style={{ background: "rgba(142,194,221,0.04)", borderColor: "rgba(142,194,221,0.35)" }}>
            <p className="mb-2 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              <strong style={strong}>TradePulse is a journaling and analytics tool. It is NOT a financial advisor, investment advisor, broker, dealer, or any licensed financial professional. Nothing in the Service is investment advice, financial advice, trading advice, tax advice, or legal advice.</strong>
            </p>
            <p className="mb-2 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              <strong style={strong}>Any statistics, analytics, charts, or sample numbers shown on the marketing site or inside the application are illustrative or aggregate. They are not representations of any specific user's results or any guarantee of future performance.</strong>
            </p>
            <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              <strong style={strong}>Trading cryptocurrency carries substantial risk of loss. You are solely responsible for your own trading decisions. Past performance does not predict future results. Do your own research.</strong>
            </p>
          </div>

          <h2 className={h2} style={h2Style}>10. Disclaimer of Warranties</h2>
          <p className={p} style={{ color: C.textDim }}>
            The Service is provided <strong style={strong}>"AS IS" and "AS AVAILABLE"</strong> without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, or uninterrupted operation.
          </p>

          <h2 className={h2} style={h2Style}>11. Limitation of Liability</h2>
          <p className={p} style={{ color: C.textDim }}>
            To the maximum extent permitted by law, in no event will TradePulse, its operator, or affiliates be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages — including lost profits, lost trading opportunities, data loss, or loss of goodwill — arising out of or related to your use of the Service. Our total liability for any claim related to the Service will not exceed the amount you paid for Pro (if any), or $100 USD, whichever is greater.
          </p>

          <h2 className={h2} style={h2Style}>12. Indemnification</h2>
          <p className={p} style={{ color: C.textDim }}>
            You agree to indemnify and hold harmless TradePulse and its operator from any claims, damages, liabilities, or expenses arising out of your use of the Service or violation of these Terms.
          </p>

          <h2 className={h2} style={h2Style}>13. Governing Law and Dispute Resolution</h2>
          <p className={p} style={{ color: C.textDim }}>
            These Terms are governed by the laws of the State of Connecticut, USA, without regard to conflict-of-laws principles. Any dispute will be resolved by binding individual arbitration in Connecticut, except either party may bring small-claims actions in their local court. You waive any right to participate in a class action.
          </p>

          <h2 className={h2} style={h2Style}>14. Changes to Terms</h2>
          <p className={p} style={{ color: C.textDim }}>
            We may update these Terms from time to time. Material changes will be announced on the Service. Continued use after changes constitutes acceptance.
          </p>

          <h2 className={h2} style={h2Style}>15. Contact</h2>
          <p className={p} style={{ color: C.textDim }}>
            Questions, refund requests, or legal notices:{" "}
            <a href="mailto:support@tradepulseapp.io" className="underline" style={{ color: C.primary }}>support@tradepulseapp.io</a>
          </p>
        </section>

        <hr className="my-8" style={{ borderColor: C.border }} />
        <p className="font-sans text-xs italic" style={{ color: C.textDim }}>
          This document is a starting template, not legal advice. We recommend a licensed attorney review it before publication, especially for any jurisdiction-specific requirements.
        </p>
      </div>
    </MarketingLayout>
  );
}
