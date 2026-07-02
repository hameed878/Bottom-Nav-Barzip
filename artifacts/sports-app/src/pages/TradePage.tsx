import { useEffect, useState } from "react";

interface Txn {
  id: string;
  type: string;
  label: string;
  amount: string;
  sign: "+" | "-";
  date: string;
  status: string;
  category: "deposit" | "referral" | "bet";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CATEGORY_STYLE: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  deposit: {
    bg: "#dbeafe",
    color: "#1d4ed8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" strokeLinecap="round" />
      </svg>
    ),
  },
  referral: {
    bg: "#fef9c3",
    color: "#b45309",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    ),
  },
  bet: {
    bg: "#dcfce7",
    color: "#15803d",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0f4ff" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={1.5} className="w-8 h-8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
      <p className="text-xs text-gray-300 text-center px-8">
        Make a deposit or earn a referral bonus to see activity here
      </p>
    </div>
  );
}

const FILTERS = ["All", "Deposit", "Referral", "Bet"] as const;
type Filter = (typeof FILTERS)[number];

interface Props {
  onBack?: () => void;
}

export default function TradePage({ onBack }: Props = {}) {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    fetch("/api/transactions", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setTxns(data.transactions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = txns.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Deposit") return t.category === "deposit";
    if (filter === "Referral") return t.category === "referral";
    if (filter === "Bet") return t.category === "bet";
    return true;
  });

  return (
    <div className="flex flex-col bg-gray-100 min-h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-3 shadow-sm flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className={`text-base font-bold text-gray-800 ${onBack ? "flex-1 text-center pr-6" : ""}`}>Balance details</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-3 pt-3 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            style={
              filter === f
                ? { background: "#2563eb", color: "white" }
                : { background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="mx-3 mt-2 bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((txn, i) => {
            const style = CATEGORY_STYLE[txn.category] ?? CATEGORY_STYLE.deposit;
            return (
              <div
                key={txn.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${i !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{txn.type}</p>
                  <p className="text-xs text-gray-400 truncate">{txn.label}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{formatDate(txn.date)}</p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className="text-sm font-bold"
                    style={{ color: txn.sign === "+" ? "#16a34a" : "#dc2626" }}
                  >
                    {txn.sign}PKR {txn.amount}
                  </span>
                  <span
                    className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full font-medium"
                    style={
                      txn.status === "Credited"
                        ? { background: "#fef9c3", color: "#92400e" }
                        : { background: "#dcfce7", color: "#166534" }
                    }
                  >
                    {txn.status}
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
