-- Add banned field to subscribers
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean DEFAULT true,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags (app uses them at runtime)
CREATE POLICY "Public read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Only service role can write (via edge function)
CREATE POLICY "Service role write feature flags"
  ON public.feature_flags FOR ALL
  USING (false)
  WITH CHECK (false);

-- Seed default flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('voice_transcription', true,   'Enable voice-to-text trade logging'),
  ('paywall_enabled',     true,   'Enforce the 20-trade free limit / paywall'),
  ('new_user_onboarding', true,   'Show onboarding flow for new users'),
  ('maintenance_mode',    false,  'Show maintenance banner across the app')
ON CONFLICT (key) DO NOTHING;
