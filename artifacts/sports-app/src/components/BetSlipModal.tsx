import { useState, useEffect } from "react";
import type { Fixture } from "@/hooks/useFixtures";
import { useAuth } from "@/context/AuthContext";

interface OddRow {
  score: string;
  odds: string;
}

interface Props {
  fixture: Fixture;
  odd: OddRow;
  onClose: () => void;
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
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
      style={{ background: c }}
    >
      {initials}
    </div>
  );
}

function ClosingCountdown({ seconds: initialSecs }: { seconds: number }) {
  const [secs, setSecs] = useState(initialSecs);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return <span>{m}:{s}</span>;
}

export default function BetSlipModal({ fixture, odd, onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const balance = parseFloat(user?.balancePkr ?? "0");
  const oddsNum = parseFloat(odd.odds) / 100;
  const amountNum = parseFloat(amount) || 0;
  const estimatedProfit = amountNum * oddsNum;

  const fixtureDate = new Date(fixture.date);
  const dateStr = fixtureDate.toISOString().split("T")[0];
  const timeStr = fixtureDate.toTimeString().slice(0, 8);

  const handleAmountChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > balance) {
      setAmount(String(balance.toFixed(2)));
    } else {
      setAmount(val);
    }
  };

  const handleConfirm = async () => {
    if (!amount || amountNum <= 0) return;
    if (amountNum > balance) {
      setError("Amount exceeds your balance");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: fixture.id,
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          leagueName: fixture.league.name,
          matchDate: dateStr,
          matchTime: timeStr,
          homeTeamLogo: fixture.homeTeam.logo ?? "",
          awayTeamLogo: fixture.awayTeam.logo ?? "",
          selectedScore: odd.score,
          oddsValue: odd.odds,
          stakePkr: amountNum,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshUser();
        setConfirmed(true);
        setTimeout(() => { onClose(); }, 1500);
      } else {
        setError(data.error ?? "Failed to place bet");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 mx-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#6b48ff" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-base font-bold text-gray-800">Order Placed!</p>
          <p className="text-sm text-gray-400 text-center">Your bet of <span className="font-bold text-gray-700">{amountNum.toFixed(2)}</span> has been placed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      {/* Fixed height so flex children distribute correctly; overflow:hidden clips to border-radius */}
      <div
        className="bg-white w-full flex flex-col"
        style={{ maxWidth: 430, borderRadius: "24px 24px 0 0", height: "min(680px, 92svh)", overflow: "hidden" }}
      >
        {/* Scrollable content — flex:1 + minHeight:0 makes it shrink and scroll */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* Top info */}
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-gray-900">{odd.score}</span>
                <span className="text-xs text-gray-400">@</span>
                <span className="text-sm font-bold" style={{ color: "#e74c3c" }}>{odd.odds}</span>
              </div>
              <span className="text-[11px] text-gray-400">{dateStr} {timeStr}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <TeamLogo name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
              <span className="text-[11px] text-gray-500 font-medium truncate max-w-[80px]">{fixture.homeTeam.name}</span>
              <span className="text-[11px] font-bold text-gray-400 mx-0.5">VS</span>
              <span className="text-[11px] text-gray-500 font-medium truncate max-w-[80px]">{fixture.awayTeam.name}</span>
              <TeamLogo name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-gray-400 truncate max-w-[55%]">{fixture.league.name}</span>
              <span className="text-[11px] text-gray-400">
                Closing in: <ClosingCountdown seconds={60 * 18 + 38} />
              </span>
            </div>
          </div>

          {/* Bet details */}
          <div className="px-4 py-3">
            <p className="text-right text-[11px] text-gray-400 mb-1.5">Processing Fee -0%</p>

            <div className="flex items-end justify-between mb-1">
              <span className="text-[11px] text-gray-500">Transaction Amount</span>
              <span className="text-[11px] text-gray-500">VIP earnings</span>
              <span className="text-[11px] text-gray-500 text-right">Estimated<br/>Profit</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-base font-bold text-gray-700">
                  {amountNum > 0 ? amountNum.toFixed(2) : "Please Enter"}
                </p>
              </div>
              <span className="text-xs text-gray-500 mx-3">x{(oddsNum * 100).toFixed(0)}%=</span>
              <span className="text-lg font-bold" style={{ color: "#27ae60" }}>
                {estimatedProfit.toFixed(2)}
              </span>
            </div>

            {/* Amount input */}
            <div className="relative mb-2.5">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount..."
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 bg-gray-50"
                min="1"
                max={balance}
              />
            </div>

            {error && <p className="text-red-500 text-[11px] mb-2 text-center">{error}</p>}

            {/* Quick buttons */}
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => {
                  const next = (parseFloat(amount) || 0) + 100;
                  setAmount(String(Math.min(next, balance).toFixed(2)));
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 active:bg-gray-100"
              >
                +100
              </button>
              <button
                onClick={() => setAmount(String(balance.toFixed(2)))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 active:bg-gray-100"
              >
                All
              </button>
              <button
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-white active:opacity-80"
                style={{ background: "#2563eb" }}
              >
                Customize
              </button>
              <button
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 active:bg-gray-100"
              >
                Recharge
              </button>
            </div>

            {/* Balance + countdown row */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-800">
                Account Balance:{" "}
                <span style={{ color: "#e74c3c" }}>{balance.toFixed(2)}</span>
              </p>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-md"
                style={{ background: "#f97316" }}
              >
                <ClosingCountdown seconds={60 * 1 + 56} />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons — flexShrink:0 so they're never squished out of view */}
        <div className="flex gap-3 px-4 pb-6 pt-3 bg-white border-t border-gray-100" style={{ flexShrink: 0 }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 active:opacity-80"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!amount || amountNum <= 0 || amountNum > balance || submitting}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold active:opacity-80 disabled:opacity-50 transition-opacity"
            style={{ background: "#2563eb" }}
          >
            {submitting ? "Placing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
