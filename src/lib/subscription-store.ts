import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionStore {
  connectedWallet: string | null;
  walletType: string | null;
  isPro: boolean;
  txSignature: string | null;
  setWallet: (address: string | null, type: string | null) => void;
  disconnect: () => void;
  setIsPro: (value: boolean) => void;
  setTxSignature: (sig: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      connectedWallet: null,
      walletType: null,
      isPro: false,
      txSignature: null,
      setWallet: (address, type) =>
        set({ connectedWallet: address, walletType: type }),
      disconnect: () =>
        set({ connectedWallet: null, walletType: null, isPro: false, txSignature: null }),
      setIsPro: (value) => set({ isPro: value }),
      setTxSignature: (sig) => set({ txSignature: sig }),
    }),
    { name: "tradepulse-subscription" }
  )
);
