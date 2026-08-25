import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const argument = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const username = argument("--username") ?? process.env.ADMIN_EMAIL;
const password = argument("--password") ?? process.env.ADMIN_PASSWORD;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("Falta DATABASE_URL en .env.local");
if (!username || username.trim().length < 3) {
  throw new Error("Indica --username o configura ADMIN_EMAIL.");
}
const strongPassword =
  typeof password === "string" &&
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

if (!strongPassword) {
  throw new Error(
    "La contraseña debe tener al menos 12 caracteres e incluir mayúscula, minúscula, número y símbolo."
  );
}

const sql = neon(connectionString);
const passwordHash = await bcrypt.hash(password, 12);

await sql`
  INSERT INTO admin_users (username, password_hash)
  VALUES (${username.trim().toLocaleLowerCase()}, ${passwordHash})
  ON CONFLICT (username)
  DO UPDATE SET password_hash = EXCLUDED.password_hash
`;

console.log(`Usuario administrador preparado: ${username.trim().toLocaleLowerCase()}`);
