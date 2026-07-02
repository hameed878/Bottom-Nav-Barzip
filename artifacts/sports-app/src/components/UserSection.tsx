import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import rechargeImg from "@assets/recharge1_1782813652136.png";
import withdrawImg from "@assets/withdraw1_1782813734214.png";
import walletImg from "@assets/wallet1_1782813747357.png";
import servicesImg from "@assets/services1_1782813761705.png";
import OnlineServicePage from "@/pages/OnlineServicePage";

interface Props {
  onRecharge: () => void;
  onWithdraw: () => void;
  onWallet: () => void;
}

export default function UserSection({ onRecharge, onWithdraw, onWallet }: Props) {
  const { user } = useAuth();
  const [serviceOpen, setServiceOpen] = useState(false);

  const actions = [
    {
      label: "Recharge",
      onClick: onRecharge,
      icon: <img src={rechargeImg} alt="Recharge" className="w-11 h-auto rounded-lg drop-shadow-md" />,
    },
    {
      label: "Withdraw",
      onClick: onWithdraw,
      icon: <img src={withdrawImg} alt="Withdraw" className="w-11 h-auto rounded-lg drop-shadow-md" />,
    },
    {
      label: "Wallet",
      onClick: onWallet,
      icon: <img src={walletImg} alt="Wallet" className="w-11 h-auto rounded-lg drop-shadow-md" />,
    },
    {
      label: "Online\nservice",
      onClick: () => setServiceOpen(true),
      icon: <img src={servicesImg} alt="Online service" className="w-11 h-auto rounded-lg drop-shadow-md" />,
    },
  ];

  const balance = user ? parseFloat(user.balancePkr).toFixed(2) : "0.00";
  const vipLevel = user?.vipLevel ?? 0;
  const username = user?.username ?? "—";

  return (
    <div className="bg-white mx-2 mt-2 rounded-xl p-3 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Left: user info */}
        <div className="flex flex-col gap-1 min-w-[100px]">
          <div className="flex items-center gap-1">
            <span className="bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              VIP{vipLevel}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{username}</span>
          <span className="text-lg font-bold text-gray-900">{balance}</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {actions.map((action) => (
            <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-1 active:opacity-70">
              {action.icon}
              <span className="text-[10px] text-gray-600 text-center leading-tight whitespace-pre-line">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      {serviceOpen && (
        <div
          className="fixed top-0 bottom-0 z-50 bg-white overflow-y-auto"
          style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430 }}
        >
          <OnlineServicePage onBack={() => setServiceOpen(false)} />
        </div>
      )}
    </div>
  );
}
