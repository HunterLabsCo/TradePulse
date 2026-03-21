import { ArrowLeft, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NewTrade() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">New Trade — Entry</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 pb-16">
        <p className="text-center text-sm text-muted-foreground leading-relaxed max-w-[260px]">
          Tap the mic and describe your trade entry naturally. We'll parse everything automatically.
        </p>

        <button className="group relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/15 transition-all active:scale-[0.93]">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
            <Mic className="h-8 w-8 text-primary-foreground" />
          </div>
        </button>

        <p className="text-xs text-muted-foreground">Tap to record</p>
      </div>
    </div>
  );
}
