import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5432/rugby"

const client = postgres(connectionString)

export const db = drizzle(client, { schema })

export * from "./schema"
export type { InferSelectModel, InferInsertModel } from "drizzle-orm"
