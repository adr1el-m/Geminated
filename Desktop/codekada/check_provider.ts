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
    const res = await client.query(`SELECT id, role FROM users WHERE email = 'provider@haliya.ph'`);
    if (res.rows.length === 0) {
      console.log("Mock provider user missing!");
    } else {
      const userId = res.rows[0].id;
      console.log("User:", res.rows[0]);
      
      const facRes = await client.query(`SELECT id, name FROM facilities WHERE user_id = $1`, [userId]);
      console.log("Facility:", facRes.rows);
    }
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();
