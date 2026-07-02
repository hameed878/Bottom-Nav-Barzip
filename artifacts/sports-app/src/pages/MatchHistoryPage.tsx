import { useEffect, useState } from "react";

type TabKey = "today" | "yesterday" | "7days";

interface MatchResult {
  id: number;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchDate: string;
  matchTime: string;
  homeScore?: number;
  awayScore?: number;
  halfHomeScore?: number;
  halfAwayScore?: number;
}

interface Props {
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
        className="w-10 h-10 object-contain rounded-full bg-white border border-gray-100"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: c }}>
      {initials}
    </div>
  );
}

function dateStrForTab(tab: TabKey): string {
  const d = new Date();
  if (tab === "yesterday") d.setDate(d.getDate() - 1);
  if (tab === "7days") d.setDate(d.getDate() - 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function MatchHistoryPage({ onBack }: Props) {
  const [tab, setTab] = useState<TabKey>("today");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const date = dateStrForTab(tab);
    fetch(`/api/fixtures?date=${date}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          const mapped: MatchResult[] = (d.fixtures ?? []).map((f: any) => ({
            id: f.id,
            leagueName: f.league?.name ?? "Unknown League",
            homeTeam: f.homeTeam?.name ?? "Home",
            awayTeam: f.awayTeam?.name ?? "Away",
            homeTeamLogo: f.homeTeam?.logo ?? "",
            awayTeamLogo: f.awayTeam?.logo ?? "",
            matchDate: f.date?.split("T")[0] ?? date,
            matchTime: f.date ? new Date(f.date).toTimeString().slice(0, 8) : "–",
            homeScore: f.goals?.home ?? undefined,
            awayScore: f.goals?.away ?? undefined,
            halfHomeScore: f.score?.halftime?.home ?? undefined,
            halfAwayScore: f.score?.halftime?.away ?? undefined,
          }));
          setMatches(mapped);
        } else {
          setError(d.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [tab]);

  const grouped = matches.reduce<Record<string, MatchResult[]>>((acc, m) => {
    const key = m.leagueName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Results</h1>
      </div>

      <div className="flex bg-white border-b border-gray-100">
        {(["today", "yesterday", "7days"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === t ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"
            }`}
          >
            {t === "today" ? "Today" : t === "yesterday" ? "Yesterday" : "7 Days"}
          </button>
        ))}
      </div>

      <div className="flex-1 pb-8">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="mx-4 mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="text-sm font-bold text-amber-700 mb-1">⚠️ API Key Required</p>
            <p className="text-xs text-gray-500">Add your FOOTBALL_API_KEY to load match results.</p>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16 text-gray-200">
              <circle cx="32" cy="32" r="28" fill="currentColor" />
              <path d="M20 32h24M32 20v24" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-gray-400">No results found</p>
          </div>
        )}

        {!loading && !error && Object.entries(grouped).map(([league, ms]) => (
          <div key={league}>
            <div className="bg-gray-100 px-4 py-2 text-center">
              <span className="text-xs font-bold text-gray-700">{league}</span>
            </div>
            {ms.map((m) => (
              <div key={m.id} className="bg-white mx-0 mb-px px-4 py-3 border-b border-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{m.matchDate}</span>
                  <span>{m.matchTime}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <TeamLogo name={m.homeTeam} logo={m.homeTeamLogo} />
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{m.homeTeam}</span>
                  </div>
                  <div className="flex flex-col items-center px-3">
                    {m.homeScore !== undefined && m.awayScore !== undefined ? (
                      <span className="text-lg font-bold text-gray-800">
                        {m.homeScore}-{m.awayScore}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-gray-300">VS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <TeamLogo name={m.awayTeam} logo={m.awayTeamLogo} />
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{m.awayTeam}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-50 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Halftime score</span>
                    <span className="font-semibold text-gray-700">
                      {m.halfHomeScore !== undefined && m.halfAwayScore !== undefined
                        ? `${m.halfHomeScore}-${m.halfAwayScore}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Full time score</span>
                    <span className="font-semibold text-gray-700">
                      {m.homeScore !== undefined && m.awayScore !== undefined
                        ? `${m.homeScore}-${m.awayScore}`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
