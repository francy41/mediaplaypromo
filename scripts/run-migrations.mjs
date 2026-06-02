/**
 * Ejecuta las migraciones SQL contra la base de datos Supabase.
 * Uso: node scripts/run-migrations.mjs "postgresql://postgres:PASS@host:5432/postgres"
 *  o:  SUPABASE_DB_URL="postgresql://..." node scripts/run-migrations.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

const connectionString = process.argv[2] || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("❌ Falta el connection string. Uso: node scripts/run-migrations.mjs \"postgresql://...\"");
  process.exit(1);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("🔌 Conectando a la base de datos...");
  await client.connect();
  console.log("✅ Conectado.\n");

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`▶ Ejecutando ${file} ... `);
    try {
      await client.query(sql);
      console.log("OK ✓");
    } catch (e) {
      console.log("ERROR ✗");
      console.error(`   ${e.message}`);
      // Continuar con el resto (puede ser "already exists" idempotente)
    }
  }

  // Verificación: listar tablas creadas
  const { rows } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name;
  `);
  console.log("\n📋 Tablas en schema public:");
  rows.forEach((r) => console.log("   • " + r.table_name));

  await client.end();
  console.log("\n🎉 Migraciones completadas.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
