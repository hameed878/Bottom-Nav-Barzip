import { useState, useEffect } from "react";
import type { Fixture } from "@/hooks/useFixtures";

interface OddRow {
  score: string;
  odds: string;
}

interface Props {
  fixture: Fixture;
  onBack: () => void;
  onBet: (odd: OddRow) => void;
}

type BetType = "full" | "half";

function generateOdds(seed: number, prefix: string): OddRow[] {
  const scores =
    prefix === "full"
      ? ["0-0","0-1","0-2","0-3","1-0","1-1","1-2","1-3","2-0","2-1","2-2","2-3","3-0","3-1","3-2","3-3"]
      : ["0-0","0-1","1-0","1-1","2-0","0-2","2-1","1-2"];

  return scores.map((s) => {
    const [a, b] = s.split("-").map(Number);
    const base = 2.0 + Math.abs(Math.sin((seed + a * 7 + b * 13) * 0.37)) * 3;
    return { score: s, odds: base.toFixed(2) + "%" };
  });
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
        className="w-14 h-14 object-contain rounded-full bg-white p-1 border border-gray-200 shadow"
      />
    );
  }
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow border border-gray-200"
      style={{ background: c }}
    >
      {initials}
    </div>
  );
}

function Countdown({ target }: { target: Date }) {
  const [diff, setDiff] = useState(Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");

  return (
    <span className="text-xl font-bold" style={{ color: "#e74c3c" }}>
      {h}:{m}:{s}
    </span>
  );
}

export default function MatchDetailPage({ fixture, onBack, onBet }: Props) {
  const [betType, setBetType] = useState<BetType>("full");

  const odds = generateOdds(fixture.id, betType);
  const fixtureDate = new Date(fixture.date);
  const dateStr = fixtureDate.toISOString().split("T")[0];
  const timeStr = fixtureDate.toTimeString().slice(0, 8);

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mr-3 text-gray-600 active:opacity-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center">Competition Details</h1>
        <div className="w-5" />
      </div>

      {/* Date & League */}
      <div className="text-center pt-3 pb-1">
        <p className="text-xs text-gray-400">( {dateStr} {timeStr} )</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{fixture.league.name}</p>
      </div>

      {/* Teams + Countdown */}
      <div className="flex items-center justify-around px-6 py-3">
        <div className="flex flex-col items-center gap-1">
          <TeamLogo name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
          <span className="text-xs text-gray-700 font-semibold text-center max-w-[80px] leading-tight">
            {fixture.homeTeam.name}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-bold" style={{ color: "#6b48ff" }}>VS</span>
          <Countdown target={fixtureDate} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <TeamLogo name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
          <span className="text-xs text-gray-700 font-semibold text-center max-w-[80px] leading-tight">
            {fixture.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Football field SVG */}
      <div className="mx-3 rounded-xl overflow-hidden shadow-sm" style={{ height: 140 }}>
        <svg viewBox="0 0 400 200" className="w-full h-full" style={{ background: "#2d8a4e" }}>
          {/* Pitch background */}
          <rect x="0" y="0" width="400" height="200" fill="#2d8a4e" />
          {/* Stripes */}
          {[0,1,2,3,4,5].map((i) => (
            <rect key={i} x={i * 67} y="0" width="33" height="200" fill="#2a7d45" />
          ))}
          {/* Outline */}
          <rect x="15" y="15" width="370" height="170" fill="none" stroke="white" strokeWidth="2" />
          {/* Center line */}
          <line x1="200" y1="15" x2="200" y2="185" stroke="white" strokeWidth="2" />
          {/* Center circle */}
          <circle cx="200" cy="100" r="35" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="100" r="3" fill="white" />
          {/* Left penalty area */}
          <rect x="15" y="60" width="60" height="80" fill="none" stroke="white" strokeWidth="2" />
          <rect x="15" y="75" width="25" height="50" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="68" cy="100" r="2.5" fill="white" />
          {/* Right penalty area */}
          <rect x="325" y="60" width="60" height="80" fill="none" stroke="white" strokeWidth="2" />
          <rect x="360" y="75" width="25" height="50" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="332" cy="100" r="2.5" fill="white" />
          {/* Goals */}
          <rect x="5" y="80" width="10" height="40" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x="385" y="80" width="10" height="40" fill="none" stroke="white" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Full / Half tabs */}
      <div className="flex mx-3 mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
        {(["full", "half"] as BetType[]).map((t) => (
          <button
            key={t}
            onClick={() => setBetType(t)}
            className="flex-1 py-2.5 text-sm font-bold transition-all capitalize"
            style={
              betType === t
                ? { background: "#6b48ff", color: "white", borderRadius: 12 }
                : { color: "#888" }
            }
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Odds list */}
      <div className="flex flex-col gap-0 px-3 mt-3 pb-6">
        {odds.map((odd) => (
          <div
            key={odd.score}
            className="flex items-center justify-between bg-white rounded-xl mb-2 px-4 py-3 shadow-sm border border-gray-50"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">{odd.score}</span>
              <span className="text-xs text-gray-400">Score betting</span>
            </div>
            <div className="flex flex-col items-center mx-4">
              <span className="text-sm font-bold" style={{ color: "#e74c3c" }}>{odd.odds}</span>
              <span className="text-xs text-gray-400">Odds</span>
            </div>
            <button
              onClick={() => onBet(odd)}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold active:opacity-80"
              style={{ background: "#6b48ff" }}
            >
              Orders can be made
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
