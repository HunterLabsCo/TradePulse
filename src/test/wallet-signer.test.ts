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
});
