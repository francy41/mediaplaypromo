/**
 * Ejecuta las migraciones SQL vía la Supabase Management API.
 * Uso: node scripts/run-migrations-api.mjs <PAT> <PROJECT_REF>
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

const pat = process.argv[2];
const ref = process.argv[3];
if (!pat || !ref) {
  console.error("Uso: node scripts/run-migrations-api.mjs <PAT> <PROJECT_REF>");
  process.exit(1);
}

const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function main() {
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`▶ ${file} ... `);
    const r = await runQuery(sql);
    if (r.ok) {
      console.log("OK ✓");
    } else {
      console.log(`ERROR ${r.status}`);
      console.log("   " + r.body.slice(0, 300));
    }
  }

  // Verificar tablas creadas
  const check = await runQuery("select table_name from information_schema.tables where table_schema='public' order by table_name;");
  console.log("\n📋 Tablas en public:");
  try {
    const rows = JSON.parse(check.body);
    rows.forEach((r) => console.log("   • " + r.table_name));
  } catch {
    console.log(check.body.slice(0, 500));
  }
  console.log("\n🎉 Listo.");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
