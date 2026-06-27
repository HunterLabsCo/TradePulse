import { webcrypto } from "node:crypto";
import { describe, it, expect, beforeEach } from "vitest";
import bs58 from "bs58";
import {
  buildWalletAuth,
  buildSyncWalletFields,
  setWalletSigner,
  clearWalletSigner,
} from "@/lib/wallet-auth";

const subtle = webcrypto.subtle;

// A real Ed25519 keypair whose raw public key (32 bytes) is base58-encoded into a
// Solana-style address, plus a signer mirroring the wallet adapter's signMessage.
async function makeWallet() {
  const kp = (await subtle.generateKey("Ed25519", true, ["sign", "verify"])) as CryptoKeyPair;
  const rawPub = new Uint8Array(await subtle.exportKey("raw", kp.publicKey));
  const address = bs58.encode(rawPub);
  let calls = 0;
  const signMessage = async (msg: Uint8Array) => {
    calls++;
    return new Uint8Array(await subtle.sign("Ed25519", kp.privateKey, msg));
  };
  return { address, publicKey: kp.publicKey, signMessage, calls: () => calls };
}

// Mirror of the edge function's verifyWalletSignature so the test proves the
// client pipeline produces a server-acceptable proof.
async function serverVerify(publicKey: CryptoKey, wallet: string, message: string, signature: string, ts: number) {
  if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false;
  if (message !== `TradePulse sync\nwallet:${wallet}\nts:${ts}`) return false;
  const sig = bs58.decode(signature);
  if (sig.length !== 64) return false;
  return subtle.verify("Ed25519", publicKey, sig, new TextEncoder().encode(message));
}

describe("wallet-auth", () => {
  beforeEach(() => clearWalletSigner());

  it("returns null when no signer is registered", async () => {
    expect(await buildWalletAuth("SomeWalletAddress")).toBeNull();
  });

  it("returns null when the registered signer is for a different wallet", async () => {
    const a = await makeWallet();
    const b = await makeWallet();
    setWalletSigner(a.address, a.signMessage);
    expect(await buildWalletAuth(b.address)).toBeNull();
  });

  it("builds the canonical message and a server-verifiable signature", async () => {
    const w = await makeWallet();
    setWalletSigner(w.address, w.signMessage);

    const auth = await buildWalletAuth(w.address);
    expect(auth).not.toBeNull();
    expect(auth!.walletAddress).toBe(w.address);
    expect(auth!.message).toBe(`TradePulse sync\nwallet:${w.address}\nts:${auth!.ts}`);
    expect(await serverVerify(w.publicKey, auth!.walletAddress, auth!.message, auth!.signature, auth!.ts)).toBe(true);
  });

  it("caches the signature so a burst of calls only prompts once", async () => {
    const w = await makeWallet();
    setWalletSigner(w.address, w.signMessage);

    const first = await buildWalletAuth(w.address);
    const second = await buildWalletAuth(w.address);
    expect(second).toEqual(first);
    expect(w.calls()).toBe(1);
  });

  it("returns null and falls back to {} when signing throws (user rejects)", async () => {
    const reject = async () => {
      throw new Error("User rejected");
    };
    setWalletSigner("RejectingWallet", reject);
    expect(await buildWalletAuth("RejectingWallet")).toBeNull();
    expect(await buildSyncWalletFields("RejectingWallet")).toEqual({});
  });

  it("buildSyncWalletFields returns {} when no wallet is connected", async () => {
    expect(await buildSyncWalletFields(undefined)).toEqual({});
    expect(await buildSyncWalletFields(null)).toEqual({});
  });
});
