import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import bcrypt from "bcryptjs"
import * as schema from "../schema"
import { users, questions, answers } from "../schema"

const client = postgres(process.env.DATABASE_URL ?? "postgres://rugby:dev123@localhost:5433/rugby")
const db = drizzle(client, { schema })

// 种子用户（含认证裁判 / 教练 / 球迷）
const SEED_USERS = [
  { email: "ref.mikedean@seed.com",  nickname: "Referee_MikeDean",  role: "referee" as const, isVerified: true },
  { email: "ref.sarah@seed.com",     nickname: "认证裁判_Sarah",     role: "referee" as const, isVerified: true },
  { email: "coach.tony@seed.com",    nickname: "CoachTony",          role: "coach" as const,   isVerified: true },
  { email: "fan.chiefsnation@seed.com", nickname: "ChiefsNation",    role: "fan" as const },
  { email: "fan.nflgeek@seed.com",   nickname: "NFLRulesGeek",       role: "fan" as const },
  { email: "fan.gridiron@seed.com",  nickname: "GridironIQ",         role: "fan" as const },
]

// 问题 + 回答
const QA = [
  {
    title: "Was the roughing-the-passer call on Myles Garrett correct?",
    body: "In the 3rd quarter, Garrett was flagged after the QB had already thrown the ball. He appeared to pull up but still made contact. Was this the right call per the NFL rulebook?",
    tags: ["Penalties", "Defensive Line"],
    answers: [
      { by: "Referee_MikeDean", certified: true, votes: 42, body: "Under Rule 12, Section 2, Article 9, a defensive player is prohibited from unnecessarily throwing his body against a passer who has released the ball. Given the replays, Garrett's momentum carried him into the QB, which qualifies. The call was technically correct, though marginal." },
      { by: "NFLRulesGeek", certified: false, votes: 18, body: "I think the call was wrong. Garrett clearly tried to avoid contact. The NFL has over-corrected on QB protection since the 2018 rule change." },
    ],
  },
  {
    title: "Can a receiver catch the ball, go out of bounds, and come back to make the catch?",
    body: "I've seen players run out of bounds and then come back in to catch a pass. Is that legal? Does it depend on whether they were forced out by a defender?",
    tags: ["Receiving", "Out of Bounds"],
    answers: [
      { by: "认证裁判_Sarah", certified: true, votes: 35, body: "A player who voluntarily goes out of bounds is ineligible to be the first to touch the ball after returning — that's illegal touching, a 5-yard penalty and loss of down. However, if he was forced out by a defender, he can legally return and catch it as long as he re-establishes himself inbounds." },
    ],
  },
  {
    title: "What exactly is an illegal formation penalty?",
    body: "The offense keeps getting flagged for illegal formation but the broadcast never explains exactly what the violation was. What are the specific requirements?",
    tags: ["Offense", "Formation"],
    answers: [
      { by: "CoachTony", certified: true, votes: 28, body: "At the snap, the offense must have at least 7 players on the line of scrimmage. The eligible receivers must be the two players on each end of that line plus the backs. Common violations: only 6 on the line, or an ineligible lineman lined up wrong. It's a 5-yard penalty." },
      { by: "GridironIQ", certified: false, votes: 7, body: "Also worth noting — receivers have to be 'covered' or 'uncovered' correctly. If a TE is covered up by a WR outside him, the TE becomes ineligible." },
    ],
  },
  {
    title: "When is a fumble considered 'down by contact' vs a live ball?",
    body: "The runner was tackled and the ball came loose right as he hit the ground. The refs ruled down by contact. How do they decide when forward progress / contact stops the play?",
    tags: ["Fumble", "Ruling"],
    answers: [
      { by: "Referee_MikeDean", certified: true, votes: 31, body: "A runner is down when any part of his body other than hands/feet touches the ground while in the grasp of a defender (down by contact). If the ball comes out AFTER that contact-induced ground touch, it's a dead ball — no fumble. The replay official reviews the exact frame the knee/elbow touches vs when the ball moves." },
    ],
  },
  {
    title: "Can a QB be called for intentional grounding while inside the pocket?",
    body: "My friend says you can only get grounding inside the tackle box. Is that true? What if the QB throws it away near a receiver?",
    tags: ["QB", "Penalties"],
    answers: [
      { by: "认证裁判_Sarah", certified: true, votes: 24, body: "Intentional grounding applies when the QB, under pressure inside the pocket, throws toward an area with no eligible receiver with a realistic chance to catch it. Once the QB is OUTSIDE the tackle box (pocket), he can legally throw the ball away as long as it reaches the line of scrimmage. Penalty: loss of down + spot foul (or safety if in the end zone)." },
      { by: "ChiefsNation", certified: false, votes: 9, body: "Mahomes exploits this all the time — he rolls out of the pocket then chucks it out of bounds. Totally legal once he's outside." },
    ],
  },
  {
    title: "Onside kick: how far must the ball travel before the kicking team can recover?",
    body: "Late in games I see teams try short kicks to get the ball back. What are the exact rules for when they can legally touch it?",
    tags: ["Special Teams", "Kickoff"],
    answers: [
      { by: "CoachTony", certified: true, votes: 19, body: "The kicked ball must travel at least 10 yards OR be touched by the receiving team first before the kicking team can legally recover it. If a kicking-team player touches it before 10 yards and before a receiver, it's illegal touching — receiving team gets the ball at that spot." },
    ],
  },
  {
    title: "Does a defensive player get an interception if he catches a tipped ball behind the line?",
    body: "A pass got batted at the line and a DL caught it. Is that a legal interception or does the tip change anything?",
    tags: ["Turnover", "Defense"],
    answers: [
      { by: "Referee_MikeDean", certified: true, votes: 16, body: "Yes, it's a fully legal interception. A pass tipped by any player (offense or defense) remains a live ball and can be intercepted. The interceptor can advance it. The only difference a tip makes is for pass-interference purposes — once tipped, PI can no longer be called downfield." },
    ],
  },
  {
    title: "What's the difference between a horse-collar tackle and a regular tackle?",
    body: "Saw a 15-yard horse-collar flag but it looked like a normal tackle to me. What makes it a horse-collar?",
    tags: ["Penalties", "Tackling"],
    answers: [
      { by: "认证裁判_Sarah", certified: true, votes: 22, body: "A horse-collar is grabbing the INSIDE collar of the back/shoulder pads (or the jersey at the nameplate) and immediately pulling the runner down. It's banned because of the leg/ankle injury risk. 15-yard personal foul. A normal wrap-up tackle around the body is fine." },
    ],
  },
  {
    title: "Can you challenge a pass interference call?",
    body: "After the 2019 controversy I'm confused whether coaches can throw the red flag on PI anymore.",
    tags: ["Replay", "Penalties"],
    answers: [
      { by: "NFLRulesGeek", certified: false, votes: 14, body: "No — the NFL made PI reviewable for ONE season (2019) after the Saints-Rams NFC Championship disaster, then removed it in 2020. Currently pass interference is NOT challengeable. It's a judgment call that stands as called on the field." },
      { by: "Referee_MikeDean", certified: true, votes: 27, body: "Correct. The 2019 experiment was widely considered a failure because the replay standard was too subjective. As of now, PI (called or not called) cannot be reviewed." },
    ],
  },
  {
    title: "Two-minute warning: how does it affect the clock and timeouts?",
    body: "Does the two-minute warning act like a free timeout? What stops and what doesn't?",
    tags: ["Clock", "Game Management"],
    answers: [
      { by: "CoachTony", certified: true, votes: 17, body: "The two-minute warning is essentially a free, automatic timeout at 2:00 in each half. It stops the game clock but NOT a team's allotted timeouts. After it, clock rules tighten — e.g., a defensive penalty in the final 2 minutes can carry a 10-second runoff." },
    ],
  },
  {
    title: "If a field goal is blocked, can either team advance it?",
    body: "Saw a blocked FG get picked up. Who can run with it and what happens if it's behind the line?",
    tags: ["Special Teams", "Field Goal"],
    answers: [
      { by: "认证裁判_Sarah", certified: true, votes: 12, body: "If a blocked field goal stays BEHIND the line of scrimmage, both teams can recover AND advance it. If it crosses the line of scrimmage before being blocked/touched, the defense can recover and advance, but the kicking team cannot advance (only recover for a... actually they can't legally regain possession to keep the drive)." },
    ],
  },
  {
    title: "What counts as a catch? The 'completing the process' rule explained",
    body: "The Dez Bryant / Calvin Johnson catches that got overturned still confuse me. What's the actual standard now?",
    tags: ["Receiving", "Catch Rule"],
    answers: [
      { by: "Referee_MikeDean", certified: true, votes: 38, body: "Since the 2018 simplification, a catch requires: (1) control of the ball, (2) two feet or another body part down inbounds, and (3) a 'football move' OR the ability to perform one (e.g., reaching, taking a third step). The old 'surviving the ground' language was removed — you no longer have to hold it through hitting the ground if you've already established the first three elements." },
      { by: "GridironIQ", certified: false, votes: 11, body: "This is why the new rule would have made BOTH the Dez and Calvin catches legal. The 'football move' standard is much more intuitive than the old process-of-the-catch wording." },
    ],
  },
]

