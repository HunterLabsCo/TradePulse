import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Trade, SAMPLE_TRADES } from "./sample-data";

interface TradeStore {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  deleteAllTrades: () => void;
  getTradeById: (id: string) => Trade | undefined;
  getTradeCount: () => number;
  getNonDemoTradeCount: () => number;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      addTrade: (trade) =>
        set((s) => ({
          trades: trade.isDemo
            ? [trade, ...s.trades]
            : [trade, ...s.trades.filter((t) => !t.isDemo)],
        })),
      updateTrade: (id, updates) =>
        set((s) => ({
          trades: s.trades.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTrade: (id) =>
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
      deleteAllTrades: () => set({ trades: [] }),
      getTradeById: (id) => get().trades.find((t) => t.id === id),
      getTradeCount: () => get().trades.length,
      getNonDemoTradeCount: () =>
        get().trades.filter((t) => !t.isDemo).length,
    }),
    { name: "tradesnap-trades" }
  )
);
