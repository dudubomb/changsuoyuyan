// Spotify Web API — Client Credentials Flow（无需用户授权，可搜索公开内容）
// 需要在 https://developer.spotify.com 创建应用获取 Client ID / Secret

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not configured")

  // 缓存 token（有效期 3600s）
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  })

  const data = await res.json() as any
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.token
}

export interface SpotifyShow {
  id:          string
  name:        string
  description: string
  publisher:   string
  images:      { url: string }[]
  external_urls: { spotify: string }
}

export interface SpotifyEpisode {
  id:           string
  name:         string
  description:  string
  audio_preview_url: string | null
  duration_ms:  number
  release_date: string
  images:       { url: string }[]
  external_urls: { spotify: string }
}

// 搜索播客节目
export async function searchShows(query: string, limit = 10): Promise<SpotifyShow[]> {
  const token = await getAccessToken()
  const url   = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=${limit}&market=US`
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data  = await res.json() as any
  return data.shows?.items ?? []
}

// 获取节目的单集列表
export async function getShowEpisodes(showId: string, limit = 50, offset = 0): Promise<SpotifyEpisode[]> {
  const token = await getAccessToken()
  const url   = `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offset}&market=US`
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data  = await res.json() as any
  return data.items ?? []
}

// 获取节目详情
export async function getShow(showId: string): Promise<SpotifyShow | null> {
  const token = await getAccessToken()
  const url   = `https://api.spotify.com/v1/shows/${showId}?market=US`
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  return res.json() as any
}
