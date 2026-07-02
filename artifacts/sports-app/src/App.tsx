import { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import HomePage from "@/pages/HomePage";
import MatchPage from "@/pages/MatchPage";
import FunctionPage from "@/pages/FunctionPage";
import BetPage from "@/pages/BetPage";
import MePage from "@/pages/MePage";
import MatchDetailPage from "@/pages/MatchDetailPage";
import BetSlipPage from "@/pages/BetSlipPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import BottomNav from "@/components/BottomNav";
import type { Fixture } from "@/hooks/useFixtures";

export type TabType = "home" | "match" | "function" | "bet" | "me";

interface OddRow { score: string; odds: string; }

type View =
  | { type: "tab"; tab: TabType }
  | { type: "match-detail"; fixture: Fixture }
  | { type: "bet-slip"; fixture: Fixture; odd: OddRow };

type AuthScreen = "login" | "register";

function MainApp() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [view, setView] = useState<View>({ type: "tab", tab: "home" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2a6b 60%)" }}>
        <div className="w-10 h-10 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-start min-h-screen bg-gray-900">
        <div className="relative w-full overflow-hidden" style={{ maxWidth: 430, minHeight: "100svh" }}>
          {authScreen === "register"
            ? <RegisterPage onGoLogin={() => setAuthScreen("login")} />
            : <LoginPage onGoRegister={() => setAuthScreen("register")} />}
        </div>
      </div>
    );
  }

  const activeTab: TabType = view.type === "tab" ? view.tab : "match";
  const navigateTo = (fixture: Fixture) => setView({ type: "match-detail", fixture });
  const openBetSlip = (fixture: Fixture, odd: OddRow) => setView({ type: "bet-slip", fixture, odd });
  const goBack = () => setView({ type: "tab", tab: "match" });
  const goBackToDetail = (fixture: Fixture) => setView({ type: "match-detail", fixture });
  const setActiveTab = (tab: TabType) => setView({ type: "tab", tab });

  const renderContent = () => {
    if (view.type === "match-detail") {
      return <MatchDetailPage fixture={view.fixture} onBack={goBack} onBet={(odd) => openBetSlip(view.fixture, odd)} />;
    }
    if (view.type === "bet-slip") {
      return <BetSlipPage fixture={view.fixture} odd={view.odd} onBack={() => goBackToDetail(view.fixture)} />;
    }
    switch (view.tab) {
      case "home":   return <HomePage onMatchClick={navigateTo} />;
      case "match":  return <MatchPage onMatchClick={navigateTo} />;
      case "function": return <FunctionPage />;
      case "bet":    return <BetPage />;
      case "me":     return <MePage />;
    }
  };

  const hideBotNav = view.type === "bet-slip";

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-200">
      <div className="relative w-full bg-gray-50 flex flex-col overflow-hidden" style={{ maxWidth: 430, minHeight: "100svh" }}>
        <div className={`flex-1 overflow-y-auto ${hideBotNav ? "" : "pb-16"}`}>{renderContent()}</div>
        {!hideBotNav && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
