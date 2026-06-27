import { describe, it, expect, beforeEach } from "vitest";
import bs58 from "bs58";
import {
  buildSyncMessage,
  buildWalletAuth,
  registerWalletSigner,
} from "@/lib/wallet-signer";

describe("buildSyncMessage", () => {
  it("produces the exact canonical format the server reconstructs", () => {
    expect(buildSyncMessage("ABC", 123)).toBe("TradePulse sync\nwallet:ABC\nts:123");
  });
});

describe("buildWalletAuth", () => {
  beforeEach(() => {
    registerWalletSigner(null);
  });

  it("returns null when no signer is registered", async () => {
    expect(await buildWalletAuth("WALLET")).toBeNull();
  });

  it("returns null when the signer rejects (user declines)", async () => {
    registerWalletSigner(() => Promise.reject(new Error("User rejected")));
    expect(await buildWalletAuth("WALLET")).toBeNull();
  });

  it("signs the canonical message and base58-encodes the signature", async () => {
    const fixedSig = new Uint8Array(64).fill(7);
    let signedBytes: Uint8Array | null = null;
    registerWalletSigner((msg) => {
      signedBytes = msg;
      return Promise.resolve(fixedSig);
    });

    const auth = await buildWalletAuth("WALLET");
    expect(auth).not.toBeNull();
    expect(typeof auth!.ts).toBe("number");
    expect(auth!.message).toBe(`TradePulse sync\nwallet:WALLET\nts:${auth!.ts}`);
    expect(auth!.signature).toBe(bs58.encode(fixedSig));
    expect(new TextDecoder().decode(signedBytes!)).toBe(auth!.message);
  });

  it("signs only once for a burst of calls and reuses the cached auth", async () => {
    let calls = 0;
    registerWalletSigner(() => {
      calls += 1;
      return Promise.resolve(new Uint8Array(64).fill(3));
    });

    const results = await Promise.all([
      buildWalletAuth("WALLET"),
      buildWalletAuth("WALLET"),
      buildWalletAuth("WALLET"),
      buildWalletAuth("WALLET"),
      buildWalletAuth("WALLET"),
    ]);

    expect(calls).toBe(1);
    for (const r of results) {
      expect(r).toEqual(results[0]);
    }
  });

  it("re-signs after the signer is re-registered (disconnect/change clears cache)", async () => {
    let calls = 0;
    const signer = () => {
      calls += 1;
      return Promise.resolve(new Uint8Array(64).fill(5));
    };

    registerWalletSigner(signer);
    await buildWalletAuth("WALLET");
    expect(calls).toBe(1);

    registerWalletSigner(signer);
    await buildWalletAuth("WALLET");
    expect(calls).toBe(2);
  });

  it("caches per wallet so distinct wallets each sign", async () => {
    let calls = 0;
    registerWalletSigner(() => {
      calls += 1;
      return Promise.resolve(new Uint8Array(64).fill(9));
    });

    await buildWalletAuth("WALLET_A");
    await buildWalletAuth("WALLET_B");
    await buildWalletAuth("WALLET_A");

    expect(calls).toBe(2);
  });
});
