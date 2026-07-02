import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import meRechargeImg from "@assets/recharge1_1782818939082.png";
import meWithdrawImg from "@assets/withdraw1_1782818948081.png";
import meRechargeHistoryImg from "@assets/recharge_history_1782819022148.png";
import meWithdrawHistoryImg from "@assets/withdraw_history_1782819033091.png";
import SecurityCenterPage from "@/pages/SecurityCenterPage";
import UsdtAddressPage from "@/pages/UsdtAddressPage";
import AddUsdtPage from "@/pages/AddUsdtPage";
import WithdrawPage from "@/pages/WithdrawPage";
import WithdrawHistoryPage from "@/pages/WithdrawHistoryPage";
import RechargeOnlinePage from "@/pages/RechargeOnlinePage";
import WalletRechargePage from "@/pages/WalletRechargePage";
import RechargeHistoryPage from "@/pages/RechargeHistoryPage";
import InvitationCenterPage from "@/pages/InvitationCenterPage";
import OnlineServicePage from "@/pages/OnlineServicePage";

type SubPage = "me" | "security-center" | "usdt-address" | "add-usdt" | "withdraw" | "add-usdt-from-withdraw" | "withdraw-history" | "recharge" | "wallet-recharge" | "recharge-history" | "qr-code" | "online-service";

