import { useEffect } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { setPageMeta } from "@/lib/page-meta";

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
    setPageMeta({
      title: "Giving Back — TradePulse",
      description: "50% of every TradePulse Pro upgrade is donated to three Connecticut organizations. Every dollar tracked publicly.",
      path: "/giving",
    });
  }, []);

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">Giving Back</h1>

        <div className="border-l-2 border-primary pl-4 mb-10">
          <p className="font-body text-sm leading-relaxed text-muted-foreground italic">
            50% of every TradePulse Pro upgrade is donated. Every dollar. Tracked publicly.
          </p>
        </div>

        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-8">
          When you upgrade to TradePulse Pro, half of your purchase goes directly to three organizations in Connecticut that matter to the people who built this:
        </p>

        <div className="space-y-4 mb-12">
          {ORGS.map(({ name, location, desc }) => (
            <div key={name} className="rounded-2xl bg-card border border-border p-5">
              <div className="mb-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <h3 className="font-display text-base font-bold text-foreground">{name}</h3>
              </div>
              <p className="font-mono-label text-[10px] text-primary mb-2 pl-4">{location}</p>
              <p className="font-body text-sm leading-relaxed text-muted-foreground pl-4">{desc}</p>
            </div>
          ))}
        </div>

        <hr className="border-border my-8" />

        <h2 className="font-display text-xl font-bold text-foreground mb-2">The Numbers</h2>
        <p className="font-body text-xs text-muted-foreground mb-4 italic">
          Updated monthly. Receipts available on request:{" "}
          <a href="mailto:support@tradepulseapp.io" className="text-primary underline">support@tradepulseapp.io</a>
        </p>
        <div className="overflow-x-auto mb-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-display text-xs font-bold text-foreground">Period</th>
                <th className="text-left py-2 pr-4 font-display text-xs font-bold text-foreground">Pro Sales</th>
                <th className="text-left py-2 font-display text-xs font-bold text-foreground">Donated</th>
              </tr>
            </thead>
            <tbody className="font-body text-muted-foreground">
              <tr className="border-b border-border">
                <td className="py-2 pr-4">May 2026</td>
                <td className="py-2 pr-4">—</td>
                <td className="py-2">—</td>
              </tr>
              <tr className="border-b border-border font-medium text-foreground">
                <td className="py-2 pr-4">Total to date</td>
                <td className="py-2 pr-4">—</td>
                <td className="py-2">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-body text-xs text-muted-foreground italic mb-10">Last updated: May 14, 2026</p>

        <hr className="border-border my-8" />

        <h2 className="font-display text-xl font-bold text-foreground mb-4">Why</h2>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          I grew up in a small town in Connecticut. The community helped my family when we needed it. Building TradePulse is a way to combine what I love — crypto markets, AI, and clean tools — with a chance to give back to the people who taught me you don't make it alone.
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          It's not charity-washing. It's not a tax move. It's just where half the money goes.
        </p>
        <p className="font-body text-sm font-medium text-foreground mb-8">— TheVeinGhost</p>

        <hr className="border-border my-8" />

        <div className="rounded-2xl bg-[hsl(var(--green-primary)/0.06)] border border-[hsl(var(--green-primary)/0.3)] p-5">
          <h2 className="font-display text-base font-bold text-foreground mb-2">Want to verify?</h2>
          <p className="font-body text-sm leading-relaxed text-muted-foreground">
            Email <a href="mailto:support@tradepulseapp.io" className="text-primary underline">support@tradepulseapp.io</a> any time and I'll send you the most recent donation receipts. Transparency is the whole point.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
