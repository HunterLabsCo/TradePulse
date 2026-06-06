-- Per-IP rate limiting for the paid AI/token edge functions
-- (elevenlabs-scribe-token, parse-trade-transcript). Both spend real money per
-- call, so an unthrottled endpoint is a quota-drain / cost-DoS vector once the
-- app is publicly advertised. Mirrors pro_status_rate_limit.
CREATE TABLE ai_endpoint_rate_limit (
  id           bigserial   PRIMARY KEY,
  endpoint     text        NOT NULL,
  ip_address   text        NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_endpoint_rate_limit_lookup
  ON ai_endpoint_rate_limit (endpoint, ip_address, requested_at);

CREATE OR REPLACE FUNCTION purge_old_ai_endpoint_rate_limit()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM ai_endpoint_rate_limit
    WHERE requested_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purge_ai_endpoint_rate_limit
  AFTER INSERT ON ai_endpoint_rate_limit
  EXECUTE PROCEDURE purge_old_ai_endpoint_rate_limit();

ALTER TABLE ai_endpoint_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon"          ON ai_endpoint_rate_limit FOR ALL TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON ai_endpoint_rate_limit FOR ALL TO authenticated USING (false);
