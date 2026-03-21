import { Home, Settings, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (["/new-trade", "/paywall"].includes(location.pathname) || location.pathname.startsWith("/trade/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2 transition-colors active:scale-[0.96]",
                isActive
                  ? "text-primary"
                  : "text-[hsl(0_0%_33%)] hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-body text-[10px] font-medium tracking-[0.04em]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
