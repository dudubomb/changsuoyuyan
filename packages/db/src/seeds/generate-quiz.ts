import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import Groq from "groq-sdk"
import * as schema from "../schema"
import { dailyQuiz } from "../schema"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TARGET = Number(process.env.TARGET ?? 1000)
const BATCH  = 25

// 题目主题，循环覆盖
const TOPICS = [
  "处罚规则（penalties）：holding, pass interference, false start, offside, roughing the passer, facemask, unnecessary roughness 等",
  "计分规则：touchdown, field goal, extra point, two-point conversion, safety 的分值和触发条件",
  "进攻规则：downs, first down, line of scrimmage, formation, eligible receivers, motion",
  "传球规则：forward pass, lateral, completion, incompletion, intentional grounding, interception",
  "跑球规则：handoff, fumble, forward progress, down by contact, sliding QB",
  "特勤组：kickoff, punt, onside kick, fair catch, touchback, blocked kick,返球规则",
  "防守规则：tackle, sack, blitz, coverage, pass rush, turnover, fumble recovery",
  "球员位置职责：QB, RB, WR, TE, OL, DL, LB, CB, S, K, P 各位置的职能",
  "时钟与比赛流程：game clock, play clock, two-minute warning, timeout, overtime, challenge/replay",
  "界线与场地：sideline, end zone, goal line, hash marks, out of bounds, neutral zone",
  "犯规后果与判罚码数：5码/10码/15码罚则，自动首攻，重赛 down",
  "高级情境判罚：catch rule, ground causing fumble, illegal touching, ineligible downfield",
]

const DIFFICULTIES = ["easy", "medium", "hard"]

async function generateBatch(topic: string, difficulty: string, count: number): Promise<any[]> {
  const prompt = `你是美式橄榄球（NFL）规则专家。请生成 ${count} 道关于以下主题的中文单选题，难度为「${difficulty}」：

主题：${topic}

要求：
1. 每题有 4 个选项，只有 1 个正确答案
2. 题目要准确、专业，符合现行 NFL 规则
3. 解析要详细，说明为什么正确以及相关规则背景
4. 干扰项要合理但明确错误
5. 必须返回纯 JSON 数组，不要任何额外文字、markdown 代码块

JSON 格式（严格遵守）：
[
  {
    "question": "题目文字？",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctIdx": 0,
    "explanation": "详细解析...",
    "tags": ["分类1", "分类2"]
  }
]`

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  })

  const content = res.choices[0]?.message?.content ?? "[]"
  try {
    // 模型可能返回 {"questions":[...]} 或直接 [...]
    const parsed = JSON.parse(content)
    const arr = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.quiz ?? Object.values(parsed)[0])
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function main() {
  console.log(`🎯 目标：生成 ${TARGET} 道题（每批 ${BATCH}）`)

  // 已有题面，避免重复
  const existing = await db.select({ q: dailyQuiz.question }).from(dailyQuiz)
  const seen = new Set(existing.map(e => e.q.trim()))
  console.log(`   现有 ${seen.size} 道题`)

  let inserted = 0
  let topicIdx = 0
  let attempts = 0

  while (inserted < TARGET && attempts < TARGET) {
    const topic = TOPICS[topicIdx % TOPICS.length]
    const difficulty = DIFFICULTIES[topicIdx % DIFFICULTIES.length]
    topicIdx++
    attempts++

    try {
      const batch = await generateBatch(topic, difficulty, BATCH)

      const valid = batch.filter(q =>
        q.question &&
        Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctIdx === "number" && q.correctIdx >= 0 && q.correctIdx < 4 &&
        q.explanation &&
        !seen.has(q.question.trim())
      )

      if (valid.length === 0) { console.log(`   ⚠️ 批次无有效题，跳过`); continue }

      valid.forEach(q => seen.add(q.question.trim()))

      await db.insert(dailyQuiz).values(valid.map(q => ({
        question:    q.question.trim(),
        options:     q.options,
        correctIdx:  q.correctIdx,
        explanation: q.explanation,
        tags:        Array.isArray(q.tags) ? q.tags.slice(0, 4) : [difficulty],
        difficulty,
        activeDate:  null,
      }))).onConflictDoNothing()

      inserted += valid.length
      console.log(`   ✅ +${valid.length}  累计 ${inserted}/${TARGET}  [${difficulty}] ${topic.slice(0, 12)}...`)
    } catch (e: any) {
      console.log(`   ❌ 批次出错: ${e.message?.slice(0, 80)}`)
      // 速率限制时等待
      if (e.message?.includes("rate") || e.status === 429) {
        console.log("   ⏳ 等待 30s...")
        await new Promise(r => setTimeout(r, 30000))
      }
    }
  }

  const total = await db.select().from(dailyQuiz)
  console.log(`\n🎉 完成！题库总量: ${total.length} 道`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
