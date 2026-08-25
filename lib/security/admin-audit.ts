import "server-only";
import { getDatabase } from "@/lib/db";

export type AdminSecurityEvent = "login_success" | "login_failure" | "login_limited" | "logout";

export async function recordAdminSecurityEvent({
  username,
  eventType,
  ipHash
}: {
  username: string;
  eventType: AdminSecurityEvent;
  ipHash: string;
}) {
  const sql = getDatabase();
  await sql`
    INSERT INTO admin_security_events (username, event_type, ip_hash)
    VALUES (${username.trim().toLocaleLowerCase()}, ${eventType}, ${ipHash})
  `;
}

