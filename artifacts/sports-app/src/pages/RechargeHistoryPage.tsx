import { useEffect, useState } from "react";

interface Deposit {
  id: number;
  amountPkr: string;
  status: string;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface Props {
  onBack: () => void;
}

export default function RechargeHistoryPage({ onBack }: Props) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deposits", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setDeposits(data.deposits); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#dcfce7", color: "#16a34a", label: "Completed" };
      case "pending":
        return { bg: "#fef9c3", color: "#b45309", label: "Pending" };
      case "rejected":
        return { bg: "#fee2e2", color: "#dc2626", label: "Rejected" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280", label: status };
    }
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f0f2f5" }}>
      {/* Header */}
      <div
        className="px-4 pt-10 pb-4 flex items-center gap-3"
        style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6e 100%)" }}
      >
        <button onClick={onBack} className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-base flex-1 text-center pr-6">Recharge History</h1>
      </div>

      {/* Summary bar */}
      {!loading && deposits.length > 0 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-sm font-bold text-gray-800">{deposits.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400">Pending</span>
            <span className="text-sm font-bold" style={{ color: "#b45309" }}>
              {deposits.filter((d) => d.status === "pending").length}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400">Completed</span>
            <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
              {deposits.filter((d) => d.status === "completed").length}
            </span>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mx-4 mt-3 mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f0f4ff" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth={1.5} className="w-8 h-8">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">No recharge history yet</p>
            <p className="text-xs text-gray-300 text-center px-8">
              Your deposit records will appear here
            </p>
          </div>
        ) : (
          deposits.map((dep, i) => {
            const st = statusStyle(dep.status);
            return (
              <div
                key={dep.id}
                className={`flex items-center gap-3 px-4 py-4 ${i !== deposits.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: "#dbeafe" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth={2} className="w-5 h-5">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" strokeLinecap="round" />
                    <path d="M6 15h4" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Recharge</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(dep.createdAt)}</p>
                </div>

                {/* Amount + status */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold" style={{ color: "#16a34a" }}>
                    +PKR {parseFloat(dep.amountPkr).toFixed(2)}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
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
