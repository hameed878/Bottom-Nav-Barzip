import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Wallet {
  id: number;
  currency: string;
  network: string;
  address: string;
}

interface Props {
  onBack: () => void;
  onAddAddress: () => void;
}

const WITHDRAWAL_FEE_PCT = 0.14;

function truncateAddress(addr: string) {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor ?? "#111827" }}>
        {value}
      </span>
    </div>
  );
}

export default function WithdrawPage({ onBack, onAddAddress }: Props) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [showFundPw, setShowFundPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const balance = parseFloat(user?.balancePkr ?? "0");

  useEffect(() => {
    fetch("/api/wallets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.wallets.length > 0) setWallet(d.wallets[0]); })
      .catch(() => {})
      .finally(() => setLoadingWallet(false));

    fetch("/api/exchange-rate", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setUsdRate(d.usdToPkr); })
      .catch(() => {});
  }, []);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * WITHDRAWAL_FEE_PCT;
  const afterFee = amountNum - fee;
  const usdtAmount = usdRate && usdRate > 0 ? afterFee / usdRate : 0;

  const handleSubmit = async () => {
    setError("");
    if (!wallet) return setError("Please link a USDT address first");
    if (!amountNum || amountNum <= 0) return setError("Enter a valid withdrawal amount");
    if (amountNum > balance) return setError("Insufficient balance");
    if (!fundPassword.trim()) return setError("Enter your fund password");
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPkr: String(amountNum), fundPassword }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) { setError(data.error ?? "Submission failed"); setSubmitting(false); return; }
      setSuccess(true);
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col bg-gray-50 min-h-full">
        <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
          <button onClick={onBack} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Cash Withdrawal</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#27ae60" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-8 h-8">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-800">Withdrawal Submitted</p>
          <p className="text-sm text-gray-400 text-center">
            Your withdrawal of PKR {amountNum.toFixed(2)} has been submitted for processing.
          </p>
          <button onClick={onBack} className="mt-4 px-8 py-3 rounded-2xl font-bold text-white" style={{ background: "#2563eb" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600 hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Cash Withdrawal</h1>
      </div>

      <div className="flex flex-col gap-0 pb-8">
        {/* USDT selector */}
        <div className="bg-white px-4 pt-5 pb-4">
          <div className="flex gap-3">
            <div className="border-2 border-blue-500 rounded-xl p-3 flex flex-col items-center gap-1 w-20">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ background: "#26a17b" }}>
                T
              </div>
              <span className="text-xs font-bold text-gray-700">TRC20</span>
            </div>
          </div>
        </div>

        {/* Receiving account */}
        <div className="bg-white mt-2 px-4 py-3">
          <p className="text-sm text-gray-500 mb-3 font-medium">Receiving bank account</p>

          {loadingWallet ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : wallet ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "#26a17b" }}>
                  T
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {truncateAddress(wallet.address)}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#2563eb" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ) : null}

          <button
            onClick={onAddAddress}
            className="flex items-center gap-1 mt-2 text-sm font-semibold"
            style={{ color: "#2563eb" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            {wallet ? "Change USDT address" : "Add the USDT address"}
          </button>
        </div>

        {/* Info rows */}
        <div className="bg-white mt-2 px-4">
          <InfoRow
            label="Account Balance"
            value={balance.toFixed(2)}
            valueColor="#e53e3e"
          />
          <InfoRow
            label="Current Exchange Rate"
            value={usdRate ? `1 USD = ${usdRate.toFixed(2)} PKR` : "Loading…"}
          />
          <InfoRow label="Withdrawal Fee" value="14%" />
          <InfoRow
            label="Withdrawal Amount"
            value={amountNum > 0 ? `PKR ${amountNum.toFixed(2)}` : "—"}
          />
          <InfoRow label="Withdrawals" value="0" />
          <InfoRow
            label="The actual to account"
            value={`${usdtAmount > 0 ? usdtAmount.toFixed(4) : "0"} (USDT)`}
          />
        </div>

        {/* Input section */}
        <div className="bg-white mt-2 px-4 py-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Withdrawal Amount</p>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter Withdrawal Amount"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              <button
                onClick={() => setAmount(String(balance))}
                className="text-xs font-bold shrink-0"
                style={{ color: "#2563eb" }}
              >
                All
              </button>
            </div>
            {amountNum > 0 && (
              <p className="text-xs text-gray-400 mt-1.5 pl-1">
                After 14% fee: PKR {afterFee.toFixed(2)}
                {usdRate ? ` ≈ ${usdtAmount.toFixed(4)} USDT` : ""}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">FundPassword:</p>
              <button className="text-xs font-semibold" style={{ color: "#2563eb" }}>
                Forgot password?
              </button>
            </div>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 gap-2">
              <input
                type={showFundPw ? "text" : "password"}
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
                placeholder="Enter Your Fund Password"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              <button onClick={() => setShowFundPw((v) => !v)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  {showFundPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs text-red-500 text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !amountNum || !fundPassword}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40 transition-opacity"
            style={{ background: "#2563eb" }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
