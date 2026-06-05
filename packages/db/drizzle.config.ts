import type { Config } from "drizzle-kit"

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby",
  },
} satisfies Config
