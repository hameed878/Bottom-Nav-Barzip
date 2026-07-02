import { useState } from "react";
import BannerSlider from "@/components/BannerSlider";
import AnnouncementBar from "@/components/AnnouncementBar";
import UserSection from "@/components/UserSection";
import HotEvents from "@/components/HotEvents";
import LiveMatchCard from "@/components/LiveMatchCard";
import { useFixtures, todayStr } from "@/hooks/useFixtures";
import type { Fixture } from "@/hooks/useFixtures";
import RechargeOnlinePage from "@/pages/RechargeOnlinePage";
import WithdrawPage from "@/pages/WithdrawPage";
import AddUsdtPage from "@/pages/AddUsdtPage";
import WalletPage from "@/pages/WalletPage";
import LuckyWheelPage from "@/pages/LuckyWheelPage";

type SubPage = "home" | "recharge" | "withdraw" | "add-usdt-withdraw" | "wallet" | "lucky-wheel";

interface Props {
  onMatchClick: (fixture: Fixture) => void;
}

function HomeMain({
  onMatchClick,
  onRecharge,
  onWithdraw,
  onWallet,
  onWheelClick,
}: {
  onMatchClick: (fixture: Fixture) => void;
  onRecharge: () => void;
  onWithdraw: () => void;
  onWallet: () => void;
  onWheelClick: () => void;
}) {
  const { fixtures, loading, error } = useFixtures(todayStr());
  const featured = fixtures.slice(0, 5);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f4f5f7" }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="/logo.png" alt="XRT.LLC" className="w-9 h-9 object-contain" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }} />
          </div>
          <span className="text-xs font-semibold text-gray-700">XRT.LLC</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">Version15.1</span>
      </div>

      <BannerSlider />
      <AnnouncementBar />
      <UserSection onRecharge={onRecharge} onWithdraw={onWithdraw} onWallet={onWallet} />
      <HotEvents onWheelClick={onWheelClick} />

      {/* Match section header */}
      <div className="flex items-center justify-between px-3 mt-3 mb-1">
        <span className="text-sm font-bold text-gray-700">Today's Matches</span>
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        )}
      </div>

      {error && (
        <div className="mx-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-700">⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && featured.length === 0 && (
        <div className="mx-3 rounded-xl bg-gray-100 border border-gray-200 px-3 py-4 text-center">
          <p className="text-xs text-gray-400">No matches available today</p>
        </div>
      )}

      <div className="flex flex-col gap-0 px-2 pb-4">
        {featured.map((fixture) => (
          <LiveMatchCard
            key={fixture.id}
            fixture={fixture}
            onClick={() => onMatchClick(fixture)}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage({ onMatchClick }: Props) {
  const [subPage, setSubPage] = useState<SubPage>("home");
  const goHome = () => setSubPage("home");

  if (subPage === "recharge") return <RechargeOnlinePage onBack={goHome} />;
  if (subPage === "withdraw") {
    return (
      <WithdrawPage
        onBack={goHome}
        onAddAddress={() => setSubPage("add-usdt-withdraw")}
      />
    );
  }
  if (subPage === "add-usdt-withdraw") {
    return (
      <AddUsdtPage
        onBack={() => setSubPage("withdraw")}
        onSuccess={() => setSubPage("withdraw")}
      />
    );
  }
  if (subPage === "wallet") {
    return <WalletPage onBack={goHome} onRecharge={() => setSubPage("recharge")} />;
  }
  if (subPage === "lucky-wheel") {
    return <LuckyWheelPage onBack={goHome} />;
  }

  return (
    <HomeMain
      onMatchClick={onMatchClick}
      onRecharge={() => setSubPage("recharge")}
      onWithdraw={() => setSubPage("withdraw")}
      onWallet={() => setSubPage("wallet")}
      onWheelClick={() => setSubPage("lucky-wheel")}
    />
  );
}
