import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core"
import { users } from "./users"
import { episodes } from "./episodes"
import { articles } from "./articles"

export const questionStatusEnum = pgEnum("question_status", [
  "open",      // 待解答
  "answered",  // 已有认证回答
  "closed",    // 关闭
])

// 规则问题
export const questions = pgTable("questions", {
  id:               uuid("id").primaryKey().defaultRandom(),
  authorId:         uuid("author_id").notNull().references(() => users.id),
  // 来源关联（可选）
  episodeId:        uuid("episode_id").references(() => episodes.id, { onDelete: "set null" }),
  articleId:        uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
  chapterTimestamp: integer("chapter_timestamp"),  // 关联播客的具体秒数
  title:            text("title").notNull(),
  body:             text("body").notNull(),
  tags:             text("tags").array().notNull().default([]),
  status:           questionStatusEnum("status").notNull().default("open"),
  isDaily:          boolean("is_daily").notNull().default(false),  // 每日一题
  dailyDate:        text("daily_date"),   // "2025-06-02"，每日一题日期
  viewCount:        integer("view_count").notNull().default(0),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
})

// 回答
export const answers = pgTable("answers", {
  id:          uuid("id").primaryKey().defaultRandom(),
  questionId:  uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  authorId:    uuid("author_id").notNull().references(() => users.id),
  body:        text("body").notNull(),
  isCertified: boolean("is_certified").notNull().default(false),  // 认证裁判标记
  voteCount:   integer("vote_count").notNull().default(0),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

// 投票（防重复：每人每条回答只能投一次）
export const answerVotes = pgTable("answer_votes", {
  id:        uuid("id").primaryKey().defaultRandom(),
  answerId:  uuid("answer_id").notNull().references(() => answers.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.answerId, t.userId),
])

// 每日一题题库（独立于普通问答）
export const dailyQuiz = pgTable("daily_quiz", {
  id:          uuid("id").primaryKey().defaultRandom(),
  question:    text("question").notNull(),
  options:     text("options").array().notNull(),    // ["选项A", "选项B", ...]
  correctIdx:  integer("correct_idx").notNull(),       // 正确选项索引
  explanation: text("explanation").notNull(),          // 答案解析
  tags:        text("tags").array().notNull().default([]),
  difficulty:  text("difficulty").notNull().default("medium"), // easy/medium/hard
  activeDate:  text("active_date"),                    // "2026-06-04" 哪天展示，null=未排期
  createdAt:   timestamp("created_at").notNull().defaultNow(),
})

// 每日一题作答记录（question_id 指向 daily_quiz，不加外键以便灵活）
export const dailyAnswers = pgTable("daily_answers", {
  id:         uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull(),   // → daily_quiz.id
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  choice:     text("choice").notNull(),    // 用户选择的选项索引
  isCorrect:  boolean("is_correct"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.questionId, t.userId),
])

// 通用评论（播客 / 文章 / 问答 三种目标）
export const comments = pgTable("comments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  authorId:   uuid("author_id").notNull().references(() => users.id),
  parentId:   uuid("parent_id"),           // 回复评论（自引用，null = 顶级评论）
  targetType: text("target_type").notNull(), // "episode" | "article" | "question"
  targetId:   uuid("target_id").notNull(),
  body:       text("body").notNull(),
  likeCount:  integer("like_count").notNull().default(0),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
})

// 评论点赞
export const commentLikes = pgTable("comment_likes", {
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.commentId, t.userId),
])
