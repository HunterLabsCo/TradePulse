import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Check, ChevronRight } from "lucide-react";
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
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { toast } from "sonner";
import { getReferral } from "@/lib/referral-utils";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionStore } from "@/lib/subscription-store";
import {
  fetchSolPrice,
  truncateAddress,
  USDC_MINT,
  LIFETIME_PRICE_USD,
  getReceivingWallet,
} from "@/lib/subscription-utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type PaymentMethod = "SOL" | "USDC" | null;

const WALLETS = [
  { name: "Phantom", bg: "bg-[#ab9ff2]/10 border-[#ab9ff2]/30" },
  { name: "Solflare", bg: "bg-[#fc8c3c]/10 border-[#fc8c3c]/30" },
  { name: "Backpack", bg: "bg-[#e33e3f]/10 border-[#e33e3f]/30" },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connect, select, wallets, connected } =
    useWallet();
  const { connection } = useConnection();
  const { setWallet, setIsPro, setTxSignature } = useSubscriptionStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [paying, setPaying] = useState(false);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(null);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSolPrice().then(setSolPrice).catch(console.error);
    const interval = setInterval(() => {
      fetchSolPrice().then(setSolPrice).catch(console.error);
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

  // Sync Solana wallet to store so ProStatusChecker picks it up on next load
  useEffect(() => {
    if (publicKey && connectedWalletType) {
      setWallet(publicKey.toBase58(), connectedWalletType);
    }
  }, [publicKey, connectedWalletType, setWallet]);

  const handlePay = useCallback(async () => {
    if (!publicKey || !paymentMethod || paying) return;
    setPaying(true);

    try {
      const receivingPubkey = new PublicKey(getReceivingWallet());

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

        tx = new Transaction();

        // If the receiving wallet has never received USDC its token account
        // won't exist yet. Create it in the same transaction so the transfer
        // doesn't fail on-chain. The user pays the one-time rent (~0.002 SOL).
        try {
          await getAccount(connection, receiverAta);
        } catch {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              receiverAta,
              receivingPubkey,
              usdcMint
            )
          );
        }

        tx.add(createTransferInstruction(senderAta, receiverAta, publicKey, amount));
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
          referral: getReferral(),
        },
      });

      if (error) {
        // Edge function failed (network/timeout) — do NOT grant Pro speculatively.
        // The tx is on-chain; user can contact support with their signature.
        toast.error(
          `Verification failed — your payment is safe. Contact support with your tx: ${signature.slice(0, 8)}…`
        );
        return;
      }

      if (data?.success && data?.verified) {
        // On-chain verification passed
        setIsPro(true);
        setTxSignature(signature);
        navigate("/upgrade/success", {
          state: { txSignature: signature, verified: true },
        });
      } else {
        // Function ran but payment didn't verify (wrong amount, wrong destination, etc.)
        toast.error(
          `Payment verification failed — contact support with tx: ${signature.slice(0, 8)}…`
        );
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

  const isSolanaConnected = connected && publicKey;
  const canPay =
    isSolanaConnected &&
    paymentMethod !== null &&
    !paying &&
    (paymentMethod !== "SOL" || solPrice > 0); // block SOL pay until price loads

  const connectedWalletLabel = isSolanaConnected
    ? connectedWalletType
        ? connectedWalletType.charAt(0).toUpperCase() + connectedWalletType.slice(1)
        : "Wallet"
    : null;

  const connectedAddr = publicKey?.toBase58() || null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0e1311] pb-24">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-[6px] active:scale-[0.96] hover:bg-[#161c19] text-[#8ec2dd]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 px-5 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-sans text-[24px] font-medium text-[#d8e0d2]">
            Upgrade to{" "}
            <span className="text-[#8ec2dd]">TradePulse</span>{" "}
            <span className="text-[#a8d4ad]">Pro</span>
          </h1>
          <p className="font-mono text-[12px] text-[#7a8a75]">
            One payment. Lifetime access. No renewals.
          </p>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod("SOL")}
            className={`rounded-[6px] border p-4 text-center transition-all active:scale-[0.97] ${
              paymentMethod === "SOL"
                ? "border-[#8ec2dd] bg-[rgba(142,194,221,0.08)]"
                : "border-[#222a25] bg-[#161c19] hover:border-[#36413a]"
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a8a75] mb-1">Pay with SOL</p>
            <p className="font-sans text-[20px] font-medium tabular-nums text-[#d8e0d2]">
              {solPrice > 0 ? `≈ ${solAmount.toFixed(3)}` : "—"}
            </p>
            <p className="font-mono text-[11px] text-[#7a8a75]">
              ${LIFETIME_PRICE_USD} USD equivalent
            </p>
          </button>

          <button
            onClick={() => setPaymentMethod("USDC")}
            className={`rounded-[6px] border p-4 text-center transition-all active:scale-[0.97] ${
              paymentMethod === "USDC"
                ? "border-[#8ec2dd] bg-[rgba(142,194,221,0.08)]"
                : "border-[#222a25] bg-[#161c19] hover:border-[#36413a]"
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a8a75] mb-1">Pay with USDC</p>
            <p className="font-sans text-[20px] font-medium tabular-nums text-[#d8e0d2]">
              99
            </p>
            <p className="font-mono text-[11px] text-[#7a8a75]">
              USDC (fixed)
            </p>
          </button>
        </div>

        {/* Giving Back */}
        <div className="rounded-[6px] border border-[rgba(168,212,173,0.25)] bg-[rgba(168,212,173,0.05)] px-4 py-3 space-y-1.5">
          <p className="font-mono text-[10px] font-medium text-[#a8d4ad] uppercase tracking-[0.14em]">Giving Back</p>
          <p className="font-mono text-[12px] text-[#7a8a75] leading-relaxed">
            <span className="text-[#d8e0d2]">50% of every Pro subscription</span> is donated to three organizations in Connecticut:
          </p>
          <ul className="space-y-1">
            {[
              "St. Anthony's Church — Prospect, CT (handicapped elevator fund & renovations)",
              "Knights of Columbus Council 13459 — Prospect, CT",
              "St. Vincent DePaul Mission Soup Kitchen — Waterbury, CT",
            ].map((org) => (
              <li key={org} className="flex items-start gap-1.5 font-mono text-[11px] text-[#7a8a75]">
                <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-[2px] bg-[#a8d4ad]/60" />
                {org}
              </li>
            ))}
          </ul>
        </div>

        {/* Connect Wallet / Connected status */}
        {isSolanaConnected ? (
          <button
            onClick={() => setWalletDrawerOpen(true)}
            className="flex w-full items-center justify-between rounded-[6px] border border-[#222a25] bg-[#161c19] px-4 py-3.5 transition-all active:scale-[0.97]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(142,194,221,0.12)]">
                <Wallet className="h-4 w-4 text-[#8ec2dd]" />
              </div>
              <div className="text-left">
                <p className="font-sans text-[13px] font-medium text-[#d8e0d2]">
                  {connectedWalletLabel}
                </p>
                <p className="font-mono text-[11px] text-[#7a8a75]">
                  {truncateAddress(connectedAddr || "")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#a8d4ad]" />
              <span className="font-mono text-[11px] text-[#7a8a75]">Connected</span>
              <ChevronRight className="h-4 w-4 text-[#7a8a75]" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setWalletDrawerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#222a25] bg-[#161c19] py-4 font-sans text-[14px] font-medium text-[#d8e0d2] transition-all active:scale-[0.97] hover:border-[#8ec2dd]"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        )}

        {/* Pay Button — only show when payment method is selected and wallet connected */}
        {canPay && (
          <button
            onClick={handlePay}
            className="flex w-full items-center justify-center gap-2 rounded-[6px] py-4 font-sans text-[15px] font-medium transition-all active:scale-[0.97] bg-[#8ec2dd] text-[#0e1311] shadow-[0_8px_32px_-8px_rgba(142,194,221,0.4)]"
          >
            {paying ? (
              <span className="animate-pulse">Processing…</span>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                {paymentMethod === "SOL"
                  ? `Pay ≈ ${solAmount.toFixed(3)} SOL`
                  : "Pay 99 USDC"}
              </>
            )}
          </button>
        )}
      </div>

      {/* Wallet Selection Drawer */}
      <Drawer open={walletDrawerOpen} onOpenChange={setWalletDrawerOpen}>
        <DrawerContent className="bg-[#0e1311] border-t border-[#222a25] pb-safe-bottom">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-sans text-[17px] font-medium text-[#d8e0d2]">
              Choose Wallet
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              {WALLETS.map(({ name, bg }) => {
                const isThisConnected =
                  name.toLowerCase() === connectedWalletType && isSolanaConnected;
                const icon = wallets.find(
                  (w) => w.adapter.name.toLowerCase() === name.toLowerCase()
                )?.adapter.icon;

                return (
                  <button
                    key={name}
                    onClick={() => connectSolanaWallet(name)}
                    className={`relative flex flex-col items-center justify-center gap-2 rounded-[10px] border p-5 transition-all active:scale-[0.96] ${bg}`}
                  >
                    {isThisConnected && (
                      <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8ec2dd]">
                        <Check className="h-2.5 w-2.5 text-[#0e1311]" />
                      </div>
                    )}
                    {icon ? (
                      <img src={icon} alt={name} className="h-12 w-12 rounded-[10px]" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#222a25]">
                        <Wallet className="h-6 w-6 text-[#7a8a75]" />
                      </div>
                    )}
                    <span className="font-sans text-[13px] font-medium text-[#d8e0d2]">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
