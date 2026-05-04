import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import * as z from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("patient").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const createUserSchema = z.object({
  email: z
    .email("Invalid Email Address")
    .trim()
    .min(1, "Email Address is required"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be a minimum of 8 characters"),
  role: z.enum(["admin", "patient"]).default("patient"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.email("Invalid Email Address").trim().optional(),
  password: z
    .string()
    .trim()
    .min(8, "Password must be a minimum of 8 characters")
    .optional(),
  role: z.enum(["admin", "patient"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
