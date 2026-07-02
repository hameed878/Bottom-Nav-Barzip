import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const QUICK_AMOUNTS = [5, 20, 50, 100, 500, 1000, 3000, 5000, 10000];

interface Props {
  onBack: () => void;
}

function generateOrderId() {
  const now = new Date();
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return (
    "THUU" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    pad(Math.floor(Math.random() * 99999), 5)
  );
}

function truncate(s: string, n = 24) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function RechargeOnlinePage({ onBack }: Props) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<"select" | "info">("select");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState("TF8XLURccFp8Tb1LFjFG33BApP9YVFp6ML");
  const [orderId] = useState(generateOrderId);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/exchange-rate", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setUsdRate(d.usdToPkr); })
      .catch(() => {});

    fetch("/api/settings/payment-address")
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.address) setWalletAddress(d.address); })
      .catch(() => {});
  }, []);

  const usdtNum = parseFloat(usdtAmount) || 0;
  const pkrActual = usdRate ? usdtNum * usdRate : 0;
  const balance = parseFloat(user?.balancePkr ?? "0");

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirm = async () => {
    if (usdtNum <= 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/deposits", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: String(pkrActual.toFixed(2)) }),
      });
      await refreshUser();
      setConfirmed(true);
    } catch {
      // silently ignore — user already has the order ID
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmed screen ───────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: "#fffbeb" }}>
        <div className="flex items-center gap-3 px-4 pt-10 pb-3 bg-white shadow-sm">
          <button onClick={onBack} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Recharge Info</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-5 px-8 py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#f59e0b" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-8 h-8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-800">Deposit Pending</p>
          <p className="text-sm text-gray-400 text-center">
            Your deposit of <span className="font-semibold text-gray-700">{usdtNum} USDT</span> is under review.
            It will be credited to your balance once approved by the team.
          </p>
          <button onClick={onBack} className="mt-4 px-8 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: "#2563eb" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Recharge Info ──────────────────────────────────────
  if (step === "info") {
    return (
      <div className="flex flex-col min-h-full" style={{ background: "#e8f8f5" }}>
        <div className="flex items-center gap-3 px-4 pt-10 pb-3 bg-white shadow-sm">
          <button onClick={() => setStep("select")} className="p-1 text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Recharge Info</h1>
        </div>

        <div className="flex flex-col gap-3 px-4 py-5">
          {/* Wallet address card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-gray-700">Wallet Address</p>
              <div className="w-48 h-48 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletAddress)}&bgcolor=ffffff&color=000000&margin=8`}
                  alt="USDT TRC20 QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center font-mono break-all px-2 leading-relaxed">
                {walletAddress}
              </p>
              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl border-2 text-sm font-bold transition-colors"
                style={{
                  borderColor: copied ? "#27ae60" : "#2563eb",
                  color: copied ? "#27ae60" : "#2563eb",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Wallet Address"}
              </button>
            </div>
          </div>

          {/* Order details card */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-3">
            <DetailRow label="Type" value="USDT (TRC20)" />
            <DetailRow label="Recharge Amount" value={`${usdtNum.toFixed(2)} USDT`} />
            <DetailRow label="Order Number" value={orderId} small />
          </div>

          {/* Note */}
          <p className="text-xs text-gray-400 text-center px-2 leading-relaxed">
            Send exactly <span className="font-bold text-gray-700">{usdtNum} USDT</span> to the address above on TRC20 network, then tap Confirm.
          </p>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-50 mt-1"
            style={{ background: "#1ab3a5" }}
          >
            {submitting ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Select amount ──────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Online Recharge</h1>
      </div>

      <div className="flex flex-col gap-0 pb-8">
        {/* Recharge Type */}
        <div className="px-4 pt-5 pb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Recharge Type</p>
          <div className="inline-flex">
            <div
              className="border-2 rounded-xl px-5 py-3 flex flex-col items-center gap-2 relative"
              style={{ borderColor: "#1ab3a5", minWidth: 90 }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ background: "#26a17b" }}>
                T
              </div>
              <span className="text-xs font-bold" style={{ color: "#1ab3a5" }}>TRC20</span>
              <div className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end overflow-hidden rounded-br-xl">
                <svg viewBox="0 0 16 16" className="w-5 h-5" style={{ color: "#1ab3a5" }}>
                  <path d="M0 16 L16 0 L16 16 Z" fill="currentColor" />
                  <path d="M10 13 L13 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Account balance */}
        <div className="px-4 py-2 border-t border-gray-50">
          <p className="text-xs text-gray-400 text-right">Account Balance: <span className="font-semibold text-gray-600">{balance.toFixed(2)} PKR</span></p>
        </div>

        {/* Amount input */}
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-3">Recharge Amount:</p>
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2 mb-2">
            <input
              type="number"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="0"
              className="text-3xl font-bold text-gray-800 w-full outline-none bg-transparent"
            />
            <span className="text-base font-bold text-gray-400 ml-2 shrink-0">USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Actual amount: <span style={{ color: "#e53e3e" }}>{pkrActual > 0 ? pkrActual.toFixed(0) : "0"}</span>
            </span>
            <span className="text-gray-500">
              USDT Exchange rate: <span className="font-semibold">{usdRate ? Math.round(usdRate) : "—"}</span>
            </span>
          </div>
        </div>

        {/* Quick amounts grid */}
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="grid grid-cols-3 gap-2 pt-3">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setUsdtAmount(String(v))}
                className={`py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  usdtAmount === String(v)
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-100 text-gray-700 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Recharge Now button */}
        <div className="px-4">
          <button
            onClick={() => usdtNum > 0 && setStep("info")}
            disabled={usdtNum <= 0}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-40"
            style={{ background: usdtNum > 0 ? "#2563eb" : "#9ca3af" }}
          >
            Recharge Now
          </button>
        </div>

        {/* Footer note */}
        <div className="px-4 pt-4">
          <p className="text-xs leading-relaxed" style={{ color: "#e53e3e" }}>
            For transferring USDT, the platform will bear the transaction fee of 1 USDT. After the recharge is completed, the system will automatically add 1 USDT to the amount.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-right font-semibold text-gray-800 ${small ? "text-xs break-all max-w-[55%]" : "text-sm"}`}>{value}</span>
    </div>
  );
}
