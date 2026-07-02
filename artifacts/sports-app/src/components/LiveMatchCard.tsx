import { useState } from "react";
import type { Fixture } from "@/hooks/useFixtures";

interface Props {
  fixture: Fixture;
  onClick: () => void;
}

function TeamLogo({ name, logo, side }: { name: string; logo: string; side: "home" | "away" }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ["#e74c3c", "#2980b9", "#27ae60", "#8e44ad", "#f39c12", "#16a085"];
  const colorIdx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;

  if (!imgError && logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-gray-100"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow border border-gray-100"
      style={{ background: colors[colorIdx] }}
    >
      {initials}
    </div>
  );
}

export default function LiveMatchCard({ fixture, onClick }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(fixture.id)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dateObj = new Date(fixture.date);
  const dateStr = dateObj.toISOString().split("T")[0];
  const timeStr = dateObj.toTimeString().slice(0, 8);
  const isLive = fixture.status.short === "1H" || fixture.status.short === "2H" || fixture.status.short === "HT";

  return (
    <div
      className="bg-white mx-0 mt-2 rounded-xl shadow-sm overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
      onClick={onClick}
    >
      {/* ID bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ background: isLive ? "#e74c3c" : "#2563eb" }}
      >
        <span className="text-white text-xs font-semibold tracking-wide">
          ID: {fixture.id}
        </span>
        {isLive && (
          <span className="bg-white text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            LIVE {fixture.status.elapsed}'
          </span>
        )}
        <button
          onClick={handleCopy}
          className="text-white/80 hover:text-white transition-colors ml-auto"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* League */}
      <div className="px-3 pt-2 pb-0.5">
        <p className="text-center text-sm font-bold text-gray-800">{fixture.league.name}</p>
      </div>

      {/* Date / time */}
      <div className="flex justify-between items-center px-4 pb-1">
        <span className="text-xs text-gray-400">{dateStr}</span>
        {isLive ? (
          <span className="text-xs font-bold text-red-500">{fixture.goals.home} - {fixture.goals.away}</span>
        ) : (
          <span className="text-xs text-gray-400">{timeStr}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1 gap-2">
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} side="home" />
          <span className="text-sm font-semibold text-gray-800 leading-tight">{fixture.homeTeam.name}</span>
        </div>
        <span className="text-sm font-bold text-gray-400 shrink-0">VS</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold leading-tight text-right" style={{ color: "#6b48ff" }}>
            {fixture.awayTeam.name}
          </span>
          <TeamLogo name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} side="away" />
        </div>
      </div>
    </div>
  );
}
