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
  onBack: () => void;
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
        className="w-12 h-12 object-contain rounded-full bg-white border border-gray-200 shadow-sm"
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
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

export default function BetSlipPage({ fixture, odd, onBack }: Props) {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const balance = parseFloat(user?.balancePkr ?? "0");

  const oddsNum = parseFloat(odd.odds);
  const amountNum = parseFloat(amount) || 0;
  const estimatedProfit = amountNum * (oddsNum / 100);

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
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-xl w-full max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#6b48ff" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-8 h-8">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-800">Order Placed!</p>
          <p className="text-sm text-gray-400 text-center">
            Your bet of <span className="font-bold text-gray-700">{amountNum.toFixed(2)} PKR</span> has been placed
            at <span className="font-bold" style={{ color: "#e74c3c" }}>{odd.odds}</span> odds.
          </p>
          <p className="text-sm text-gray-400 text-center">
            Estimated profit:{" "}
            <span className="font-bold" style={{ color: "#27ae60" }}>
              {estimatedProfit.toFixed(2)} PKR
            </span>
          </p>
          <button
            onClick={onBack}
            className="mt-2 w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "#2563eb" }}
          >
            Back to Match
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <button onClick={onBack} className="mr-3 text-gray-600 active:opacity-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center">Place Bet</h1>
        <div className="w-5" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">

        {/* Match card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">{dateStr} {timeStr}</span>
            <span className="text-xs text-gray-400 truncate max-w-[55%] text-right">{fixture.league.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-1 flex-1">
              <TeamLogo name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight max-w-[70px]">
                {fixture.homeTeam.name}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-sm font-bold" style={{ color: "#6b48ff" }}>VS</span>
              <span className="text-xs text-gray-400">
                Closing in: <ClosingCountdown seconds={60 * 18 + 38} />
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <TeamLogo name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight max-w-[70px]">
                {fixture.awayTeam.name}
              </span>
            </div>
          </div>
        </div>

        {/* Selected odds card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Score Betting</p>
              <p className="text-xl font-bold text-gray-800">{odd.score}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Odds</p>
              <p className="text-xl font-bold" style={{ color: "#e74c3c" }}>{odd.odds}</p>
            </div>
          </div>
        </div>

        {/* Profit calculator card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">Processing Fee</p>
            <p className="text-xs font-semibold text-gray-600">-0%</p>
          </div>

          <div className="flex items-end justify-between mb-3 pt-1 border-t border-gray-50">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Transaction Amount</p>
              <p className="text-lg font-bold text-gray-800">
                {amountNum > 0 ? amountNum.toFixed(2) : "Please Enter"}
              </p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs text-gray-400 mb-0.5">VIP earnings</p>
              <p className="text-sm font-semibold text-gray-600">
                x{oddsNum.toFixed(2)}% =
              </p>
            </div>
            <div className="text-right flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Estimated Profit</p>
              <p className="text-lg font-bold" style={{ color: "#27ae60" }}>
                {estimatedProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Enter amount..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500 bg-gray-50 mb-3"
            min="1"
            max={balance}
          />

          {error && (
            <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
          )}

          {/* Quick buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                const next = (parseFloat(amount) || 0) + 100;
                setAmount(String(Math.min(next, balance).toFixed(2)));
              }}
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-100"
            >
              +100
            </button>
            <button
              onClick={() => setAmount(String(balance.toFixed(2)))}
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-100"
            >
              All
            </button>
            <button
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white active:opacity-80"
              style={{ background: "#2563eb" }}
            >
              Customize
            </button>
            <button
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-500 active:bg-gray-100"
            >
              Recharge
            </button>
          </div>

          {/* Balance row */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-800">
              Account Balance:{" "}
              <span style={{ color: "#e74c3c" }}>{balance.toFixed(2)}</span>
            </p>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
              style={{ background: "#f97316" }}
            >
              <ClosingCountdown seconds={60 * 1 + 56} />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — always visible at bottom */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-base font-bold text-gray-600 active:opacity-70"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!amount || amountNum <= 0 || amountNum > balance || submitting}
          className="flex-1 py-4 rounded-2xl text-white text-base font-bold active:opacity-80 disabled:opacity-40 transition-opacity"
          style={{ background: "#2563eb" }}
        >
          {submitting ? "Placing…" : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
