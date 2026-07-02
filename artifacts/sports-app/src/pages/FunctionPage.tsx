import { useState } from "react";
import BetRecordPage from "@/pages/BetRecordPage";
import MatchHistoryPage from "@/pages/MatchHistoryPage";
import RebateCenterPage from "@/pages/RebateCenterPage";
import AgencyCenterPage from "@/pages/AgencyCenterPage";
import TradePage from "@/pages/TradePage";
import InvitationCenterPage from "@/pages/InvitationCenterPage";
import UserListPage from "@/pages/UserListPage";

type SubPage = "home" | "bet-record" | "match-record" | "rebate-center" | "agency-center" | "balance-details" | "message-center" | "agency-qr" | "agency-user-list";

const menuItems: { id: SubPage; label: string; iconBg: string; icon: React.ReactNode }[] = [
  {
    id: "bet-record",
    label: "Bet record",
    iconBg: "#ef4444",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#ef4444" />
        <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">$</text>
      </svg>
    ),
  },
  {
    id: "match-record",
    label: "Match record",
    iconBg: "#f59e0b",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#f59e0b" />
        <path d="M16 8l2 5h5l-4 3 1.5 5L16 18l-4.5 3 1.5-5-4-3h5z" fill="white" />
      </svg>
    ),
  },
  {
    id: "rebate-center",
    label: "Rebate Center",
    iconBg: "#10b981",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#10b981" />
        <rect x="8" y="11" width="16" height="10" rx="2" stroke="white" strokeWidth="1.8" fill="none" />
        <path d="M8 16h16" stroke="white" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2.5" fill="white" />
      </svg>
    ),
  },
  {
    id: "agency-center",
    label: "Agency center",
    iconBg: "#f97316",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#f97316" />
        <path d="M16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 28v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M22 8a3 3 0 0 1 0 5.5M10 8a3 3 0 0 0 0 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "balance-details",
    label: "Balance details",
    iconBg: "#ef4444",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#ef4444" />
        <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.8" fill="none" />
        <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">$</text>
      </svg>
    ),
  },
  {
    id: "message-center",
    label: "Message center",
    iconBg: "#ec4899",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="14" fill="#ec4899" />
        <path d="M9 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke="white" strokeWidth="1.6" fill="none" />
        <path d="M8 12l8 6 8-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function FunctionHome({ onNavigate }: { onNavigate: (page: SubPage) => void }) {
  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <div className="bg-white px-4 pt-10 pb-3 shadow-sm">
        <h1 className="text-base font-bold text-gray-800 text-center">Function</h1>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-4 text-left active:bg-gray-50 transition-colors ${i !== menuItems.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 shrink-0">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}

export default function FunctionPage() {
  const [subPage, setSubPage] = useState<SubPage>("home");
  const goHome = () => setSubPage("home");

  if (subPage === "bet-record") return <BetRecordPage onBack={goHome} />;
  if (subPage === "match-record") return <MatchHistoryPage onBack={goHome} />;
  if (subPage === "rebate-center") return <RebateCenterPage onBack={goHome} />;
  if (subPage === "agency-center") return <AgencyCenterPage onBack={goHome} onShowQR={() => setSubPage("agency-qr")} onUserList={() => setSubPage("agency-user-list")} />;
  if (subPage === "agency-qr") return <InvitationCenterPage onBack={() => setSubPage("agency-center")} />;
  if (subPage === "agency-user-list") return <UserListPage onBack={() => setSubPage("agency-center")} />;
  if (subPage === "balance-details") return <TradePage onBack={goHome} />;
  if (subPage === "message-center") {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
          <button onClick={goHome} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Message center</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
          <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5} className="w-14 h-14">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm text-gray-400">No messages yet</p>
        </div>
      </div>
    );
  }

  return <FunctionHome onNavigate={setSubPage} />;
}
