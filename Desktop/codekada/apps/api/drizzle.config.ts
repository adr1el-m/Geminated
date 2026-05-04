import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./controllers/*.ts", // It's searching for exported pgTable
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
