"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEpisode, useEpisodeVTT, useTranscribe } from "../../lib/hooks"
import SubtitlePlayer from "../../components/SubtitlePlayer"
import Comments from "../../components/Comments"
import { useAuthStore } from "../../lib/auth-store"

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function EpisodePage() {
  const { id }   = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { data: episode, isLoading } = useEpisode(id)
  const { data: vttContent }         = useEpisodeVTT(id)
  const transcribe                   = useTranscribe()

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3eb489]/40 border-t-[#3eb489] rounded-full animate-spin" />
    </div>
  )

  if (!episode) return (
    <div className="flex-1 flex flex-col items-center justify-center text-white/30">
      <p className="text-5xl mb-3">🎙</p><p>播客不存在</p>
    </div>
  )

  return (
    <>
      {/* 全屏视频背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay muted loop playsInline
          ref={el => { if (el) el.playbackRate = 0.4 }}
          className="w-full h-full object-cover"
        >
          <source src="/podcast-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))" }} />
      </div>

    {/* 内容层 */}
    <div className="relative z-10 flex-1 flex flex-col px-6 py-4 max-w-3xl mx-auto w-full gap-3" style={{ minHeight: 0 }}>

      {/* 返回 */}
      <Link href="/episodes" className="text-xs text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
        ← 返回播客列表
      </Link>

      {/* 标题卡片 — 固定高度 */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-4 flex-shrink-0 space-y-2 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {episode.subtitle && (
              <p className="text-white/35 text-xs mb-1">{episode.subtitle}</p>
            )}
            <h1 className="text-lg font-bold text-white leading-snug line-clamp-2">
              {episode.title}
            </h1>
            {episode.summary && (
              <p className="text-white/45 text-sm leading-relaxed mt-1">{episode.summary}</p>
            )}
          </div>
          {episode.coverUrl && (
            <img src={episode.coverUrl} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {episode.tags?.slice(0,3).map((t: string) => (
            <span key={t} className="text-xs bg-blue-500/10 text-blue-300/70 border border-blue-400/20 px-2 py-0.5 rounded-full">{t}</span>
          ))}
          <span className="text-xs font-medium text-white/50 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full">
            📅 {new Date(episode.publishedAt).toLocaleDateString("zh-CN")}
          </span>
          <span className="text-xs font-medium text-[#a8edcf]/80 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2 py-0.5 rounded-full">
            ⏱ {formatDuration(episode.duration)}
          </span>
        </div>
      </div>

      {/* 播放器 — 固定高度 */}
      {episode.audioUrl && (
        <div className="flex-shrink-0">
          <SubtitlePlayer
            audioUrl={episode.audioUrl}
            vttContent={vttContent ?? ""}
            duration={episode.duration}
            layout="stacked"
            episodeId={id}
          />
        </div>
      )}

      {/* 字幕按钮 */}
      <div className="flex-shrink-0 flex items-center gap-3">
        {vttContent ? (
          <div className="text-xs text-[#a8edcf]/70 bg-[#3eb489]/10 border border-[#3eb489]/20 px-3 py-1 rounded-full">
            ✓ 字幕已生成
          </div>
        ) : user && (
          <button
            onClick={() => transcribe.mutate(id)}
            disabled={transcribe.isPending}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white bg-white/5 border border-white/10 hover:border-white/25 px-4 py-1.5 rounded-full transition-all disabled:opacity-40"
          >
            {transcribe.isPending
              ? <><span className="animate-spin inline-block">⟳</span> 转录中...</>
              : <>🎙 生成字幕</>
            }
          </button>
        )}
      </div>

      {/* 评论 */}
      <Comments targetType="episode" targetId={id} />

    </div>
    </>
  )
}

// 独立字幕显示（KTV 效果，监听同一音频）
import { useEffect, useState, useRef } from "react"

interface Cue { start: number; end: number; text: string }

function parseVTT(vtt: string): Cue[] {
  const cues: Cue[] = []
  const blocks = vtt.split("\n\n").slice(1)
  for (const block of blocks) {
    const lines    = block.trim().split("\n")
    const timeLine = lines.find(l => l.includes("-->"))
    if (!timeLine) continue
    const toSec = (t: string) => { const p = t.split(":").map(Number); return p[0]*3600+p[1]*60+p[2] }
    const [s, e] = timeLine.split("-->").map(x => toSec(x.trim()))
    const text = lines.slice(lines.indexOf(timeLine)+1).join(" ").trim()
    if (text) cues.push({ start: s, end: e, text })
  }
  return cues
}

function SubtitleDisplay({ vttContent, audioUrl, duration }: { vttContent: string; audioUrl: string; duration: number }) {
  const audioRef              = useRef<HTMLAudioElement>(null)
  const [cues, setCues]       = useState<Cue[]>([])
  const [idx, setIdx]         = useState(-1)
  const [pct, setPct]         = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => { if (vttContent) setCues(parseVTT(vttContent)) }, [vttContent])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    let raf: number
    const tick = () => {
      const t = a.currentTime
      const i = cues.findIndex(c => t >= c.start && t <= c.end)
      setIdx(i)
      if (i >= 0) setPct(Math.max(0, Math.min(1, (t - cues[i].start) / (cues[i].end - cues[i].start))))
      raf = requestAnimationFrame(tick)
    }
    const onPlay  = () => { setPlaying(true);  raf = requestAnimationFrame(tick) }
    const onPause = () => { setPlaying(false);  cancelAnimationFrame(raf) }
    a.addEventListener("play", onPlay); a.addEventListener("pause", onPause); a.addEventListener("ended", onPause)
    return () => { cancelAnimationFrame(raf); a.removeEventListener("play",onPlay); a.removeEventListener("pause",onPause) }
  }, [cues])

  const prev    = idx > 0               ? cues[idx-1] : null
  const current = idx >= 0              ? cues[idx]   : null
  const next    = idx < cues.length-1   ? cues[idx+1] : null

  if (!vttContent) return (
    <p className="text-white/15 text-sm">▶ 播放时显示字幕</p>
  )

  return (
    <div className="w-full flex flex-col items-center gap-4 px-6">
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      {!playing && idx < 0 ? (
        <p className="text-white/20 text-sm">▶ 播放时显示字幕</p>
      ) : (
        <>
          {prev    && <KTVLine text={prev.text}    pct={1}   role="prev"    />}
          {current ? <KTVLine text={current.text}  pct={pct} role="current" />
                   : <div style={{ height: "var(--ktv-size, 1.5rem)" }} />}
          {next    && <KTVLine text={next.text}     pct={0}   role="next"    />}
        </>
      )}
    </div>
  )
}

function KTVLine({ text, pct, role }: { text: string; pct: number; role: "prev"|"current"|"next" }) {
  const base: React.CSSProperties = {
    fontFamily:   "var(--font-noto-sc), sans-serif",
    fontSize:     role === "current" ? "var(--ktv-size, 1.5rem)" : "calc(var(--ktv-size, 1.5rem) * 0.65)",
    fontWeight:   700,
    lineHeight:   1.4,
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
    maxWidth:     "100%",
    margin:       0,
    transition:   "font-size 0.3s ease",
  }
  if (role !== "current") return <p style={{ ...base, color: "#fff", opacity: role === "prev" ? 0.2 : 0.12 }}>{text}</p>
  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <p style={{ ...base, color: "rgba(255,255,255,0.2)" }}>{text}</p>
      <p className="ktv-highlight" style={{ ...base, position:"absolute", inset:0, clipPath:`inset(0 ${100-pct*100}% 0 0)` }}>{text}</p>
    </div>
  )
}
