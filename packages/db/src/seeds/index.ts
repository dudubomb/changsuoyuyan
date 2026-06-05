import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../schema"
import { teams, players, playerStats } from "../schema"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })

// ── NFL 32 支球队 ──────────────────────────────────────────
const NFL_TEAMS = [
  // AFC East
  { name: "Buffalo Bills",           shortName: "Bills",     abbreviation: "BUF", conference: "AFC", division: "AFC East",  primaryColor: "#00338D" },
  { name: "Miami Dolphins",          shortName: "Dolphins",  abbreviation: "MIA", conference: "AFC", division: "AFC East",  primaryColor: "#008E97" },
  { name: "New England Patriots",    shortName: "Patriots",  abbreviation: "NE",  conference: "AFC", division: "AFC East",  primaryColor: "#002244" },
  { name: "New York Jets",           shortName: "Jets",      abbreviation: "NYJ", conference: "AFC", division: "AFC East",  primaryColor: "#125740" },
  // AFC North
  { name: "Baltimore Ravens",        shortName: "Ravens",    abbreviation: "BAL", conference: "AFC", division: "AFC North", primaryColor: "#241773" },
  { name: "Cincinnati Bengals",      shortName: "Bengals",   abbreviation: "CIN", conference: "AFC", division: "AFC North", primaryColor: "#FB4F14" },
  { name: "Cleveland Browns",        shortName: "Browns",    abbreviation: "CLE", conference: "AFC", division: "AFC North", primaryColor: "#311D00" },
  { name: "Pittsburgh Steelers",     shortName: "Steelers",  abbreviation: "PIT", conference: "AFC", division: "AFC North", primaryColor: "#FFB612" },
  // AFC South
  { name: "Houston Texans",          shortName: "Texans",    abbreviation: "HOU", conference: "AFC", division: "AFC South", primaryColor: "#03202F" },
  { name: "Indianapolis Colts",      shortName: "Colts",     abbreviation: "IND", conference: "AFC", division: "AFC South", primaryColor: "#002C5F" },
  { name: "Jacksonville Jaguars",    shortName: "Jaguars",   abbreviation: "JAX", conference: "AFC", division: "AFC South", primaryColor: "#006778" },
  { name: "Tennessee Titans",        shortName: "Titans",    abbreviation: "TEN", conference: "AFC", division: "AFC South", primaryColor: "#0C2340" },
  // AFC West
  { name: "Denver Broncos",          shortName: "Broncos",   abbreviation: "DEN", conference: "AFC", division: "AFC West",  primaryColor: "#FB4F14" },
  { name: "Kansas City Chiefs",      shortName: "Chiefs",    abbreviation: "KC",  conference: "AFC", division: "AFC West",  primaryColor: "#E31837" },
  { name: "Las Vegas Raiders",       shortName: "Raiders",   abbreviation: "LV",  conference: "AFC", division: "AFC West",  primaryColor: "#000000" },
  { name: "Los Angeles Chargers",    shortName: "Chargers",  abbreviation: "LAC", conference: "AFC", division: "AFC West",  primaryColor: "#0080C6" },
  // NFC East
  { name: "Dallas Cowboys",          shortName: "Cowboys",   abbreviation: "DAL", conference: "NFC", division: "NFC East",  primaryColor: "#003594" },
  { name: "New York Giants",         shortName: "Giants",    abbreviation: "NYG", conference: "NFC", division: "NFC East",  primaryColor: "#0B2265" },
  { name: "Philadelphia Eagles",     shortName: "Eagles",    abbreviation: "PHI", conference: "NFC", division: "NFC East",  primaryColor: "#004C54" },
  { name: "Washington Commanders",   shortName: "Commanders",abbreviation: "WAS", conference: "NFC", division: "NFC East",  primaryColor: "#5A1414" },
  // NFC North
  { name: "Chicago Bears",           shortName: "Bears",     abbreviation: "CHI", conference: "NFC", division: "NFC North", primaryColor: "#0B162A" },
  { name: "Detroit Lions",           shortName: "Lions",     abbreviation: "DET", conference: "NFC", division: "NFC North", primaryColor: "#0076B6" },
  { name: "Green Bay Packers",       shortName: "Packers",   abbreviation: "GB",  conference: "NFC", division: "NFC North", primaryColor: "#203731" },
  { name: "Minnesota Vikings",       shortName: "Vikings",   abbreviation: "MIN", conference: "NFC", division: "NFC North", primaryColor: "#4F2683" },
  // NFC South
  { name: "Atlanta Falcons",         shortName: "Falcons",   abbreviation: "ATL", conference: "NFC", division: "NFC South", primaryColor: "#A71930" },
  { name: "Carolina Panthers",       shortName: "Panthers",  abbreviation: "CAR", conference: "NFC", division: "NFC South", primaryColor: "#0085CA" },
  { name: "New Orleans Saints",      shortName: "Saints",    abbreviation: "NO",  conference: "NFC", division: "NFC South", primaryColor: "#D3BC8D" },
  { name: "Tampa Bay Buccaneers",    shortName: "Buccaneers",abbreviation: "TB",  conference: "NFC", division: "NFC South", primaryColor: "#D50A0A" },
  // NFC West
  { name: "Arizona Cardinals",       shortName: "Cardinals", abbreviation: "ARI", conference: "NFC", division: "NFC West",  primaryColor: "#97233F" },
  { name: "Los Angeles Rams",        shortName: "Rams",      abbreviation: "LAR", conference: "NFC", division: "NFC West",  primaryColor: "#003594" },
  { name: "San Francisco 49ers",     shortName: "49ers",     abbreviation: "SF",  conference: "NFC", division: "NFC West",  primaryColor: "#AA0000" },
  { name: "Seattle Seahawks",        shortName: "Seahawks",  abbreviation: "SEA", conference: "NFC", division: "NFC West",  primaryColor: "#002244" },
]

