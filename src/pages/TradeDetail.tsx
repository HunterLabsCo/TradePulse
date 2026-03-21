import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, LogOut, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTradeStore } from "@/lib/trade-store";
import { PnlBadge } from "@/components/PnlBadge";
import { EmotionBadge } from "@/components/EmotionBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExitModal } from "@/components/trade/ExitModal";
import { UpdateModal } from "@/components/trade/UpdateModal";
import { ExitHistory } from "@/components/trade/ExitHistory";
import { NotesSection } from "@/components/trade/NotesSection";
import { TradeSummary } from "@/components/trade/TradeSummary";
import type { ExitEvent, TradeNote, EmotionalState } from "@/lib/sample-data";

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-card border border-border px-4 py-3 text-left active:scale-[0.98]">
        <span className="section-label">
          {icon && <span className="mr-1">{icon}</span>}{title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[hsl(var(--text-muted))] transition-transform",
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
      <span className="font-body text-xs font-300 text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="font-body text-xs font-400 text-foreground text-right tracking-data">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </span>
    </div>
  );
}

function UpdatesFeed({ updates }: { updates: TradeNote[] }) {
  if (updates.length === 0) {
    return <p className="font-body text-xs font-300 text-muted-foreground italic">No updates logged yet.</p>;
  }
  return (
    <div className="space-y-2">
      {[...updates].reverse().map((n) => (
        <div key={n.id} className="rounded-xl bg-card border-l-2 border-l-primary border border-border p-3">
          <div className="mb-1">
            <span className="font-body text-[11px] font-500 text-primary">⚡ Trade Update</span>
          </div>
          <p className="font-body text-xs font-300 leading-relaxed whitespace-pre-line text-foreground">{n.text}</p>
          {n.emotions && n.emotions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {n.emotions.map((e) => (
                <EmotionBadge key={e} emotion={e} />
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-body text-[10px] font-300 text-accent tabular-nums tracking-data">
              {new Date(n.timestamp).toLocaleString()}
            </span>
            <span className="font-body text-[9px] font-400 rounded-full px-1.5 py-0.5 bg-[hsl(var(--blue-accent)/0.1)] text-accent border border-[hsl(var(--blue-accent)/0.25)]">
              Mid-trade update
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trade = useTradeStore((s) => s.getTradeById(id ?? ""));
  const updateTrade = useTradeStore((s) => s.updateTrade);
  const deleteTrade = useTradeStore((s) => s.deleteTrade);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!trade) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-body text-sm font-300 text-muted-foreground">Trade not found.</p>
      </div>
    );
  }

  const isOpen = trade.status === "open";
  const isClosed = trade.status === "closed";
  const exitEvents = trade.exitEvents ?? [];
  const tradeNotes = trade.tradeNotes ?? [];

  const updateNotes = tradeNotes.filter((n) => n.noteType === "update");
  const directNotes = tradeNotes.filter((n) => n.noteType !== "update");

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
    setShowExitModal(false);
    toast.success("Exit logged ✓", { duration: 2000 });
    navigate("/journal");
  };

  const handleAddNote = (note: TradeNote) => {
    updateTrade(trade.id, { tradeNotes: [...tradeNotes, note] });
  };

  const handleSaveUpdate = (note: TradeNote, _emotions: EmotionalState[]) => {
    updateTrade(trade.id, { tradeNotes: [...tradeNotes, note] });
  };

  const confirmationSignals = trade.confirmationSignals ?? [];
  const confirmationOther = trade.confirmationSignalOther;

  return (
    <div className="flex min-h-screen flex-col pb-40">
      {/* Header */}
      <header className="px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card mb-3 text-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-600 text-foreground">{trade.tokenName}</h1>
              <span className="font-body text-xs font-300 text-[hsl(var(--text-muted))]">{trade.chain}</span>
              {trade.isDemo && (
                <span className="font-body text-[9px] font-400 rounded bg-[hsl(var(--text-primary)/0.06)] px-1.5 py-0.5 text-[hsl(var(--text-muted))]">DEMO</span>
              )}
            </div>
            <span
              className={cn(
                "mt-1 inline-flex rounded-md px-2 py-0.5 font-body text-[11px] font-400",
                isOpen
                  ? "border border-[hsl(var(--green-primary)/0.3)] bg-[hsl(var(--green-primary)/0.1)] text-primary"
                  : "border border-[hsl(var(--red-action)/0.3)] bg-[hsl(var(--red-action)/0.1)] text-red-action"
              )}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isClosed && trade.finalPnl !== undefined && (
              <PnlBadge pnl={trade.finalPnl} className="text-sm" />
            )}
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:text-red-destroy transition-colors active:scale-[0.95]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-2 px-5">
        {isClosed && exitEvents.length > 0 && (
          <TradeSummary exitEvents={exitEvents} entryTime={trade.entryTime} closedAt={trade.closedAt} />
        )}

        <Section title="Entry" defaultOpen>
          <div className="space-y-0.5">
            <Field label="Market Cap" value={trade.entryMarketCap} />
            <Field label="Entry Price" value={trade.entryPrice} />
            <Field label="Size" value={trade.positionSize} />
            <Field label="Setup" value={trade.setupType} />
            <Field label="Narrative" value={trade.narrativeType} />
            <Field label="Session" value={trade.sessionType} />
            <Field label="Time" value={new Date(trade.entryTime).toLocaleString()} />
          </div>

          {(confirmationSignals.length > 0 || confirmationOther) && (
            <div className="mt-3">
              <p className="section-label mb-1">Confirmation Signals</p>
              <div className="flex flex-wrap gap-1">
                {confirmationSignals.map((sig) => (
                  <span key={sig} className="rounded-full bg-[hsl(var(--green-primary)/0.1)] px-2 py-0.5 font-body text-[10px] font-400 text-primary">{sig}</span>
                ))}
                {confirmationOther && (
                  <span className="rounded-full bg-[hsl(var(--green-primary)/0.1)] px-2 py-0.5 font-body text-[10px] font-400 text-primary border border-dashed border-[hsl(var(--green-primary)/0.3)]">{confirmationOther}</span>
                )}
              </div>
            </div>
          )}

          {trade.emotionalStateAtEntry.length > 0 && (
            <div className="mt-3">
              <p className="section-label mb-1">Emotional State</p>
              <div className="flex flex-wrap gap-1">
                {trade.emotionalStateAtEntry.map((e) => (
                  <EmotionBadge key={e} emotion={e} />
                ))}
              </div>
            </div>
          )}

          {trade.quickTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {trade.quickTags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-300 text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}

          {trade.entryTranscript && (
            <div className="mt-3">
              <p className="section-label mb-1">Transcript</p>
              <p className="rounded-none rounded-r-lg bg-[hsl(var(--blue-accent)/0.04)] border-l-2 border-l-[hsl(var(--blue-accent)/0.3)] py-3 px-4 font-body text-[13px] font-300 italic leading-relaxed text-accent">"{trade.entryTranscript}"</p>
            </div>
          )}

          {trade.additionalNotes && (
            <div className="mt-2">
              <p className="section-label mb-1">Additional Notes</p>
              <p className="rounded-xl bg-card p-3 font-body text-xs font-300 leading-relaxed border border-border">{trade.additionalNotes}</p>
            </div>
          )}
        </Section>

        <Section title={`Exit History (${exitEvents.length})`}>
          <ExitHistory events={exitEvents} />
        </Section>

        <Section title={`Updates (${updateNotes.length})`} icon="⚡">
          <UpdatesFeed updates={updateNotes} />
        </Section>

        <Section title={`Notes (${directNotes.length})`} icon="📝">
          <NotesSection notes={tradeNotes} isOpen={isOpen} onAddNote={handleAddNote} />
        </Section>

        {trade.updates.length > 0 && (
          <Section title={`Legacy Updates (${trade.updates.length})`}>
            <div className="space-y-4">
              {trade.updates.map((u) => (
                <div key={u.id} className="border-l-2 border-border pl-3">
                  <p className="font-body text-[10px] font-300 text-accent tabular-nums tracking-data">{new Date(u.timestamp).toLocaleString()}</p>
                  <p className="mt-1 font-body text-xs font-300 leading-relaxed">{u.note}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {u.emotionalState.map((e) => (<EmotionBadge key={e} emotion={e} />))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

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
                {trade.emotionalStateAtExit.map((e) => (<EmotionBadge key={e} emotion={e} />))}
              </div>
            )}
            {trade.exitTranscript && (
              <p className="mt-3 rounded-none rounded-r-lg bg-[hsl(var(--blue-accent)/0.04)] border-l-2 border-l-[hsl(var(--blue-accent)/0.3)] py-3 px-4 font-body text-[13px] font-300 italic leading-relaxed text-accent">"{trade.exitTranscript}"</p>
            )}
          </Section>
        )}

        {trade.reflectionNote && (
          <Section title="Reflection">
            <p className="font-body text-xs font-300 leading-relaxed">{trade.reflectionNote}</p>
            {trade.reflectionLesson && (
              <div className="mt-2 rounded-xl bg-[hsl(var(--green-primary)/0.05)] p-3">
                <p className="section-label mb-1">Lesson</p>
                <p className="font-body text-xs font-300 leading-relaxed text-foreground">{trade.reflectionLesson}</p>
              </div>
            )}
            {trade.emotionalStateAtReflection && trade.emotionalStateAtReflection.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trade.emotionalStateAtReflection.map((e) => (<EmotionBadge key={e} emotion={e} />))}
              </div>
            )}
          </Section>
        )}
      </div>

      {isOpen && (
        <div className="fixed bottom-20 left-0 right-0 z-30 flex gap-2 px-5">
          <button onClick={() => setShowUpdateModal(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary border border-[hsl(var(--border-default))] py-3 font-body text-xs font-400 text-foreground active:scale-[0.97] transition-colors hover:border-[hsl(var(--border-default)/1.5)]">
            <Plus className="h-4 w-4" /> Update
          </button>
          <button onClick={() => setShowExitModal(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--red-action)/0.15)] border border-[hsl(var(--red-action)/0.4)] py-3 font-body text-xs font-400 text-red-action active:scale-[0.97] transition-colors hover:bg-[hsl(var(--red-action)/0.25)]">
            <LogOut className="h-4 w-4" /> Log Exit
          </button>
        </div>
      )}

      <ExitModal open={showExitModal} onOpenChange={setShowExitModal} remainingPercent={remainingPercent} onSave={handleSaveExit} />
      <UpdateModal open={showUpdateModal} onOpenChange={setShowUpdateModal} onSave={handleSaveUpdate} />

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-600">Delete this trade?</DialogTitle>
            <DialogDescription className="font-body font-300">This will permanently delete this trade and all its exits, updates, and notes. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <p className="font-body text-xs font-300 text-muted-foreground mb-1.5">Type <span className="font-400 text-foreground">DELETE</span> to confirm</p>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-9 font-body text-sm font-mono" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-destroy text-foreground hover:bg-[hsl(var(--red-destroy)/0.8)]" disabled={deleteConfirmText !== "DELETE"} onClick={() => { deleteTrade(trade.id); setShowDeleteModal(false); toast.success("Trade deleted"); navigate("/journal"); }}>
                Delete Trade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
