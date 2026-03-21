import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Paywall() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.96] hover:bg-card"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <Wallet className="mb-6 h-14 w-14 text-primary" />

      <h1 className="mb-2 text-center text-xl font-bold">You've used your 20 free trades</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground leading-relaxed max-w-[280px]">
        Subscribe to keep logging trades and tracking your edge.
      </p>

      <div className="mb-8 w-full max-w-xs space-y-2 rounded-xl bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Monthly (SOL)</span>
          <span className="text-sm font-bold">[MONTHLY_PRICE_SOL] SOL</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Monthly (ETH)</span>
          <span className="text-sm font-bold">[MONTHLY_PRICE_ETH] ETH</span>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {[
          { label: "Connect Phantom", color: "bg-[#ab9ff2]" },
          { label: "Connect Solflare", color: "bg-[#fc8c3c]" },
          { label: "Connect MetaMask", color: "bg-[#f6851b]" },
        ].map(({ label, color }) => (
          <button
            key={label}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl ${color} py-4 text-sm font-bold text-white shadow-lg active:scale-[0.97]`}
          >
            <Wallet className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
