"use client"
import { useEffect, useRef } from "react"

// Canvas 体积聚光灯：动态雾 + 上升尘埃 + 神光
export default function SpotlightCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    // 光源位置（顶部中央偏上）
    const srcX = () => W / 2
    const srcY = () => -H * 0.06
    // 光锥半角
    const topHalf = 28      // 顶部半宽
    const botHalf = () => W * 0.42  // 底部半宽

    // 移动端降级：减少粒子数 + 降帧，省电省性能
    const isMobile = window.innerWidth < 768

    // 尘埃粒子（带深度 z 做视差/大小）
    type P = { x: number; y: number; z: number; vy: number; vx: number; phase: number; r: number }
    const N = isMobile ? 35 : 90
    const parts: P[] = []
    const spawn = (): P => {
      const z = Math.random()            // 0 远 1 近
      return {
        x: W / 2 + (Math.random() - 0.5) * W * 0.5,
        y: Math.random() * H,
        z,
        vy: -(8 + z * 22) / 60,          // 近的飘得快
        vx: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
        r: 0.4 + z * 2.2,
      }
    }
    for (let i = 0; i < N; i++) parts.push(spawn())

    // 散景虚化光斑（大而柔，营造电影景深）
    type Bokeh = { x: number; y: number; r: number; vy: number; hue: number; phase: number }
    const bokeh: Bokeh[] = Array.from({ length: isMobile ? 4 : 10 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.35,
      y: Math.random() * H,
      r: 18 + Math.random() * 38,
      vy: -(2 + Math.random() * 4) / 60,
      hue: Math.random() < 0.5 ? 0 : 1,  // 0 暖白 1 冷绿
      phase: Math.random() * Math.PI * 2,
    }))

    // 判断点是否在光锥内，返回 0-1 强度
    const coneIntensity = (x: number, y: number): number => {
      if (y < 0) return 0
      const t = y / H                              // 0 顶 1 底
      const half = topHalf + (botHalf() - topHalf) * t
      const cx = srcX()
      const dx = Math.abs(x - cx)
      if (dx > half) return 0
      const edge = 1 - dx / half                   // 中心1 边缘0
      const falloff = 1 - t * 0.75                  // 越往下越暗
      return Math.pow(edge, 1.6) * falloff
    }

    // 神光射线（从光源发散的细光柱），固定角度+随机宽度
    const rays = Array.from({ length: isMobile ? 6 : 14 }, () => ({
      ang:    (Math.random() - 0.5) * 0.5,   // 相对竖直的偏角（弧度）
      width:  6 + Math.random() * 22,
      alpha:  0.03 + Math.random() * 0.06,
      phase:  Math.random() * Math.PI * 2,
      speed:  0.3 + Math.random() * 0.5,
    }))

    let raf = 0
    let time = 0
    let lastFrame = 0
    const frameInterval = isMobile ? 1000 / 30 : 0  // 手机锁 30fps

    const draw = (now = 0) => {
      raf = requestAnimationFrame(draw)
      // 移动端降帧
      if (frameInterval && now - lastFrame < frameInterval) return
      lastFrame = now

      time += 0.016
      ctx.clearRect(0, 0, W, H)

      // 1. 光锥主体（径向渐变 + 多段三角填充模拟体积）
      const cx = srcX()
      // 微妙整体闪烁（电流/灯丝质感）
      const flick = 0.92 + 0.08 * (Math.sin(time * 7.3) * 0.5 + Math.sin(time * 13.1) * 0.3 + Math.sin(time * 2.1) * 0.2)
      const grad = ctx.createLinearGradient(0, srcY(), 0, H)
      grad.addColorStop(0,    `rgba(255,255,255,${0.42 * flick})`)
      grad.addColorStop(0.10, `rgba(205,250,230,${0.28 * flick})`)
      grad.addColorStop(0.45, `rgba(120,210,175,${0.10 * flick})`)
      grad.addColorStop(0.80, "rgba(62,180,137,0.02)")
      grad.addColorStop(1,    "rgba(62,180,137,0)")

      // 逐行水平渐变填充，边缘自然羽化（无硬边）
      ctx.save()
      ctx.globalCompositeOperation = "screen"
      const STEP = 2
      for (let y = 0; y < H; y += STEP) {
        const t = y / H
        const half = topHalf + (botHalf() - topHalf) * t
        // 沿光线方向的亮度（复用 grad 的衰减）
        let vAlpha: number
        if (t < 0.10)      vAlpha = 0.42 - (0.42 - 0.28) * (t / 0.10)
        else if (t < 0.45) vAlpha = 0.28 - (0.28 - 0.10) * ((t - 0.10) / 0.35)
        else if (t < 0.80) vAlpha = 0.10 - (0.10 - 0.02) * ((t - 0.45) / 0.35)
        else               vAlpha = 0.02 * (1 - (t - 0.80) / 0.20)
        vAlpha *= flick
        if (vAlpha <= 0.001) continue
        // 颜色随深度从白过渡到绿
        const col = t < 0.3 ? "230,252,242" : t < 0.6 ? "150,225,190" : "62,180,137"
        // 水平渐变：中心亮 → 两侧透明（超长羽化，溶解边缘）
        const feather = half * 2.6   // 大幅放大羽化区，看不出锥形轮廓
        const hg = ctx.createLinearGradient(cx - feather, 0, cx + feather, 0)
        hg.addColorStop(0,    `rgba(${col},0)`)
        hg.addColorStop(0.20, `rgba(${col},${vAlpha * 0.04})`)
        hg.addColorStop(0.38, `rgba(${col},${vAlpha * 0.35})`)
        hg.addColorStop(0.5,  `rgba(${col},${vAlpha})`)
        hg.addColorStop(0.62, `rgba(${col},${vAlpha * 0.35})`)
        hg.addColorStop(0.80, `rgba(${col},${vAlpha * 0.04})`)
        hg.addColorStop(1,    `rgba(${col},0)`)
        ctx.fillStyle = hg
        ctx.fillRect(cx - feather, y, feather * 2, STEP + 1)
      }
      ctx.restore()

      // 2. 动态体积雾（飘动的柔和光斑，模拟空气湍流）
      ctx.save()
      ctx.globalCompositeOperation = "screen"
      for (let i = 0; i < 6; i++) {
        const fx = cx + Math.sin(time * 0.3 + i * 1.7) * W * 0.14
        const fy = H * (0.12 + i * 0.16) + Math.cos(time * 0.25 + i) * 35
        const fr = 140 + i * 45 + Math.sin(time * 0.4 + i) * 30
        const fogGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr)
        const a = 0.045 * (1 - i / 7)
        fogGrad.addColorStop(0,   `rgba(190,240,215,${a})`)
        fogGrad.addColorStop(0.5, `rgba(190,240,215,${a * 0.4})`)
        fogGrad.addColorStop(1,   "rgba(190,240,215,0)")
        ctx.fillStyle = fogGrad
        ctx.fillRect(0, 0, W, H)
      }
      ctx.restore()
      // 2.5 神光射线（God rays）— 从光源发散的细光柱（无 clip，靠自身渐变羽化）
      ctx.save()
      ctx.globalCompositeOperation = "screen"
      const sy = srcY()
      for (const ray of rays) {
        const flicker = 0.7 + 0.3 * Math.sin(time * ray.speed + ray.phase)
        const a = ray.alpha * flicker
        // 射线在底部的落点
        const farLen = H * 1.2
        const ex = cx + Math.sin(ray.ang) * farLen
        const ey = sy + Math.cos(ray.ang) * farLen
        const grd = ctx.createLinearGradient(cx, sy, ex, ey)
        grd.addColorStop(0,   `rgba(225,252,240,${a})`)
        grd.addColorStop(0.5, `rgba(150,225,190,${a * 0.4})`)
        grd.addColorStop(1,   "rgba(150,225,190,0)")
        ctx.strokeStyle = grd
        ctx.lineWidth = ray.width
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(cx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
      ctx.restore()

      // 3. 尘埃粒子（带景深虚化）
      ctx.globalCompositeOperation = "screen"
      for (const p of parts) {
        p.y += p.vy
        p.x += p.vx + Math.sin(time + p.phase) * 0.12
        if (p.y < -10) { Object.assign(p, spawn(), { y: H + 10 }) }

        const inten = coneIntensity(p.x, p.y)
        if (inten <= 0.02) continue
        const twinkle = 0.6 + 0.4 * Math.sin(time * 2 + p.phase)
        const alpha = inten * twinkle * (0.4 + p.z * 0.6)
        // 景深：近的(z大)锐利核心 + 光晕；远的(z小)只有柔光团
        const core   = p.r * (0.5 + p.z * 0.7)
        const bloom  = core * (4 - p.z * 1.5)   // 远的光晕更大更虚
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bloom)
        g.addColorStop(0,   `rgba(245,255,250,${alpha})`)
        g.addColorStop(0.3, `rgba(190,245,220,${alpha * 0.5})`)
        g.addColorStop(1,   "rgba(190,245,220,0)")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, bloom, 0, Math.PI * 2)
        ctx.fill()
        // 近处粒子加锐利核心点
        if (p.z > 0.6) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, core * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      // 3.5 散景虚化光斑（电影景深）
      for (const b of bokeh) {
        b.y += b.vy
        b.x += Math.sin(time * 0.4 + b.phase) * 0.2
        if (b.y < -b.r) { b.y = H + b.r; b.x = W / 2 + (Math.random() - 0.5) * W * 0.35 }
        const inten = coneIntensity(b.x, b.y)
        if (inten <= 0.03) continue
        const breathe = 0.7 + 0.3 * Math.sin(time * 0.8 + b.phase)
        const a = inten * breathe * 0.06
        const col = b.hue === 0 ? "245,255,248" : "150,225,190"
        // 散景特征：边缘略亮的环形软盘
        const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.3, b.x, b.y, b.r)
        g.addColorStop(0,    `rgba(${col},${a * 0.5})`)
        g.addColorStop(0.75, `rgba(${col},${a * 0.7})`)
        g.addColorStop(0.92, `rgba(${col},${a})`)
        g.addColorStop(1,    `rgba(${col},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = "source-over"

      // 4. 顶部光源辉光（呼吸）
      const pulse = 0.85 + 0.15 * Math.sin(time * 0.9)
      ctx.globalCompositeOperation = "screen"

      // 4a. 外层柔晕
      const srcGlow = ctx.createRadialGradient(cx, 0, 0, cx, 0, 190 * pulse)
      srcGlow.addColorStop(0, `rgba(255,255,255,${0.7 * pulse})`)
      srcGlow.addColorStop(0.35, "rgba(205,252,232,0.35)")
      srcGlow.addColorStop(1, "rgba(168,237,207,0)")
      ctx.fillStyle = srcGlow
      ctx.fillRect(0, 0, W, H)

      // 4b. 衍射环（镜头光圈感）
      ctx.save()
      ctx.translate(cx, 0)
      for (let ri = 0; ri < 3; ri++) {
        const rr = (50 + ri * 32) * pulse
        ctx.strokeStyle = `rgba(205,252,232,${(0.06 - ri * 0.015) * pulse})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      // 4c. 横向镜头光晕（anamorphic flare）
      const flareW = W * 0.5 * pulse
      const flareGrad = ctx.createLinearGradient(cx - flareW, 0, cx + flareW, 0)
      flareGrad.addColorStop(0,    "rgba(180,240,215,0)")
      flareGrad.addColorStop(0.5,  `rgba(225,252,240,${0.22 * pulse})`)
      flareGrad.addColorStop(1,    "rgba(180,240,215,0)")
      ctx.fillStyle = flareGrad
      ctx.fillRect(cx - flareW, -3, flareW * 2, 6)

      // 4d. 极亮核心点
      const coreGlow = ctx.createRadialGradient(cx, 0, 0, cx, 0, 28 * pulse)
      coreGlow.addColorStop(0, `rgba(255,255,255,${0.95 * pulse})`)
      coreGlow.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = coreGlow
      ctx.fillRect(0, 0, W, H)

      // 5. 地面光斑
      const floor = ctx.createRadialGradient(cx, H, 0, cx, H, W * 0.4)
      floor.addColorStop(0, "rgba(62,180,137,0.16)")
      floor.addColorStop(0.5, "rgba(62,180,137,0.04)")
      floor.addColorStop(1, "rgba(62,180,137,0)")
      ctx.fillStyle = floor
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = "source-over"
    }
    draw()

    // 标签页隐藏时暂停动画，省电
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else { lastFrame = 0; raf = requestAnimationFrame(draw) }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ background: "radial-gradient(ellipse 70% 60% at 50% -8%, #0d1712 0%, #060908 50%, #030403 100%)" }}>
      {/* 光束 canvas，轻微模糊模拟磨砂散射 */}
      <canvas ref={canvasRef} className="w-full h-full" style={{ filter: "blur(8px)" }} />

      {/* 磨砂颗粒层 — 细密噪点叠加 */}
      <div className="absolute inset-0" style={{
        opacity: 0.08,
        mixBlendMode: "overlay",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")",
        backgroundSize: "180px 180px",
      }} />

      {/* 磨砂玻璃光泽 — 斜向柔光扫过 */}
      <div className="absolute inset-0" style={{
        mixBlendMode: "screen",
        opacity: 0.5,
        background: "linear-gradient(125deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%)",
      }} />

      {/* 暗角 */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 120% 85% at 50% 20%, transparent 32%, rgba(0,0,0,0.8) 100%)" }}
      />
    </div>
  )
}
