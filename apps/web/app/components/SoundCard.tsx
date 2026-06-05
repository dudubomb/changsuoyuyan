"use client"
import { playClick } from "../lib/sound"

// 鼠标进入时播放机械咔哒声的卡片包装
export default function SoundCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={style}
      onMouseEnter={() => playClick()}
    >
      {children}
    </div>
  )
}
