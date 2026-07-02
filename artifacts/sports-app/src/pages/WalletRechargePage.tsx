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
    "WLLT" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    pad(Math.floor(Math.random() * 99999), 5)
  );
}

export default function WalletRechargePage({ onBack }: Props) {
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
  const walletBal = parseFloat(user?.walletBalance ?? "0");

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
        body: JSON.stringify({ amount: String(pkrActual.toFixed(2)), type: "wallet" }),
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
      <div className="flex flex-col min-h-full" style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a6b 60%)" }}>
        <div className="flex items-center gap-3 px-4 pt-10 pb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
          <button onClick={onBack} className="p-1 text-white/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-white flex-1 text-center pr-6">Wallet Recharge</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-5 px-8 py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.3)", border: "2px solid #f59e0b" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2.5} className="w-8 h-8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-bold text-white">Wallet Recharge Pending</p>
          <p className="text-sm text-white/60 text-center">
            Your deposit of <span className="font-semibold text-white">{usdtNum} USDT</span> is under review.
            Once approved, it will be credited to your <span className="text-yellow-400 font-semibold">Wallet Balance</span>.
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
      <div className="flex flex-col min-h-full" style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a6b 60%)" }}>
        <div className="flex items-center gap-3 px-4 pt-10 pb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
          <button onClick={() => setStep("select")} className="p-1 text-white/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-white flex-1 text-center pr-6">Wallet Recharge Info</h1>
        </div>

        <div className="flex flex-col gap-3 px-4 py-5">
          {/* Destination badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} className="w-4 h-4 shrink-0">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
              <path d="M16 3v4H8V3" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-yellow-300">Funds go to: Wallet Balance (rebate wallet)</span>
          </div>

          {/* Wallet address card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="px-5 pt-5 pb-4 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-white">USDT TRC20 Address</p>
              <div className="w-48 h-48 rounded-xl overflow-hidden bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletAddress)}&bgcolor=ffffff&color=000000&margin=8`}
                  alt="USDT TRC20 QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                />
              </div>
              <p className="text-xs text-white/60 text-center font-mono break-all px-2 leading-relaxed">
                {walletAddress}
              </p>
              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl border-2 text-sm font-bold transition-colors"
                style={{
                  borderColor: copied ? "#4ade80" : "#f59e0b",
                  color: copied ? "#4ade80" : "#f59e0b",
                  background: copied ? "rgba(74,222,128,0.08)" : "rgba(245,158,11,0.08)",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Wallet Address"}
              </button>
            </div>
          </div>

          {/* Order details card */}
          <div className="rounded-2xl px-5 py-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <DetailRow label="Type" value="USDT (TRC20)" />
            <DetailRow label="Recharge Amount" value={`${usdtNum.toFixed(2)} USDT`} />
            <DetailRow label="PKR Value" value={`₨ ${pkrActual > 0 ? pkrActual.toFixed(0) : "0"}`} />
            <DetailRow label="Destination" value="Wallet Balance" highlight />
            <DetailRow label="Order Number" value={orderId} small />
          </div>

          <p className="text-xs text-white/40 text-center px-2 leading-relaxed">
            Send exactly <span className="font-bold text-white/70">{usdtNum} USDT</span> on TRC20 network, then tap Confirm.
          </p>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-50 mt-1"
            style={{ background: "linear-gradient(90deg, #d97706, #b45309)" }}
          >
            {submitting ? "Confirming…" : "Confirm Wallet Recharge"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Select amount ──────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full" style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d2a6b 60%)" }}>
      <div className="flex items-center gap-3 px-4 pt-10 pb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} className="p-1 text-white/70">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-white flex-1 text-center pr-6">Wallet Recharge</h1>
      </div>

      <div className="flex flex-col gap-0 pb-8">
        {/* Destination notice */}
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)" }}>
          <span className="text-lg">🪙</span>
          <div>
            <p className="text-xs font-bold text-yellow-300">Depositing to: Wallet Balance</p>
            <p className="text-[11px] text-white/50 mt-0.5">Current: PKR {walletBal.toFixed(2)}</p>
          </div>
        </div>

        {/* Recharge Type */}
        <div className="px-4 pt-5 pb-4">
          <p className="text-sm font-semibold text-white/80 mb-3">Payment Method</p>
          <div className="inline-flex">
            <div
              className="border-2 rounded-xl px-5 py-3 flex flex-col items-center gap-2 relative"
              style={{ borderColor: "#f59e0b", minWidth: 90 }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ background: "#26a17b" }}>
                T
              </div>
              <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>TRC20</span>
              <div className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end overflow-hidden rounded-br-xl">
                <svg viewBox="0 0 16 16" className="w-5 h-5" style={{ color: "#f59e0b" }}>
                  <path d="M0 16 L16 0 L16 16 Z" fill="currentColor" />
                  <path d="M10 13 L13 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Amount input */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-sm font-bold text-white/80 mb-3">Recharge Amount:</p>
          <div className="flex items-center justify-between border-b-2 border-white/20 pb-2 mb-2">
            <input
              type="number"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="0"
              className="text-3xl font-bold text-white w-full outline-none bg-transparent placeholder-white/20"
            />
            <span className="text-base font-bold text-white/40 ml-2 shrink-0">USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">
              ≈ PKR <span style={{ color: "#fbbf24" }}>{pkrActual > 0 ? pkrActual.toFixed(0) : "0"}</span>
            </span>
            <span className="text-white/50">
              Rate: <span className="font-semibold text-white/70">{usdRate ? Math.round(usdRate) : "—"} PKR/USDT</span>
            </span>
          </div>
        </div>

        {/* Quick amounts grid */}
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 pt-3">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setUsdtAmount(String(v))}
                className="py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: usdtAmount === String(v) ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${usdtAmount === String(v) ? "#f59e0b" : "rgba(255,255,255,0.12)"}`,
                  color: usdtAmount === String(v) ? "#fbbf24" : "rgba(255,255,255,0.7)",
                }}
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
            style={{ background: usdtNum > 0 ? "linear-gradient(90deg, #d97706, #b45309)" : "#374151" }}
          >
            Recharge Wallet Now
          </button>
        </div>

        {/* Footer note */}
        <div className="px-4 pt-4">
          <p className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.7)" }}>
            Funds deposited here go to your Wallet Balance (rebate wallet). Use this to top-up your rebate wallet for transfers.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, small, highlight }: { label: string; value: string; small?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className={`text-right font-semibold ${highlight ? "text-yellow-400" : "text-white"} ${small ? "text-xs break-all max-w-[55%]" : "text-sm"}`}>{value}</span>
    </div>
  );
}
