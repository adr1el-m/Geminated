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
      WHERE table_name = 'appointments';
    `);
    
    const hasSymptoms = res.rows.some(r => r.column_name === 'symptoms_summary');
    if (!hasSymptoms) {
      await client.query(`ALTER TABLE "appointments" ADD COLUMN "symptoms_summary" text;`);
      console.log("Added 'symptoms_summary' column to appointments");
    }

    const hasScore = res.rows.some(r => r.column_name === 'triage_score');
    if (!hasScore) {
      await client.query(`ALTER TABLE "appointments" ADD COLUMN "triage_score" integer;`);
      console.log("Added 'triage_score' column to appointments");
    }

    const hasData = res.rows.some(r => r.column_name === 'data');
    if (!hasData) {
      await client.query(`ALTER TABLE "appointments" ADD COLUMN "data" jsonb DEFAULT '{}' NOT NULL;`);
      console.log("Added 'data' column to appointments");
    }
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    await client.end();
  }
}

run();
