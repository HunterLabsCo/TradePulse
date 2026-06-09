import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useSubscriptionStore } from "@/lib/subscription-store";

interface AppSidebarProps {
  activePage: "home" | "journal" | "settings" | "new-trade" | "trade-detail";
}

function shortenWallet(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function getInitials(wallet: string | null): string {
  if (wallet) return wallet.slice(0, 2).toUpperCase();
  return "DG";
}

function MicIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#0e1311" />
      <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" stroke="#0e1311" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function AppSidebar({ activePage }: AppSidebarProps) {
  const navigate = useNavigate();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const connectedWallet = useSubscriptionStore((s) => s.connectedWallet);

  const initials = getInitials(connectedWallet);

  const navItems = [
    { label: "Home", path: "/app", key: "home" },
    { label: "Journal", path: "/journal", key: "journal" },
    { label: "Lessons", path: "/journal", key: "lessons" },   // TODO: dedicated route
    { label: "Setups", path: "/journal", key: "setups" },     // TODO: dedicated route
    { label: "Settings", path: "/settings", key: "settings" },
  ];

  return (
    <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col gap-6 h-screen sticky top-0 bg-[#0a0e0c] border-r border-[#222a25] p-6">
      <Logo size={17} />

      {/* Speak a trade CTA */}
      <button
        onClick={() => navigate("/new-trade")}
        className="flex items-center justify-center gap-2 w-full bg-[#8ec2dd] text-[#0e1311] py-[11px] px-[14px] rounded-[4px] font-sans font-medium text-[14px]"
        aria-label="Speak a trade"
      >
        <MicIcon size={14} />
        Speak a trade
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ label, path, key }) => {
          const active = key === activePage;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2.5 py-[9px] px-3 rounded-[4px] font-sans text-[14px] tracking-[-0.005em] w-full text-left transition-colors ${
                active
                  ? "bg-[#161c19] text-[#8ec2dd] font-medium"
                  : "bg-transparent text-[#7a8a75] font-normal hover:text-[#d8e0d2]"
              }`}
            >
              <span
                className={`inline-block w-[5px] h-[5px] rounded-[3px] flex-shrink-0 ${
                  active ? "bg-[#8ec2dd]" : "bg-transparent"
                }`}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2.5">
        <div className="w-8 h-8 flex-shrink-0 rounded-[4px] flex items-center justify-center text-[#8ec2dd] font-mono text-[11px] font-medium border border-[#8ec2dd]">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-sans text-[13px] font-medium text-[#d8e0d2] truncate">
            {connectedWallet ? shortenWallet(connectedWallet) : "Trader"}
          </span>
          {isPro ? (
            <span className="font-mono text-[9.5px] text-[#a8d4ad]">● PRO</span>
          ) : (
            <span className="font-mono text-[9.5px] text-[#7a8a75]">FREE</span>
          )}
        </div>
      </div>
    </aside>
  );
}
