import "dotenv/config";
import fs from "fs";
import path from "path";
import pool from "./db";

// Applies migrations from server/migrations/ in the order given, each in its
// own transaction. Uses the same DB settings as the app (DATABASE_URL or DB_*).
async function migrate(files: string[]) {
  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.resolve(__dirname, "../migrations", file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`${file}: ${(err as Error).message}`);
      }
      console.log(`Migration applied: ${file}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: tsx src/migrate.ts <migration-file.sql> [...]");
  process.exit(1);
}

migrate(files).catch((err) => {
  console.error("Migration failed:", err.message ?? err);
  process.exit(1);
});
