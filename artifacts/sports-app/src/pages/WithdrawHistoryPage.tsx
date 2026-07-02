import { useEffect, useState } from "react";

interface Withdrawal {
  id: number;
  amountPkr: string;
  feePkr: string;
  amountUsdt: string;
  walletAddress: string;
  orderId: string;
  status: "pending" | "success" | "rejected";
  rejectReason?: string | null;
  createdAt: string;
}

interface Props {
  onBack: () => void;
}

type FilterTab = "all" | "pending" | "success" | "rejected";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  success: "Success",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#06b6d4",
  success: "#22c55e",
  rejected: "#ef4444",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="text-sm font-semibold" style={{ color: STATUS_COLOR[status] ?? "#6b7280" }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function WithdrawCard({ w }: { w: Withdrawal }) {
  return (
    <div className="bg-white rounded-xl mx-3 mb-3 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <StatusBadge status={w.status} />
        <span className="text-base font-bold text-red-500">{parseFloat(w.amountPkr).toFixed(0)}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <Row label="Processing Fee" value={parseFloat(w.feePkr).toFixed(2)} />
        <Row label="Data" value={formatDate(w.createdAt)} />
        <Row label="Type" value="USDT" />
        <Row label="The order number" value={w.orderId} small />
        {w.status === "rejected" && w.rejectReason && (
          <Row label="Reason" value={w.rejectReason} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-right text-gray-700 ${small ? "text-[10px] break-all max-w-[55%]" : "text-xs font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "success", label: "Success" },
  { key: "rejected", label: "Rejected" },
];

export default function WithdrawHistoryPage({ onBack }: Props) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/withdrawals", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setWithdrawals(d.withdrawals);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? withdrawals : withdrawals.filter((w) => w.status === tab);

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Withdraw record</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-white border-b border-gray-100 px-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === t.key ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 pt-3 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 text-gray-200">
              <rect x="8" y="8" width="32" height="32" rx="6" fill="currentColor" />
              <path d="M16 20h16M16 28h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-gray-400">No records found</span>
          </div>
        ) : (
          filtered.map((w) => <WithdrawCard key={w.id} w={w} />)
        )}
      </div>
    </div>
  );
}
