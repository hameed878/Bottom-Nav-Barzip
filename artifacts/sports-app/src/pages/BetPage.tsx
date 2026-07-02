import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Bet {
  id: number;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  matchDate: string;
  matchTime: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  selectedScore: string;
  oddsValue: string;
  stakePkr: string;
  estimatedProfit: string;
  orderId: string;
  status: string;
  createdAt: string;
}

function TeamLogo({ name, logo }: { name: string; logo: string }) {
  const [err, setErr] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ["#e74c3c", "#2980b9", "#27ae60", "#8e44ad", "#f39c12"];
  const c = colors[name.split("").reduce((a, x) => a + x.charCodeAt(0), 0) % colors.length];
  if (!err && logo) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setErr(true)}
        className="w-8 h-8 object-contain rounded-full bg-white border border-gray-200"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: c }}>
      {initials}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface CancelAlertProps {
  bet: Bet;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function CancelAlert({ bet, onConfirm, onClose, loading }: CancelAlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[340px] overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff3e0" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={2} className="w-5 h-5">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Cancel Order?</p>
              <p className="text-xs text-gray-400 mt-0.5">Order #{bet.orderId.slice(-10)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">{bet.homeTeam} VS {bet.awayTeam}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Stake</span>
              <span className="text-sm font-bold" style={{ color: "#2563eb" }}>PKR {parseFloat(bet.stakePkr).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Est. Profit</span>
              <span className="text-sm font-bold" style={{ color: "#16a34a" }}>{parseFloat(bet.estimatedProfit).toFixed(3)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mb-4">
            Cancelling will refund your stake of{" "}
            <span className="font-bold text-gray-700">PKR {parseFloat(bet.stakePkr).toFixed(2)}</span> back to your balance.
          </p>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 text-sm font-semibold text-gray-500 border-r border-gray-100 active:bg-gray-50"
          >
            Keep Bet
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-4 text-sm font-bold text-white active:opacity-80 disabled:opacity-50"
            style={{ background: "#f97316" }}
          >
            {loading ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BetPage() {
  const { refreshUser } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Bet | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBets = () => {
    setLoading(true);
    fetch("/api/bets", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setBets(data.bets); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBets(); }, []);

  const todayBets = bets.filter((b) => {
    const today = new Date().toISOString().split("T")[0];
    return b.createdAt.startsWith(today);
  });

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bets/${cancelTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setBets((prev) => prev.map((b) => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b));
        await refreshUser();
      }
    } catch {}
    finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f5f5f5" }}>
      {cancelTarget && (
        <CancelAlert
          bet={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}

      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-800">Bet</h1>
          <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
            Today's bet{" "}
            <span className="font-bold">{todayBets.filter((b) => b.status === "active").length}</span>
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{new Date().toISOString().split("T")[0]}</p>
      </div>

      {/* Bet list */}
      <div className="flex flex-col gap-3 px-3 pt-3 pb-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0f4ff" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={1.5} className="w-8 h-8">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">No bets yet</p>
            <p className="text-xs text-gray-300 text-center px-8">Place a bet on any match to see it here</p>
          </div>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* League + time header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-800 text-center mb-2">{bet.leagueName}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{bet.matchDate}</span>
                  <span>{bet.matchTime}</span>
                </div>

                {/* Teams row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <TeamLogo name={bet.homeTeam} logo={bet.homeTeamLogo} />
                    <span className="text-xs font-semibold text-gray-700">{bet.homeTeam}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 mx-2">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{bet.awayTeam}</span>
                    <TeamLogo name={bet.awayTeam} logo={bet.awayTeamLogo} />
                  </div>
                </div>

                {/* Score / odds */}
                <p className="text-center text-sm font-bold mt-2 text-gray-800">
                  Score {bet.selectedScore}{" "}
                  <span style={{ color: "#e74c3c" }}>@ {parseFloat(bet.oddsValue).toFixed(2)}%</span>
                </p>
              </div>

              {/* Order details */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Order Number</span>
                  <span className="text-xs font-semibold text-gray-700">{bet.orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Bet Date</span>
                  <span className="text-xs font-semibold text-gray-700">{formatDate(bet.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#2563eb" }}>Stake</span>
                  <span className="text-sm font-bold" style={{ color: "#2563eb" }}>
                    {parseFloat(bet.stakePkr).toFixed(1)}
                  </span>
                </div>

                {/* Profit + Cancel row */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#16a34a" }}>Estimated Profit</span>
                    <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
                      {parseFloat(bet.estimatedProfit).toFixed(3)}
                    </span>
                  </div>

                  {bet.status === "active" ? (
                    <button
                      onClick={() => setCancelTarget(bet)}
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold active:opacity-80"
                      style={{ background: "#f97316" }}
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <span
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={
                        bet.status === "cancelled"
                          ? { background: "#fee2e2", color: "#dc2626" }
                          : { background: "#dcfce7", color: "#166534" }
                      }
                    >
                      {bet.status === "cancelled" ? "Cancelled" : "Settled"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
