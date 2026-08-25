import "server-only";
import { getDatabase } from "@/lib/db";
import { securityHash } from "@/lib/security/request";

type RateLimitRow = {
  request_count: number | string;
  window_started_at: Date | string;
};

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds
}: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const sql = getDatabase();
  const identifierHash = securityHash(`${scope}:${identifier}`);
  const rows = (await sql`
    INSERT INTO security_rate_limits (
      scope, identifier_hash, window_started_at, request_count
    ) VALUES (
      ${scope}, ${identifierHash}, NOW(), 1
    )
    ON CONFLICT (scope, identifier_hash)
    DO UPDATE SET
      request_count = CASE
        WHEN security_rate_limits.window_started_at <= NOW() - make_interval(secs => ${windowSeconds})
          THEN 1
        ELSE security_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN security_rate_limits.window_started_at <= NOW() - make_interval(secs => ${windowSeconds})
          THEN NOW()
        ELSE security_rate_limits.window_started_at
      END
    RETURNING request_count, window_started_at
  `) as RateLimitRow[];

  const count = Number(rows[0].request_count);
  const startedAt = new Date(rows[0].window_started_at).getTime();
  const retryAfter = Math.max(1, Math.ceil((startedAt + windowSeconds * 1000 - Date.now()) / 1000));
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
}

