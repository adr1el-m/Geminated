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
    await client.query(`
      CREATE TABLE IF NOT EXISTS "outbreak_alerts" (
        "id" varchar PRIMARY KEY NOT NULL,
        "symptom_cluster" varchar,
        "region" varchar,
        "spike_percentage" real,
        "severity" varchar,
        "message" text,
        "created_at" timestamp DEFAULT now()
      );
    `);
    console.log("outbreak_alerts table verified/created");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "triage_sessions" (
        "id" varchar PRIMARY KEY NOT NULL,
        "session_token" varchar,
        "symptoms_raw" text,
        "urgency_level" varchar,
        "urgency_score" integer,
        "region" varchar,
        "created_at" timestamp DEFAULT now(),
        "language" varchar DEFAULT 'English'
      );
    `);
    console.log("triage_sessions table verified/created");
  } catch(e) {
    console.error("Migration Error:", e);
  } finally {
    await client.end();
  }
}

run();
