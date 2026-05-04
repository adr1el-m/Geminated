import pkg from "pg";
const { Pool } = pkg;
import { env } from "./apps/api/configs/envalid.js";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { users } from "./apps/api/models/userModel.js";
import { facilities } from "./apps/api/models/facilityModel.js";
import { eq } from "drizzle-orm";

async function seedMockProvider() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool);

  try {
    const email = "provider@haliya.ph";
    const password = "provider123";
    const role = "admin";
    
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email));
    
    if (existing.length > 0) {
      console.log("Mock provider already exists!");
      
      // Ensure facility exists for this user
      const existingFacility = await db.select().from(facilities).where(eq(facilities.user_id, existing[0].id));
      if (existingFacility.length === 0) {
         console.log("Adding missing facility profile...");
         await db.insert(facilities).values({
           id: crypto.randomUUID(),
           uid: crypto.randomUUID(),
           user_id: existing[0].id,
           name: "Haliya National Hospital",
           email: email,
           location: "Manila, Philippines",
           is_verified: true,
         });
         console.log("Facility profile added.");
      }
      return;
    }

    // Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    
    await db.insert(users).values({
      id: userId,
      email: email,
      password_hash: hashedPassword,
      role: role
    });
    
    // Create Facility Profile
    await db.insert(facilities).values({
      id: crypto.randomUUID(),
      uid: crypto.randomUUID(),
      user_id: userId,
      name: "Haliya National Hospital",
      email: email,
      location: "Manila, Philippines",
      is_verified: true,
    });
    
    console.log("Successfully created mock provider!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", role);
  } catch (err) {
    console.error("Failed to seed mock provider:", err);
  } finally {
    await pool.end();
  }
}

seedMockProvider();
