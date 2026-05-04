import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { env } from "./envalid.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);

export const connectDB = async () => {
  const client = await pool.connect();
  client.release();
  console.log("Database connected");
};
