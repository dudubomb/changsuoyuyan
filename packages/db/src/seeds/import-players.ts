import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../schema"
import { teams, players } from "../schema"
import { eq } from "drizzle-orm"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })

// Sleeper team abbreviation → 我们 DB 里的 abbreviation 映射
const TEAM_MAP: Record<string, string> = {
  ARI: "ARI", ATL: "ATL", BAL: "BAL", BUF: "BUF",
  CAR: "CAR", CHI: "CHI", CIN: "CIN", CLE: "CLE",
  DAL: "DAL", DEN: "DEN", DET: "DET", GB:  "GB",
  HOU: "HOU", IND: "IND", JAX: "JAX", KC:  "KC",
  LAC: "LAC", LAR: "LAR", LV:  "LV",  MIA: "MIA",
  MIN: "MIN", NE:  "NE",  NO:  "NO",  NYG: "NYG",
  NYJ: "NYJ", PHI: "PHI", PIT: "PIT", SEA: "SEA",
  SF:  "SF",  TB:  "TB",  TEN: "TEN", WAS: "WAS",
}

// 位置标准化
function normalizePosition(pos: string): string {
  const map: Record<string, string> = {
    DE: "DL", DT: "DL", NT: "DL",
    FS: "S",  SS: "S",  DB: "CB",
    ILB: "LB", OLB: "LB", MLB: "LB",
    OL: "OL", OT: "OL", OG: "OL", C: "OL",
    K: "K", P: "K", LS: "K",
  }
  return map[pos] ?? pos
}

async function importPlayers() {
  console.log("📡 从 Sleeper API 获取球员数据...")
  const res  = await fetch("https://api.sleeper.app/v1/players/nfl")
  const data = await res.json() as Record<string, any>

  // 取所有现役有球队的球员
  const activePlayers = Object.values(data).filter(p =>
    p.active &&
    p.team &&
    TEAM_MAP[p.team] &&
    p.position &&
    p.first_name &&
    p.last_name
  )

  console.log(`✅ 找到 ${activePlayers.length} 名现役球员`)

  // 拿球队映射
  const allTeams = await db.select().from(teams)
  const teamMap  = Object.fromEntries(allTeams.map(t => [t.abbreviation, t.id]))

  let inserted = 0
  let skipped  = 0

  // 分批插入，每批 100 人
  const BATCH = 100
  for (let i = 0; i < activePlayers.length; i += BATCH) {
    const batch = activePlayers.slice(i, i + BATCH)

    const values = batch.map(p => ({
      name:        `${p.first_name} ${p.last_name}`,
      teamId:      teamMap[TEAM_MAP[p.team]] ?? null,
      position:    normalizePosition(p.position),
      jersey:      p.number ? parseInt(p.number) : null,
      age:         p.age ? parseInt(p.age) : null,
      height:      p.height ?? null,
      weight:      p.weight ? `${p.weight} lbs` : null,
      college:     p.college ?? null,
      draftYear:   p.years_exp != null ? (new Date().getFullYear() - p.years_exp) : null,
      bio:         null,
    }))

    try {
      const result = await db.insert(players).values(values).onConflictDoNothing().returning({ id: players.id })
      inserted += result.length
      skipped  += batch.length - result.length
    } catch (e) {
      console.error(`批次 ${i}-${i+BATCH} 出错:`, e)
    }

    // 进度
    if ((i / BATCH) % 5 === 0) {
      console.log(`   进度: ${Math.min(i + BATCH, activePlayers.length)}/${activePlayers.length}`)
    }
  }

  console.log(`\n🎉 完成！`)
  console.log(`   新增: ${inserted} 名球员`)
  console.log(`   跳过: ${skipped} 名（已存在）`)

  const total = await db.select().from(players)
  console.log(`   数据库总球员数: ${total.length}`)

  process.exit(0)
}

importPlayers().catch(e => { console.error(e); process.exit(1) })
