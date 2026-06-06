-- Audit log + brute-force throttle for the admin-action edge function.
-- Records every request (authorized or not) so admin activity is traceable and
-- repeated failed auth attempts from an IP can be rate-limited.
CREATE TABLE admin_action_log (
  id          bigserial   PRIMARY KEY,
  ip_address  text        NOT NULL,
  action      text,
  authorized  boolean     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_action_log_ip_time
  ON admin_action_log (ip_address, authorized, created_at);

-- Keep 30 days of audit history; purge older rows on insert.
CREATE OR REPLACE FUNCTION purge_old_admin_action_log()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM admin_action_log
    WHERE created_at < now() - interval '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purge_admin_action_log
  AFTER INSERT ON admin_action_log
  EXECUTE PROCEDURE purge_old_admin_action_log();

ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon"          ON admin_action_log FOR ALL TO anon          USING (false);
CREATE POLICY "deny_all_authenticated" ON admin_action_log FOR ALL TO authenticated USING (false);