// ── 核心球员 ──────────────────────────────────────────────
const NFL_PLAYERS = [
  // QB
  { name: "Patrick Mahomes",  teamAbbr: "KC",  position: "QB", jersey: 15, age: 29, height: "6'3\"", weight: "230 lbs", college: "Texas Tech",    draftYear: 2017, draftRound: 1, draftPick: 10,
    bio: "Two-time Super Bowl MVP and consensus best QB in the NFL. Known for improvisation, arm talent, and clutch performances.",
    stats: { season: "2024", matches: 16, touchdowns: 38, yards: 4823, completions: 378, attempts: 556, passerRating: 108.4, interceptions: 11 } },
  { name: "Josh Allen",       teamAbbr: "BUF", position: "QB", jersey: 17, age: 28, height: "6'5\"", weight: "237 lbs", college: "Wyoming",       draftYear: 2018, draftRound: 1, draftPick: 7,
    bio: "Elite dual-threat QB with elite arm strength and rushing ability. One of the few players who can single-handedly take over a game.",
    stats: { season: "2024", matches: 16, touchdowns: 40, yards: 4306, completions: 311, attempts: 489, passerRating: 101.4, interceptions: 10 } },
  { name: "Lamar Jackson",    teamAbbr: "BAL", position: "QB", jersey: 8,  age: 27, height: "6'2\"", weight: "212 lbs", college: "Louisville",    draftYear: 2018, draftRound: 1, draftPick: 32,
    bio: "Two-time NFL MVP. The most dynamic rushing QB in league history with elite playmaking ability.",
    stats: { season: "2024", matches: 16, touchdowns: 41, yards: 4172, completions: 330, attempts: 511, passerRating: 119.6, interceptions: 4 } },
  { name: "Joe Burrow",       teamAbbr: "CIN", position: "QB", jersey: 9,  age: 28, height: "6'4\"", weight: "221 lbs", college: "LSU",           draftYear: 2020, draftRound: 1, draftPick: 1,
    bio: "Super Bowl LVI runner-up. Elite pocket presence and accuracy, with championship pedigree from LSU.",
    stats: { season: "2024", matches: 10, touchdowns: 15, yards: 2309, completions: 202, attempts: 299, passerRating: 103.3, interceptions: 6 } },
  { name: "Jalen Hurts",      teamAbbr: "PHI", position: "QB", jersey: 1,  age: 26, height: "6'1\"", weight: "223 lbs", college: "Oklahoma",      draftYear: 2020, draftRound: 2, draftPick: 53,
    bio: "Super Bowl champion. The engine of the Eagles' offense — equally dangerous running and passing.",
    stats: { season: "2024", matches: 16, touchdowns: 35, yards: 3858, completions: 297, attempts: 456, passerRating: 99.0, interceptions: 15 } },
  // WR
  { name: "Tyreek Hill",      teamAbbr: "MIA", position: "WR", jersey: 10, age: 30, height: "5'10\"",weight: "191 lbs", college: "West Alabama",  draftYear: 2016, draftRound: 5, draftPick: 165,
    bio: "The fastest player in the NFL. Record-setting receiver with elite route running and YAC ability.",
    stats: { season: "2024", matches: 14, touchdowns: 9, yards: 1421, receptions: 119, targets: 171, interceptions: 0 } },
  { name: "Justin Jefferson",  teamAbbr: "MIN", position: "WR", jersey: 18, age: 25, height: "6'1\"", weight: "195 lbs", college: "LSU",          draftYear: 2020, draftRound: 1, draftPick: 22,
    bio: "The most complete receiver in the NFL. Dominant at every level with elite route running and ball skills.",
    stats: { season: "2024", matches: 16, touchdowns: 10, yards: 1533, receptions: 103, targets: 143, interceptions: 0 } },
  { name: "CeeDee Lamb",      teamAbbr: "DAL", position: "WR", jersey: 88, age: 25, height: "6'2\"", weight: "198 lbs", college: "Oklahoma",      draftYear: 2020, draftRound: 1, draftPick: 17,
    bio: "Triple crown WR threat — speed, size, and hands. The Cowboys' offensive centerpiece.",
    stats: { season: "2024", matches: 16, touchdowns: 11, yards: 1749, receptions: 135, targets: 181, interceptions: 0 } },
  // TE
  { name: "Travis Kelce",     teamAbbr: "KC",  position: "TE", jersey: 87, age: 35, height: "6'5\"", weight: "250 lbs", college: "Cincinnati",    draftYear: 2013, draftRound: 3, draftPick: 63,
    bio: "The greatest tight end in NFL history. Three Super Bowl rings, 8x Pro Bowl, and the most reliable target in clutch situations.",
    stats: { season: "2024", matches: 15, touchdowns: 10, yards: 984, receptions: 93, targets: 121, interceptions: 0 } },
  // RB
  { name: "Christian McCaffrey", teamAbbr: "SF", position: "RB", jersey: 23, age: 28, height: "5'11\"",weight: "205 lbs", college: "Stanford",   draftYear: 2017, draftRound: 1, draftPick: 8,
    bio: "The most versatile offensive weapon in the NFL. Elite rusher and receiver who demands double teams.",
    stats: { season: "2024", matches: 6, touchdowns: 7, yards: 523, carries: 103, receptions: 30, interceptions: 0 } },
  // DL/LB
  { name: "Micah Parsons",    teamAbbr: "DAL", position: "LB", jersey: 11, age: 25, height: "6'3\"", weight: "245 lbs", college: "Penn State",    draftYear: 2021, draftRound: 1, draftPick: 12,
    bio: "The most disruptive defensive player in the NFL. Three-time All-Pro with elite pass-rush skills.",
    stats: { season: "2024", matches: 15, touchdowns: 1, yards: 0, tackles: 64, sacks: 14.0, interceptions: 1 } },
  { name: "Myles Garrett",    teamAbbr: "CLE", position: "DL", jersey: 95, age: 29, height: "6'4\"", weight: "272 lbs", college: "Texas A&M",     draftYear: 2017, draftRound: 1, draftPick: 1,
    bio: "Defensive Player of the Year. The most dominant pass rusher in the NFL with elite athleticism.",
    stats: { season: "2024", matches: 16, touchdowns: 0, yards: 0, tackles: 55, sacks: 14.0, interceptions: 1 } },
]

