import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import * as z from "zod";
import { patients } from "./patientModel.js";

export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().notNull(),
  patient_id: uuid("patient_id").references(() => patients.id, {
    onDelete: "cascade",
  }),
  doctor_name: varchar("doctor_name", { length: 255 }),
  specialty: varchar("specialty", { length: 255 }),
  date: timestamp("date", { withTimezone: true }),
  status: varchar("status", { length: 50 }),
  notes: text("notes"),
  data: jsonb("data").default({}).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;

export const createConsultationSchema = z.object({
  patient_id: z.uuid("Invalid Patient ID"),
  doctor_name: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  date: z.iso.datetime({ offset: true }).optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

export const updateConsultationSchema = z.object({
  doctor_name: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  date: z.iso.datetime({ offset: true }).optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
