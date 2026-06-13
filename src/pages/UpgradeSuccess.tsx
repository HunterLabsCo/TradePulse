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
        colors: ["#8ec2dd", "#a8d4ad", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#8ec2dd", "#a8d4ad", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0e1311] px-8 text-center">
      <h1 className="mb-2 font-sans text-[36px] font-medium text-[#8ec2dd] leading-none">
        You're Pro 🎉
      </h1>
      <p className="mb-6 font-mono text-[13px] text-[#7a8a75] max-w-[280px]">
        TradePulse Pro — Lifetime access unlocked
      </p>

      {txSignature && (
        <a
          href={`https://solscan.io/tx/${txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 rounded-[4px] bg-[#161c19] border border-[#222a25] px-4 py-3 font-mono text-[12px] text-[#8ec2dd] underline decoration-[rgba(142,194,221,0.3)] underline-offset-2"
        >
          Tx: {truncateAddress(txSignature)}
        </a>
      )}

      <button
        onClick={() => navigate("/app")}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-[6px] bg-[#8ec2dd] py-4 font-sans text-[15px] font-medium text-[#0e1311] shadow-[0_8px_32px_-8px_rgba(142,194,221,0.4)] transition-all active:scale-[0.97]"
      >
        Start Trading
      </button>
    </div>
  );
}
