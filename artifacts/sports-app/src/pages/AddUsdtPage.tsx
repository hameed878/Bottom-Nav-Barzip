import { useState } from "react";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddUsdtPage({ onBack, onSuccess }: Props) {
  const [address, setAddress] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [showFundPw, setShowFundPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!address.trim()) return setError("Please enter the USDT wallet address");
    if (address.trim().length < 10) return setError("Invalid wallet address");

    setLoading(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: "USDT", network: "TRC20", address: address.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.error ?? "Failed to add wallet");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600 hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Virtual Currency</h1>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 w-24">Currency</span>
          <span className="text-sm font-bold text-gray-800">USDT</span>
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <p className="text-xs text-gray-500 mb-2">Please Select Wallet Type</p>
          <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white">
            <span className="text-sm font-semibold text-gray-800">TRC20</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">USDT Wallet Address</p>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Enter your TRC20 USDT wallet address"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-white resize-none outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">FundPassword</p>
          <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white gap-2">
            <input
              type={showFundPw ? "text" : "password"}
              value={fundPassword}
              onChange={(e) => setFundPassword(e.target.value)}
              className="flex-1 text-sm text-gray-800 bg-transparent outline-none"
              placeholder="Enter fund password"
            />
            <button onClick={() => setShowFundPw((v) => !v)} className="text-gray-400 hover:text-gray-600">
              {showFundPw
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-500 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !address.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-opacity disabled:opacity-40"
          style={{ background: address.trim() ? "#2563eb" : "#d1d5db", color: address.trim() ? "white" : "#9ca3af" }}
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
