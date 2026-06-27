import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, lazy, Suspense } from "react";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { checkProStatus } from "@/lib/subscription-utils";
import { clearWalletSigner, setWalletSigner } from "@/lib/wallet-auth";
import { hydrateTradesFromCloud } from "@/lib/sync";
// Eager: the marketing/legal surface that gets prerendered for SEO + first paint.
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";
import GivingPage from "./pages/GivingPage";
// Lazy: the interactive app shell (kept out of the landing-page bundle).
const Index = lazy(() => import("./pages/Index"));
const NewTrade = lazy(() => import("./pages/NewTrade"));
const TradeDetail = lazy(() => import("./pages/TradeDetail"));
const Journal = lazy(() => import("./pages/Journal"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

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

// Exposes the connected wallet's signMessage to the non-React sync path so it can
// prove wallet ownership to the create-trade / get-trades edge functions.
function WalletAuthBridge() {
  const { publicKey, signMessage } = useWallet();

  useEffect(() => {
    if (publicKey && signMessage) {
      setWalletSigner(publicKey.toBase58(), signMessage);
    } else {
      clearWalletSigner();
    }
  }, [publicKey, signMessage]);

  return null;
}

const App = () => {
  // Fire-and-forget cloud hydration once on startup. The persisted trade store
  // rehydrates synchronously from localStorage before this effect runs, so the
  // merge is purely additive on top of the local source of truth.
  useEffect(() => {
    hydrateTradesFromCloud();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <WalletProviderWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProStatusChecker />
          <WalletAuthBridge />
          <Suspense fallback={<div className="min-h-screen bg-[#0e1311]" />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Index />} />
              <Route path="/new-trade" element={<NewTrade />} />
              <Route path="/trade/:id" element={<TradeDetail />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/upgrade/success" element={<UpgradeSuccess />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/giving" element={<GivingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProviderWrapper>
  </QueryClientProvider>
  );
};

export default App;
