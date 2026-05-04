import pkg from "pg";
const { Client } = pkg;
import { env } from "./apps/api/configs/envalid.js";

async function run() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log("Connected to NeonDB");
  
  try {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients';
    `);
    
    const hasFullName = res.rows.some(r => r.column_name === 'full_name');
    if (!hasFullName) {
      await client.query(`ALTER TABLE "patients" ADD COLUMN "full_name" varchar(255);`);
      console.log("Added 'full_name' column to patients");
    } else {
      console.log("'full_name' already exists.");
    }
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    await client.end();
  }
}

run();
