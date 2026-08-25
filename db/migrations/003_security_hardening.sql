CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (char_length(token_hash) = 64),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS security_rate_limits (
  scope TEXT NOT NULL,
  identifier_hash TEXT NOT NULL CHECK (char_length(identifier_hash) = 64),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (scope, identifier_hash)
);

CREATE TABLE IF NOT EXISTS admin_security_events (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL
    CHECK (event_type IN ('login_success', 'login_failure', 'login_limited', 'logout')),
  ip_hash TEXT NOT NULL CHECK (char_length(ip_hash) = 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitas_sitio (
  visitor_id TEXT PRIMARY KEY CHECK (visitor_id ~ '^[a-zA-Z0-9-]{16,80}$'),
  primera_visita TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultima_visita TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_sessions_active_idx
  ON admin_sessions (admin_user_id, expires_at DESC)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_security_events_date_idx
  ON admin_security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_security_events_username_idx
  ON admin_security_events (username, created_at DESC);
CREATE INDEX IF NOT EXISTS security_rate_limits_window_idx
  ON security_rate_limits (window_started_at);

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON TABLE admin_users, admin_sessions, security_rate_limits, admin_security_events FROM PUBLIC;

