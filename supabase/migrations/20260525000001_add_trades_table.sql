-- Server-side trade records for free-tier limit enforcement.
-- Trades are also cached client-side in localStorage; this table is the source
-- of truth for counting (prevents DevTools bypass of the 20-trade limit).
CREATE TABLE trades (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text        NOT NULL,
  trade_data     jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trades_wallet_address_idx ON trades (wallet_address);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Service role (used by edge functions) bypasses RLS automatically.
-- Deny all direct anon/authenticated client access.
CREATE POLICY "deny_all_anon"          ON trades FOR ALL TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON trades FOR ALL TO authenticated USING (false);
