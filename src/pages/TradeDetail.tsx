import { useParams, useNavigate } from "react-router-dom";
import { Plus, LogOut, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTradeStore } from "@/lib/trade-store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExitModal } from "@/components/trade/ExitModal";
import { UpdateModal } from "@/components/trade/UpdateModal";
import { ExitHistory } from "@/components/trade/ExitHistory";
import { NotesSection } from "@/components/trade/NotesSection";
import { TradeSummary } from "@/components/trade/TradeSummary";
import { EmotionBadge } from "@/components/EmotionBadge";
import type { ExitEvent, TradeNote, EmotionalState } from "@/lib/sample-data";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { Pnl } from "@/components/design/Pnl";
import { Candles } from "@/components/design/Candles";
import { Waveform } from "@/components/design/Waveform";
import { AppSidebar } from "@/components/design/AppSidebar";
import { MobileTabBar } from "@/components/design/MobileTabBar";

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Mist-styled collapsible section
function MistSection({
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
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 border-b border-[#222a25] text-left">
        <Label>{title}</Label>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#7a8a75] transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// Field row for detail view
function DetailField({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="font-mono text-[10px] text-[#7a8a75] tracking-[0.1em] uppercase whitespace-nowrap">{label}</span>
      <span className="font-mono text-[12px] text-[#d8e0d2] text-right">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </span>
    </div>
  );
}

function UpdatesFeed({ updates }: { updates: TradeNote[] }) {
  if (updates.length === 0) {
    return <p className="font-mono text-[10.5px] text-[#7a8a75] italic">No updates logged yet.</p>;
  }
  return (
    <div className="space-y-3">
      {[...updates].reverse().map((n) => (
        <div key={n.id} className="border-l-2 border-[#8ec2dd] pl-3 bg-[#161c19] rounded-r-[4px] py-2.5 pr-3">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[10px] text-[#8ec2dd] tracking-[0.1em]">⚡ UPDATE</span>
            {n.sizeAdded && (
              <Pill color="#a8d4ad">+{n.sizeAdded} added</Pill>
            )}
          </div>
          <p className="font-sans text-[13px] text-[#d8e0d2] leading-[1.5] whitespace-pre-line">{n.text}</p>
          {n.emotions && n.emotions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {n.emotions.map((e) => <EmotionBadge key={e} emotion={e} />)}
            </div>
          )}
          <p className="mt-1.5 font-mono text-[10px] text-[#7a8a75]">
            {new Date(n.timestamp).toLocaleString()}
          </p>
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
  const [editLesson, setEditLesson] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  useEffect(() => {
    if (!trade) navigate("/journal");
  }, [trade, navigate]);

  if (!trade) return null;

  const isOpen = trade.status === "open";
  const isClosed = trade.status === "closed";
  const exitEvents = trade.exitEvents ?? [];
  const tradeNotes = trade.tradeNotes ?? [];
  const updateNotes = tradeNotes.filter((n) => n.noteType === "update");
  const directNotes = tradeNotes.filter((n) => n.noteType !== "update");
  const totalPercentClosed = exitEvents.reduce((s, e) => s + e.percentClosed, 0);
  const remainingPercent = Math.max(0, 100 - totalPercentClosed);
  const confirmationSignals = trade.confirmationSignals ?? [];

  // Compute index (simplified — just position in store)
  const allTrades = useTradeStore.getState().trades;
  const tradeIdx = allTrades.findIndex((t) => t.id === trade.id);

  const handleSaveExit = (event: ExitEvent) => {
    const freshTrade = useTradeStore.getState().getTradeById(trade.id);
    if (!freshTrade) return;
    const freshExitEvents = freshTrade.exitEvents ?? [];
    const newExitEvents = [...freshExitEvents, event];
    const updates: Record<string, any> = { exitEvents: newExitEvents };
    const newTotalClosed = newExitEvents.reduce((s, e) => s + e.percentClosed, 0);
    if (newTotalClosed >= 100 || event.exitType === "full-exit" || event.exitType === "moon-bag") {
      updates.status = "closed";
      updates.closedAt = new Date().toISOString();
      const totalWeight = newExitEvents.reduce((s, e) => s + e.percentClosed, 0);
      updates.finalPnl = totalWeight > 0
        ? newExitEvents.reduce((s, e) => s + e.pnlPercent * e.percentClosed, 0) / totalWeight
        : event.pnlPercent;
    }
    updateTrade(trade.id, updates);
    setShowExitModal(false);
    toast.success("Exit logged ✓");
    navigate("/journal");
  };

  const handleAddNote = (note: TradeNote) => {
    updateTrade(trade.id, { tradeNotes: [...tradeNotes, note] });
  };

  const handleSaveUpdate = (note: TradeNote, _emotions: EmotionalState[], sizeAdded?: string) => {
    const updates: Record<string, any> = { tradeNotes: [...tradeNotes, note] };
    if (sizeAdded) {
      const existing = trade.positionSize ?? "";
      const existingNum = parseFloat(existing);
      const addedNum = parseFloat(sizeAdded);
      if (!isNaN(existingNum) && !isNaN(addedNum)) {
        const chain = existing.replace(/[\d.]/g, "").trim() || trade.chain;
        updates.positionSize = `${(existingNum + addedNum).toFixed(2)} ${chain}`.trim();
      } else {
        updates.positionSize = existing ? `${existing} (+${sizeAdded})` : sizeAdded;
      }
    }
    updateTrade(trade.id, updates);
  };

  const handleSaveLesson = () => {
    if (!editLesson.trim()) return;
    updateTrade(trade.id, { reflectionLesson: editLesson.trim() });
    setSavingLesson(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0e1311]">
      <AppSidebar activePage="trade-detail" />

      <MobileTabBar />

      <div className="flex flex-col flex-1 pb-40">
        <div className="md:max-w-[720px] md:mx-auto w-full">

          {/* Back Row */}
          <div className="flex items-center justify-between pt-1.5 px-[22px] py-4">
            <button
              onClick={() => navigate("/journal")}
              className="bg-transparent text-[#8ec2dd] border border-[#222a25] py-[5px] px-2.5 font-mono text-[11px] rounded-[3px] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Back to journal"
            >
              ← journal
            </button>
            <div className="flex items-center gap-2">
              <Label>Entry №{String(tradeIdx + 1).padStart(2, "0")}</Label>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); }}
                className="ml-2 text-[#7a8a75] hover:text-[#e89a8a] transition-colors p-1"
                aria-label="Delete trade"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Hero */}
          <section className="pt-7 px-[22px]">
            <Label>{formatRelativeTime(trade.entryTime)} · {trade.chain}</Label>
            <div className="flex items-end justify-between gap-3 mt-2">
              <span className="font-sans text-[38px] font-medium text-[#d8e0d2] tracking-[-0.03em] leading-[0.95] truncate">
                {trade.tokenName}
              </span>
              <Pnl
                pnl={isClosed && trade.finalPnl !== undefined ? trade.finalPnl : null}
                size="lg"
              />
            </div>
            <p className="font-mono text-[11px] text-[#7a8a75] mt-1">
              {isOpen
                ? `open · entered ${trade.entryMarketCap ?? "—"}`
                : [
                    trade.exitPrice ? `exited $${trade.exitPrice}` : null,
                    `entered ${trade.entryMarketCap ?? "—"}`,
                  ].filter(Boolean).join(" · ")}
            </p>
            {/* Status badge */}
            <div className="mt-2 inline-flex">
              <Pill color={isOpen ? "#8ec2dd" : "#e89a8a"}>
                {isOpen ? "OPEN" : "CLOSED"}
              </Pill>
              {trade.isDemo && <span className="ml-2"><Pill color="#7a8a75">DEMO</Pill></span>}
            </div>
          </section>

          {/* Chart */}
          <div className="pt-[22px] px-[22px]">
            <Candles width={320} height={70} color="#a8d4ad" red="#e89a8a" />
            {/* TODO: wire to real OHLC data when available */}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-6 mx-[22px]" />

          {/* Voice Note */}
          <section className="px-[22px]">
            <div className="flex items-center gap-2 mb-3">
              <Label>Voice note</Label>
            </div>
            <div className="mb-3.5 opacity-70">
              <Waveform bars={36} color="#8ec2dd" height={20} width={2.5} gap={2.5} rounded active={false} />
            </div>
            {trade.entryTranscript ? (
              <p className="font-sans text-[15px] text-[#d8e0d2] leading-[1.6] italic">
                "{trade.entryTranscript}"
              </p>
            ) : (
              <p className="font-mono text-[10.5px] text-[#7a8a75] italic">No transcript recorded.</p>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-6 mx-[22px]" />

          {/* Lesson */}
          <section className="px-[22px]">
            <Label className="mb-2 block">Lesson</Label>
            {trade.reflectionLesson ? (
              <div className="py-3.5 px-4 border-l-2 border-[#8ec2dd] bg-[#161c19] font-sans text-[16px] text-[#d8e0d2] leading-[1.5] font-medium tracking-[-0.005em]">
                {trade.reflectionLesson}
              </div>
            ) : (
              <div className="py-3.5 px-4 border-l-2 border-[#222a25] bg-[#161c19]">
                {savingLesson ? (
                  <div className="flex gap-2">
                    <textarea
                      value={editLesson}
                      onChange={(e) => setEditLesson(e.target.value)}
                      placeholder="What did you learn?"
                      rows={2}
                      className="flex-1 font-sans text-[15px] text-[#d8e0d2] bg-transparent border-none outline-none resize-none leading-[1.5] placeholder:text-[#7a8a75]"
                      style={{ caretColor: "#8ec2dd" }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveLesson}
                      className="font-mono text-[11px] text-[#8ec2dd] border border-[#8ec2dd] rounded-[3px] px-2 py-1 self-end"
                    >
                      save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSavingLesson(true)}
                    className="font-sans text-[15px] text-[#7a8a75] italic"
                  >
                    What did you learn?
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-6 mx-[22px]" />

          {/* Trade Log sections */}
          <div className="px-[22px] space-y-0">
            <Label className="block mb-4">Trade log</Label>

            {isClosed && exitEvents.length > 0 && (
              <div className="mb-4">
                <TradeSummary exitEvents={exitEvents} entryTime={trade.entryTime} closedAt={trade.closedAt} />
              </div>
            )}

            {/* Entry details */}
            <MistSection title="Entry" defaultOpen>
              <div className="space-y-0.5">
                <DetailField label="Market Cap" value={trade.entryMarketCap} />
                <DetailField label="Entry Price" value={trade.entryPrice} />
                <DetailField label="Size" value={trade.positionSize} />
                <DetailField label="Setup" value={trade.setupType} />
                <DetailField label="Narrative" value={trade.narrativeType} />
                <DetailField label="Indicators" value={trade.indicatorsUsed} />
                <DetailField label="Session" value={trade.sessionType} />
                <DetailField label="Time" value={new Date(trade.entryTime).toLocaleString()} />
              </div>

              {confirmationSignals.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">Signals</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {confirmationSignals.map((sig) => (
                      <Pill key={sig} color="#8ec2dd">{sig}</Pill>
                    ))}
                    {trade.confirmationSignalOther && (
                      <Pill color="#7a8a75">{trade.confirmationSignalOther}</Pill>
                    )}
                  </div>
                </div>
              )}

              {trade.emotionalStateAtEntry.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">State</Label>
                  <div className="flex flex-wrap gap-1">
                    {trade.emotionalStateAtEntry.map((e) => <EmotionBadge key={e} emotion={e} />)}
                  </div>
                </div>
              )}

              {trade.quickTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {trade.quickTags.map((tag) => (
                    <Pill key={tag} color="#7a8a75">{tag}</Pill>
                  ))}
                </div>
              )}

              {trade.additionalNotes && (
                <div className="mt-4">
                  <Label className="mb-1 block">Notes</Label>
                  <p className="font-sans text-[13px] text-[#d8e0d2] leading-[1.5]">{trade.additionalNotes}</p>
                </div>
              )}
            </MistSection>

            <MistSection title={`Exit history (${exitEvents.length})`}>
              <ExitHistory events={exitEvents} />
            </MistSection>

            <MistSection title={`Updates (${updateNotes.length})`}>
              <UpdatesFeed updates={updateNotes} />
            </MistSection>

            <MistSection title={`Notes (${directNotes.length})`}>
              <NotesSection notes={tradeNotes} isOpen={isOpen} onAddNote={handleAddNote} />
            </MistSection>

            {trade.exitTime && (
              <MistSection title="Exit">
                <div className="space-y-0.5">
                  <DetailField label="Price" value={trade.exitPrice} />
                  <DetailField label="PnL" value={trade.finalPnl !== undefined ? `${trade.finalPnl > 0 ? "+" : ""}${trade.finalPnl.toFixed(2)}R` : undefined} />
                  <DetailField label="Method" value={trade.exitMethod} />
                  <DetailField label="Time" value={new Date(trade.exitTime).toLocaleString()} />
                </div>
                {trade.emotionalStateAtExit && trade.emotionalStateAtExit.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {trade.emotionalStateAtExit.map((e) => <EmotionBadge key={e} emotion={e} />)}
                  </div>
                )}
                {trade.exitTranscript && (
                  <p className="mt-3 font-sans text-[14px] text-[#d8e0d2] italic leading-[1.5] border-l-2 border-[#8ec2dd] pl-3">
                    "{trade.exitTranscript}"
                  </p>
                )}
              </MistSection>
            )}

            {trade.reflectionNote && (
              <MistSection title="Reflection">
                <p className="font-sans text-[13px] text-[#d8e0d2] leading-[1.5]">{trade.reflectionNote}</p>
              </MistSection>
            )}

            {/* Legacy updates */}
            {trade.updates.length > 0 && (
              <MistSection title={`Legacy updates (${trade.updates.length})`}>
                <div className="space-y-4">
                  {trade.updates.map((u) => (
                    <div key={u.id} className="border-l-2 border-[#222a25] pl-3">
                      <p className="font-mono text-[10px] text-[#7a8a75]">{new Date(u.timestamp).toLocaleString()}</p>
                      <p className="mt-1 font-sans text-[13px] text-[#d8e0d2] leading-[1.5]">{u.note}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {u.emotionalState.map((e) => <EmotionBadge key={e} emotion={e} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </MistSection>
            )}
          </div>
        </div>
      </div>

      {/* Open trade CTA buttons — lifted above the mobile tab bar */}
      {isOpen && (
        <div className="fixed bottom-[96px] md:bottom-6 left-[22px] right-[22px] md:left-[calc(220px+22px)] z-30 flex gap-3">
          <button
            onClick={() => setShowUpdateModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 bg-[#161c19] border border-[#222a25] rounded-[4px] font-mono text-[12px] text-[#d8e0d2] hover:border-[#8ec2dd] transition-colors"
          >
            <Plus className="h-4 w-4" /> Update
          </button>
          <button
            onClick={() => setShowExitModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 py-3 bg-[rgba(232,154,138,0.08)] border border-[rgba(232,154,138,0.3)] rounded-[4px] font-mono text-[12px] text-[#e89a8a] hover:bg-[rgba(232,154,138,0.15)] transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log Exit
          </button>
        </div>
      )}

      <ExitModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        remainingPercent={remainingPercent}
        onSave={handleSaveExit}
      />
      <UpdateModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        onSave={handleSaveUpdate}
        chain={trade.chain}
      />

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm bg-[#161c19] border-[#222a25]">
          <DialogHeader>
            <DialogTitle className="font-sans font-medium text-[#d8e0d2]">Delete this trade?</DialogTitle>
            <DialogDescription className="font-mono text-[11px] text-[#7a8a75]">
              This permanently deletes this trade and all its data. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <p className="font-mono text-[10px] text-[#7a8a75] mb-1.5">
                Type <span className="text-[#d8e0d2]">DELETE</span> to confirm
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-9 font-mono text-sm bg-[#0a0e0c] border-[#222a25] text-[#d8e0d2] focus-visible:ring-[#e89a8a] focus-visible:border-[#e89a8a]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-[#222a25] text-[#7a8a75] hover:bg-[#222a25] hover:text-[#d8e0d2]"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#e89a8a] text-[#0e1311] hover:bg-[#e89a8a]/80"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={() => {
                  deleteTrade(trade.id);
                  setShowDeleteModal(false);
                  toast.success("Trade deleted");
                  navigate("/journal");
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
