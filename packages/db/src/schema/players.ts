import { pgTable, uuid, text, integer, real, timestamp, jsonb, unique } from "drizzle-orm/pg-core"
import { users } from "./users"
import { teams } from "./teams"

export const players = pgTable("players", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  teamId:      uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  position:    text("position").notNull(),   // "QB" | "WR" | "RB" | "TE" | "OL" | "DL" | "LB" | "CB" | "S" | "K"
  jersey:      integer("jersey"),            // 球衣号码
  nationality: text("nationality"),
  age:         integer("age"),
  height:      text("height"),               // "6'3\""
  weight:      text("weight"),               // "230 lbs"
  college:     text("college"),              // 大学
  draftYear:   integer("draft_year"),
  draftRound:  integer("draft_round"),
  draftPick:   integer("draft_pick"),
  bio:         text("bio"),
  avatarUrl:   text("avatar_url"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

// 赛季数据（每球员每赛季一行）
export const playerStats = pgTable("player_stats", {
  id:            uuid("id").primaryKey().defaultRandom(),
  playerId:      uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  season:        text("season").notNull(),        // "2024"
  teamId:        uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  matches:       integer("matches").default(0),
  starts:        integer("starts").default(0),
  // 进攻
  touchdowns:    integer("touchdowns").default(0),
  yards:         integer("yards").default(0),
  // QB 专属
  completions:   integer("completions"),
  attempts:      integer("attempts"),
  passerRating:  real("passer_rating"),
  interceptions: integer("interceptions").default(0),
  // WR/TE 专属
  receptions:    integer("receptions"),
  targets:       integer("targets"),
  // RB 专属
  carries:       integer("carries"),
  // 防守
  tackles:       integer("tackles"),
  sacks:         real("sacks"),
  forcedFumbles: integer("forced_fumbles"),
  // 其余灵活字段
  extra:         jsonb("extra").default({}),
})

// 社区评分（每人每球员一条，唯一约束）
export const playerRatings = pgTable("player_ratings", {
  id:        uuid("id").primaryKey().defaultRandom(),
  playerId:  uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score:     real("score").notNull(),   // 0-10
  comment:   text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.playerId, t.userId),   // 每人只能评一次
])
