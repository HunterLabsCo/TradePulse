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
        <p className="font-sans text-7xl font-medium text-[#8ec2dd]">404</p>
        <h1 className="mt-4 font-sans text-2xl font-medium text-[#d8e0d2]">Page not found</h1>
        <p className="mt-2 font-mono text-sm text-[#7a8a75]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 flex h-11 items-center rounded-[4px] bg-[#8ec2dd] px-6 font-sans text-sm font-medium text-[#0e1311] transition-transform active:scale-[0.97]"
        >
          Back to Home
        </button>
      </div>
    </MarketingLayout>
  );
};

export default NotFound;
