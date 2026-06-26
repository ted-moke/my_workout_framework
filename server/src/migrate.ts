import "dotenv/config";
import fs from "fs";
import path from "path";
import pool from "./db";

async function migrate(file: string) {
  const sql = fs.readFileSync(path.resolve(__dirname, "../migrations", file), "utf8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`Migration applied: ${file}`);
  } finally {
    client.release();
    await pool.end();
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx src/migrate.ts <migration-file.sql>");
  process.exit(1);
}

migrate(file).catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
