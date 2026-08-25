import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/auth/session";

export const verifyAdmin = cache(async () => {
  const session = await readAdminSession();
  if (!session) redirect("/dashboard/login");
  return session;
});

export async function requireAdminAction() {
  const session = await readAdminSession();
  if (!session) throw new Error("Tu sesión venció. Vuelve a iniciar sesión.");
  return session;
}
