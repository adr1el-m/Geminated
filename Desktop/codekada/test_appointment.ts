import pkg from "pg";
const { Client } = pkg;
import { env } from "./apps/api/configs/envalid.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

async function run() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log("Connected to NeonDB");
  
  try {
    // 1. Get the provider facility
    const providerEmail = "provider@haliya.ph";
    const userRes = await client.query(`SELECT id FROM users WHERE email = $1`, [providerEmail]);
    if (userRes.rows.length === 0) {
      console.log("Mock provider missing");
      return;
    }
    const providerUserId = userRes.rows[0].id;
    const facRes = await client.query(`SELECT id FROM facilities WHERE user_id = $1 LIMIT 1`, [providerUserId]);
    const facilityId = facRes.rows[0].id;

    // 2. Ensure a mock patient exists
    const patientEmail = "patient@haliya.ph";
    let patientUserId;
    let patientId;
    const pUserRes = await client.query(`SELECT id FROM users WHERE email = $1`, [patientEmail]);
    
    if (pUserRes.rows.length === 0) {
      patientUserId = crypto.randomUUID();
      const hash = await bcrypt.hash("patient123", 10);
      await client.query(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`, [patientUserId, patientEmail, hash, 'patient']);
      patientId = crypto.randomUUID();
      await client.query(`INSERT INTO patients (id, user_id, email, full_name) VALUES ($1, $2, $3, $4)`, [patientId, patientUserId, patientEmail, 'Mock Patient']);
      console.log("Created mock patient: patient@haliya.ph / patient123");
    } else {
      patientUserId = pUserRes.rows[0].id;
      const pRes = await client.query(`SELECT id FROM patients WHERE user_id = $1 LIMIT 1`, [patientUserId]);
      patientId = pRes.rows[0].id;
      console.log("Using existing mock patient:", patientEmail);
    }

    // 3. Create a test appointment
    const appointmentId = crypto.randomUUID();
    await client.query(`
      INSERT INTO appointments (id, patient_id, facility_id, appointment_type, status, symptoms_summary, triage_score, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      appointmentId,
      patientId,
      facilityId,
      'consultation',
      'pending',
      'Fever, coughing, and body aches for 3 days',
      7,
      'Please bring recent lab results.'
    ]);
    
    console.log("✅ Successfully audited a test appointment in NeonDB.");
    console.log("Appointment ID:", appointmentId);
    console.log(`Log in as provider@haliya.ph (provider123) to see the facility dashboard.`);
    console.log(`Log in as patient@haliya.ph (patient123) to see the patient dashboard.`);

  } catch(e) {
    console.error("Error creating test data:", e);
  } finally {
    await client.end();
  }
}

run();
