import type { Metadata } from "next"

const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:3001"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://changsuoyuyan.com"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${API_URL}/episodes/${id}`, { next: { revalidate: 3600 } })
    const ep  = (await res.json()).data
    if (!ep) return { title: "播客" }
    const desc = (ep.summary ?? "").slice(0, 150)
    return {
      title: ep.title,
      description: desc || `${ep.title} —— 畅所煜彦 NFL 美式橄榄球播客`,
      alternates: { canonical: `/episodes/${id}` },
      openGraph: {
        type: "article",
        title: ep.title,
        description: desc,
        url: `${SITE_URL}/episodes/${id}`,
        images: ep.coverUrl ? [{ url: ep.coverUrl }] : undefined,
      },
    }
  } catch {
    return { title: "播客" }
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
