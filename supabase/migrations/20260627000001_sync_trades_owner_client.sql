-- Sync repo trades schema with the live DB. The original add_trades_table
-- migration predates the multi-device owner/client model: live has since added
-- owner_id/client_id, made wallet_address nullable (anonymous trades), and added
-- the indexes that back create-trade's (owner_id, client_id) upsert and
-- owner_id lookups. These ran directly against prod and were never committed, so
-- a fresh project/preview branch couldn't reproduce it. Idempotent: safe to run
-- against live, which already has every object below.
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS owner_id text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE public.trades ALTER COLUMN wallet_address DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trades_owner_client_uniq ON public.trades (owner_id, client_id);
CREATE INDEX IF NOT EXISTS trades_owner_idx ON public.trades (owner_id);
