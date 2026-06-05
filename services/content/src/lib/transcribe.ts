import Groq from "groq-sdk"
import { toFile } from "groq-sdk"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import os from "os"
import path from "path"

const execAsync = promisify(exec)

// 懒加载 Groq：没配 key 时不报错，调用转录时才提示
let _groq: Groq | null = null
function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("字幕功能未配置（缺少 GROQ_API_KEY）")
  }
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// VTT 时间格式
function toVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = (seconds % 60).toFixed(3).padStart(6, "0")
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${s}`
}

function segmentsToVTT(segments: any[], offsetSec = 0): string[] {
  const lines: string[] = []
  segments.forEach((seg, i) => {
    lines.push(String(i + 1))
    lines.push(`${toVTTTime(seg.start + offsetSec)} --> ${toVTTTime(seg.end + offsetSec)}`)
    lines.push(seg.text.trim())
    lines.push("")
  })
  return lines
}

// 用 ffmpeg 压缩音频：转成 16kHz mono mp3（Whisper 最优输入，体积缩小 10x）
async function compressAudio(inputPath: string, outputPath: string): Promise<void> {
  await execAsync(
    `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -b:a 32k -y "${outputPath}" 2>&1`
  )
}

// 分块：每块最多 20 分钟（避免超 25MB）
async function splitAudio(inputPath: string, chunkDir: string, chunkMinutes = 20): Promise<string[]> {
  const pattern = path.join(chunkDir, "chunk_%03d.mp3")
  await execAsync(
    `ffmpeg -i "${inputPath}" -f segment -segment_time ${chunkMinutes * 60} -ar 16000 -ac 1 -b:a 32k -y "${pattern}" 2>&1`
  )
  const files = fs.readdirSync(chunkDir)
    .filter(f => f.startsWith("chunk_") && f.endsWith(".mp3"))
    .sort()
    .map(f => path.join(chunkDir, f))
  return files
}

export async function transcribeFromUrl(
  audioUrl: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), "rugby-"))
  const rawPath  = path.join(tmpDir, "audio_raw")
  const compPath = path.join(tmpDir, "audio.mp3")

  try {
    // 1. 下载
    onProgress?.("downloading")
    const res = await fetch(audioUrl, { headers: { "User-Agent": "Mozilla/5.0" } })
    if (!res.ok) throw new Error(`下载失败: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(rawPath, buf)
    onProgress?.("compressing")

    // 2. 压缩
    await compressAudio(rawPath, compPath)
    const sizeMB = fs.statSync(compPath).size / 1024 / 1024
    onProgress?.(`compressed: ${sizeMB.toFixed(1)}MB`)

    let allLines: string[] = ["WEBVTT", ""]
    let cueIndex = 1

    if (sizeMB <= 22) {
      // 3a. 小文件直接转录
      onProgress?.("transcribing")
      const file       = await toFile(fs.createReadStream(compPath), "audio.mp3", { type: "audio/mpeg" })
      const transcript = await getGroq().audio.transcriptions.create({
        file,
        model:           "whisper-large-v3",
        response_format: "verbose_json",
        language:        "zh",
        prompt:          "以下是美式橄榄球NFL中文播客，含中英文混合内容。",
      }) as any

      transcript.segments?.forEach((seg: any) => {
        allLines.push(String(cueIndex++))
        allLines.push(`${toVTTTime(seg.start)} --> ${toVTTTime(seg.end)}`)
        allLines.push(seg.text.trim())
        allLines.push("")
      })
    } else {
      // 3b. 大文件分块转录
      onProgress?.("splitting")
      const chunkDir = path.join(tmpDir, "chunks")
      fs.mkdirSync(chunkDir)
      const chunks = await splitAudio(compPath, chunkDir)
      onProgress?.(`split into ${chunks.length} chunks`)

      let offsetSec = 0
      for (let i = 0; i < chunks.length; i++) {
        onProgress?.(`transcribing chunk ${i + 1}/${chunks.length}`)
        const chunkFile  = await toFile(fs.createReadStream(chunks[i]), "chunk.mp3", { type: "audio/mpeg" })
        const transcript = await getGroq().audio.transcriptions.create({
          file:            chunkFile,
          model:           "whisper-large-v3",
          response_format: "verbose_json",
          language:        "zh",
          prompt:          "以下是美式橄榄球NFL中文播客，含中英文混合内容。",
        }) as any

        transcript.segments?.forEach((seg: any) => {
          allLines.push(String(cueIndex++))
          allLines.push(`${toVTTTime(seg.start + offsetSec)} --> ${toVTTTime(seg.end + offsetSec)}`)
          allLines.push(seg.text.trim())
          allLines.push("")
        })

        // 计算这块的实际时长作为下一块的偏移
        const lastSeg = transcript.segments?.[transcript.segments.length - 1]
        offsetSec += lastSeg ? lastSeg.end + 0.1 : 0
      }
    }

    return allLines.join("\n")
  } finally {
    // 清理临时文件
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
