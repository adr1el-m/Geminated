import pkg from "pg";
const { Client } = pkg;
import { env } from "./apps/api/configs/envalid.js";

async function run() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  try {
    const res = await client.query(`SELECT full_name FROM patients LIMIT 1`);
    console.log("Success:", res.rows);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();
