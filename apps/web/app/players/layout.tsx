import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "NFL 球员数据分析",
  description: "全部现役 NFL 球员数据、能力矩阵雷达图、社区评分。按位置和球队筛选 3000+ 名美式橄榄球球员。",
  alternates: { canonical: "/players" },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
