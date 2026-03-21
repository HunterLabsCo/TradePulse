import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, LogOut, MessageCircle, ChevronDown } from "lucide-react";
import { useTradeStore } from "@/lib/trade-store";
import { PnlBadge } from "@/components/PnlBadge";
import { EmotionBadge } from "@/components/EmotionBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExitModal } from "@/components/trade/ExitModal";
import { ExitHistory } from "@/components/trade/ExitHistory";
import { NotesSection } from "@/components/trade/NotesSection";
import { TradeSummary } from "@/components/trade/TradeSummary";
import type { ExitEvent, TradeNote } from "@/lib/sample-data";

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3 text-left active:scale-[0.98]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 py-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Field({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </span>
    </div>
  );
}

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trade = useTradeStore((s) => s.getTradeById(id ?? ""));
  const updateTrade = useTradeStore((s) => s.updateTrade);
  const [showExitModal, setShowExitModal] = useState(false);

  if (!trade) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Trade not found.</p>
      </div>
    );
  }

  const isOpen = trade.status === "open";
  const isClosed = trade.status === "closed";
  const exitEvents = trade.exitEvents ?? [];
  const tradeNotes = trade.tradeNotes ?? [];

  const totalPercentClosed = exitEvents.reduce((s, e) => s + e.percentClosed, 0);
  const remainingPercent = Math.max(0, 100 - totalPercentClosed);

  const handleSaveExit = (event: ExitEvent) => {
    const newExitEvents = [...exitEvents, event];
    const updates: Record<string, any> = { exitEvents: newExitEvents };

    if (event.exitType === "full-exit" || event.exitType === "moon-bag") {
      updates.status = "closed";
      updates.closedAt = new Date().toISOString();
    }

    updateTrade(trade.id, updates);
  };

  const handleAddNote = (note: TradeNote) => {
    updateTrade(trade.id, { tradeNotes: [...tradeNotes, note] });
  };

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* Header */}
      <header className="px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card mb-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{trade.tokenName}</h1>
              <span className="text-xs text-muted-foreground font-medium">{trade.chain}</span>
              {trade.isDemo && (
                <span className="text-[9px] rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">DEMO</span>
              )}
            </div>
            <span
              className={cn(
                "mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          {isClosed && trade.finalPnl !== undefined && (
            <PnlBadge pnl={trade.finalPnl} className="text-sm" />
          )}
        </div>
      </header>

      <div className="space-y-2 px-5">
        {/* Part 6 — Summary (closed trades) */}
        {isClosed && exitEvents.length > 0 && (
          <TradeSummary
            exitEvents={exitEvents}
            entryTime={trade.entryTime}
            closedAt={trade.closedAt}
          />
        )}

        {/* Entry */}
        <Section title="Entry" defaultOpen>
          <div className="space-y-0.5">
            <Field label="Market Cap" value={trade.entryMarketCap} />
            <Field label="Price" value={trade.entryPrice} />
            <Field label="Size" value={trade.positionSize} />
            <Field label="Setup" value={trade.setupType} />
            <Field label="Narrative" value={trade.narrativeType} />
            <Field label="Volume ✓" value={trade.volumeConfirmed} />
            <Field label="Wallet ✓" value={trade.walletConfirmed} />
            <Field label="Session" value={trade.sessionType} />
            <Field label="Status" value={trade.interruptionStatus} />
            <Field label="Time" value={new Date(trade.entryTime).toLocaleString()} />
          </div>
          {trade.emotionalStateAtEntry.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {trade.emotionalStateAtEntry.map((e) => (
                <EmotionBadge key={e} emotion={e} />
              ))}
            </div>
          )}
          {trade.quickTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {trade.quickTags.map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {trade.entryTranscript && (
            <p className="mt-3 rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground italic">
              "{trade.entryTranscript}"
            </p>
          )}
        </Section>

        {/* Part 4 — Exit History */}
        <Section title={`Exit History (${exitEvents.length})`}>
          <ExitHistory events={exitEvents} />
        </Section>

        {/* Part 5 — Notes Feed */}
        <Section title={`Notes (${tradeNotes.length})`}>
          <NotesSection notes={tradeNotes} isOpen={isOpen} onAddNote={handleAddNote} />
        </Section>

        {/* Updates (legacy) */}
        {trade.updates.length > 0 && (
          <Section title={`Updates (${trade.updates.length})`}>
            <div className="space-y-4">
              {trade.updates.map((u) => (
                <div key={u.id} className="border-l-2 border-border pl-3">
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(u.timestamp).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">{u.note}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {u.emotionalState.map((e) => (
                      <EmotionBadge key={e} emotion={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Exit (legacy) */}
        {trade.exitTime && (
          <Section title="Exit">
            <div className="space-y-0.5">
              <Field label="Price" value={trade.exitPrice} />
              <Field label="PnL" value={trade.finalPnl !== undefined ? `${trade.finalPnl > 0 ? "+" : ""}${trade.finalPnl.toFixed(2)} SOL` : undefined} />
              <Field label="Method" value={trade.exitMethod} />
              <Field label="Time" value={new Date(trade.exitTime).toLocaleString()} />
            </div>
            {trade.emotionalStateAtExit && trade.emotionalStateAtExit.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {trade.emotionalStateAtExit.map((e) => (
                  <EmotionBadge key={e} emotion={e} />
                ))}
              </div>
            )}
            {trade.exitTranscript && (
              <p className="mt-3 rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground italic">
                "{trade.exitTranscript}"
              </p>
            )}
          </Section>
        )}

        {/* Reflection */}
        {trade.reflectionNote && (
          <Section title="Reflection">
            <p className="text-xs leading-relaxed">{trade.reflectionNote}</p>
            {trade.reflectionLesson && (
              <div className="mt-2 rounded-lg bg-primary/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Lesson</p>
                <p className="text-xs leading-relaxed text-foreground">{trade.reflectionLesson}</p>
              </div>
            )}
            {trade.emotionalStateAtReflection && trade.emotionalStateAtReflection.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trade.emotionalStateAtReflection.map((e) => (
                  <EmotionBadge key={e} emotion={e} />
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-0 right-0 flex gap-2 px-5">
        {isOpen && (
          <>
            <button
              onClick={() => navigate(`/new-trade?edit=${trade.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card py-3 text-xs font-semibold active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" /> Update
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive/15 py-3 text-xs font-semibold text-destructive active:scale-[0.97]"
            >
              <LogOut className="h-4 w-4" /> Log Exit
            </button>
          </>
        )}
        {isClosed && !trade.reflectionNote && (
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card py-3 text-xs font-semibold active:scale-[0.97]">
            <MessageCircle className="h-4 w-4" /> Add Reflection
          </button>
        )}
      </div>

      {/* Part 3 — Floating Exit FAB */}
      {isOpen && (
        <button
          onClick={() => setShowExitModal(true)}
          className="fixed bottom-24 right-5 z-40 flex h-12 items-center gap-1.5 rounded-full bg-destructive px-4 text-xs font-bold text-destructive-foreground shadow-lg active:scale-[0.95] transition-transform"
        >
          <LogOut className="h-4 w-4" /> Exit
        </button>
      )}

      {/* Part 2 — Exit Modal */}
      <ExitModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        remainingPercent={remainingPercent}
        onSave={handleSaveExit}
      />
    </div>
  );
}
