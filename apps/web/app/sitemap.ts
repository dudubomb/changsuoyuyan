import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://changsuoyuyan.com"
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:3001"

export const revalidate = 3600 // 每小时刷新

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,              changeFrequency: "daily",  priority: 1 },
    { url: `${SITE_URL}/episodes`, changeFrequency: "daily",  priority: 0.9 },
    { url: `${SITE_URL}/players`,  changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/qa`,       changeFrequency: "daily",  priority: 0.8 },
  ]

  // 动态拉播客和球员（失败时只返回静态页）
  try {
    const [epRes, plRes] = await Promise.all([
      fetch(`${API_URL}/episodes?limit=100`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/players?limit=500`,  { next: { revalidate: 3600 } }),
    ])
    const episodes = (await epRes.json()).data ?? []
    const players  = (await plRes.json()).data ?? []

    const epUrls: MetadataRoute.Sitemap = episodes.map((e: any) => ({
      url: `${SITE_URL}/episodes/${e.id}`,
      lastModified: e.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
    const plUrls: MetadataRoute.Sitemap = players.map((p: any) => ({
      url: `${SITE_URL}/players/${p.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))

    return [...staticPages, ...epUrls, ...plUrls]
  } catch {
    return staticPages
  }
}
