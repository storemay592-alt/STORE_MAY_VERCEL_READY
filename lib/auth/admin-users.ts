import "server-only";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/db";

type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
};

// Makes an unknown username take the same bcrypt work as a real username.
const dummyPasswordHash = "$2b$12$uYdGTu3qBtm0Xjrcg5xwguFPWUEucvxjBZRE9ly/7NSAnQzAV5M9K";

export async function verifyAdminUser(username: string, password: string) {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT id, username, password_hash
    FROM admin_users
    WHERE username = ${username.trim().toLocaleLowerCase()}
    LIMIT 1
  `) as AdminUserRow[];

  const isValid = await bcrypt.compare(password, rows[0]?.password_hash ?? dummyPasswordHash);
  if (!rows.length) return null;
  return isValid ? { id: rows[0].id, username: rows[0].username } : null;
}
