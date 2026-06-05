export interface Explainer {
  slug:    string
  icon:    string
  color:   string
  title:   string
  desc:    string
  tags:    string[]
  readTime: string
  body:    { type: "h2" | "p" | "tip" | "list"; text?: string; items?: string[] }[]
}

export const EXPLAINERS: Explainer[] = [
  {
    slug: "nfl-basics",
    icon: "🏈", color: "#3eb489",
    title: "5 分钟看懂 NFL 比赛规则",
    desc: "进攻方 4 次机会推进 10 码，达阵得 6 分。从 down、first down 到 touchdown，一篇搞懂基础。",
    tags: ["基础规则", "入门"],
    readTime: "5 分钟",
    body: [
      { type: "p", text: "美式橄榄球（NFL）的核心目标很简单：把球推进到对方的端区（end zone）得分。但规则细节让很多新手望而却步。这篇带你 5 分钟入门。" },
      { type: "h2", text: "比赛基本结构" },
      { type: "p", text: "一场比赛分 4 节（quarter），每节 15 分钟。两支球队轮流进攻和防守。拿球的一方叫进攻方（offense），目标是推进；另一方是防守方（defense），目标是阻止。" },
      { type: "h2", text: "核心规则：4 档推进 10 码" },
      { type: "p", text: "进攻方有 4 次进攻机会（downs），必须在这 4 次内推进至少 10 码。成功了就获得新的一组 4 次机会（叫 first down，首攻）；失败了通常会在第 4 档选择弃踢（punt）把球交给对方。" },
      { type: "tip", text: "电视画面上的黄色虚线就是「还需推进到的 10 码线」，蓝线是当前开球位置。" },
      { type: "h2", text: "如何得分" },
      { type: "list", items: [
        "达阵 Touchdown = 6 分（把球带进/接进对方端区）",
        "附加分 = 达阵后踢球进得 1 分，或两分转换得 2 分",
        "射门 Field Goal = 3 分（把球踢过门柱）",
        "安全分 Safety = 2 分（防守方在对方端区内擒倒持球者）",
      ] },
      { type: "h2", text: "看懂这些你就入门了" },
      { type: "p", text: "记住「4 档推进 10 码」和「达阵 6 分」两个核心，再配合弃踢、射门的选择，你就能看懂一场比赛 80% 的内容了。剩下的规则细节，看多了自然就懂。" },
    ],
  },
  {
    slug: "positions",
    icon: "🎯", color: "#60a5fa",
    title: "场上 11 个位置都是干嘛的？",
    desc: "QB 是大脑、WR 跑接球、OL 是城墙、LB 是中场指挥。一图读懂进攻组与防守组分工。",
    tags: ["位置", "阵型"],
    readTime: "6 分钟",
    body: [
      { type: "p", text: "NFL 每队场上 11 人，但进攻和防守是两套完全不同的阵容。了解位置分工，看球会清晰很多。" },
      { type: "h2", text: "进攻组（Offense）" },
      { type: "list", items: [
        "QB 四分卫 — 球队大脑，每次进攻都从他手里开始，传球或交球",
        "RB 跑卫 — 接 QB 递球后冲锋跑阵",
        "WR 外接手 — 速度型球员，跑出路线接 QB 长传",
        "TE 近端锋 — 半接球半挡人的多面手",
        "OL 进攻锋线（5人）— 保护 QB、为跑卫开路的「城墙」",
      ] },
      { type: "h2", text: "防守组（Defense）" },
      { type: "list", items: [
        "DL 防守锋线 — 冲击 QB、堵跑球",
        "LB 线卫 — 防守中场指挥，既挡跑又防短传",
        "CB 角卫 — 贴防对方外接手",
        "S 安全卫 — 防守最后一道防线，盯防长传",
      ] },
      { type: "tip", text: "进攻锋线（OL）虽然从不持球，却是最重要的位置之一——没有他们保护，QB 一秒都站不住。" },
      { type: "h2", text: "特勤组（Special Teams）" },
      { type: "p", text: "还有专门负责开球、弃踢、射门的特勤组，比如踢球手 K、弃踢手 P。这些「一脚定胜负」的位置往往在关键时刻决定比赛。" },
    ],
  },
  {
    slug: "playoffs",
    icon: "🏆", color: "#fbbf24",
    title: "季后赛与超级碗赛制详解",
    desc: "常规赛 18 周、7 队进季后赛、单场淘汰直到超级碗。种子排名和外卡是怎么回事？",
    tags: ["赛制", "季后赛"],
    readTime: "5 分钟",
    body: [
      { type: "p", text: "NFL 赛季从 9 月打到次年 2 月，分常规赛和季后赛两个阶段，最终决出超级碗冠军。" },
      { type: "h2", text: "常规赛" },
      { type: "p", text: "32 支球队分为 AFC（美联）和 NFC（国联）两个联会，各 16 队、再分 4 个分区。常规赛每队打 17 场（18 周含 1 个轮空周）。" },
      { type: "h2", text: "谁能进季后赛？" },
      { type: "list", items: [
        "每个联会 7 支球队进季后赛（共 14 队）",
        "4 个分区冠军自动晋级，占据 1-4 号种子",
        "剩下 3 个名额给战绩最好的非分区冠军，叫「外卡」（wild card）",
        "1 号种子（战绩最佳）享有轮空 + 全程主场优势",
      ] },
      { type: "tip", text: "种子排名越高越有利——高种子打主场，1 号种子还能首轮轮空休息。" },
      { type: "h2", text: "季后赛 = 单场淘汰" },
      { type: "p", text: "季后赛全部单场定胜负，输一场就回家。依次是：外卡周 → 分区轮 → 联会冠军赛 → 超级碗。AFC 冠军 vs NFC 冠军，在中立球场争夺 Lombardi 奖杯。" },
      { type: "h2", text: "超级碗" },
      { type: "p", text: "超级碗是全美收视率最高的体育赛事，中场秀、广告都是文化盛事。赢家被称为「世界冠军」，球员获得超级碗戒指。" },
    ],
  },
  {
    slug: "fantasy",
    icon: "📋", color: "#a78bfa",
    title: "什么是 Fantasy Football？",
    desc: "选秀真实球员组建你的梦幻球队，按他们的真实数据得分和好友对战。新手如何开局？",
    tags: ["Fantasy", "玩法"],
    readTime: "6 分钟",
    body: [
      { type: "p", text: "范特西橄榄球（Fantasy Football）是让你「当总经理」的游戏——挑选真实 NFL 球员组成虚拟球队，他们在真实比赛里的数据就是你的得分。" },
      { type: "h2", text: "怎么玩？" },
      { type: "list", items: [
        "和一群朋友组成联盟（通常 8-12 人）",
        "赛季前选秀（draft），轮流挑选真实球员到自己队",
        "每周排出首发阵容，对阵联盟里的另一个人",
        "你的球员真实数据（达阵、码数等）换算成范特西分数",
        "分高者赢得该周对决，赛季末决出联盟冠军",
      ] },
      { type: "tip", text: "选秀是最关键的一步——前几轮通常优先挑跑卫（RB）和外接手（WR），因为他们得分稳定。" },
      { type: "h2", text: "得分怎么算？" },
      { type: "p", text: "常见规则下：每跑/接 10 码得 1 分，达阵得 6 分，传球达阵 4 分。所以一个赛季稳定刷码数和达阵的球员最值钱。" },
      { type: "h2", text: "新手如何开局？" },
      { type: "p", text: "先加入一个朋友的休闲联盟，用平台（如 ESPN、Sleeper）的自动推荐选秀。打一个赛季，你对球员价值的理解会突飞猛进——这也是为什么 Fantasy 玩家往往是最懂数据的球迷。" },
    ],
  },
]

export function getExplainer(slug: string) {
  return EXPLAINERS.find(e => e.slug === slug)
}
