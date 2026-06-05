import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

// NFL 球队（独立实体，供 players / episodes / tags 关联）
export const teams = pgTable("teams", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),          // "Kansas City Chiefs"
  shortName:    text("short_name").notNull(),     // "Chiefs"
  abbreviation: text("abbreviation").notNull(),   // "KC"
  conference:   text("conference").notNull(),     // "AFC" | "NFC"
  division:     text("division").notNull(),       // "AFC West"
  logoUrl:      text("logo_url"),
  primaryColor: text("primary_color"),            // "#E31837"
  createdAt:    timestamp("created_at").notNull().defaultNow(),
})
