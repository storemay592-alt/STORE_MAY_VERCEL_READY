import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;

function assertEncryptedConnection(connectionString: string) {
  if (process.env.NODE_ENV !== "production") return;

  try {
    const sslMode = new URL(connectionString).searchParams.get("sslmode");
    if (sslMode !== "require" && sslMode !== "verify-full") {
      throw new Error("Neon debe usar una conexión TLS obligatoria.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("TLS")) throw error;
    throw new Error("La conexión segura a la base de datos no es válida.");
  }
}

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("La conexión a la base de datos no está configurada.");
  }

  assertEncryptedConnection(connectionString);

  client ??= neon(connectionString);
  return client;
}
