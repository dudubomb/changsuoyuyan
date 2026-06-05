"use client"

interface Stat { label: string; value: number } // value 0-100

interface Props {
  stats:    Stat[]
  color?:   string
  size?:    number
}

export default function RadarChart({ stats, color = "#a8edcf", size = 260 }: Props) {
  const n       = stats.length
  const cx      = size / 2
  const cy      = size / 2
  const maxR    = size * 0.30   // 缩小半径，给标签留出边距
  const levels  = 4

  // 每个轴的角度（从顶部开始，顺时针）
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

  // 极坐标 → 直角坐标
  const point = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  // 网格背景多边形
  const gridPolygon = (level: number) => {
    const r = (maxR * level) / levels
    return stats.map((_, i) => {
      const p = point(r, i)
      return `${p.x},${p.y}`
    }).join(" ")
  }

  // 数据多边形
  const dataPolygon = stats.map((s, i) => {
    const r = (s.value / 100) * maxR
    const p = point(r, i)
    return `${p.x},${p.y}`
  }).join(" ")

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {/* 网格 */}
      {Array.from({ length: levels }).map((_, l) => (
        <polygon
          key={l}
          points={gridPolygon(l + 1)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* 轴线 */}
      {stats.map((_, i) => {
        const outer = point(maxR, i)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )
      })}

      {/* 数据区域 */}
      <polygon
        points={dataPolygon}
        fill={`${color}22`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 数据点 */}
      {stats.map((s, i) => {
        const r = (s.value / 100) * maxR
        const p = point(r, i)
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y} r="3.5"
            fill={color}
            opacity="0.9"
          />
        )
      })}

      {/* 标签 */}
      {stats.map((s, i) => {
        const labelR = maxR + 20
        const p      = point(labelR, i)

        // 标签对齐
        let anchor: "start" | "middle" | "end" = "middle"
        const cos = Math.cos(angle(i))
        if (cos > 0.2)  anchor = "start"
        if (cos < -0.2) anchor = "end"

        // 防止左右贴边裁切，限制 x 范围
        const px = Math.max(2, Math.min(size - 2, p.x))

        return (
          <g key={i}>
            <text
              x={px} y={p.y + 4}
              textAnchor={anchor}
              fontSize="11"
              fontFamily="var(--font-noto-sc), sans-serif"
              fontWeight="600"
              fill="rgba(255,255,255,0.55)"
            >
              {s.label}
            </text>
            <text
              x={px} y={p.y + 16}
              textAnchor={anchor}
              fontSize="10"
              fontFamily="monospace"
              fill={color}
              opacity="0.8"
            >
              {s.value}
            </text>
          </g>
        )
      })}

      {/* 中心点 */}
      <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}
