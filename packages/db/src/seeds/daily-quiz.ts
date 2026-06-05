import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../schema"
import { dailyQuiz } from "../schema"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })

const QUIZ = [
  {
    question: "Holding 和 Block in the Back 的区别是什么？",
    options: ["都是进攻方犯规", "Holding 是抓拽，Block in the Back 是背后阻挡", "都是防守方犯规", "没有区别"],
    correctIdx: 1,
    explanation: "Holding（抱人）是用手抓拽对方球员阻止其移动，进攻和防守方都可能被判，处罚10码；Block in the Back（背后阻挡）特指从对方背后号码区域推挡，主要在回攻时判罚，处罚10码。两者性质不同。",
    tags: ["Penalties", "基础规则"],
    difficulty: "easy",
  },
  {
    question: "一次达阵（Touchdown）得多少分？",
    options: ["3分", "6分", "7分", "2分"],
    correctIdx: 1,
    explanation: "达阵得6分。达阵后可选择附加分：射门成功得1分（共7分），或两分转换成功得2分（共8分）。",
    tags: ["计分", "基础规则"],
    difficulty: "easy",
  },
  {
    question: "进攻方有几次机会推进10码获得新的首攻（First Down）？",
    options: ["3次", "4次", "5次", "2次"],
    correctIdx: 1,
    explanation: "进攻方有4次进攻机会（downs）推进至少10码。成功则获得新的一组4次机会；失败则在第4次通常选择弃踢（punt）或射门。",
    tags: ["基础规则", "Downs"],
    difficulty: "easy",
  },
  {
    question: "什么是 Pass Interference（传球干扰）？",
    options: ["传球者越线传球", "在球到达前非法阻挡接球员", "接球员出界后接球", "防守球员擒抱四分卫"],
    correctIdx: 1,
    explanation: "传球干扰指在传球到达前，防守或进攻球员非法接触对方、阻止其正常接球的行为。防守方DPI在犯规地点给予自动首攻，进攻方OPI罚10码。",
    tags: ["Penalties", "Passing"],
    difficulty: "medium",
  },
  {
    question: "四分卫在口袋内被擒抱在本方端区，判什么？",
    options: ["达阵", "安全分（Safety）", "失误", "弃踢"],
    correctIdx: 1,
    explanation: "四分卫（或持球者）在本方端区内被擒倒，防守方得2分安全分（Safety），且进攻方还需自由踢将球权交给对方。这是防守方最高效的得分方式之一。",
    tags: ["计分", "Safety"],
    difficulty: "medium",
  },
  {
    question: "Roughing the Passer（粗暴对待传球员）通常罚多少码？",
    options: ["5码", "10码", "15码", "20码"],
    correctIdx: 2,
    explanation: "粗暴对待传球员是15码罚则并自动首攻。包括传球后仍撞击四分卫、击打头颈部、用全身重量压在四分卫身上等。NFL近年加强了对四分卫的保护。",
    tags: ["Penalties", "Defense"],
    difficulty: "medium",
  },
  {
    question: "什么情况下接球员的接球算有效（completion）？",
    options: ["单脚触地即可", "双脚或身体两点在界内触地并控制球", "只要碰到球", "在端区内任意接触"],
    correctIdx: 1,
    explanation: "NFL规则要求接球员控制球的同时，双脚（或身体除手以外的两个部位）落在界内，并完成'足球动作'或保持控制。这与大学规则的单脚触地不同。",
    tags: ["Receiving", "基础规则"],
    difficulty: "medium",
  },
  {
    question: "什么是 Intentional Grounding（故意抛球）？",
    options: ["故意把球扔出界", "四分卫受压力下无接球员区域抛球避免被擒", "传球给对方", "弃踢失误"],
    correctIdx: 1,
    explanation: "故意抛球指四分卫在口袋内受到擒抱压力时，故意将球抛向没有合理接球员的区域以避免被擒杀。判罚为损失该down并从抛球点后退（端区内则为安全分）。前提是四分卫仍在口袋内。",
    tags: ["Penalties", "QB"],
    difficulty: "hard",
  },
  {
    question: "Onside Kick（短开球）的球必须滚动多少码后进攻方才能合法触球？",
    options: ["5码", "10码", "15码", "无限制"],
    correctIdx: 1,
    explanation: "开球后球必须前进至少10码，或被接收方先触碰，开球方才能合法重新获得球权。这让落后球队在比赛末段有机会快速夺回球权。",
    tags: ["Special Teams", "Kickoff"],
    difficulty: "hard",
  },
  {
    question: "防守方拦截传球（Interception）后被擒，球权归谁？",
    options: ["仍归进攻方", "归防守方，攻守转换", "重新开球", "判罚进攻方"],
    correctIdx: 1,
    explanation: "拦截是攻守转换（turnover）。防守方拦截后即获得球权成为新的进攻方，从被擒倒处或回攻终点开始进攻。这是改变比赛走势的关键play。",
    tags: ["Turnover", "Defense"],
    difficulty: "easy",
  },
]

async function seed() {
  console.log("📝 填充每日一题题库...")

  // 给前几道题排期（从今天开始）
  const today = new Date()
  const withDates = QUIZ.map((q, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + (i - 0)) // 第一题今天，往后排
    return { ...q, activeDate: i < 5 ? d.toISOString().slice(0, 10) : null }
  })

  const result = await db.insert(dailyQuiz).values(withDates).onConflictDoNothing().returning()
  console.log(`✅ 插入 ${result.length} 道题`)
  console.log(`   今日题目: ${QUIZ[0].question}`)
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
