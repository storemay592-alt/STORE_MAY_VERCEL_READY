import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DATABASE_URL en .env.local");
}

const sql = neon(connectionString);
const migrationsDirectory = join(process.cwd(), "db", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

function splitStatements(source) {
  const statements = [];
  let current = "";
  let singleQuoted = false;
  let doubleQuoted = false;
  let lineComment = false;
  let blockComment = false;
  let dollarTag = null;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      current += char;
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        blockComment = false;
      }
      continue;
    }
    if (!singleQuoted && !doubleQuoted && !dollarTag && char === "-" && next === "-") {
      current += char + next;
      index += 1;
      lineComment = true;
      continue;
    }
    if (!singleQuoted && !doubleQuoted && !dollarTag && char === "/" && next === "*") {
      current += char + next;
      index += 1;
      blockComment = true;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        const tag = match[0];
        if (!dollarTag) dollarTag = tag;
        else if (dollarTag === tag) dollarTag = null;
        current += tag;
        index += tag.length - 1;
        continue;
      }
    }

    if (!doubleQuoted && !dollarTag && char === "'" && source[index - 1] !== "\\") {
      if (singleQuoted && next === "'") {
        current += char + next;
        index += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
    } else if (!singleQuoted && !dollarTag && char === '"') {
      doubleQuoted = !doubleQuoted;
    }

    if (char === ";" && !singleQuoted && !doubleQuoted && !dollarTag) {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

for (const migrationFile of migrationFiles) {
  const migration = await readFile(join(migrationsDirectory, migrationFile), "utf8");
  for (const statement of splitStatements(migration)) await sql.query(statement);
  console.log(`Migración aplicada: ${migrationFile}`);
}

console.log("Base de datos preparada para el catálogo y el panel.");
