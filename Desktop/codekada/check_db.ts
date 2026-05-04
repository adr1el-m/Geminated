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
      WHERE table_name = 'facilities';
    `);
    console.log("Columns:", res.rows.map(r => r.column_name));
    
    // Quick fix: Add missing location column if it doesn't exist
    const hasLocation = res.rows.some(r => r.column_name === 'location');
    if (!hasLocation) {
      await client.query(`ALTER TABLE "facilities" ADD COLUMN "location" text;`);
      console.log("Added 'location' column to facilities");
    }
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    await client.end();
  }
}

run();