async function seed() {
  console.log("🌱 开始填充数据...")

  // 1. 球队
  console.log("📍 插入 32 支 NFL 球队...")
  const insertedTeams = await db.insert(teams).values(NFL_TEAMS).onConflictDoNothing().returning()
  console.log(`   ✅ ${insertedTeams.length} 支球队`)

  // 建立 abbreviation → id 映射
  const allTeams = await db.select().from(teams)
  const teamMap = Object.fromEntries(allTeams.map(t => [t.abbreviation, t.id]))

  // 2. 球员
  console.log("🏈 插入球员...")
  for (const p of NFL_PLAYERS) {
    const teamId = teamMap[p.teamAbbr]
    if (!teamId) { console.warn(`   ⚠️  找不到球队 ${p.teamAbbr}`); continue }

    const [player] = await db.insert(players).values({
      name:       p.name,
      teamId,
      position:   p.position,
      jersey:     p.jersey,
      age:        p.age,
      height:     p.height,
      weight:     p.weight,
      college:    p.college,
      draftYear:  p.draftYear,
      draftRound: p.draftRound,
      draftPick:  p.draftPick,
      bio:        p.bio,
    }).onConflictDoNothing().returning()

    if (player) {
      await db.insert(playerStats).values({
        playerId:      player.id,
        season:        p.stats.season,
        teamId,
        matches:       p.stats.matches,
        touchdowns:    p.stats.touchdowns,
        yards:         p.stats.yards,
        interceptions: p.stats.interceptions,
        completions:   (p.stats as any).completions,
        attempts:      (p.stats as any).attempts,
        passerRating:  (p.stats as any).passerRating,
        receptions:    (p.stats as any).receptions,
        targets:       (p.stats as any).targets,
        carries:       (p.stats as any).carries,
        tackles:       (p.stats as any).tackles,
        sacks:         (p.stats as any).sacks,
      }).onConflictDoNothing()
      console.log(`   ✅ ${p.name} (${p.position} · ${p.teamAbbr})`)
    }
  }

  console.log("\n🎉 Seed 完成！")
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
