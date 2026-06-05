import { pgTable, uuid, text, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", [
  "fan",       // 普通球迷
  "host",      // 主播
  "editor",    // 编辑
  "coach",     // 教练
  "referee",   // 裁判
  "admin",     // 管理员
])

// 用户主表
export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash"),           // null = OAuth 登录
  nickname:     text("nickname").notNull(),
  avatar:       text("avatar"),
  bio:          text("bio"),
  role:         userRoleEnum("role").notNull().default("fan"),
  isVerified:   boolean("is_verified").notNull().default(false),  // 认证裁判/教练
  isActive:     boolean("is_active").notNull().default(true),     // 封号用
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
})

// OAuth 第三方登录（Google / Apple）
export const oauthAccounts = pgTable("oauth_accounts", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider:   text("provider").notNull(),   // "google" | "apple"
  providerId: text("provider_id").notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
})

// Refresh Token
export const refreshTokens = pgTable("refresh_tokens", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// 用户关注关系（关注其他用户 / 主播）
export const userFollows = pgTable("user_follows", {
  followerId:  uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
})

// 用户收藏（播客 / 文章 / 球员 通用）
export const bookmarks = pgTable("bookmarks", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),  // "episode" | "article" | "player" | "question"
  targetId:   uuid("target_id").notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
})

// 通知
export const notificationTypeEnum = pgEnum("notification_type", [
  "answer_certified",   // 你的问题获得官方解读
  "answer_replied",     // 有人回复了你的回答
  "question_answered",  // 你的问题有新回答
  "episode_published",  // 关注的主播发布新播客
  "daily_question",     // 每日一题提醒
])

export const notifications = pgTable("notifications", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      notificationTypeEnum("type").notNull(),
  title:     text("title").notNull(),
  body:      text("body"),
  targetType: text("target_type"),   // 跳转目标类型
  targetId:   uuid("target_id"),     // 跳转目标 ID
  isRead:    boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// 举报（内容审核）
export const reportReasonEnum = pgEnum("report_reason", [
  "spam", "misinformation", "offensive", "other"
])

export const reports = pgTable("reports", {
  id:         uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(),  // "answer" | "comment" | "article"
  targetId:   uuid("target_id").notNull(),
  reason:     reportReasonEnum("reason").notNull(),
  note:       text("note"),
  resolvedAt: timestamp("resolved_at"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
})
