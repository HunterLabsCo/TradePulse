CREATE TABLE pro_status_rate_limit (
  id           bigserial   PRIMARY KEY,
  ip_address   text        NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pro_status_rate_limit_ip_time
  ON pro_status_rate_limit (ip_address, requested_at);

CREATE OR REPLACE FUNCTION purge_old_pro_status_rate_limit()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM pro_status_rate_limit
    WHERE requested_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purge_pro_status_rate_limit
  AFTER INSERT ON pro_status_rate_limit
  EXECUTE PROCEDURE purge_old_pro_status_rate_limit();

ALTER TABLE pro_status_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon"          ON pro_status_rate_limit FOR ALL TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON pro_status_rate_limit FOR ALL TO authenticated USING (false);
