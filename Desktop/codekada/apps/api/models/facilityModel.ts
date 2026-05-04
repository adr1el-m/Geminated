import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import * as z from "zod";
import { users } from "./userModel.js";

export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().notNull(),
  uid: varchar("uid", { length: 255 }).notNull().unique(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: text("location"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postal_code: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Philippines"),
  website: varchar("website", { length: 255 }),
  specialties: jsonb("specialties").default([]).notNull(),
  services: jsonb("services").default([]).notNull(),
  operating_hours: jsonb("operating_hours").default({}).notNull(),
  staff: jsonb("staff").default({}).notNull(),
  capacity: jsonb("capacity").default({}).notNull(),
  languages: jsonb("languages").default([]).notNull(),
  accreditation: jsonb("accreditation").default([]).notNull(),
  insurance_accepted: jsonb("insurance_accepted").default([]).notNull(),
  license_number: varchar("license_number", { length: 100 }),
  description: text("description"),
  is_active: boolean("is_active").default(true).notNull(),
  is_searchable: boolean("is_searchable").default(true).notNull(),
  is_verified: boolean("is_verified").default(false).notNull(),
  profile_complete: boolean("profile_complete").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;

const dayScheduleSchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const operatingHoursSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional(),
});

const staffSchema = z.object({
  doctors: z.number().optional(),
  nurses: z.number().optional(),
  supportStaff: z.number().optional(),
  totalStaff: z.number().optional(),
});

const capacitySchema = z.object({
  bedCapacity: z.number().optional(),
  consultationRooms: z.number().optional(),
});

export const createFacilitySchema = z.object({
  uid: z.string().trim().min(1, "UID is required"),
  user_id: z.uuid("Invalid User ID"),
  name: z.string().trim().min(1, "Name is required"),
  type: z.string().trim().optional(),
  email: z.email("Invalid Email Address").trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  country: z.string().trim().optional(),
  website: z.url("Invalid URL").optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  operating_hours: operatingHoursSchema.optional(),
  staff: staffSchema.optional(),
  capacity: capacitySchema.optional(),
  languages: z.array(z.string()).optional(),
  accreditation: z.array(z.string()).optional(),
  insurance_accepted: z.array(z.string()).optional(),
  license_number: z.string().trim().optional(),
  description: z.string().trim().optional(),
  is_active: z.boolean().optional(),
  is_searchable: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  profile_complete: z.boolean().optional(),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

export const updateFacilitySchema = z.object({
  name: z.string().trim().optional(),
  type: z.string().trim().optional(),
  email: z.email("Invalid Email Address").trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  country: z.string().trim().optional(),
  website: z.url("Invalid URL").optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  operating_hours: operatingHoursSchema.optional(),
  staff: staffSchema.optional(),
  capacity: capacitySchema.optional(),
  languages: z.array(z.string()).optional(),
  accreditation: z.array(z.string()).optional(),
  insurance_accepted: z.array(z.string()).optional(),
  license_number: z.string().trim().optional(),
  description: z.string().trim().optional(),
  is_active: z.boolean().optional(),
  is_searchable: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  profile_complete: z.boolean().optional(),
});

export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
