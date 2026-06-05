import { relations } from "drizzle-orm"
import { users, refreshTokens, oauthAccounts, userFollows, bookmarks, notifications, reports } from "./users"
import { teams } from "./teams"
import { players, playerStats, playerRatings } from "./players"
import { episodes, episodePlayers, episodeTeams, listenProgress } from "./episodes"
import { articles, articlePlayers } from "./articles"
import { questions, answers, answerVotes, dailyAnswers, comments, commentLikes } from "./qa"

// ── Users ─────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens:  many(refreshTokens),
  oauthAccounts:  many(oauthAccounts),
  following:      many(userFollows, { relationName: "follower" }),
  followers:      many(userFollows, { relationName: "following" }),
  bookmarks:      many(bookmarks),
  notifications:  many(notifications),
  playerRatings:  many(playerRatings),
  listenProgress: many(listenProgress),
  questions:      many(questions),
  answers:        many(answers),
  comments:       many(comments),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}))

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}))

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower:  one(users, { fields: [userFollows.followerId],  references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [userFollows.followingId], references: [users.id], relationName: "following" }),
}))

// ── Teams ─────────────────────────────────────────────────
export const teamsRelations = relations(teams, ({ many }) => ({
  players:       many(players),
  episodeTeams:  many(episodeTeams),
}))

// ── Players ───────────────────────────────────────────────
export const playersRelations = relations(players, ({ one, many }) => ({
  team:          one(teams, { fields: [players.teamId], references: [teams.id] }),
  stats:         many(playerStats),
  ratings:       many(playerRatings),
  episodePlayers: many(episodePlayers),
  articlePlayers: many(articlePlayers),
}))

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, { fields: [playerStats.playerId], references: [players.id] }),
  team:   one(teams,   { fields: [playerStats.teamId],   references: [teams.id] }),
}))

export const playerRatingsRelations = relations(playerRatings, ({ one }) => ({
  player: one(players, { fields: [playerRatings.playerId], references: [players.id] }),
  user:   one(users,   { fields: [playerRatings.userId],   references: [users.id] }),
}))

// ── Episodes ──────────────────────────────────────────────
export const episodesRelations = relations(episodes, ({ one, many }) => ({
  author:         one(users,   { fields: [episodes.authorId], references: [users.id] }),
  episodePlayers: many(episodePlayers),
  episodeTeams:   many(episodeTeams),
  listenProgress: many(listenProgress),
  articles:       many(articles),
  questions:      many(questions),
}))

export const episodePlayersRelations = relations(episodePlayers, ({ one }) => ({
  episode: one(episodes, { fields: [episodePlayers.episodeId], references: [episodes.id] }),
  player:  one(players,  { fields: [episodePlayers.playerId],  references: [players.id] }),
}))

export const episodeTeamsRelations = relations(episodeTeams, ({ one }) => ({
  episode: one(episodes, { fields: [episodeTeams.episodeId], references: [episodes.id] }),
  team:    one(teams,    { fields: [episodeTeams.teamId],    references: [teams.id] }),
}))

export const listenProgressRelations = relations(listenProgress, ({ one }) => ({
  user:    one(users,    { fields: [listenProgress.userId],    references: [users.id] }),
  episode: one(episodes, { fields: [listenProgress.episodeId], references: [episodes.id] }),
}))

// ── Articles ──────────────────────────────────────────────
export const articlesRelations = relations(articles, ({ one, many }) => ({
  author:         one(users,    { fields: [articles.authorId],  references: [users.id] }),
  episode:        one(episodes, { fields: [articles.episodeId], references: [episodes.id] }),
  articlePlayers: many(articlePlayers),
}))

export const articlePlayersRelations = relations(articlePlayers, ({ one }) => ({
  article: one(articles, { fields: [articlePlayers.articleId], references: [articles.id] }),
  player:  one(players,  { fields: [articlePlayers.playerId],  references: [players.id] }),
}))

// ── Q&A ───────────────────────────────────────────────────
export const questionsRelations = relations(questions, ({ one, many }) => ({
  author:       one(users,    { fields: [questions.authorId],  references: [users.id] }),
  episode:      one(episodes, { fields: [questions.episodeId], references: [episodes.id] }),
  article:      one(articles, { fields: [questions.articleId], references: [articles.id] }),
  answers:      many(answers),
  dailyAnswers: many(dailyAnswers),
  comments:     many(comments),
}))

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  author:   one(users,     { fields: [answers.authorId],   references: [users.id] }),
  votes:    many(answerVotes),
}))

export const answerVotesRelations = relations(answerVotes, ({ one }) => ({
  answer: one(answers, { fields: [answerVotes.answerId], references: [answers.id] }),
  user:   one(users,   { fields: [answerVotes.userId],   references: [users.id] }),
}))

export const dailyAnswersRelations = relations(dailyAnswers, ({ one }) => ({
  question: one(questions, { fields: [dailyAnswers.questionId], references: [questions.id] }),
  user:     one(users,     { fields: [dailyAnswers.userId],     references: [users.id] }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  likes:  many(commentLikes),
}))

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, { fields: [commentLikes.commentId], references: [comments.id] }),
  user:    one(users,    { fields: [commentLikes.userId],    references: [users.id] }),
}))
