import { useEffect, useState } from "react";

interface RebateRecord {
  date: string;
  amount: string;
  type: string;
  breakdown: { level: number; amount: string }[];
}

interface RebateStats {
  totalRebate: string;
  rebateThisWeek: string;
  todayRebate: string;
  lastRebate: string;
  records: RebateRecord[];
}

interface Props {
  onBack: () => void;
}

export default function RebateCenterPage({ onBack }: Props) {
  const [stats, setStats] = useState<RebateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rebate/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? {
    totalRebate: "0.00",
    rebateThisWeek: "0.00",
    todayRebate: "0.00",
    lastRebate: "0.00",
    records: [],
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f4f5f7" }}>
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Rebate Center</h1>
      </div>

      {/* Summary card — matches the image design */}
      <div
        className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 60%, #dc2626 100%)", minHeight: 140 }}
      >
        {/* Decorative figures (right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-40 pointer-events-none opacity-80">
          <svg viewBox="0 0 160 130" fill="none" className="w-full h-full">
            {/* Pile of coins / boxes */}
            <ellipse cx="110" cy="105" rx="28" ry="8" fill="rgba(255,200,80,0.5)" />
            <rect x="88" y="78" width="44" height="28" rx="4" fill="rgba(255,190,60,0.7)" />
            <rect x="88" y="74" width="44" height="8" rx="3" fill="rgba(255,210,100,0.8)" />
            <ellipse cx="110" cy="74" rx="22" ry="5" fill="rgba(255,220,120,0.9)" />
            <rect x="95" y="55" width="30" height="22" rx="3" fill="rgba(255,200,70,0.75)" />
            <rect x="95" y="51" width="30" height="7" rx="3" fill="rgba(255,215,100,0.85)" />
            <ellipse cx="110" cy="52" rx="15" ry="4" fill="rgba(255,225,130,0.95)" />
            {/* Person figure */}
            <circle cx="116" cy="30" r="10" fill="rgba(255,255,255,0.25)" />
            <path d="M106 40 Q116 50 126 40 L128 68 L116 70 L104 68 Z" fill="rgba(255,255,255,0.2)" />
            <path d="M106 44 L96 58 L102 62 L110 50" fill="rgba(255,255,255,0.15)" />
            <path d="M126 44 L136 58 L130 62 L122 50" fill="rgba(255,255,255,0.15)" />
          </svg>
        </div>

        <div className="relative z-10 px-5 py-4">
          {/* App title line */}
          <p className="text-white font-bold text-base mb-3">RBT.CC Full Details</p>

          {/* Top row: total & last */}
          <div className="flex gap-8 mb-3">
            <div>
              <p className="text-white/90 text-lg font-bold leading-tight">
                +{loading ? "…" : s.totalRebate}
              </p>
            </div>
            <div>
              <p className="text-white/90 text-lg font-bold leading-tight">
                +{loading ? "…" : s.lastRebate}
              </p>
            </div>
          </div>

          {/* Bottom row: today & last labels */}
          <div className="flex gap-8">
            <div>
              <p className="text-white/70 text-xs">Today Rebate</p>
              <p className="text-white font-semibold text-sm">+{loading ? "…" : s.todayRebate}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Last rebate</p>
              <p className="text-white font-semibold text-sm">+{loading ? "…" : s.lastRebate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rebate Rate Info */}
      <div className="mx-4 mt-3 bg-white rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">Rebate Rate</p>
        <div className="flex justify-between text-center">
          {[
            { level: "Level 1", pct: "8%", color: "#ef4444" },
            { level: "Level 2", pct: "5%", color: "#f97316" },
            { level: "Level 3", pct: "3%", color: "#9ca3af" },
          ].map((item) => (
            <div key={item.level} className="flex flex-col items-center gap-1">
              <span
                className="text-xs font-bold px-3 py-1 rounded-lg text-white"
                style={{ background: item.color }}
              >
                {item.level}
              </span>
              <span className="text-lg font-bold" style={{ color: item.color }}>{item.pct}</span>
              <span className="text-[10px] text-gray-400">of profit</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records List */}
      <div className="mx-4 mt-3 flex flex-col gap-3 pb-6">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && s.records.length === 0 && (
          <div className="bg-white rounded-xl px-4 py-8 flex flex-col items-center gap-2">
            <svg viewBox="0 0 80 60" fill="none" className="w-20 h-14">
              <ellipse cx="40" cy="48" rx="24" ry="6" fill="#e0e0e0" opacity="0.6" />
              <ellipse cx="40" cy="38" rx="21" ry="8" fill="#c8c8c8" />
              <ellipse cx="40" cy="34" rx="15" ry="10" fill="#d8d8d8" />
              <ellipse cx="40" cy="28" rx="10" ry="7" fill="#e8e8e8" />
              <circle cx="34" cy="29" r="2" fill="#b0c8e8" opacity="0.7" />
              <circle cx="40" cy="27" r="1.5" fill="#b0c8e8" opacity="0.7" />
              <circle cx="46" cy="29" r="2" fill="#b0c8e8" opacity="0.7" />
            </svg>
            <p className="text-sm text-gray-400">No rebate records yet</p>
            <p className="text-xs text-gray-300 text-center">Invite friends to bet and earn 8% / 5% / 3% rebates</p>
          </div>
        )}

        {!loading && s.records.map((record, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Amount + Type row */}
            <div className="flex items-start justify-between px-4 pt-3 pb-2">
              <div>
                <p className="text-lg font-bold" style={{ color: "#ef4444" }}>
                  {record.amount}
                </p>
                <p className="text-xs text-gray-400">Amount</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">{record.type}</p>
                <p className="text-xs text-gray-400">Type</p>
              </div>
            </div>

            {/* Breakdown by level */}
            {record.breakdown.length > 0 && (
              <div className="px-4 pb-2 flex gap-3">
                {record.breakdown.map((b) => (
                  <span
                    key={b.level}
                    className="text-[10px] text-white px-2 py-0.5 rounded-full"
                    style={{
                      background: b.level === 1 ? "#ef4444" : b.level === 2 ? "#f97316" : "#9ca3af",
                    }}
                  >
                    L{b.level}: +{b.amount}
                  </span>
                ))}
              </div>
            )}

            {/* Date button */}
            <button
              className="w-full py-2.5 font-semibold text-sm text-white"
              style={{ background: "linear-gradient(90deg, #f97316, #ef4444)" }}
            >
              {record.date}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