async function seed() {
  console.log("🌱 填充规则问答...")

  // 用户
  const pwHash = await bcrypt.hash("password123", 12)
  const userMap = new Map<string, string>()
  for (const u of SEED_USERS) {
    const [created] = await db.insert(users)
      .values({ ...u, passwordHash: pwHash })
      .onConflictDoNothing()
      .returning()
    if (created) userMap.set(u.nickname, created.id)
    else {
      const existing = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.email, u.email) })
      if (existing) userMap.set(u.nickname, existing.id)
    }
  }
  console.log(`   ✅ ${userMap.size} 个用户`)

  // 问题 + 回答
  let qCount = 0, aCount = 0
  for (const item of QA) {
    const authorId = userMap.get(item.answers[0].by) ?? [...userMap.values()][0]
    const [q] = await db.insert(questions).values({
      authorId,
      title: item.title,
      body:  item.body,
      tags:  item.tags,
      status: item.answers.some(a => a.certified) ? "answered" : "open",
    }).returning()
    qCount++

    for (const a of item.answers) {
      const aid = userMap.get(a.by)
      if (!aid) continue
      await db.insert(answers).values({
        questionId:  q.id,
        authorId:    aid,
        body:        a.body,
        isCertified: a.certified,
        voteCount:   a.votes,
      })
      aCount++
    }
  }

  console.log(`   ✅ ${qCount} 个问题, ${aCount} 条回答`)
  console.log("🎉 完成！")
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
