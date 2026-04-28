-- Explicit deny policies for UPDATE and DELETE on subscribers.
-- Supabase defaults to deny for uncovered operations when RLS is enabled,
-- but explicit policies make the intent clear and survive future policy changes.

CREATE POLICY "Deny public update on subscribers"
  ON public.subscribers FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny public delete on subscribers"
  ON public.subscribers FOR DELETE
  USING (false);
