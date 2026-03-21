import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const chipDefault = "bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,27%)] text-[hsl(0,0%,67%)]";
const chipSelected = "bg-primary text-primary-foreground border border-primary";

export default function SettingsPage() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const deleteAllTrades = useTradeStore((s) => s.deleteAllTrades);
  const [displayName, setDisplayName] = useState("");
  const [defaultChain, setDefaultChain] = useState("SOL");

  function exportCSV() {
    const headers = "Token,Chain,Status,PnL,Entry Time,Exit Time\n";
    const rows = trades
      .map((t) => `${t.tokenName},${t.chain},${t.status},${t.finalPnl ?? ""},${t.entryTime},${t.exitTime ?? ""}`)
      .join("\n");
    downloadFile(headers + rows, "tradesnap-export.csv", "text/csv");
  }

  function exportJSON() {
    downloadFile(JSON.stringify(trades, null, 2), "tradesnap-export.json", "application/json");
  }

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.96] hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Settings</h1>
      </header>

      <div className="space-y-6 px-5">
        {/* Display Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Anon Trader"
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-[hsl(0,0%,27%)] outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Default Chain */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Default Chain</label>
          <div className="flex gap-2 flex-wrap">
            {["SOL", "ETH", "BASE", "BNB", "ARB"].map((chain) => (
              <button
                key={chain}
                onClick={() => setDefaultChain(chain)}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors active:scale-[0.96] ${
                  defaultChain === chain
                    ? chipSelected
                    : chipDefault
                }`}
              >
                {chain === "BNB" ? "BNB / BSC" : chain}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Subscription</p>
          <p className="mt-1 text-sm font-bold">Free Tier</p>
          <p className="text-[10px] text-muted-foreground">Connect a wallet to subscribe</p>
        </div>

        {/* Export */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Export Data</p>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card py-3 text-xs font-semibold active:scale-[0.97]"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card py-3 text-xs font-semibold active:scale-[0.97]"
            >
              <Download className="h-4 w-4" /> JSON
            </button>
          </div>
        </div>

        {/* Delete All */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[hsl(0,80%,40%)]/10 py-3 text-xs font-semibold text-[hsl(0,80%,40%)] active:scale-[0.97]">
              <Trash2 className="h-4 w-4" /> Delete All Data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete everything?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your trades and data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted text-foreground border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAllTrades}
                className="bg-[hsl(0,80%,40%)] text-white hover:bg-[hsl(0,80%,35%)]"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
