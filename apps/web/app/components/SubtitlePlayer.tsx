"use client"
import { useEffect, useRef, useState, useCallback } from "react"

interface Cue { start: number; end: number; text: string }

function parseVTT(vtt: string): Cue[] {
  const cues: Cue[] = []
  const blocks = vtt.split("\n\n").slice(1)
  for (const block of blocks) {
    const lines    = block.trim().split("\n")
    const timeLine = lines.find(l => l.includes("-->"))
    if (!timeLine) continue
    const toSec = (t: string) => {
      const parts = t.split(":").map(Number)
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    const [s, e] = timeLine.split("-->").map(x => toSec(x.trim()))
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(" ").trim()
    if (text) cues.push({ start: s, end: e, text })
  }
  return cues
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

// KTV 单行：放大扫光效果
function KTVLine({
  text,
  pct,
  role,
}: {
  text: string
  pct:  number
  role: "prev" | "current" | "next"
}) {
  const base: React.CSSProperties = {
    fontFamily:   "var(--font-noto-sc), sans-serif",
    fontSize:     role === "current" ? "var(--ktv-size, 1.6rem)" : "1.1rem",
    fontWeight:   700,
    lineHeight:   1.4,
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
    maxWidth:     "100%",
    margin:       0,
    transition:   "font-size 0.3s ease",
  }

  if (role !== "current") {
    return (
      <p style={{ ...base, color: "#fff", opacity: role === "prev" ? 0.22 : 0.15 }}>
        {text}
      </p>
    )
  }

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      {/* 底层：暗色未播放 */}
      <p style={{ ...base, color: "rgba(255,255,255,0.2)" }}>{text}</p>
      {/* 上层：薄荷绿放大高亮，clip 控制进度 */}
      <p
        className="ktv-highlight"
        style={{
          ...base,
          position: "absolute",
          inset:    0,
          clipPath: `inset(0 ${100 - pct * 100}% 0 0)`,
        }}
      >
        {text}
      </p>
    </div>
  )
}

export default function SubtitlePlayer({
  audioUrl,
  vttContent,
  duration,
  layout = "stacked",
  episodeId,
}: {
  audioUrl:   string
  vttContent: string
  duration:   number
  layout?:    "stacked" | "side"
  episodeId?: string
  subtitleOnly?: boolean
  subtitleInline?: boolean
}) {
  const audioRef                      = useRef<HTMLAudioElement>(null)
  const progressRef                   = useRef<HTMLDivElement>(null)
  const [cues, setCues]               = useState<Cue[]>([])
  const [currentIdx, setCurrentIdx]   = useState(-1)
  const [linePct, setLinePct]         = useState(0)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [progress, setProgress]       = useState(0)
  const [elapsed, setElapsed]         = useState(0)
  const [speed, setSpeed]             = useState(1)
  const SPEEDS                        = [0.75, 1, 1.25, 1.5, 2]

  useEffect(() => {
    if (vttContent) setCues(parseVTT(vttContent))
  }, [vttContent])

  // 断点续播：恢复进度 + 定时保存
  useEffect(() => {
    if (!episodeId) return
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (!token) return
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

    // 恢复
    fetch(`${apiBase}/me/progress/${episodeId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ data }) => {
        const audio = audioRef.current
        if (data?.position && audio && data.position < (audio.duration || duration) - 5) {
          audio.currentTime = data.position
        }
      })
      .catch(() => {})

    // 每 15 秒保存一次
    const save = () => {
      const audio = audioRef.current
      if (!audio || audio.paused || audio.currentTime < 3) return
      fetch(`${apiBase}/me/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ episodeId, position: audio.currentTime }),
      }).catch(() => {})
    }
    const interval = setInterval(save, 15000)
    return () => { save(); clearInterval(interval) }
  }, [episodeId, duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let rafId: number

    const tick = () => {
      const t = audio.currentTime
      setElapsed(t)
      setProgress(t / (audio.duration || duration || 1) * 100)

      const idx = cues.findIndex(c => t >= c.start && t <= c.end)
      setCurrentIdx(idx)

      if (idx >= 0) {
        const c = cues[idx]
        setLinePct(Math.max(0, Math.min(1, (t - c.start) / (c.end - c.start))))
      }

      rafId = requestAnimationFrame(tick)
    }

    const onPlay  = () => { setIsPlaying(true);  rafId = requestAnimationFrame(tick) }
    const onPause = () => { setIsPlaying(false);  cancelAnimationFrame(rafId) }
    const onEnded = () => { setIsPlaying(false);  cancelAnimationFrame(rafId); setProgress(100) }

    audio.addEventListener("play",  onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    // 拖拽时也要更新
    audio.addEventListener("seeked", tick)

    return () => {
      cancelAnimationFrame(rafId)
      audio.removeEventListener("play",   onPlay)
      audio.removeEventListener("pause",  onPause)
      audio.removeEventListener("ended",  onEnded)
      audio.removeEventListener("seeked", tick)
    }
  }, [cues, duration])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    isPlaying ? a.pause() : a.play()
  }

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar   = progressRef.current
    if (!audio || !bar) return
    const rect = bar.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * (audio.duration || duration)
  }, [duration])

  const skip = (secs: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(a.currentTime + secs, a.duration || duration))
  }

  const cycleSpeed = () => {
    const a = audioRef.current
    if (!a) return
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
    a.playbackRate = next
    setSpeed(next)
  }

  const prevCue    = currentIdx > 0           ? cues[currentIdx - 1] : null
  const currentCue = currentIdx >= 0          ? cues[currentIdx]     : null
  const nextCue    = currentIdx < cues.length - 1 ? cues[currentIdx + 1] : null

  // 字幕面板（复用）
  const SubtitlePanel = (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl px-6 flex flex-col items-center justify-center gap-3 overflow-hidden"
      style={{
        minHeight: layout === "side" ? "100%" : "clamp(200px, 40vw, 360px)",
        padding:   layout === "side" ? "2rem 1.5rem" : "2rem 1.5rem",
      }}
    >
      <style>{`
        @media (min-width: 768px) { :root { --ktv-size: ${layout === "side" ? "2.2rem" : "3rem"}; } }
        :root { --ktv-size: 1.5rem; }
      `}</style>
      {!cues.length || (!isPlaying && currentIdx < 0) ? (
        <p className="text-white/20 text-sm text-center">▶ 播放时显示字幕</p>
      ) : (
        <>
          {prevCue    && <KTVLine text={prevCue.text}    pct={1}       role="prev"    />}
          {currentCue
            ? <KTVLine text={currentCue.text} pct={linePct} role="current" />
            : <div style={{ minHeight: "var(--ktv-size, 1.5rem)" }} />
          }
          {nextCue    && <KTVLine text={nextCue.text}    pct={0}       role="next"    />}
        </>
      )}
    </div>
  )

  if (layout === "side") {
    return (
      <div className="flex flex-col gap-4 h-full">
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
        {/* 字幕区占主体 */}
        <div className="flex-1">{SubtitlePanel}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      {/* 播放控件 */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-4 space-y-3 shadow-xl">

        {/* 进度条 */}
        <div
          ref={progressRef}
          onClick={seek}
          className="relative h-2 bg-white/10 rounded-full cursor-pointer group"
          style={{ marginTop: "8px", marginBottom: "8px" }}
        >
          {/* 绿色进度 */}
          <div
            className="h-2 rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #2d9e6b, #3eb489, #5ecfa0)",
              boxShadow: "0 0 8px rgba(62,180,137,0.5)",
            }}
          />
          {/* 橄榄球指示点 */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left:       `calc(${progress}% - 10px)`,
              fontSize:   "20px",
              lineHeight:  1,
              filter:     "drop-shadow(0 0 4px rgba(62,180,137,0.8))",
              userSelect: "none",
            }}
          >
            🏈
          </div>
        </div>

        {/* 时间 */}
        <div className="flex justify-between text-xs text-white/25">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={cycleSpeed}
            className="text-xs text-white/40 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-colors w-14 text-center"
          >
            {speed}x
          </button>

          <div className="flex items-center gap-5">
            <button
              onClick={() => skip(-15)}
              className="relative flex items-center justify-center text-white/60 hover:text-[#a8edcf] transition-all active:scale-90 group/skip"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover/skip:-rotate-12">
                <defs>
                  <filter id="chalk-l" x="-30%" y="-30%" width="160%" height="160%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
                  </filter>
                </defs>
                <g filter="url(#chalk-l)" opacity="0.92">
                  <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M6 2.5L5.5 7.5L10.5 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="var(--font-dancing)" fill="currentColor" filter="url(#chalk-l)">15</text>
              </svg>
            </button>

            {/* 手绘动漫风播放键（黑胶 + logo） */}
            <button
              onClick={togglePlay}
              className="relative flex-shrink-0 group active:scale-95 transition-transform"
              style={{ width: 116, height: 116 }}
            >
              {/* 旋转黑胶层（播放时旋转） */}
              <div
                className={isPlaying ? "logo-spinning" : "logo-paused"}
                style={{ position: "absolute", inset: 0 }}
              >
                <svg width="116" height="116" viewBox="0 0 116 116" fill="none">
                  <defs>
                    {/* 黑灰水彩质感填充 */}
                    <radialGradient id="discFill" cx="40%" cy="35%" r="75%">
                      <stop offset="0%"   stopColor="#4a4750" />
                      <stop offset="45%"  stopColor="#33303a" />
                      <stop offset="100%" stopColor="#1c1a22" />
                    </radialGradient>
                    {/* 水彩斑驳叠加 */}
                    <radialGradient id="discBlotch" cx="65%" cy="70%" r="50%">
                      <stop offset="0%"   stopColor="rgba(80,76,90,0.5)" />
                      <stop offset="100%" stopColor="rgba(80,76,90,0)" />
                    </radialGradient>
                    {/* 手绘抖动滤镜 */}
                    <filter id="handDrawn" x="-10%" y="-10%" width="120%" height="120%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="5" result="n" />
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
                    </filter>
                  </defs>

                  <g filter="url(#handDrawn)">
                    {/* 外圈粗描边圆盘 */}
                    <circle cx="58" cy="58" r="50" fill="url(#discFill)" stroke="#15131a" strokeWidth="6" />
                    {/* 水彩斑驳 */}
                    <circle cx="58" cy="58" r="50" fill="url(#discBlotch)" />
                    {/* 黑胶纹路（浅灰细圈） */}
                    <circle cx="58" cy="58" r="44" fill="none" stroke="rgba(120,116,130,0.35)" strokeWidth="1" />
                    <circle cx="58" cy="58" r="38" fill="none" stroke="rgba(120,116,130,0.28)" strokeWidth="1" />
                    <circle cx="58" cy="58" r="32" fill="none" stroke="rgba(120,116,130,0.22)" strokeWidth="1" />
                    {/* 左上橄榄球 — 真实比例 (~1.8:1) */}
                    <g transform="rotate(-28 40 34)">
                      {/* 球身：修长，两端适度收尖带圆角 */}
                      <path
                        d="M19 34 C19 28 28 24 40 24 C52 24 61 28 61 34 C61 40 52 44 40 44 C28 44 19 40 19 34 Z"
                        fill="#7d4019"
                      />
                      {/* 上半亮色皮革 */}
                      <path
                        d="M19 34 C19 28 28 24 40 24 C52 24 61 28 61 34 C56 37 48 38 40 38 C32 38 24 37 19 34 Z"
                        fill="#9c5621"
                      />
                      {/* 高光 */}
                      <ellipse cx="37" cy="29.5" rx="13" ry="3.5" fill="rgba(255,255,255,0.2)" />
                      {/* 两端白色尖帽（细长） */}
                      <path d="M19 34 C21.5 31.5 25 31.5 27 34 C25 36.5 21.5 36.5 19 34 Z" fill="#fff" />
                      <path d="M61 34 C58.5 31.5 55 31.5 53 34 C55 36.5 58.5 36.5 61 34 Z" fill="#fff" />
                      {/* 中央缝线 */}
                      <line x1="31" y1="34" x2="49" y2="34" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                      {/* 鞋带横线 */}
                      <line x1="34" y1="31" x2="34" y2="37" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="37.3" y1="30.6" x2="37.3" y2="37.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="40.6" y1="30.6" x2="40.6" y2="37.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="43.9" y1="31" x2="43.9" y2="37" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </g>
                </svg>

                {/* 中心 logo */}
                <img
                  src="/logo.png"
                  alt="play"
                  style={{
                    position:     "absolute",
                    top:          "50%",
                    left:         "50%",
                    transform:    "translate(-50%, -50%)",
                    width:        "46px",
                    height:       "46px",
                    borderRadius: "50%",
                    objectFit:    "cover",
                    border:       "2px solid #3a3340",
                  }}
                />
              </div>

              {/* 暂停时：手绘三角覆盖（不旋转） */}
              {!isPlaying && (
                <svg
                  width="116" height="116" viewBox="0 0 116 116" fill="none"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <defs>
                    <filter id="triHand" x="-20%" y="-20%" width="140%" height="140%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="9" result="tn" />
                      <feDisplacementMap in="SourceGraphic" in2="tn" scale="3" />
                    </filter>
                  </defs>
                  {/* 半透明遮罩让三角突出 */}
                  <circle cx="58" cy="58" r="48" fill="rgba(0,0,0,0.28)" />
                  <g filter="url(#triHand)">
                    {/* 白色手绘三角 + 粗深描边 */}
                    <path
                      d="M48 40 L78 58 L48 76 Z"
                      fill="#ffffff"
                      stroke="#3a3340"
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              )}
            </button>

            <button
              onClick={() => skip(15)}
              className="relative flex items-center justify-center text-white/60 hover:text-[#a8edcf] transition-all active:scale-90 group/skip"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover/skip:rotate-12">
                <defs>
                  <filter id="chalk-r" x="-30%" y="-30%" width="160%" height="160%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
                  </filter>
                </defs>
                <g filter="url(#chalk-r)" opacity="0.92">
                  <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M18 2.5L18.5 7.5L13.5 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="var(--font-dancing)" fill="currentColor" filter="url(#chalk-r)">15</text>
              </svg>
            </button>
          </div>

          <div className={`text-xs px-3 py-1.5 rounded-full border w-14 text-center ${
            cues.length > 0
              ? "text-[#a8edcf]/70 bg-[#3eb489]/10 border-[#3eb489]/30"
              : "text-white/20 bg-white/5 border-white/10"
          }`}>
            {cues.length > 0 ? "字幕" : "无幕"}
          </div>
        </div>
      </div>

      {/* KTV 字幕区 */}
      {SubtitlePanel}
    </div>
  )
}
