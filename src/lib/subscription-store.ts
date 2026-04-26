import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionStore {
  connectedWallet: string | null;
  walletType: string | null;
  isPro: boolean;
  txSignature: string | null;
  promoSession: string | null;
  promoUsername: string | null;
  setWallet: (address: string | null, type: string | null) => void;
  disconnect: () => void;
  setIsPro: (value: boolean) => void;
  setTxSignature: (sig: string | null) => void;
  setPromoSession: (token: string, username: string) => void;
  promoLogout: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      connectedWallet: null,
      walletType: null,
      isPro: false,
      txSignature: null,
      promoSession: null,
      promoUsername: null,
      setWallet: (address, type) =>
        set({ connectedWallet: address, walletType: type }),
      disconnect: () =>
        set({ connectedWallet: null, walletType: null, isPro: false, txSignature: null }),
      setIsPro: (value) => set({ isPro: value }),
      setTxSignature: (sig) => set({ txSignature: sig }),
      setPromoSession: (token, username) =>
        set({ promoSession: token, promoUsername: username, isPro: true }),
      promoLogout: () =>
        set({ promoSession: null, promoUsername: null, isPro: false }),
    }),
    { name: "tradepulse-subscription" }
  )
);
