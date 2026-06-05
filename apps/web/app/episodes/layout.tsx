import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "NFL 播客",
  description: "畅所煜彦 NFL 美式橄榄球播客 —— 每周赛后回顾、选秀分析、超级碗复盘，与 Star 和 Steven 一起畅所欲言 American Football。",
  alternates: { canonical: "/episodes" },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
