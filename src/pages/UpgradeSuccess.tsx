import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { truncateAddress } from "@/lib/subscription-utils";

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const txSignature = (location.state as any)?.txSignature || "";

  useEffect(() => {
    // Fire confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#39FF14", "#4FC3F7", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#39FF14", "#4FC3F7", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <h1 className="mb-2 font-display text-[36px] font-[800] text-primary leading-none">
        You're Pro 🎉
      </h1>
      <p className="mb-6 font-body text-[15px] font-light text-muted-foreground max-w-[280px]">
        TradePulse Pro — Lifetime access unlocked
      </p>

      {txSignature && (
        <a
          href={`https://solscan.io/tx/${txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 rounded-xl bg-card border border-border px-4 py-3 font-mono-label text-[12px] text-[hsl(var(--blue-accent))] underline decoration-[hsl(var(--blue-accent)/0.3)] underline-offset-2"
        >
          Tx: {truncateAddress(txSignature)}
        </a>
      )}

      <button
        onClick={() => navigate("/")}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display text-[15px] font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--green-primary)/0.3)] transition-all active:scale-[0.97]"
      >
        Start Trading
      </button>
    </div>
  );
}
