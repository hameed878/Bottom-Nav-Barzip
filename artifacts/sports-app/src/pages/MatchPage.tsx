import { useState, useMemo } from "react";
import { useFixtures, todayStr, tomorrowStr, type Fixture } from "@/hooks/useFixtures";
import LiveMatchCard from "@/components/LiveMatchCard";

interface Props {
  onMatchClick: (fixture: Fixture) => void;
}

type TabFilter = "all" | "today" | "tomorrow";

export default function MatchPage({ onMatchClick }: Props) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");

  const today = todayStr();
  const tomorrow = tomorrowStr();

  const dateToFetch = tab === "tomorrow" ? tomorrow : today;
  const { fixtures, loading, error } = useFixtures(dateToFetch);

  const filtered = useMemo(() => {
    if (!search.trim()) return fixtures;
    const q = search.trim().toLowerCase();
    return fixtures.filter(
      (f) =>
        f.homeTeam.name.toLowerCase().includes(q) ||
        f.awayTeam.name.toLowerCase().includes(q) ||
        String(f.id).includes(q)
    );
  }, [fixtures, search]);

  const displayList = useMemo(() => {
    if (tab === "today") return filtered.filter((f) => f.date.startsWith(today));
    if (tab === "tomorrow") return filtered.filter((f) => f.date.startsWith(tomorrow));
    return filtered;
  }, [filtered, tab, today, tomorrow]);

  const tabLabels: Record<TabFilter, string> = {
    all: `All ( ${filtered.length} )`,
    today: `Today ( ${filtered.filter((f) => f.date.startsWith(today)).length} )`,
    tomorrow: `Tomorrow ( ${filtered.filter((f) => f.date.startsWith(tomorrow)).length} )`,
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f4f5f7" }}>
      {/* Search + tabs sticky header */}
      <div className="bg-white px-4 pt-4 pb-0 shadow-sm">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Team Name"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-gray-50"
          />
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: "#2563eb" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            Search
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          {(["all", "today", "tomorrow"] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
              }`}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0 px-2 pt-2 pb-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading matches…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-2 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="text-sm font-bold text-amber-700 mb-1">⚠️ API Key Required</p>
            <p className="text-xs text-gray-500">Add your FOOTBALL_API_KEY to environment secrets to load live matches.</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && displayList.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-gray-300">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-gray-400">No matches found</p>
          </div>
        )}

        {!loading && !error &&
          displayList.map((fixture) => (
            <LiveMatchCard
              key={fixture.id}
              fixture={fixture}
              onClick={() => onMatchClick(fixture)}
            />
          ))}
      </div>
    </div>
  );
}
