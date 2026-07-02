import { useEffect, useState } from "react";

interface AgencyStats {
  username: string;
  referralCode: string;
  teamBalance: string;
  teamSize: number;
  newRegistrations: number;
  totalTopUp: string;
  totalWithdrawal: string;
  totalBetAmount: string;
  numberOfBets: number;
  totalProfit: string;
  teamMotivationAchievement: number;
  teamIncentivesNotUpToPar: number;
}

interface Props {
  onBack: () => void;
  onShowQR: () => void;
  onUserList: () => void;
}

function QRIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-7 h-7">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="5" y="5" width="3" height="3" fill="white" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="white" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="white" stroke="none" />
      <path d="M14 14h3v3M17 17v3h3M14 17h1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatRow({ icon, label, value, arrow }: { icon: React.ReactNode; label: string; value: string | number; arrow?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
      {arrow && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 ml-1">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function AgencyCenterPage({ onBack, onShowQR, onUserList }: Props) {
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agency/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Agency center</h1>
      </div>

      <div
        className="relative px-5 pt-6 pb-8 flex flex-col items-center gap-3"
        style={{
          background: "linear-gradient(160deg, #0d1b3e 0%, #1a1060 50%, #2d0a6e 100%)",
          minHeight: 180,
          overflow: "hidden",
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(ellipse at 70% 30%, rgba(100,60,200,0.8) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(200,30,100,0.5) 0%, transparent 50%)",
          }}
        />
        <span className="relative text-white font-bold text-lg z-10">{stats?.username ?? "—"}</span>
        <div className="relative z-10 flex items-center gap-8 w-full justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold" style={{ color: "#f59e0b" }}>{loading ? "…" : stats?.teamBalance ?? "0.00"}</span>
            <span className="text-xs text-blue-200">Team Balance</span>
          </div>
          <button
            onClick={onShowQR}
            className="flex flex-col items-center gap-1 active:opacity-70"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/20" style={{ background: "rgba(255,255,255,0.1)" }}>
              <QRIcon />
            </div>
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold" style={{ color: "#f59e0b" }}>{loading ? "…" : stats?.teamSize ?? 0}</span>
            <span className="text-xs text-blue-200">Team Size</span>
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-md px-4 py-4 flex gap-2 z-10 relative">
        {[
          {
            label: "Personal Report",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#f59e0b" />
                <path d="M7 12h10M7 8h10M7 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            label: "Team Report",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#f59e0b" />
                <path d="M7 17v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            label: "User List",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#f59e0b" />
                <circle cx="9" cy="9" r="2" stroke="white" strokeWidth="1.6" />
                <path d="M5 17v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M15 7h4M15 11h4M15 15h4" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ),
          },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.label === "User List" ? onUserList : undefined}
            className="flex-1 flex flex-col items-center gap-2 active:opacity-70"
          >
            {item.icon}
            <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {[
          {
            label: "New registration(30 days)",
            value: loading ? "…" : stats?.newRegistrations ?? 0,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/></svg>,
          },
          {
            label: "Total top-up(30 days)",
            value: loading ? "…" : stats?.totalTopUp ?? "0",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8" strokeLinecap="round"/></svg>,
          },
          {
            label: "Total withdrawal(30 days)",
            value: loading ? "…" : stats?.totalWithdrawal ?? "0",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 16V8" strokeLinecap="round"/></svg>,
          },
          {
            label: "Total bet amount of last 30 days",
            value: loading ? "…" : stats?.totalBetAmount ?? "0",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round"/></svg>,
          },
          {
            label: "The numbers of bet in 30 days",
            value: loading ? "…" : stats?.numberOfBets ?? 0,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round"/></svg>,
          },
          {
            label: "The total profit(30 days)",
            value: loading ? "…" : stats?.totalProfit ?? "0",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 7 22 7 22 13" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          },
          {
            label: "Team Motivation Achievement",
            value: loading ? "…" : stats?.teamMotivationAchievement ?? 0,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>,
          },
          {
            label: "Team incentives not up to par",
            value: loading ? "…" : stats?.teamIncentivesNotUpToPar ?? 0,
            arrow: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>,
          },
        ].map((row) => (
          <StatRow key={row.label} icon={row.icon} label={row.label} value={row.value} arrow={row.arrow} />
        ))}
      </div>
    </div>
  );
}
