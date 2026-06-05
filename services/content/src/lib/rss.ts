import Parser from "rss-parser"

const parser = new Parser({
  customFields: {
    item: [
      ["itunes:duration",    "itunesDuration"],
      ["itunes:image",       "itunesImage"],
      ["itunes:episode",     "itunesEpisode"],
      ["itunes:season",      "itunesSeason"],
      ["itunes:explicit",    "itunesExplicit"],
    ],
    feed: [
      ["itunes:author",  "itunesAuthor"],
      ["itunes:image",   "itunesImage"],
      ["itunes:category","itunesCategory"],
    ],
  },
})

// 把 "1:02:34" 或 "3720" 统一转成秒数
function parseDuration(raw: string | undefined): number {
  if (!raw) return 0
  if (/^\d+$/.test(raw)) return parseInt(raw)
  const parts = raw.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export interface ParsedFeed {
  title:       string
  description: string
  coverUrl:    string
  author:      string
  episodes:    ParsedEpisode[]
}

export interface ParsedEpisode {
  guid:        string
  title:       string
  description: string
  audioUrl:    string
  coverUrl:    string
  duration:    number       // 秒
  publishedAt: Date
  episodeNum:  number | null
}

export async function parseFeed(url: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(url)

  const episodes: ParsedEpisode[] = (feed.items ?? [])
    .filter(item => item.enclosure?.url)
    .map(item => ({
      guid:        item.guid ?? item.link ?? item.title ?? "",
      title:       item.title ?? "Untitled",
      description: item.contentSnippet ?? item.content ?? "",
      audioUrl:    item.enclosure!.url,
      coverUrl:    (item as any).itunesImage?.$ ?.href
                    ?? (item as any).itunesImage
                    ?? (feed as any).itunesImage?.$ ?.href
                    ?? "",
      duration:    parseDuration((item as any).itunesDuration),
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      episodeNum:  (item as any).itunesEpisode ? Number((item as any).itunesEpisode) : null,
    }))

  return {
    title:       feed.title ?? "",
    description: feed.description ?? "",
    coverUrl:    (feed as any).itunesImage?.$ ?.href ?? (feed as any).itunesImage ?? "",
    author:      (feed as any).itunesAuthor ?? feed.creator ?? "",
    episodes,
  }
}
