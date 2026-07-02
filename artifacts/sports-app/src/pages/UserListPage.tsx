import { useEffect, useState } from "react";

interface Subordinate {
  id: number;
  username: string;
  vipLevel: number;
  level: number;
}

interface Props {
  onBack: () => void;
}

export default function UserListPage({ onBack }: Props) {
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<1 | 2 | 3 | "all">("all");

  useEffect(() => {
    fetch("/api/agency/subordinates", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Please log in to view your team." : "Failed to load team data.");
        return r.json();
      })
      .then((d) => {
        if (d.ok) setSubordinates(d.subordinates);
        else throw new Error(d.error ?? "Unknown error");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? subordinates : subordinates.filter((u) => u.level === filter);

  const levelColor = (level: number) => {
    if (level === 1) return { bg: "#dbeafe", text: "#1d4ed8" };
    if (level === 2) return { bg: "#fef9c3", text: "#b45309" };
    return { bg: "#dcfce7", text: "#166534" };
  };

  const vipColor = (v: number) => (v >= 5 ? "#f59e0b" : v >= 3 ? "#8b5cf6" : "#6b7280");

  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">User List</h1>
      </div>

      {/* Level filter tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {(["all", 1, 2, 3] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: filter === lvl ? "linear-gradient(135deg,#1a3a6e,#2563eb)" : "#e5e7eb",
              color: filter === lvl ? "#fff" : "#6b7280",
            }}
          >
            {lvl === "all" ? "All" : `Level ${lvl}`}
          </button>
        ))}
      </div>

      {/* Count badge */}
      <div className="px-4 pb-2">
        <span className="text-xs text-gray-400">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-2 text-red-400 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 opacity-50">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 opacity-30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
            </svg>
            <span className="text-sm">No subordinates yet</span>
          </div>
        ) : (
          filtered.map((u, i) => {
            const lc = levelColor(u.level);
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#1a3a6e,#2563eb)" }}
                >
                  {u.username[0]?.toUpperCase() ?? "?"}
                </div>

                {/* Name + level badge */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.username}</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: lc.bg, color: lc.text }}
                  >
                    Level {u.level}
                  </span>
                </div>

                {/* VIP badge */}
                <div
                  className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border"
                  style={{ borderColor: vipColor(u.vipLevel), background: `${vipColor(u.vipLevel)}18` }}
                >
                  <svg viewBox="0 0 24 24" fill={vipColor(u.vipLevel)} className="w-3 h-3">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-[11px] font-bold" style={{ color: vipColor(u.vipLevel) }}>
                    VIP{u.vipLevel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
