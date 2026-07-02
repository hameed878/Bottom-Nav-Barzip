import { TabType } from "@/App";

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
  {
    key: "home",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: "match",
    label: "Match",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 0 20M12 2a10 10 0 0 0 0 20" />
        <path d="M2 12h20" />
        <path d="M6.5 4.5C8 7 9 9.5 9 12s-1 5-2.5 7.5M17.5 4.5C16 7 15 9.5 15 12s1 5 2.5 7.5" />
      </svg>
    ),
  },
  {
    key: "function",
    label: "Function",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: "bet",
    label: "Bet",
    icon: null,
  },
  {
    key: "me",
    label: "Me",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-gray-200 z-50"
      style={{ maxWidth: 430 }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: isActive ? "#2563eb" : "#6b7280" }}
            >
              {tab.key === "bet" ? (
                <img
                  src="/voucher.png"
                  alt="Bet"
                  className="w-7 h-7 object-contain"
                  style={{
                    filter: isActive
                      ? "brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(1583%) hue-rotate(213deg) brightness(97%) contrast(95%)"
                      : "brightness(0) saturate(100%) invert(46%) sepia(8%) saturate(573%) hue-rotate(175deg) brightness(90%) contrast(85%)",
                  }}
                />
              ) : (
                tab.icon
              )}
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
