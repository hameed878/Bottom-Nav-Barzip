import { useState } from "react";

export default function DepositModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleDeposit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Enter a valid amount");
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: String(num) }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Deposit failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Recharge (PKR)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#f59e0b" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-bold text-gray-800">Deposit Pending</p>
            <p className="text-sm text-gray-400 text-center">
              Your deposit of <span className="font-semibold text-gray-700">PKR {parseFloat(amount).toFixed(2)}</span> is under review.
              It will be credited to your balance once approved.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 rounded-2xl text-white font-bold text-sm"
              style={{ background: "#2563eb" }}
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              {[500, 1000, 5000, 10000].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${amount === String(v) ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500"}`}>
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (PKR)"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500 mb-3"
            />
            {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}
            <button
              onClick={handleDeposit}
              disabled={loading || !amount}
              className="w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50"
              style={{ background: "#2563eb" }}
            >
              {loading ? "Processing…" : "Submit Deposit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
