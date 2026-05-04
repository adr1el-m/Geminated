import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import * as z from "zod";
import { users } from "./userModel.js";

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  full_name: varchar("full_name", { length: 255 }),
  personal_info: jsonb("personal_info").default({}).notNull(),
  medical_info: jsonb("medical_info")
    .default({
      allergies: [],
      surgeries: [],
      conditions: {},
      medications: [],
    })
    .notNull(),
  settings: jsonb("settings").default({}).notNull(),
  activity: jsonb("activity").default({ consultationHistory: [] }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

const personalInfoSchema = z.object({
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  fullName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
});

const medicalInfoSchema = z.object({
  allergies: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  conditions: z.record(z.string(), z.unknown()).default({}),
  medications: z.array(z.string()).default([]),
});

const activitySchema = z.object({
  consultationHistory: z.array(z.unknown()).default([]),
});

export const createPatientSchema = z.object({
  user_id: z.uuid("Invalid User ID"),
  email: z
    .email("Invalid Email Address")
    .trim()
    .min(1, "Email Address is required"),
  personal_info: personalInfoSchema.optional(),
  medical_info: medicalInfoSchema.optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  activity: activitySchema.optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = z.object({
  email: z.email("Invalid Email Address").trim().optional(),
  personal_info: personalInfoSchema.optional(),
  medical_info: medicalInfoSchema.optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  activity: activitySchema.optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
