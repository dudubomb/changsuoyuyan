"use client"

// 用 Web Audio 合成机械"咔哒"声，无需音频文件
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

// 机械咔哒声：短促的噪声脉冲 + 高频点击
export function playClick(volume = 0.15) {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === "suspended") ctx.resume()

  const now = ctx.currentTime

  // 1. 中低频"咔"——三角波更柔和，频率降低
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(900, now)
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.018)
  oscGain.gain.setValueAtTime(volume, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
  osc.connect(oscGain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.035)

  // 2. 噪声脉冲——低通过滤，去掉尖刺感，更像木质/机械哒声
  const bufferSize = ctx.sampleRate * 0.025
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(volume * 0.35, now)
  const lp = ctx.createBiquadFilter()
  lp.type = "lowpass"
  lp.frequency.value = 1800   // 砍掉高频尖刺
  const bp = ctx.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 700
  noise.connect(lp).connect(bp).connect(noiseGain).connect(ctx.destination)
  noise.start(now)
  noise.stop(now + 0.025)
}
