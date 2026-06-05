import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum, unique } from "drizzle-orm/pg-core"
import { users } from "./users"
import { players } from "./players"
import { teams } from "./teams"

export const episodeStatusEnum = pgEnum("episode_status", ["draft", "published", "archived"])

export const episodes = pgTable("episodes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  authorId:    uuid("author_id").notNull().references(() => users.id),
  title:       text("title").notNull(),
  subtitle:    text("subtitle"),             // 副标题 / 系列名
  audioUrl:    text("audio_url").notNull(),
  coverUrl:    text("cover_url"),
  duration:    integer("duration").notNull(), // 秒
  summary:     text("summary"),
  // 章节列表：[{ title, startTime(秒), linkedQuestionId? }]
  chapters:    jsonb("chapters").notNull().default([]),
  tags:        text("tags").array().notNull().default([]),
  status:      episodeStatusEnum("status").notNull().default("draft"),
  playCount:   integer("play_count").notNull().default(0),
  vttContent:  text("vtt_content"),      // 字幕 WebVTT 内容
  transcribedAt: timestamp("transcribed_at"), // 转录时间
  publishedAt: timestamp("published_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

// 播客 ↔ 球员（多对多）
export const episodePlayers = pgTable("episode_players", {
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  playerId:  uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.episodeId, t.playerId),
])

// 播客 ↔ 球队（多对多）
export const episodeTeams = pgTable("episode_teams", {
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  teamId:    uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.episodeId, t.teamId),
])

// 收听进度（支持断点续播）
export const listenProgress = pgTable("listen_progress", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  position:  integer("position").notNull().default(0),  // 秒
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.userId, t.episodeId),
])
