CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  wallet_type text,
  plan text DEFAULT 'lifetime',
  payment_currency text,
  amount_paid numeric,
  transaction_signature text UNIQUE,
  created_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read by wallet"
  ON public.subscribers FOR SELECT
  USING (true);

CREATE POLICY "Service role insert"
  ON public.subscribers FOR INSERT
  WITH CHECK (false);