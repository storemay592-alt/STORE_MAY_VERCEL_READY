import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getDatabase } from "@/lib/db";

const developmentCookieName = "store_may_admin_session";
const productionCookieName = "__Host-store_may_admin_session";
const sessionDurationSeconds = 60 * 60 * 4;

type AdminSession = {
  userId: string;
  username: string;
  role: "owner";
  jti: string;
};

type SessionRow = { exists: boolean };

function sessionCookieName() {
  return process.env.NODE_ENV === "production" ? productionCookieName : developmentCookieName;
}

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("La clave de sesión no está configurada correctamente.");
  }
  return new TextEncoder().encode(secret);
}

function tokenHash(jti: string) {
  return createHash("sha256").update(jti).digest("hex");
}

async function verifyToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    if (
      payload.role !== "owner" ||
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.jti !== "string"
    ) return null;

    return {
      userId: payload.sub,
      username: payload.username,
      role: "owner",
      jti: payload.jti
    };
  } catch {
    return null;
  }
}

export async function createAdminSession(admin: { id: string; username: string }) {
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
  const jti = randomUUID();
  const sql = getDatabase();

  await sql`DELETE FROM admin_sessions WHERE expires_at <= NOW() OR revoked_at IS NOT NULL`;
  await sql`
    INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at)
    VALUES (${admin.id}, ${tokenHash(jti)}, ${expiresAt})
  `;

  const token = await new SignJWT({ username: admin.username, role: "owner" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(admin.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(sessionKey());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high"
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  const session = token ? await verifyToken(token) : null;

  if (session) {
    const sql = getDatabase();
    await sql`
      UPDATE admin_sessions
      SET revoked_at = NOW()
      WHERE token_hash = ${tokenHash(session.jti)}
        AND revoked_at IS NULL
    `;
  }

  cookieStore.delete(sessionCookieName());
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;

  try {
    const sql = getDatabase();
    const rows = (await sql`
      SELECT EXISTS (
        SELECT 1
        FROM admin_sessions s
        JOIN admin_users u ON u.id = s.admin_user_id
        WHERE s.admin_user_id = ${session.userId}
          AND u.username = ${session.username}
          AND s.token_hash = ${tokenHash(session.jti)}
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
      ) AS exists
    `) as SessionRow[];
    return rows[0]?.exists ? session : null;
  } catch {
    return null;
  }
}
