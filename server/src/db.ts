import { Pool } from "pg";

const CONNECTION_TIMEOUT_MS = 5000; // 5 seconds

console.log("Connecting to database...");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "workout",
  password: process.env.DB_PASSWORD || "workout",
  database: process.env.DB_NAME || "workout_tracker",
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
});

export default pool;
