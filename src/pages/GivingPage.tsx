import { useEffect } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { setPageMeta } from "@/lib/page-meta";
import { ROUTE_META } from "@/prerender/route-meta";
import { C } from "@/components/marketing/theme";

const ORGS = [
  {
    name: "St. Anthony's Church",
    location: "Prospect, CT",
    desc: "Restoring access. Funds the handicapped elevator and ongoing renovations so every parishioner can attend Mass.",
  },
  {
    name: "Knights of Columbus Council 13459",
    location: "Prospect, CT",
    desc: "Local works of charity — scholarships, family aid, and community programs run by my fellow Knights.",
  },
  {
    name: "St. Vincent DePaul Mission Soup Kitchen",
    location: "Waterbury, CT",
    desc: "Hot meals for anyone who walks through the door. No paperwork, no questions.",
  },
];

export default function GivingPage() {
  useEffect(() => {
    setPageMeta({ ...ROUTE_META["/giving"], path: "/giving" });
  }, []);

  const label = "mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]";

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className={label} style={{ color: C.primary }}>Giving Back</p>
        <h1 className="mb-4 font-sans text-[2.5rem] font-bold leading-[1.1]" style={{ color: C.text, letterSpacing: "-0.03em" }}>
          Giving Back
        </h1>

        <div className="mb-10 border-l-2 pl-4" style={{ borderColor: C.primary }}>
          <p className="font-sans text-sm italic leading-relaxed" style={{ color: C.textDim }}>
            50% of every TradePulse Pro upgrade is donated. Every dollar. Tracked publicly.
          </p>
        </div>

        <p className="mb-8 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          When you upgrade to TradePulse Pro, half of your purchase goes directly to three organizations in Connecticut that matter to the people who built this:
        </p>

        <p className={label} style={{ color: C.textDim }}>Recipients</p>
        <div className="mb-12 space-y-4">
          {ORGS.map(({ name, location, desc }) => (
            <div key={name} className="rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.primary }} />
                <div>
                  <p className="font-sans text-base font-medium" style={{ color: C.text }}>{name}</p>
                  <p className="font-mono text-[10px]" style={{ color: C.primary }}>{location}</p>
                  <p className="mt-1 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <p className={label} style={{ color: C.primary }}>The Numbers</p>
        <h2 className="mb-2 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>The Numbers</h2>
        <p className="mb-4 font-sans text-xs italic" style={{ color: C.textDim }}>
          Updated monthly. Receipts available on request:{" "}
          <a href="mailto:rickybob99999@gmail.com" className="underline" style={{ color: C.primary }}>rickybob99999@gmail.com</a>
        </p>
        <div className="mb-2 overflow-x-auto rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: C.border }}>
                <th className="py-2 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Period</th>
                <th className="py-2 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Pro Sales</th>
                <th className="py-2 text-left font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Donated</th>
              </tr>
            </thead>
            <tbody className="font-sans">
              <tr className="border-b" style={{ borderColor: C.border }}>
                <td className="py-2 pr-4" style={{ color: C.textDim }}>May 2026</td>
                <td className="py-2 pr-4" style={{ color: C.textDim }}>—</td>
                <td className="py-2" style={{ color: C.textDim }}>—</td>
              </tr>
              <tr className="border-b font-medium" style={{ borderColor: C.border }}>
                <td className="py-2 pr-4" style={{ color: C.text }}>Total to date</td>
                <td className="py-2 pr-4" style={{ color: C.text }}>—</td>
                <td className="py-2" style={{ color: C.text }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-10 font-sans text-xs italic" style={{ color: C.textDim }}>Last updated: May 14, 2026</p>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <p className={label} style={{ color: C.textDim }}>Why</p>
        <h2 className="mb-4 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>Why</h2>
        <p className="mb-4 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          I grew up in a small town in Connecticut. The community helped my family when we needed it. Building TradePulse is a way to combine what I love — crypto markets, AI, and clean tools — with a chance to give back to the people who taught me you don't make it alone.
        </p>
        <p className="mb-4 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          It's not charity-washing. It's not a tax move. It's just where half the money goes.
        </p>
        <p className="mb-8 font-sans text-sm font-medium" style={{ color: C.text }}>— TheVeinGhost</p>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <div className="rounded-[6px] border p-5" style={{ background: "rgba(142,194,221,0.04)", borderColor: "rgba(142,194,221,0.35)" }}>
          <h2 className="mb-2 font-sans text-base font-medium" style={{ color: C.text }}>Want to verify?</h2>
          <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
            Email <a href="mailto:rickybob99999@gmail.com" className="underline" style={{ color: C.primary }}>rickybob99999@gmail.com</a> any time and I'll send you the most recent donation receipts. Transparency is the whole point.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
