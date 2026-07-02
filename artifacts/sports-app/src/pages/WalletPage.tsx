import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface WalletData {
  walletBalance: string;
  yesterdayRebate: string;
  cumulativeRebate: string;
  history: { id: number; level: number; bonusAmount: string; percentage: string; createdAt: string }[];
}

interface Subordinate {
  id: number;
  username: string;
  balancePkr: string;
  vipLevel: number;
}

interface VipRewardRecord {
  id: number;
  vipLevel: number;
  rewardRate: string;
  balanceSnapshot: string;
  rewardAmount: string;
  rewardedFor: string;
  createdAt: string;
}

interface Props {
  onBack: () => void;
  onRecharge: () => void;
}

type SubView = "home" | "transfer-self" | "transfer-sub" | "history" | "vip-history";

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Wraps every sub-view: fills the full screen, scrollable, dark gradient bg
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col min-h-screen overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a6b 35%, #0e3a8c 60%, #0a2560 80%, #1a1a3e 100%)" }}
    >
      {/* Decorative bg layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ top: 60, left: "50%", transform: "translateX(-50%)", width: 260, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(100,160,255,0.18) 0%, transparent 70%)" }} />
        <svg viewBox="0 0 200 200" className="absolute" style={{ right: -20, top: 80, width: 160, height: 160, opacity: 0.10 }} fill="white">
          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="4" fill="none" />
          <polygon points="100,30 115,70 160,70 126,95 140,140 100,115 60,140 74,95 40,70 85,70" fill="white" opacity="0.5" />
        </svg>
      </div>
      {/* Scrollable content */}
      <div className="relative z-10 flex flex-col flex-1 pb-10">
        {children}
      </div>
    </div>
  );
}

