import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@rugby/db"

const client = postgres(
  process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby"
)

export const db = drizzle(client, { schema })
