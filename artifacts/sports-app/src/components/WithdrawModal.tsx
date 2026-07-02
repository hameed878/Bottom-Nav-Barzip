import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function WithdrawModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const balance = parseFloat(user?.balancePkr ?? "0");

  const handleWithdraw = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Enter a valid amount");
    if (num > balance) return setError("Insufficient balance");
    setError("");
    // In a real app this would call the withdrawal API
    alert(`Withdrawal request of PKR ${num.toFixed(2)} submitted!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Withdraw (PKR)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Available: <span className="font-bold text-gray-800">PKR {balance.toFixed(2)}</span>
        </p>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter withdrawal amount (PKR)"
          max={balance}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-orange-500 mb-3"
        />

        <button
          onClick={() => setAmount(String(balance))}
          className="text-xs text-blue-600 font-semibold mb-3"
        >
          Withdraw All (PKR {balance.toFixed(2)})
        </button>

        {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

        <button
          onClick={handleWithdraw}
          disabled={!amount}
          className="w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50"
          style={{ background: "#f97316" }}
        >
          Confirm Withdrawal
        </button>
      </div>
    </div>
  );
}