export default function WalletPage({ onBack, onRecharge }: Props) {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<SubView>("home");

  // Transfer-self
  const [transferAmount, setTransferAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Transfer-sub — username lookup flow
  const [subUsername, setSubUsername] = useState("");
  const [subLookupLoading, setSubLookupLoading] = useState(false);
  const [subLookupError, setSubLookupError] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subordinate | null>(null);

  // VIP
  const [vipRewards, setVipRewards] = useState<VipRewardRecord[]>([]);
  const [vipLevel, setVipLevel] = useState(0);
  const [vipRate, setVipRate] = useState(0);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/wallet/balance", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchVipStatus = () => {
    fetch("/api/vip/status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) { setVipLevel(d.vipLevel); setVipRate(d.ratePercent); } })
      .catch(() => {});
  };

  const fetchVipHistory = () => {
    fetch("/api/vip/history", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setVipRewards(d.rewards); })
      .catch(() => {});
  };

  useEffect(() => { fetchData(); fetchVipStatus(); }, []);

  const walletBal = parseFloat(data?.walletBalance ?? user?.walletBalance ?? "0");

  // ── Transfer Self ─────────────────────────────────────────
  const handleTransferSelf = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return;
    if (amt > walletBal) { setMessage({ text: "Insufficient wallet balance", ok: false }); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/wallet/transfer-self", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: String(amt) }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage({ text: `PKR ${amt.toFixed(2)} transferred to your main balance!`, ok: true });
        setTransferAmount("");
        await refreshUser();
        fetchData();
      } else {
        setMessage({ text: d.error ?? "Transfer failed", ok: false });
      }
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Lookup subordinate by username ────────────────────────
  const handleLookupSub = async () => {
    if (!subUsername.trim()) return;
    setSubLookupLoading(true);
    setSubLookupError("");
    setSelectedSub(null);
    try {
      const r = await fetch(`/api/wallet/lookup-subordinate?username=${encodeURIComponent(subUsername.trim())}`, {
        credentials: "include",
      });
      const d = await r.json();
      if (d.ok) {
        setSelectedSub(d.subordinate);
        setTransferAmount("");
        setMessage(null);
      } else {
        setSubLookupError(d.error ?? "Subordinate not found");
      }
    } catch {
      setSubLookupError("Network error. Please try again.");
    } finally {
      setSubLookupLoading(false);
    }
  };

  // ── Transfer to Subordinate ───────────────────────────────
  const handleTransferSub = async () => {
    if (!selectedSub) return;
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return;
    if (amt > walletBal) { setMessage({ text: "Insufficient wallet balance", ok: false }); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/wallet/transfer-subordinate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: selectedSub.id, amount: String(amt) }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage({ text: `PKR ${amt.toFixed(2)} sent to ${selectedSub.username}!`, ok: true });
        setTransferAmount("");
        setSelectedSub(null);
        setSubUsername("");
        fetchData();
      } else {
        setMessage({ text: d.error ?? "Transfer failed", ok: false });
      }
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    setSubView("home");
    setMessage(null);
    setTransferAmount("");
    setSelectedSub(null);
    setSubUsername("");
    setSubLookupError("");
  };

  // ──────────────────────────────────────────────────────────
  // VIP HISTORY
  // ──────────────────────────────────────────────────────────
  if (subView === "vip-history") {
    return (
      <Screen>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={goHome} className="text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path d="M18 12H6M12 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 className="text-base font-bold text-white">VIP Reward History</h1>
          <div className="w-8" />
        </div>

        {vipLevel > 0 && (
          <div className="mx-4 mb-3 rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}>
            <div>
              <p className="text-xs text-yellow-300 mb-0.5">Your Current VIP Level</p>
              <p className="text-xl font-bold text-white">VIP {vipLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-yellow-300 mb-0.5">Daily Reward Rate</p>
              <p className="text-xl font-bold text-yellow-400">{vipRate}%</p>
            </div>
          </div>
        )}

        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {vipRewards.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="text-3xl">🏆</span>
              <span className="text-white/70 text-sm font-semibold">No VIP rewards yet</span>
              <span className="text-white/40 text-xs text-center px-6">VIP rewards are credited daily between 12:00–1:00 AM based on your balance</span>
            </div>
          ) : vipRewards.map((r, i) => (
            <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${i !== vipRewards.length - 1 ? "border-b border-white/10" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-white/80 font-semibold">VIP {r.vipLevel} Reward ({parseFloat(r.rewardRate) * 100}%)</span>
                <span className="text-[10px] text-white/50">Balance: PKR {parseFloat(r.balanceSnapshot).toFixed(2)}</span>
                <span className="text-[10px] text-white/40">{r.rewardedFor}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#fbbf24" }}>+PKR {parseFloat(r.rewardAmount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  // ──────────────────────────────────────────────────────────
  // REBATE HISTORY
  // ──────────────────────────────────────────────────────────
  if (subView === "history") {
    return (
      <Screen>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={goHome} className="text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path d="M18 12H6M12 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 className="text-base font-bold text-white">Rebate History</h1>
          <div className="w-8" />
        </div>
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {!data || data.history.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <span className="text-white/50 text-sm">No rebate history yet</span>
              <span className="text-white/30 text-xs">Rebates appear when your subordinates place bets</span>
            </div>
          ) : data.history.map((h, i) => (
            <div key={h.id} className={`flex items-center justify-between px-4 py-3 ${i !== data.history.length - 1 ? "border-b border-white/10" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-white/70">Level {h.level} rebate ({h.percentage}%)</span>
                <span className="text-[10px] text-white/40">{formatDate(h.createdAt)}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#4ade80" }}>+PKR {parseFloat(h.bonusAmount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  // ──────────────────────────────────────────────────────────
  // TRANSFER SELF
  // ──────────────────────────────────────────────────────────
  if (subView === "transfer-self") {
    return (
      <Screen>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={goHome} className="text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path d="M18 12H6M12 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 className="text-base font-bold text-white">Transfer to Main Balance</h1>
          <div className="w-8" />
        </div>

        <div className="mx-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {/* Balance */}
          <div className="mb-5 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-xs text-white/60 mb-1">Wallet Balance (Available)</p>
            <p className="text-3xl font-bold text-white">PKR {walletBal.toFixed(2)}</p>
          </div>

          <p className="text-xs text-white/60 mb-2">Amount to Transfer</p>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => { setTransferAmount(e.target.value); setMessage(null); }}
            placeholder="Enter amount..."
            className="w-full rounded-xl px-4 py-3 text-base outline-none mb-3 font-bold"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
          />

          {/* Quick pct buttons */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => { setTransferAmount(((walletBal * pct) / 100).toFixed(2)); setMessage(null); }}
                className="py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                {pct}%
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center ${message.ok ? "text-green-400" : "text-red-400"}`}
              style={{ background: message.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${message.ok ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
              {message.ok ? "✓ " : "✗ "}{message.text}
            </div>
          )}

          <button
            onClick={handleTransferSelf}
            disabled={!transferAmount || parseFloat(transferAmount) <= 0 || submitting}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm disabled:opacity-40 active:scale-98 transition-all"
            style={{ background: "linear-gradient(90deg, #2563eb, #1d4ed8)" }}
          >
            {submitting ? "Processing…" : "Confirm Transfer"}
          </button>

          <p className="text-xs text-white/40 text-center mt-4">
            Funds move from your rebate wallet to your main betting balance instantly.
          </p>
        </div>
      </Screen>
    );
  }

  // ──────────────────────────────────────────────────────────
  // TRANSFER TO SUBORDINATE
  // ──────────────────────────────────────────────────────────
  if (subView === "transfer-sub") {
    return (
      <Screen>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={goHome} className="text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path d="M18 12H6M12 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 className="text-base font-bold text-white">Transfer to Subordinate</h1>
          <div className="w-8" />
        </div>

        <div className="flex flex-col gap-4 mx-4">

          {/* Wallet balance */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <p className="text-xs text-white/60 mb-1">Your Wallet Balance</p>
            <p className="text-2xl font-bold text-white">PKR {walletBal.toFixed(2)}</p>
          </div>

          {/* Username lookup */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <p className="text-xs text-white/60 mb-3 font-semibold">Enter Subordinate Username</p>
            <p className="text-[11px] text-white/40 mb-3">
              Only users who registered using your referral code can receive transfers.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={subUsername}
                onChange={(e) => { setSubUsername(e.target.value); setSubLookupError(""); if (selectedSub) setSelectedSub(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLookupSub(); }}
                placeholder="Type username…"
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none font-semibold"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
              />
              <button
                onClick={handleLookupSub}
                disabled={!subUsername.trim() || subLookupLoading}
                className="px-4 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all whitespace-nowrap"
                style={{ background: "linear-gradient(90deg, #2563eb, #1d4ed8)" }}
              >
                {subLookupLoading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : "Verify"}
              </button>
            </div>

            {/* Lookup error */}
            {subLookupError && (
              <div className="mt-3 px-3 py-2.5 rounded-xl text-xs text-red-400 font-semibold flex items-center gap-2"
                style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
                {subLookupError}
              </div>
            )}

            {/* Verified subordinate */}
            {selectedSub && (
              <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-3"
                style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.4)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                  {selectedSub.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedSub.username}</p>
                  <p className="text-[11px] text-green-400">✓ Verified subordinate · VIP {selectedSub.vipLevel}</p>
                </div>
                <button
                  onClick={() => { setSelectedSub(null); setSubUsername(""); setMessage(null); }}
                  className="text-white/40 hover:text-white/80 transition-colors p-1"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Amount + confirm — only shown after verification */}
          {selectedSub && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <p className="text-xs text-white/60 mb-2">Amount to Send to <span className="text-white font-bold">{selectedSub.username}</span></p>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => { setTransferAmount(e.target.value); setMessage(null); }}
                placeholder="Enter amount…"
                className="w-full rounded-xl px-4 py-3 text-base outline-none mb-3 font-bold"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
              />

              {/* Quick pct buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => { setTransferAmount(((walletBal * pct) / 100).toFixed(2)); setMessage(null); }}
                    className="py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {message && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center ${message.ok ? "text-green-400" : "text-red-400"}`}
                  style={{ background: message.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${message.ok ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                  {message.ok ? "✓ " : "✗ "}{message.text}
                </div>
              )}

              <button
                onClick={handleTransferSub}
                disabled={!transferAmount || parseFloat(transferAmount) <= 0 || submitting}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm disabled:opacity-40 active:scale-98 transition-all"
                style={{ background: "linear-gradient(90deg, #f97316, #ea580c)" }}
              >
                {submitting
                  ? "Sending…"
                  : `Send PKR ${parseFloat(transferAmount || "0").toFixed(2)} → ${selectedSub.username}`}
              </button>
            </div>
          )}
        </div>
      </Screen>
    );
  }

  // ──────────────────────────────────────────────────────────
  // HOME
  // ──────────────────────────────────────────────────────────
  return (
    <Screen>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onBack} className="text-white p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
            <path d="M18 12H6M12 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-white">Wallet</h1>
        <button onClick={() => setSubView("history")} className="flex flex-col items-center gap-0.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-5 h-5">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[9px] text-white/70">Billing Details</span>
        </button>
      </div>

      {/* Balance card */}
      <div
        className="mx-4 rounded-2xl p-4 mb-5"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🪙</span>
          <span className="text-sm font-bold text-white">
            Balance: PKR {loading ? "…" : parseFloat(data?.walletBalance ?? user?.walletBalance ?? "0").toFixed(2)}
          </span>
          <button onClick={fetchData} className="ml-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/70">
            PKR Yesterday's reward: {loading ? "…" : parseFloat(data?.yesterdayRebate ?? "0").toFixed(2)}
          </span>
          <span className="text-xs text-white/70">
            PKR Cumulative reward: {loading ? "…" : parseFloat(data?.cumulativeRebate ?? "0").toFixed(2)}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-[10px] text-white/40 leading-relaxed">
            This wallet accumulates rebate rewards from your subordinates' bets (L1: 5%, L2: 3%, L3: 1%). Transfer funds to your main balance or send to a subordinate.
          </p>
        </div>
      </div>

      {/* Action grid */}
      <div className="mx-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "transfer\n(subordinate)",
              onClick: () => { setSubView("transfer-sub"); setMessage(null); },
              icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                  <circle cx="16" cy="14" r="8" stroke="white" strokeWidth="2.5" fill="none" />
                  <path d="M4 36v-2a12 12 0 0 1 12-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="34" cy="20" r="6" stroke="white" strokeWidth="2" fill="none" />
                  <path d="M24 38v-1a10 10 0 0 1 10-10h0a10 10 0 0 1 10 10v1" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M28 10l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              label: "transfer\n(self)",
              onClick: () => { setSubView("transfer-self"); setMessage(null); },
              icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                  <circle cx="24" cy="14" r="10" stroke="white" strokeWidth="2.5" fill="none" />
                  <path d="M8 42v-2a16 16 0 0 1 16-16 16 16 0 0 1 16 16v2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 6l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              label: "recharge",
              onClick: onRecharge,
              icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                  <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" fill="none" />
                  <path d="M24 15v18M15 24h18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="24" cy="24" r="10" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                </svg>
              ),
            },
            {
              label: "rebate\nhistory",
              onClick: () => setSubView("history"),
              icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                  <rect x="8" y="10" width="32" height="28" rx="3" stroke="white" strokeWidth="2.5" fill="none" />
                  <path d="M14 20h20M14 28h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M20 36V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl py-6 active:opacity-80 transition-opacity"
              style={{ background: "rgba(30,80,180,0.55)", border: "1px solid rgba(100,150,255,0.3)", backdropFilter: "blur(4px)" }}
            >
              {item.icon}
              <span className="text-xs text-white font-medium text-center whitespace-pre-line leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* VIP Rewards — full width */}
        <button
          onClick={() => { fetchVipHistory(); setSubView("vip-history"); }}
          className="flex items-center justify-between px-6 py-4 rounded-2xl active:opacity-80 transition-opacity"
          style={{ background: "linear-gradient(90deg, rgba(120,80,10,0.7), rgba(180,120,10,0.6))", border: "1px solid rgba(245,158,11,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 shrink-0">
              <path d="M24 8 L38 15 L38 28 Q38 38 24 44 Q10 38 10 28 L10 15 Z" stroke="#fbbf24" strokeWidth="2.5" fill="rgba(245,158,11,0.2)" />
              <path d="M18 24 L22 28 L30 20" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-bold text-yellow-300">VIP Rewards</p>
              <p className="text-xs text-yellow-400/70">
                {vipLevel > 0 ? `VIP ${vipLevel} · ${vipRate}% daily reward` : "Deposit to unlock VIP level"}
              </p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={2.5} className="w-5 h-5 shrink-0">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </Screen>
  );
}
