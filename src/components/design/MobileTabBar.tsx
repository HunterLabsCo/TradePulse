import { useNavigate } from "react-router-dom";

type TabKey = "home" | "journal" | "settings";

const TABS: { label: TabKey; path: string }[] = [
  { label: "home", path: "/app" },
  { label: "journal", path: "/journal" },
  { label: "settings", path: "/settings" },
];

export function MobileTabBar({ active }: { active?: TabKey }) {
  const navigate = useNavigate();
  return (
    <nav className="md:hidden fixed left-0 right-0 bottom-0 bg-[#161c19] border-t border-[#222a25] py-3 px-5 pb-[26px] flex justify-around z-50">
      {TABS.map(({ label, path }) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 font-mono min-w-[44px] min-h-[44px] justify-center ${
              isActive ? "text-[#8ec2dd]" : "text-[#7a8a75]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`w-[5px] h-[5px] rounded-[3px] ${
                isActive ? "bg-[#8ec2dd]" : "bg-transparent border border-[#7a8a75]"
              }`}
            />
            <span className="text-[11px] font-medium tracking-[0.04em]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
