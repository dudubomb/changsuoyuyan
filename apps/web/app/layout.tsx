import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Dancing_Script, Noto_Sans_SC } from "next/font/google"
import "./globals.css"
import Nav from "./components/Nav"
import QueryProvider from "./components/QueryProvider"

const geist   = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], weight: ["400", "700"] })
const notoSC  = Noto_Sans_SC({ variable: "--font-noto-sc", subsets: ["latin"], weight: ["400", "500", "700"] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://changsuoyuyan.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  "畅所煜彦 | NFL 美式橄榄球社区",
    template: "%s | 畅所煜彦 NFL",
  },
  description: "畅所煜彦是中文 NFL 美式橄榄球社区 —— 赛后播客、球员数据分析、规则问答。每周与 Star 和 Steven 一起畅所欲言 American Football 和 Fantasy Football。",
  keywords: [
    "NFL", "美式橄榄球", "American Football", "Fantasy Football",
    "NFL 播客", "NFL 中文", "美式橄榄球规则", "橄榄球规则", "球员数据", "畅所煜彦",
    "超级碗", "Super Bowl", "NFL 分析",
  ],
  authors: [{ name: "畅所煜彦 Star & Steven" }],
  creator: "畅所煜彦",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "畅所煜彦 NFL",
    title: "畅所煜彦 | NFL 美式橄榄球社区",
    description: "中文 NFL 社区 —— 赛后播客、球员数据分析、规则问答。",
    images: [{ url: "/logo.png", width: 800, height: 800, alt: "畅所煜彦 NFL" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "畅所煜彦 | NFL 美式橄榄球社区",
    description: "中文 NFL 社区 —— 播客、球员分析、规则问答。",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${geist.variable} ${dancing.variable} ${notoSC.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "畅所煜彦 NFL",
            url: SITE_URL,
            description: "中文 NFL 美式橄榄球社区 —— 播客、球员分析、规则问答",
            inLanguage: "zh-CN",
            about: { "@type": "Thing", name: "American Football / NFL" },
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/players?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }) }}
        />
      </head>
      <body className="h-dvh flex flex-col bg-black text-slate-100 overflow-hidden">
        <QueryProvider>
          <Nav />
          <div className="flex-1 overflow-auto min-h-0 flex flex-col">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
