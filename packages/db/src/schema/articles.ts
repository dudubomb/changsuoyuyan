import { pgTable, uuid, text, integer, timestamp, pgEnum, unique } from "drizzle-orm/pg-core"
import { users } from "./users"
import { episodes } from "./episodes"
import { players } from "./players"

export const articleStatusEnum = pgEnum("article_status", ["draft", "published", "archived"])

export const articles = pgTable("articles", {
  id:          uuid("id").primaryKey().defaultRandom(),
  authorId:    uuid("author_id").notNull().references(() => users.id),
  episodeId:   uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
  title:       text("title").notNull(),
  body:        text("body").notNull(),      // Markdown
  tags:        text("tags").array().notNull().default([]),
  readTime:    integer("read_time"),        // 分钟（前端展示用）
  viewCount:   integer("view_count").notNull().default(0),
  status:      articleStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

// 文章 ↔ 球员（多对多，文章中 embed 球员卡片）
export const articlePlayers = pgTable("article_players", {
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  playerId:  uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.articleId, t.playerId),
])
