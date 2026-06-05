import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "NFL 规则问答",
  description: "美式橄榄球规则问答社区 —— 认证裁判解读、每日一题答题、争议判罚讨论。学习 NFL 规则从这里开始。",
  alternates: { canonical: "/qa" },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