const menuItems = [
  {
    id: "security",
    label: "Security Center",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-500">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "qr",
    label: "My QR Code",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-500">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
        <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
        <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
        <path d="M14 14h3v3M17 17v3h3M14 17h1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "service",
    label: "Online service",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-500">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "download",
    label: "App Download",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-500">
        <path d="M12 3v13M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 19h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "logout",
    label: "Sign Out",
    isLogout: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-500">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
];

function MeHome({
  onSecurityCenter,
  onQrCode,
  onOnlineService,
  onWithdraw,
  onWithdrawHistory,
  onRecharge,
  onRechargeHistory,
}: {
  onSecurityCenter: () => void;
  onQrCode: () => void;
  onOnlineService: () => void;
  onWithdraw: () => void;
  onWithdrawHistory: () => void;
  onRecharge: () => void;
  onRechargeHistory: () => void;
}) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const balance = parseFloat(user.balancePkr).toFixed(2);
  const totalTrade = parseFloat(user.totalTrade).toFixed(2);
  const frozenTrade = parseFloat(user.frozenTrade).toFixed(2);

  const handleItem = (id: string) => {
    if (id === "security") onSecurityCenter();
    else if (id === "qr") onQrCode();
    else if (id === "service") onOnlineService();
    else if (id === "logout") logout();
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f0f2f5" }}>
      {/* Dark header */}
      <div
        className="relative px-5 pt-10 pb-8"
        style={{ background: "linear-gradient(160deg, #0d1b3e 0%, #1a3a6e 50%, #0d2a5e 100%)", minHeight: 160 }}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.5) 0%, transparent 60%)" }} />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-white/70 shrink-0" style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.15)" }}>
            <img src="/ronaldo.jpg" alt="Ronaldo" className="w-full h-full object-cover object-top" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded text-white w-fit" style={{ background: "#f59e0b" }}>
              VIP{user.vipLevel}
            </span>
            <span className="text-white font-bold text-xl">{user.username}</span>
            <span className="text-white/50 text-xs">Referral: {user.referralCode}</span>
          </div>
        </div>
      </div>

      {/* Trades stats */}
      <div className="mx-4 -mt-4 rounded-2xl px-5 py-4 shadow-md relative z-10" style={{ background: "linear-gradient(135deg, #1a3a6e 0%, #0d2a5e 100%)" }}>
        <div className="flex gap-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium" style={{ color: "#93c5fd" }}>Trades frozen</span>
            <span className="text-base font-bold" style={{ color: "#38bdf8" }}>{frozenTrade}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium" style={{ color: "#93c5fd" }}>Total Trade</span>
            <span className="text-base font-bold" style={{ color: "#38bdf8" }}>{totalTrade}</span>
          </div>
        </div>
      </div>

      {/* Account balance */}
      <div className="mx-4 mt-3 bg-white rounded-2xl px-5 py-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">Account Balance</p>
        <p className="text-2xl font-bold text-gray-900">
          {balance} <span className="text-gray-500 font-semibold">≈ {balance}</span>{" "}
          <span className="text-gray-700 font-bold">(PKR)</span>
        </p>
      </div>

      {/* Action buttons */}
      <div className="mx-4 mt-3 bg-white rounded-2xl px-4 py-5 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          <button onClick={onRecharge} className="flex flex-col items-center gap-2">
            <img src={meRechargeImg} alt="Recharge" className="w-14 h-auto rounded-lg drop-shadow-md" />
            <span className="text-xs text-gray-600 font-semibold">Recharge</span>
          </button>

          <button onClick={onWithdraw} className="flex flex-col items-center gap-2">
            <img src={meWithdrawImg} alt="Withdraw" className="w-14 h-auto rounded-lg drop-shadow-md" />
            <span className="text-xs text-gray-600 font-semibold">Withdraw</span>
          </button>

          <button onClick={onRechargeHistory} className="flex flex-col items-center gap-2">
            <img src={meRechargeHistoryImg} alt="Recharge History" className="w-14 h-auto rounded-lg drop-shadow-md" />
            <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">Recharge<br />History</span>
          </button>

          <button onClick={onWithdrawHistory} className="flex flex-col items-center gap-2">
            <img src={meWithdrawHistoryImg} alt="Withdraw History" className="w-14 h-auto rounded-lg drop-shadow-md" />
            <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">Withdraw<br />History</span>
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {menuItems.map((item, i) => (
          <button
            key={item.id}
            onClick={() => handleItem(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 text-left active:bg-gray-50 transition-colors ${i !== menuItems.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className={`flex-1 text-sm font-medium ${item.isLogout ? "text-red-500" : "text-gray-700"}`}>{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 shrink-0">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

    </div>
  );
}

export default function MePage() {
  const [subPage, setSubPage] = useState<SubPage>("me");

  if (subPage === "security-center") {
    return (
      <SecurityCenterPage
        onBack={() => setSubPage("me")}
        onUsdtAddress={() => setSubPage("usdt-address")}
      />
    );
  }

  if (subPage === "usdt-address") {
    return (
      <UsdtAddressPage
        onBack={() => setSubPage("security-center")}
        onAdd={() => setSubPage("add-usdt")}
      />
    );
  }

  if (subPage === "add-usdt") {
    return (
      <AddUsdtPage
        onBack={() => setSubPage("usdt-address")}
        onSuccess={() => setSubPage("usdt-address")}
      />
    );
  }

  if (subPage === "withdraw") {
    return (
      <WithdrawPage
        onBack={() => setSubPage("me")}
        onAddAddress={() => setSubPage("add-usdt-from-withdraw")}
      />
    );
  }

  if (subPage === "add-usdt-from-withdraw") {
    return (
      <AddUsdtPage
        onBack={() => setSubPage("withdraw")}
        onSuccess={() => setSubPage("withdraw")}
      />
    );
  }

  if (subPage === "withdraw-history") {
    return <WithdrawHistoryPage onBack={() => setSubPage("me")} />;
  }

  if (subPage === "recharge") {
    return <RechargeOnlinePage onBack={() => setSubPage("me")} />;
  }

  if (subPage === "wallet-recharge") {
    return <WalletRechargePage onBack={() => setSubPage("me")} />;
  }

  if (subPage === "recharge-history") {
    return <RechargeHistoryPage onBack={() => setSubPage("me")} />;
  }

  if (subPage === "qr-code") {
    return <InvitationCenterPage onBack={() => setSubPage("me")} />;
  }

  if (subPage === "online-service") {
    return <OnlineServicePage onBack={() => setSubPage("me")} />;
  }

  return (
    <MeHome
      onSecurityCenter={() => setSubPage("security-center")}
      onQrCode={() => setSubPage("qr-code")}
      onOnlineService={() => setSubPage("online-service")}
      onWithdraw={() => setSubPage("withdraw")}
      onWithdrawHistory={() => setSubPage("withdraw-history")}
      onRecharge={() => setSubPage("recharge")}
      onRechargeHistory={() => setSubPage("recharge-history")}
    />
  );
}
