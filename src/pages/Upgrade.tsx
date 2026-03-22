import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Check, AlertCircle, ChevronRight } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import { BrowserProvider } from "ethers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionStore } from "@/lib/subscription-store";
import {
  fetchSolPrice,
  truncateAddress,
  USDC_MINT,
  LIFETIME_PRICE_USD,
  RECEIVING_WALLET,
} from "@/lib/subscription-utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type PaymentMethod = "SOL" | "USDC" | null;

const WALLETS = [
  { name: "Phantom", color: "bg-[#ab9ff2]", type: "solana" },
  { name: "Solflare", color: "bg-[#fc8c3c]", type: "solana" },
  { name: "Backpack", color: "bg-[#e33e3f]", type: "solana" },
  { name: "MetaMask", color: "bg-[#f6851b]", type: "ethereum" },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connect, select, wallets, connected } =
    useWallet();
  const { connection } = useConnection();
  const { setWallet, setIsPro, setTxSignature } = useSubscriptionStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [ethWallet, setEthWallet] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(null);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSolPrice().then(setSolPrice);
    const interval = setInterval(() => {
      fetchSolPrice().then(setSolPrice);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const solAmount = solPrice > 0 ? LIFETIME_PRICE_USD / solPrice : 0;

  const connectSolanaWallet = useCallback(
    async (walletName: string) => {
      const adapter = wallets.find(
        (w) => w.adapter.name.toLowerCase() === walletName.toLowerCase()
      );
      if (adapter) {
        select(adapter.adapter.name);
        try {
          await connect();
          setConnectedWalletType(walletName.toLowerCase());
          setWalletDrawerOpen(false);
        } catch {
          // user rejected
        }
      }
    },
    [wallets, select, connect]
  );

  const connectMetaMask = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      toast.error("MetaMask not detected — please install it first.");
      return;
    }
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setEthWallet(addr);
      setConnectedWalletType("metamask");
      setWalletDrawerOpen(false);
    } catch {
      toast.error("MetaMask connection rejected.");
    }
  }, []);

  // Sync Solana wallet state
  useEffect(() => {
    if (publicKey && connectedWalletType && connectedWalletType !== "metamask") {
      setWallet(publicKey.toBase58(), connectedWalletType);
    }
  }, [publicKey, connectedWalletType, setWallet]);

  const handlePay = useCallback(async () => {
    if (!publicKey || !paymentMethod || paying) return;
    setPaying(true);

    try {
      const receivingPubkey = new PublicKey(RECEIVING_WALLET);

      let tx: Transaction;

      if (paymentMethod === "SOL") {
        const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
        tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: receivingPubkey,
            lamports,
          })
        );
      } else {
        const usdcMint = new PublicKey(USDC_MINT);
        const senderAta = await getAssociatedTokenAddress(usdcMint, publicKey);
        const receiverAta = await getAssociatedTokenAddress(
          usdcMint,
          receivingPubkey
        );
        const amount = 99_000_000;

        tx = new Transaction().add(
          createTransferInstruction(senderAta, receiverAta, publicKey, amount)
        );
      }

      const signature = await sendTransaction(tx, connection);

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });

      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: {
          txSignature: signature,
          walletAddress: publicKey.toBase58(),
          walletType: connectedWalletType,
          paymentCurrency: paymentMethod,
          expectedAmount: paymentMethod === "USDC" ? 99 : solAmount,
        },
      });

      if (error) {
        toast.warning(
          "Payment received but verification pending — please contact support."
        );
        setIsPro(true);
        setTxSignature(signature);
        navigate("/upgrade/success", {
          state: { txSignature: signature, verified: false },
        });
        return;
      }

      if (data?.success) {
        setIsPro(true);
        setTxSignature(signature);
        navigate("/upgrade/success", {
          state: { txSignature: signature, verified: data.verified },
        });
      }
    } catch (err: any) {
      if (
        err?.message?.includes("User rejected") ||
        err?.message?.includes("rejected")
      ) {
        toast.error("Transaction cancelled.");
      } else if (err?.message?.includes("insufficient")) {
        toast.error("Insufficient balance — please add funds and try again.");
      } else {
        toast.error("Transaction failed — please try again.");
      }
    } finally {
      setPaying(false);
    }
  }, [
    publicKey,
    paymentMethod,
    paying,
    solAmount,
    connection,
    sendTransaction,
    connectedWalletType,
    setIsPro,
    setTxSignature,
    navigate,
  ]);

  const isMetaMaskConnected = ethWallet !== null;
  const isSolanaConnected = connected && publicKey;
  const isAnyConnected = isSolanaConnected || isMetaMaskConnected;
  const canPay = isSolanaConnected && paymentMethod !== null && !paying;

  const connectedWalletLabel = isAnyConnected
    ? connectedWalletType
        ? connectedWalletType.charAt(0).toUpperCase() + connectedWalletType.slice(1)
        : "Wallet"
    : null;

  const connectedAddr = connectedWalletType === "metamask"
    ? ethWallet
    : publicKey?.toBase58() || null;

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.96] hover:bg-card text-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 px-5 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-[24px] font-[800] text-foreground">
            Upgrade to{" "}
            <span className="text-primary">TradePulse</span>{" "}
            <span className="text-[hsl(var(--blue-accent))]">Pro</span>
          </h1>
          <p className="font-body text-[13px] font-light text-muted-foreground">
            One payment. Lifetime access. No renewals.
          </p>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod("SOL")}
            className={`rounded-xl border p-4 text-center transition-all active:scale-[0.97] ${
              paymentMethod === "SOL"
                ? "border-primary bg-[hsl(var(--green-primary)/0.08)]"
                : "border-border bg-card hover:border-[hsl(var(--border-default))]"
            }`}
          >
            <p className="section-label mb-1">Pay with SOL</p>
            <p className="font-display text-[20px] font-bold tabular-nums text-foreground">
              {solPrice > 0 ? `≈ ${solAmount.toFixed(3)}` : "—"}
            </p>
            <p className="font-body text-[11px] font-light text-muted-foreground">
              ${LIFETIME_PRICE_USD} USD equivalent
            </p>
          </button>

          <button
            onClick={() => setPaymentMethod("USDC")}
            className={`rounded-xl border p-4 text-center transition-all active:scale-[0.97] ${
              paymentMethod === "USDC"
                ? "border-primary bg-[hsl(var(--green-primary)/0.08)]"
                : "border-border bg-card hover:border-[hsl(var(--border-default))]"
            }`}
          >
            <p className="section-label mb-1">Pay with USDC</p>
            <p className="font-display text-[20px] font-bold tabular-nums text-foreground">
              99
            </p>
            <p className="font-body text-[11px] font-light text-muted-foreground">
              USDC (fixed)
            </p>
          </button>
        </div>

        {/* MetaMask notice */}
        {isMetaMaskConnected && connectedWalletType === "metamask" && (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--blue-accent))]" />
            <p className="font-body text-[12px] font-light text-muted-foreground">
              ETH payments coming soon. Connect a Solana wallet to pay now.
            </p>
          </div>
        )}

        {/* Connect Wallet / Connected status */}
        {isAnyConnected ? (
          <button
            onClick={() => setWalletDrawerOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-all active:scale-[0.97]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--green-primary)/0.12)]">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-body text-[13px] font-semibold text-foreground">
                  {connectedWalletLabel}
                </p>
                <p className="font-body text-[11px] font-light text-muted-foreground">
                  {truncateAddress(connectedAddr || "")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-body text-[11px] text-muted-foreground">Connected</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setWalletDrawerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-body text-[14px] font-semibold text-foreground transition-all active:scale-[0.97] hover:border-primary/50"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        )}

        {/* Pay Button */}
        <button
          disabled={!canPay}
          onClick={handlePay}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-[15px] font-bold transition-all active:scale-[0.97] ${
            canPay
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--green-primary)/0.3)]"
              : "bg-[hsl(var(--bg-elevated))] text-muted-foreground cursor-not-allowed"
          }`}
        >
          {paying ? (
            <span className="animate-pulse">Processing…</span>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              {paymentMethod === "SOL"
                ? `Pay ≈ ${solAmount.toFixed(3)} SOL`
                : paymentMethod === "USDC"
                ? "Pay 99 USDC"
                : "Select payment method"}
            </>
          )}
        </button>
      </div>

      {/* Wallet Selection Drawer */}
      <Drawer open={walletDrawerOpen} onOpenChange={setWalletDrawerOpen}>
        <DrawerContent className="pb-safe-bottom">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-display text-[17px] font-bold text-foreground">
              Choose Wallet
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {WALLETS.map(({ name, color, type }) => {
              const isThisConnected =
                (name.toLowerCase() === connectedWalletType && isSolanaConnected) ||
                (name === "MetaMask" && isMetaMaskConnected);

              return (
                <button
                  key={name}
                  onClick={() =>
                    type === "ethereum"
                      ? connectMetaMask()
                      : connectSolanaWallet(name)
                  }
                  className={`flex w-full items-center justify-between rounded-xl ${color} px-4 py-3.5 font-body text-[13px] font-semibold text-white shadow-md active:scale-[0.97] transition-transform`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>{name}</span>
                  </div>
                  {isThisConnected && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-white/80" />
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
