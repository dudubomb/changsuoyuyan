import type { Metadata } from "next"

const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:3001"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://changsuoyuyan.com"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${API_URL}/players/${id}`, { next: { revalidate: 3600 } })
    const p   = (await res.json()).data
    if (!p) return { title: "球员" }
    const teamName = p.team?.name ?? ""
    const title = `${p.name}（${p.position} · ${teamName}）`
    const desc  = `${p.name} —— ${teamName} ${p.position} 球员数据、能力分析、社区评分。NFL 美式橄榄球球员档案。`
    return {
      title,
      description: desc,
      alternates: { canonical: `/players/${id}` },
      openGraph: {
        type: "profile",
        title,
        description: desc,
        url: `${SITE_URL}/players/${id}`,
        images: p.avatarUrl ? [{ url: p.avatarUrl }] : undefined,
      },
    }
  } catch {
    return { title: "球员" }
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
