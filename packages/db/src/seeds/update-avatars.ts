import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../schema"
import { players } from "../schema"
import { eq } from "drizzle-orm"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })

async function main() {
  console.log("📡 拉取 Sleeper 球员数据...")
  const res  = await fetch("https://api.sleeper.app/v1/players/nfl")
  const data = await res.json() as Record<string, any>

  // 建 name → sleeper_id 映射（带球队消歧）
  const nameToId = new Map<string, string>()
  for (const [id, p] of Object.entries(data)) {
    if (!p.first_name || !p.last_name || !p.active) continue
    const name = `${p.first_name} ${p.last_name}`
    nameToId.set(name, id)
  }
  console.log(`   映射 ${nameToId.size} 名球员`)

  const all = await db.select({ id: players.id, name: players.name }).from(players)
  console.log(`   数据库 ${all.length} 名球员`)

  let updated = 0
  for (const p of all) {
    const sid = nameToId.get(p.name)
    if (!sid) continue
    // Sleeper CDN 头像（带球衣的官方照）
    const url = `https://sleepercdn.com/content/nfl/players/${sid}.jpg`
    await db.update(players).set({ avatarUrl: url }).where(eq(players.id, p.id))
    updated++
    if (updated % 500 === 0) console.log(`   进度: ${updated}`)
  }

  console.log(`\n🎉 完成！更新 ${updated} 名球员头像`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
