import { useState, type ReactNode } from "react";
import {
  Label,
  Pill,
  Kbd,
  Pnl,
  Logo,
  Waveform,
  Sparkline,
  MiniBars,
  Candles,
  Field,
  ToggleRow,
  SettingsGroup,
  TradeRow,
  TradeRowFull,
} from "@/components/design";
import { SAMPLE_TRADES } from "@/lib/sample-data";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-mist-border rounded-mist-lg p-5 bg-mist-bg-raised">
      <Label className="mb-4">{title}</Label>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </div>
  );
}

export default function DesignTest() {
  const [toggles, setToggles] = useState({ a: true, b: false, c: true });

  return (
    <div className="min-h-screen bg-mist-bg text-mist-text px-6 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Logo size={20} />
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">
          Mist Design Primitives
        </h1>

        <Section title="Label">
          <Label>SECTION LABEL</Label>
        </Section>

        <Section title="Pill">
          <Pill>default</Pill>
          <Pill color="#8ec2dd">primary</Pill>
          <Pill color="#a8d4ad">win</Pill>
          <Pill color="#e89a8a">loss</Pill>
          <Pill color="#8ec2dd" bg="rgba(142,194,221,0.1)">filled</Pill>
        </Section>

        <Section title="Kbd">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <Kbd>Esc</Kbd>
        </Section>

        <Section title="Pnl">
          <Pnl pnl={2.43} size="sm" />
          <Pnl pnl={2.43} size="md" />
          <Pnl pnl={-1.12} size="lg" />
          <Pnl pnl={4.5} size="xl" />
          <Pnl pnl={null} size="md" />
        </Section>

        <Section title="Logo">
          <Logo size={14} />
          <Logo size={20} />
        </Section>

        <Section title="Waveform">
          <div className="text-mist-primary">
            <Waveform />
          </div>
          <div className="text-mist-text-dim">
            <Waveform active={false} bars={20} />
          </div>
        </Section>

        <Section title="Sparkline / MiniBars / Candles">
          <Sparkline width={140} height={32} stroke="#8ec2dd" fill="rgba(142,194,221,0.15)" dots />
          <MiniBars data={[2.1, -0.8, 1.4, 3.2, -1.1, 2.7, 1.9]} width={140} height={32} color="#a8d4ad" neg="#e89a8a" />
          <Candles width={240} height={88} color="#a8d4ad" red="#e89a8a" />
        </Section>

        <Section title="Field">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Field k="Token" v="PEPEKING" />
            <Field k="Chain" v="SOL" />
            <Field k="Entry MC" v="42K" highlight />
            <Field k="Transcript" v="Volume spiked 8x, fresh wallets loaded" wide />
          </div>
        </Section>

        <div className="border border-mist-border rounded-mist-lg bg-mist-bg-raised">
          <SettingsGroup title="Preferences">
            <ToggleRow label="Voice auto-parse" on={toggles.a} onChange={() => setToggles((t) => ({ ...t, a: !t.a }))} />
            <ToggleRow label="Cloud sync" on={toggles.b} onChange={() => setToggles((t) => ({ ...t, b: !t.b }))} />
            <ToggleRow label="Haptics" on={toggles.c} last onChange={() => setToggles((t) => ({ ...t, c: !t.c }))} />
          </SettingsGroup>
        </div>

        <Section title="TradeRow (compact)">
          <div className="w-full">
            {SAMPLE_TRADES.slice(0, 4).map((trade, i, arr) => (
              <TradeRow key={trade.id} trade={trade} last={i === arr.length - 1} />
            ))}
          </div>
        </Section>

        <Section title="TradeRowFull (journal)">
          <div className="w-full">
            {SAMPLE_TRADES.slice(0, 4).map((trade, i, arr) => (
              <TradeRowFull key={trade.id} trade={trade} idx={i} last={i === arr.length - 1} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
