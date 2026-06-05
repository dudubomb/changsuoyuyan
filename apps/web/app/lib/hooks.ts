"use client"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { api } from "./api"

// ── Episodes ─────────────────────────────────────────────
export function useEpisodes(page = 1, q?: string) {
  return useQuery({
    queryKey: ["episodes", page, q],
    queryFn:  () => api.get("/episodes", { params: { page, limit: 20, q } }).then(r => r.data),
  })
}

export function useEpisode(id: string) {
  return useQuery({
    queryKey: ["episodes", id],
    queryFn:  () => api.get(`/episodes/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })
}

// ── Players ──────────────────────────────────────────────
export function usePlayers(page = 1, position?: string, teamId?: string, q?: string) {
  return useQuery({
    queryKey: ["players", page, position, teamId, q],
    queryFn:  () => api.get("/players", { params: { page, limit: 20, position, teamId, q } }).then(r => r.data),
  })
}

// 无限滚动版
export function useInfinitePlayers(position?: string, teamId?: string, q?: string) {
  const LIMIT = 24
  return useInfiniteQuery({
    queryKey: ["players-infinite", position, teamId, q],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get("/players", { params: { page: pageParam, limit: LIMIT, position, teamId, q } }).then(r => r.data),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((s, p) => s + p.data.length, 0)
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined
    },
  })
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn:  () => api.get("/players/teams/all").then(r => r.data.data),
    staleTime: Infinity,
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["players", id],
    queryFn:  () => api.get(`/players/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })
}

export function useRelatedPlayers(id: string) {
  return useQuery({
    queryKey: ["players", id, "related"],
    queryFn:  () => api.get(`/players/${id}/related`).then(r => r.data.data),
    enabled:  !!id,
  })
}

export function useRatePlayer(playerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { score: number; comment?: string }) =>
      api.post(`/players/${playerId}/rate`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players", playerId] }),
  })
}

// ── Articles ─────────────────────────────────────────────
export function useArticles(page = 1) {
  return useQuery({
    queryKey: ["articles", page],
    queryFn:  () => api.get("/articles", { params: { page, limit: 20 } }).then(r => r.data),
  })
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["articles", id],
    queryFn:  () => api.get(`/articles/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })
}

// ── NFL 实时数据 ─────────────────────────────────────────
export function useScoreboard() {
  return useQuery({
    queryKey: ["nfl", "scoreboard"],
    queryFn:  () => api.get("/nfl/scoreboard").then(r => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,   // 每分钟刷新比分
  })
}
export function useNFLNews() {
  return useQuery({
    queryKey: ["nfl", "news"],
    queryFn:  () => api.get("/nfl/news").then(r => r.data.data),
    staleTime: 300_000,
  })
}
export function useStandings() {
  return useQuery({
    queryKey: ["nfl", "standings"],
    queryFn:  () => api.get("/nfl/standings").then(r => r.data.data),
    staleTime: 600_000,
  })
}
export function useGameDetail(id: string) {
  return useQuery({
    queryKey: ["nfl", "game", id],
    queryFn:  () => api.get(`/nfl/game/${id}`).then(r => r.data.data),
    enabled:  !!id,
    refetchInterval: 30_000,
  })
}

// ── Q&A ──────────────────────────────────────────────────
export function useQuestions(page = 1) {
  return useQuery({
    queryKey: ["questions", page],
    queryFn:  () => api.get("/qa/questions", { params: { page, limit: 20 } }).then(r => r.data),
  })
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ["questions", id],
    queryFn:  () => api.get(`/qa/questions/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })
}

export function useDailyQuiz() {
  return useQuery({
    queryKey: ["daily-quiz"],
    queryFn:  () => api.get("/qa/daily").then(r => r.data.data),
  })
}

export function useSubmitDaily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: number }) =>
      api.post(`/qa/daily/${id}/submit`, { choice }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-quiz"] }),
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; body: string; tags: string[] }) =>
      api.post("/qa/questions", data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  })
}

export function useCreateAnswer(questionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      api.post(`/qa/questions/${questionId}/answers`, { body }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", questionId] }),
  })
}

export function useEpisodeVTT(id: string) {
  return useQuery({
    queryKey: ["episodes", id, "vtt"],
    queryFn:  () => api.get(`/episodes/${id}/vtt`).then(r => r.data.data.vttContent as string),
    enabled:  !!id,
    retry:    false,
  })
}

export function useTranscribe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/episodes/${id}/transcribe`).then(r => r.data),
    onSuccess:  (_, id) => qc.invalidateQueries({ queryKey: ["episodes", id, "vtt"] }),
  })
}

// ── 评论 ─────────────────────────────────────────────────
export function useComments(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn:  () => api.get("/comments", { params: { targetType, targetId } }).then(r => r.data.data),
    enabled:  !!targetId,
  })
}

export function useCreateComment(targetType: string, targetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { body: string; parentId?: string }) =>
      api.post("/comments", { targetType, targetId, ...data }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", targetType, targetId] }),
  })
}

export function useLikeComment(targetType: string, targetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => api.post(`/comments/${commentId}/like`).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", targetType, targetId] }),
  })
}

// ── 个人主页 ─────────────────────────────────────────────
export function useMyQuestions() {
  return useQuery({ queryKey: ["me", "questions"], queryFn: () => api.get("/me/questions").then(r => r.data.data) })
}
export function useMyComments() {
  return useQuery({ queryKey: ["me", "comments"], queryFn: () => api.get("/me/comments").then(r => r.data.data) })
}
export function useMyAnswers() {
  return useQuery({ queryKey: ["me", "answers"], queryFn: () => api.get("/me/answers").then(r => r.data.data) })
}
export function useQuizStats() {
  return useQuery({ queryKey: ["me", "quiz-stats"], queryFn: () => api.get("/me/quiz-stats").then(r => r.data.data) })
}
export function useContinueListening() {
  return useQuery({ queryKey: ["me", "continue"], queryFn: () => api.get("/me/continue").then(r => r.data.data) })
}

// ── 断点续播 ─────────────────────────────────────────────
export function useSaveProgress() {
  return useMutation({
    mutationFn: (data: { episodeId: string; position: number }) => api.put("/me/progress", data),
  })
}
export function useGetProgress(episodeId: string) {
  return useQuery({
    queryKey: ["progress", episodeId],
    queryFn:  () => api.get(`/me/progress/${episodeId}`).then(r => r.data.data),
    enabled:  !!episodeId,
  })
}

export function useVoteAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answerId: string) =>
      api.post(`/qa/answers/${answerId}/vote`).then(r => r.data.data),
    onSuccess: (_, answerId) => qc.invalidateQueries({ queryKey: ["questions"] }),
  })
}
