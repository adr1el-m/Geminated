import {
  date,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import * as z from "zod";
import { facilities } from "./facilityModel.js";
import { patients } from "./patientModel.js";

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().notNull(),
  patient_id: uuid("patient_id").references(() => patients.id, {
    onDelete: "cascade",
  }),
  facility_id: uuid("facility_id").references(() => facilities.id, {
    onDelete: "cascade",
  }),
  doctor_name: varchar("doctor_name", { length: 255 }),
  specialty: varchar("specialty", { length: 255 }),
  appointment_type: varchar("appointment_type", { length: 100 }),
  appointment_date: date("appointment_date"),
  appointment_time: time("appointment_time"),
  status: varchar("status", { length: 50 }).default("pending"),
  notes: text("notes"),
  symptoms_summary: text("symptoms_summary"),
  triage_score: integer("triage_score"),
  triage_explanation: text("triage_explanation"),
  data: jsonb("data").default({}).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid("Invalid Patient ID"),
  facility_id: z.string().uuid("Invalid Facility ID"),
  doctor_name: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  appointment_type: z.string().trim().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format HH:MM or HH:MM:SS")
    .optional(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .default("pending"),
  notes: z.string().trim().optional(),
  symptoms_summary: z.string().trim().optional(),
  triage_score: z.number().optional(),
  triage_explanation: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  doctor_name: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  appointment_type: z.string().trim().optional(),
  appointment_date: z.iso.date().optional(),
  appointment_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format HH:MM or HH:MM:SS")
    .optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  notes: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
