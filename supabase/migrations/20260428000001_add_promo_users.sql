-- promo_users table was referenced by edge functions but never existed in migrations.
-- This creates it with full RLS lockdown — only the service role (edge functions) can touch it.

CREATE TABLE IF NOT EXISTS public.promo_users (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text        UNIQUE NOT NULL,
  password_hash  text        NOT NULL,
  session_token  text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.promo_users ENABLE ROW LEVEL SECURITY;

-- Deny all access from the anon/authenticated roles — edge functions use the service role which bypasses RLS
CREATE POLICY "No public access to promo_users"
  ON public.promo_users FOR ALL
  USING (false)
  WITH CHECK (false);
