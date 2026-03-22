import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { BottomNav } from "@/components/BottomNav";
import { useEffect } from "react";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { checkProStatus } from "@/lib/subscription-utils";
import Index from "./pages/Index";
import NewTrade from "./pages/NewTrade";
import TradeDetail from "./pages/TradeDetail";
import Journal from "./pages/Journal";
import SettingsPage from "./pages/SettingsPage";
import Upgrade from "./pages/Upgrade";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProStatusChecker() {
  const { connectedWallet, setIsPro, setTxSignature } = useSubscriptionStore();

  useEffect(() => {
    if (connectedWallet) {
      checkProStatus(connectedWallet).then(({ isPro, txSignature }) => {
        setIsPro(isPro);
        if (txSignature) setTxSignature(txSignature);
      });
    }
  }, [connectedWallet, setIsPro, setTxSignature]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <>
      <ProStatusChecker />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/new-trade" element={<NewTrade />} />
        <Route path="/trade/:id" element={<TradeDetail />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/upgrade/success" element={<UpgradeSuccess />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProviderWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </WalletProviderWrapper>
  </QueryClientProvider>
);

export default App;
