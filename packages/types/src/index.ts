export type UserRole = 'fan' | 'host' | 'editor' | 'coach' | 'referee'

export interface User {
  id: string
  nickname: string
  avatar?: string
  role: UserRole
  isVerified: boolean
  createdAt: Date
}

export interface Chapter {
  title: string
  startTime: number
  linkedQuestionId?: string
}

export interface Tag {
  id: string
  name: string
  type: 'team' | 'player' | 'competition' | 'topic'
}

export interface Episode {
  id: string
  title: string
  audioUrl: string
  coverUrl?: string
  duration: number
  summary?: string
  chapters: Chapter[]
  tags: Tag[]
  relatedArticleIds: string[]
  relatedPlayerIds: string[]
  authorId: string
  publishedAt: Date
}

export interface Article {
  id: string
  authorId: string
  title: string
  body: string
  episodeId?: string
  tags: Tag[]
  publishedAt: Date
}

export interface Question {
  id: string
  authorId: string
  title: string
  body: string
  episodeId?: string
  chapterTimestamp?: number
  tags: Tag[]
  createdAt: Date
}

export interface Answer {
  id: string
  questionId: string
  authorId: string
  body: string
  isCertified: boolean
  voteCount: number
  createdAt: Date
}

export interface PlayerStats {
  season: string
  matches: number
  tries: number
  tackles: number
  carries: number
}

export interface Player {
  id: string
  name: string
  team: string
  position: string
  nationality: string
  bio?: string
  stats: PlayerStats[]
  communityRating: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    page: number
    total: number
    totalPages: number
  }
}
