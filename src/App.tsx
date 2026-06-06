import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, type ReactNode } from "react";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { checkProStatus } from "@/lib/subscription-utils";
import { supabase } from "@/integrations/supabase/client";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NewTrade from "./pages/NewTrade";
import TradeDetail from "./pages/TradeDetail";
import Journal from "./pages/Journal";
import SettingsPage from "./pages/SettingsPage";
import Upgrade from "./pages/Upgrade";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";
import GivingPage from "./pages/GivingPage";

const queryClient = new QueryClient();

function ProStatusChecker() {
  const { connectedWallet, setIsPro, setTxSignature } = useSubscriptionStore();

  useEffect(() => {
    if (connectedWallet) {
      checkProStatus(connectedWallet)
        .then(({ isPro, txSignature }) => {
          setIsPro(isPro);
          if (txSignature) setTxSignature(txSignature);
        })
        .catch((err) => console.error("[ProStatus] Failed to check:", err));
    }
  }, [connectedWallet, setIsPro, setTxSignature]);

  return null;
}

// Blocks promo-session users from reaching the admin panel
function AdminGuard({ children }: { children: ReactNode }) {
  const promoSession = useSubscriptionStore((s) => s.promoSession);
  if (promoSession) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PromoStatusChecker() {
  const { promoSession, setIsPro, promoLogout } = useSubscriptionStore();

  useEffect(() => {
    if (!promoSession) return;

    const verify = () => {
      supabase.functions
        .invoke("promo-auth", { body: { action: "verify", token: promoSession } })
        .then(({ data, error }) => {
          // Only act on a definitive response. A transient error (network/5xx)
          // must NOT log the user out — re-check on the next interval instead.
          if (error || !data) return;
          if (data.valid) {
            setIsPro(true);
          } else {
            promoLogout();
          }
        })
        .catch(() => {
          /* transient failure — keep the session and retry next interval */
        });
    };

    verify();
    // Re-verify periodically so an expired or revoked token can't stay valid
    // client-side while the app is left open for days.
    const interval = setInterval(verify, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [promoSession, setIsPro, promoLogout]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProviderWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProStatusChecker />
          <PromoStatusChecker />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Index />} />
            <Route path="/new-trade" element={<NewTrade />} />
            <Route path="/trade/:id" element={<TradeDetail />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/upgrade/success" element={<UpgradeSuccess />} />
            <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/giving" element={<GivingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </WalletProviderWrapper>
  </QueryClientProvider>
);

export default App;
