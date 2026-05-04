-- Add session token expiration to promo_users
ALTER TABLE promo_users
  ADD COLUMN IF NOT EXISTS session_token_expires_at timestamptz;

-- DB-backed rate limiting for promo login attempts.
-- Survives cold starts and works across concurrent edge function instances.
CREATE TABLE IF NOT EXISTS login_attempts (
  id          bigserial PRIMARY KEY,
  username    text      NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_username_time
  ON login_attempts (username, attempted_at);

-- Auto-purge attempts older than 24 hours to keep the table small.
-- Edge function queries only look at the last 15 minutes anyway.
CREATE OR REPLACE FUNCTION purge_old_login_attempts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_purge_login_attempts ON login_attempts;
CREATE TRIGGER trg_purge_login_attempts
  AFTER INSERT ON login_attempts
  EXECUTE PROCEDURE purge_old_login_attempts();

-- RLS: service role only — the edge function uses the service key
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON login_attempts FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_authenticated" ON login_attempts FOR ALL TO authenticated USING (false);
