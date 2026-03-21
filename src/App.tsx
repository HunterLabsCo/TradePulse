import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import NewTrade from "./pages/NewTrade";
import TradeDetail from "./pages/TradeDetail";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import Paywall from "./pages/Paywall";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/new-trade" element={<NewTrade />} />
          <Route path="/trade/:id" element={<TradeDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
