import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MarketingLayout from "@/components/MarketingLayout";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 — TradePulse";

    let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }
    const prev = robotsMeta.content;
    robotsMeta.content = "noindex, nofollow";

    return () => {
      document.title = "TradePulse — Never Lose a Trade to Bad Timing";
      robotsMeta!.content = prev;
    };
  }, []);

  return (
    <MarketingLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 flex h-11 items-center rounded-xl bg-primary px-6 font-display text-sm font-bold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          Back to Home
        </button>
      </div>
    </MarketingLayout>
  );
};

export default NotFound;
