import { useState } from "react";

interface MatchCardProps {
  id: string;
  league: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
}

function TeamLogo({ name, color }: { name: string; color: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

export default function MatchCard({
  id,
  league,
  date,
  time,
  homeTeam,
  awayTeam,
  homeColor,
  awayColor,
}: MatchCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white mx-2 mt-2 rounded-xl shadow-sm overflow-hidden">
      {/* ID bar */}
      <div className="flex items-center gap-2 bg-blue-600 px-3 py-1.5">
        <span className="text-white text-xs font-semibold tracking-wide">
          ID: {id}
        </span>
        <button
          onClick={handleCopy}
          className="text-white/80 hover:text-white transition-colors"
          title="Copy ID"
        >
          {copied ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* League name */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-center text-sm font-bold text-gray-800">{league}</p>
      </div>

      {/* Date and time */}
      <div className="flex justify-between items-center px-4 pb-1">
        <span className="text-xs text-gray-400">{date}</span>
        <span className="text-xs text-gray-400">{time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1 gap-2">
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo name={homeTeam} color={homeColor} />
          <span className="text-sm font-semibold text-gray-800 leading-tight">
            {homeTeam}
          </span>
        </div>

        <span className="text-sm font-bold text-gray-500 shrink-0">VS</span>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-blue-600 leading-tight text-right">
            {awayTeam}
          </span>
          <TeamLogo name={awayTeam} color={awayColor} />
        </div>
      </div>
    </div>
  );
}
