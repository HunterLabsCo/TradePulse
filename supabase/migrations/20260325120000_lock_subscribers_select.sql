-- Remove public read access on subscribers.
-- All pro-status checks now go through the check-pro-status edge function
-- which uses the service role and only returns data for the requested wallet.
DROP POLICY IF EXISTS "Public read by wallet" ON public.subscribers;
