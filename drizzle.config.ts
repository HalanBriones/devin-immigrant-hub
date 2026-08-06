import { defineConfig } from "drizzle-kit";
import "./src/lib/load-env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/immigrant_hub",
  },
});
