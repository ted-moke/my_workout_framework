import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "workout",
  password: process.env.DB_PASSWORD || "workout",
  database: process.env.DB_NAME || "workout_tracker",
});

export default pool;
