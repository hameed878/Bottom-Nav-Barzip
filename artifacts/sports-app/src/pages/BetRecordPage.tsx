import { useEffect, useState } from "react";

interface Bet {
  id: number;
  stakePkr: string;
  estimatedProfit: string;
  status: string;
  createdAt: string;
  orderId: string;
  homeTeam: string;
  awayTeam: string;
  selectedScore: string;
  oddsValue: string;
}

type Period = 7 | 10 | 30;

function formatBetDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface Props {
  onBack: () => void;
}

export default function BetRecordPage({ onBack }: Props) {
  const [period, setPeriod] = useState<Period>(7);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/bets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setBets(d.bets); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  const filtered = bets.filter((b) => new Date(b.createdAt) >= cutoff);

  const detailBet = detailId !== null ? bets.find((b) => b.id === detailId) : null;

  if (detailBet) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
          <button onClick={() => setDetailId(null)} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Order Detail</h1>
        </div>
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            ["Order No", detailBet.orderId],
            ["Match", `${detailBet.homeTeam} vs ${detailBet.awayTeam}`],
            ["Score Selection", detailBet.selectedScore],
            ["Odds", detailBet.oddsValue + "%"],
            ["Bet Amount", parseFloat(detailBet.stakePkr).toFixed(2)],
            ["Estimated Profit", parseFloat(detailBet.estimatedProfit).toFixed(2)],
            ["Status", detailBet.status.charAt(0).toUpperCase() + detailBet.status.slice(1)],
            ["Bet Date", formatBetDate(detailBet.createdAt)],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className={`flex items-center justify-between px-5 py-4 ${i !== arr.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-sm font-semibold ${label === "Status" && detailBet.status === "active" ? "text-blue-600" : label === "Estimated Profit" ? "text-green-600" : "text-gray-800"}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">My order</h1>
      </div>

      <div className="flex bg-white border-b border-gray-100 px-2">
        {([7, 10, 30] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              period === p ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"
            }`}
          >
            Nearly {p} day
          </button>
        ))}
      </div>

      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "#3b82f6" }}>
              <th className="py-3 px-2 text-left text-xs font-semibold text-white">Bet Date</th>
              <th className="py-3 px-2 text-right text-xs font-semibold text-white">Bet amount</th>
              <th className="py-3 px-2 text-right text-xs font-semibold text-white">Profit And Loss</th>
              <th className="py-3 px-2 text-right text-xs font-semibold text-white">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-sm text-gray-400">No orders found</td>
              </tr>
            ) : (
              filtered.map((bet, i) => {
                const profit = parseFloat(bet.estimatedProfit);
                const isPending = bet.status === "active";
                return (
                  <tr key={bet.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-3 px-2 text-xs text-gray-700">{formatBetDate(bet.createdAt)}</td>
                    <td className="py-3 px-2 text-right text-xs text-gray-700">{parseFloat(bet.stakePkr).toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-xs font-semibold" style={{ color: isPending ? "#9ca3af" : "#10b981" }}>
                      {isPending ? "–" : profit.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setDetailId(bet.id)}
                        className="text-xs font-semibold"
                        style={{ color: "#3b82f6" }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-6">— END —</p>
        )}
      </div>
    </div>
  );
}
