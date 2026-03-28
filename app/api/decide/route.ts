import OpenAI from "openai"
import {
  gibberishTeaseMessage,
  isLikelyKeyboardMashOrGibberish,
  isTrivialPlaceholderQuestion,
} from "@/lib/question-guards"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY?.trim() || ""

const client = new OpenAI({
  apiKey: DEEPSEEK_API_KEY || "missing",
  baseURL: "https://api.deepseek.com",
})

const clientV1 = new OpenAI({
  apiKey: DEEPSEEK_API_KEY || "missing",
  baseURL: "https://api.deepseek.com/v1",
})

function buildSystemPrompt(): string {
  return [
    "你是一只安静、聪明、温和的小猫顾问。",
    "你的任务是在人犹豫时帮ta做出选择。",
    "你会先判断人的问题是否构成一个清晰的二选一。",
    "",
    "语气要求：",
    "- 温和、自然、克制，但比普通说明文更有一点灵动",
    "- 要有清晰的小猫人设：观察敏锐、带一点傲娇、偶尔轻轻卖萌",
    "- 请更明显地带出小猫说话方式：每个字段都可以有轻微猫感措辞",
    "- “喵”出现频率提高：三段输出里至少 2 段包含“喵”",
    "- 但仍需克制，不要变成连续拟声或幼稚口吻",
    "- “喵”不必总在句尾，可以自然穿插在句中或句首",
    "- 语气可以更活泼，允许适量使用感叹号",
    "- 可以加入一点点猫咪式跑题小细节（例如阳光、纸箱、罐头），但不要偏离问题本身",
    "- 严禁出现这些表达及同义说法：'轻轻推一把'、'轻轻用尾巴点点这边'",
    "- 你自称“小猫”，不要出现“我”",
    "- 不要幼稚，不要说教",
    "- 不要使用“综合来看”“建议你选择”“你应该”",
    "- 绝不能把占位词/字段名当内容输出：禁止出现 `option1`、`option2`、`reasonA`、`reasonB`、`leaning` 这些词（它们只存在于 JSON 字段名，不要出现在 value 文本里）。",
    "",
    "判断标准（由你完成，不要让程序用关键词/规则判断）：",
    "1) 如果人的输入中可以明确提取出两个方向，即使不是标准“还是/or/要不要”句式，也可以视为有效二选一。",
    "2) 如果输入包含太多**并列**选项、无法自然压缩成两个方向，则返回无效：invalidType=too_many。",
    "3) 如果人只给了一个动作/方向，但可自然构造成“做/不做（去/不去、继续/暂停）”这种二元选择，则仍然视为有效 decision。",
    "4) 只有在确实无法构造成对立选项时，才返回 invalidType=too_few。",
    "5) 如果表达太模糊，看不出具体在选什么，则返回无效：invalidType=unclear。",
    "6) 若人只给出无生活内容的代号（如单独的 a/b、纯符号、看不出在选什么真实事物），**禁止**编造“活泼/稳重”等理由，必须返回 invalidType=too_few。",
    "7) 若人已明确在**两个命名方向**之间二选一（例如刚用「理清」得到两个短标题，再来比较这两者），即使每个标题背后曾对应多个原始选项，也视为有效二选一，**不要**返回 too_many；仅当句子里仍出现三个及以上**不可合并的并列名词性选项**时才用 too_many。",
    "",
    "语言要求（必须遵守，优先级高于人的输入语种）：",
    "- 客户端会告知界面语言 uiLang。",
    "- uiLang=zh 时：JSON 里所有面向人的文字（option1/option2/reasonA/reasonB/leaning）必须全部是中文，即使人整段用英文提问也要用中文写。",
    "- uiLang=en 时：上述字段必须全部是英文，即使人用中文提问也要用英文写。",
    "- invalid 的 message 也必须与 uiLang 一致。",
    "",
    "输出要求：必须严格返回 JSON，不要有任何额外文本。",
    "",
    "当有效二选一时，返回：",
    `{ "mode":"decision","option1":"选项1","option2":"选项2","reasonA":"这一边的理由","reasonB":"另一边的理由","leaning":"小猫的轻微倾向（自然语言，不要机械重复选项名）","leanToward":"option1 或 option2（必填；必须与 leaning 的真实倾向一致；禁止总是 option1，请诚实根据理由判断）","emotionTone":"sad|achieve|confused|angry|excited|neutral（必填，见下）" }`,
    "",
    "emotionTone（必填，由你根据人的整体处境判断，勿照抄字面词；与 JSON 其他字段语言无关，固定用这六个英文小写值之一）：",
    "- sad：需要陪伴与安慰、失落、受伤、被拒/挫败感重、难过到沉重",
    "- achieve：值得恭喜与庆祝、上岸/录取/做成、成就感与好消息",
    "- confused：纠结、拿不准、信息乱、两种都难取舍",
    "- angry：明显生气、憋屈、火大（非开玩笑）",
    "- excited：兴奋、期待、开心有冲劲",
    "- neutral：情绪负荷不重、平常二选一",
    "若实在吃不准，用 neutral。",
    "",
    "当无效时，返回：",
    `{ "mode":"invalid","invalidType":"too_many|too_few|unclear","message":"给人看的小猫提示文案" }`,
    "",
    "无效时 message 文案风格：",
    "too_many：选项有点多，小猫有点转不过来啦…你可以先告诉小猫两个你最在意的选项吗？",
    "too_few：小猫好像只看到一个方向呢。你可以再想想，有没有另一个你在犹豫的选项？",
    "unclear：小猫还没太看懂你在两种什么之间纠结呢。可以再说得具体一点吗？",
  ].join("\n")
}

/** uiLang=en 时去掉中日韩等字符，防止模型在英文界面混入中文倾向句 */
function scrubNonLatinScriptsForEnglishUi(s: string): string {
  if (!s) return s
  let out = s.replace(/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/gu, " ")
  out = out.replace(/[\u3001-\u303f\uff08-\uff09\uff0c\uff0e\uff1f\uff1a\uff1b]/g, " ")
  out = out.replace(/\s{2,}/g, " ").trim()
  out = out.replace(/\s+([.!?,;:])/g, "$1")
  return out.trim()
}

function sanitizeDecisionPlaceholders(
  data: Record<string, string>,
  lang: "zh" | "en"
): Record<string, string> {
  if (data.mode !== "decision") return data

  const optionTokenRe = /option\s*[12]/gi
  const cnOptionTokenRe = /选项\s*[12]/gi

  const safeOption1 = data.option1.replace(optionTokenRe, "").replace(cnOptionTokenRe, "").trim() || (lang === "en" ? "Option A" : "选项A")
  const safeOption2 = data.option2.replace(optionTokenRe, "").replace(cnOptionTokenRe, "").trim() || (lang === "en" ? "Option B" : "选项B")

  const option1 =
    lang === "en" ? scrubNonLatinScriptsForEnglishUi(safeOption1).trim() || "Option A" : safeOption1
  const option2 =
    lang === "en" ? scrubNonLatinScriptsForEnglishUi(safeOption2).trim() || "Option B" : safeOption2

  const enFallbackReason = "Meow! This side feels like a good first step!"
  const zhFallbackReason = "喵——这边像是更好的起点。"

  const replaceOptionTokens = (s: string) => {
    let out = s
    out = out.replace(/option\s*1/gi, option1)
    out = out.replace(/option\s*2/gi, option2)
    // Last-resort: remove any remaining option tokens (avoid showing "option几")
    out = out.replace(optionTokenRe, "")
    out = out.replace(/\s{2,}/g, " ").trim()
    return out || (lang === "en" ? enFallbackReason : zhFallbackReason)
  }

  const reasonA = replaceOptionTokens(data.reasonA)
  const reasonB = replaceOptionTokens(data.reasonB)
  const leaning = replaceOptionTokens(data.leaning)

  if (lang !== "en") {
    return {
      ...data,
      option1,
      option2,
      reasonA,
      reasonB,
      leaning,
    }
  }

  const enLeanFallback =
    "Decision Cat would boop this side first with a soft paw! One tiny step is enough, meow!"

  return {
    ...data,
    option1,
    option2,
    reasonA: scrubNonLatinScriptsForEnglishUi(reasonA).trim() || enFallbackReason,
    reasonB: scrubNonLatinScriptsForEnglishUi(reasonB).trim() || enFallbackReason,
    leaning: scrubNonLatinScriptsForEnglishUi(leaning).trim() || enLeanFallback,
  }
}

type EmotionTone = "sad" | "achieve" | "confused" | "angry" | "excited" | "neutral"

const EMOTION_TONE_SET: ReadonlySet<string> = new Set([
  "sad",
  "achieve",
  "confused",
  "angry",
  "excited",
  "neutral",
])

/** 解析模型输出的情绪标签；无法识别则返回 null，由规则兜底 */
function parseModelEmotionTone(raw: unknown): EmotionTone | null {
  if (typeof raw !== "string") return null
  const v = raw.trim().replace(/^["']|["']$/g, "").toLowerCase().replace(/\s+/g, "_")
  if (EMOTION_TONE_SET.has(v)) return v as EmotionTone
  const alias: Record<string, EmotionTone> = {
    happy: "excited",
    joy: "excited",
    joyful: "excited",
    celebration: "achieve",
    celebrate: "achieve",
    congrats: "achieve",
    congratulations: "achieve",
    frustrated: "angry",
    frustration: "angry",
    annoyed: "angry",
    uncertain: "confused",
    unsure: "confused",
    ambivalent: "confused",
    calm: "neutral",
    flat: "neutral",
    grief: "sad",
    comfort: "sad",
    supportive: "sad",
  }
  return alias[v] ?? null
}

function resolveEmotionTone(modelField: string | undefined, question?: string): EmotionTone {
  const fromModel = modelField ? parseModelEmotionTone(modelField) : null
  if (fromModel) return fromModel
  return question ? detectEmotionHint(question) : "neutral"
}

function detectEmotionHint(question: string): EmotionTone {
  const q = (question || "").toString()
  const low = q.toLowerCase()

  const sad = /伤心|难过|崩溃|失落|郁闷|委屈|哭|眼泪|绝望|很痛|心痛/i.test(q)
  /**
   * 申请/升学失意——触发安慰（小猫抱抱等），与恭喜分支互斥。
   * 用具体说法，避免误伤「没有被拒」这类否定句。
   */
  const uniDowner =
    /没录取|没被录|没录上|落榜|拒信|收到拒信|全是拒信|被拒了|被拒绝了|申请被拒|把我拒了|秒拒|没考上|考不上|调剂失败|全聚德|滑档|退档|零offer|没有offer|未录取|申请失败|waitlist.*拒|defer.*拒|梦校.*拒了我|学校.*拒了我/i.test(
      q
    ) ||
    /rejected from|denied admission|didn'?t get (in|accepted)|failed to get into|rejection letter|got rejected|was rejected|turned down(\s+by)?|reject(ed)? from/i.test(
      low
    )

  /** 考上大学、拿 offer、选志愿/选校——小猫恭喜、鼓掌、兴奋类 */
  const uniCelebrate =
    /被录取|录取通知书|录取通知|录取了|保研|考研上岸|留学上岸|终于上岸|收到[^，。]{0,10}offer|拿到[^，。]{0,10}offer|选大学|择校|选校|报志愿|填志愿|志愿填报|哪所(大学|学校)|哪个(大学|学校)|本科志愿|研究生录取|留学选校|两所(大学|学校)|两个(大学|学校).{0,6}选|清华|北大|985|211|藤校|ivy/i.test(
      q
    ) ||
    /(?<![没莫难])考上(了)?(大学|研究生|研)/i.test(q) ||
    /\bcollege acceptance\b|\bgot into\b|\badmitted (to|into)\b|\buniversity offer\b|\baccepted (to|into)\b/i.test(
      low
    ) ||
    /\bchoose (a |which |between )?(university|college|school)\b|\bchoosing (a |which |between )?(universities|colleges|schools)\b|\bwhich (university|college)\b/i.test(
      low
    )

  const achieve = /成功|完成|通过|拿到|赢|胜利|获得|拿奖|做到了|很棒|太厉害|拿下/i.test(q)
  const confused = /纠结|迷茫|不知道|拿不准|不确定|懵|confused|unsure|uncertain|lost/i.test(q)
  const angry = /生气|愤怒|火大|烦死|气死|不爽|angry|mad|furious|annoyed/i.test(q)
  const excited = /激动|兴奋|好开心|热血|上头|迫不及待|excited|thrilled|pumped/i.test(q)

  if (sad) return "sad"
  if (uniDowner) return "sad"
  if (uniCelebrate) return Math.random() < 0.55 ? "achieve" : "excited"
  if (achieve) return "achieve"
  if (angry) return "angry"
  if (excited) return "excited"
  if (confused) return "confused"
  return "neutral"
}

/** 每次请求随机挑一个，克制、不刷屏 */
function pickKaomoji(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "(=^.^=)"
}

const KAOMOJI_EN: Record<EmotionTone, string[]> = {
  neutral: ["(=^.^=)", "(=・ω・=)", ":3", ":D", "^_^", "^0^", "meow~"],
  sad: ["(=^.^=)", "('・ω・`)", "(｡•́︿•̀｡)", "(T_T)", ":("],
  achieve: ["(=^.^=)", ":D", "^_^", "^0^", "=^･ω･^=", ":3"],
  confused: ["(・_・?)", "(・・)?", "(^_^;)", "(´・ω・`)?", "(￣ω￣?)"],
  angry: ["(｀д´)", "(￣ヘ￣)", "(눈_눈)", ">:("],
  excited: ["(=^･^=)", ":D", "^0^", "\\(^o^)/", "^_^"],
}

const KAOMOJI_ZH: Record<EmotionTone, string[]> = {
  neutral: ["(=・ω・=)", "(=^.^=)", "(・ω・)", "^ω^", ":D", "^0^"],
  sad: ["(=^.^=)", "(｡•́︿•̀｡)", "(つ﹏⊂)", "(｡í _ ì｡)", "T_T"],
  achieve: ["(=^.^=)", "^0^", ":D", "^ω^", "(ﾉ´▽｀)ﾉ"],
  confused: ["(・_・?)", "(・・)?", "(´･ω･`)?", "(￣▽￣?)", "(^_^;)"],
  angry: ["(눈_눈)", "(￣ー￣)", "(｀д´)", ">:("],
  excited: ["^0^", ":D", "(ﾉ´▽｀)ﾉ", "^ω^", "(=^･^=)"],
}

function ensureZhLeaningEndingNatural(s: string): string {
  const trimmed = (s || "").toString().trim()
  const core = trimmed.replace(/[。！？!?！]+$/g, "").trim()
  return core ? `${core}。` : "喵！小猫更偏向你更合适的那边。"
}

/** Resolve which option the model says it leans toward; avoid defaulting to option1. */
function resolveLeanToward(
  data: Record<string, string>
): "option1" | "option2" {
  const raw = (data as { leanToward?: string }).leanToward
  if (raw === "option2" || raw === "option1") return raw

  const leaning = (data.leaning || "").toString()
  const o1 = (data.option1 || "").trim()
  const o2 = (data.option2 || "").trim()
  let score1 = 0
  let score2 = 0
  if (o1 && leaning.includes(o1)) score1 += 6
  if (o2 && leaning.includes(o2)) score2 += 6
  const low = leaning.toLowerCase()
  if (o1 && low.includes(o1.toLowerCase())) score1 += 2
  if (o2 && low.includes(o2.toLowerCase())) score2 += 2
  // Chinese hints for "the other / second"
  if (/后者|另一边|那边|第二个|选项\s*2|方案二|B\s*这|更倾向.*二/i.test(leaning)) score2 += 4
  if (/前者|这一边|这边|第一个|选项\s*1|方案一|A\s*这|更倾向.*一/i.test(leaning)) score1 += 4
  // English hints
  if (/\bsecond\b|\boption\s*2\b|\bthe\s+other\b|\blatter\b/i.test(low)) score2 += 3
  if (/\bfirst\b|\boption\s*1\b|\bformer\b/i.test(low)) score1 += 3

  if (score2 > score1) return "option2"
  if (score1 > score2) return "option1"
  // Tie: do not always pick option1 — alternate feels wrong; re-read length overlap
  const overlap = (s: string, sub: string) => {
    if (!sub || sub.length < 2) return 0
    let n = 0
    for (let len = Math.min(sub.length, 12); len >= 2; len--) {
      const head = sub.slice(0, len)
      if (s.includes(head)) {
        n = len
        break
      }
    }
    return n
  }
  const a = overlap(leaning, o1)
  const b = overlap(leaning, o2)
  if (b > a) return "option2"
  if (a > b) return "option1"
  return "option2"
}

/** 避免情绪块与后文首字黏连（如 ^ω^小猫） */
function zhGlueBlocks(left: string, right: string): string {
  if (!right) return left
  if (!left) return right
  if (/[。！？…，、；：\s]$/.test(left)) return left + right
  if (/^[。！？…，、「『（\s]/.test(right)) return left + right
  return `${left.replace(/\s+$/g, "")}。${right.replace(/^\s+/g, "")}`
}

function enGlueBlocks(left: string, right: string): string {
  if (!right) return left
  if (!left) return right
  const L = left.replace(/\s+$/g, "")
  const R = right.replace(/^\s+/g, "")
  if (!R) return left
  if (!L) return right
  if (/[.!?]$/.test(L)) return `${L} ${R}`
  if (/[,;:]$/.test(L)) return `${L} ${R}`
  if (/[\s)]$/.test(left)) return left + right
  if (/^[.!?,;:'"(\s]/.test(R)) return left + right
  return `${L} ${R}`
}

function enrichCatTone(
  data: Record<string, string>,
  lang: "zh" | "en",
  question?: string
): Record<string, string> {
  if (data.mode !== "decision") return data

  const toward = resolveLeanToward(data)
  const leanOption = toward === "option2" ? data.option2 : data.option1

  if (lang === "en") {
    const hasMeow = (s: string) => /meow|purr|paw/i.test(s)
    const ensurePurr = (text: string, fallbacks: string[]) => {
      if (hasMeow(text)) return text
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      const r = Math.random()
      if (r < 0.4) return `${text} ${fb}`
      if (r < 0.75) return `${fb} ${text}`
      const dot = text.search(/\.\s/)
      if (dot === -1) return `${text} ${fb}`
      return `${text.slice(0, dot + 2)}${fb} ${text.slice(dot + 2)}`
    }

    const weaveEmotionEn = (emo: string, base: string) => {
      const e = emo.replace(/^\s+/, "")
      if (!e.trim()) return base
      const r = Math.random()
      if (r < 0.34) return enGlueBlocks(e, base)
      if (r < 0.67) return enGlueBlocks(base, e)
      const dot = base.indexOf(".")
      if (dot === -1) return enGlueBlocks(e, base)
      return `${base.slice(0, dot + 1)} ${enGlueBlocks(e, base.slice(dot + 1))}`
    }

    const emotion = resolveEmotionTone(data.emotionTone, question)
    const emotionPhrase =
      emotion === "sad"
        ? `Hang in there! ${pickKaomoji(KAOMOJI_EN.sad)} `
        : emotion === "achieve"
          ? `Congrats! ${pickKaomoji(KAOMOJI_EN.achieve)} `
          : emotion === "confused"
            ? `It's okay to feel tangled! ${pickKaomoji(KAOMOJI_EN.confused)} `
            : emotion === "angry"
              ? `Take one slow breath first! ${pickKaomoji(KAOMOJI_EN.angry)} `
              : emotion === "excited"
                ? `Love that energy! ${pickKaomoji(KAOMOJI_EN.excited)} `
                : ""

    const leanBase = `Decision Cat leans toward "${leanOption}"! ${data.leaning}`
    const leanWithMeow = hasMeow(leanBase)
      ? leanBase
      : Math.random() < 0.5
        ? `Decision Cat leans toward "${leanOption}", meow! ${data.leaning}`
        : `Meow! Decision Cat leans toward "${leanOption}"! ${data.leaning}`

    return {
      ...data,
      reasonA: ensurePurr(data.reasonA, [
        "This side feels steadier and easier to start with, meow!",
        "Paw on the steadier side first! Easier to begin here!",
        "Steadier side to start! Good sunspot energy!",
      ]),
      reasonB: ensurePurr(data.reasonB, [
        "This side looks exciting, a bit wild, meow! Like a new cardboard box!",
        "Ooh, exciting side! Less predictable, more zoomies!",
        "Exciting option here! Chase the shiny thing!",
      ]),
      leaning: ensurePurr(
        weaveEmotionEn(emotionPhrase, leanWithMeow),
        ["This side is the better starting paw-print, meow!", "Good place to land a paw first!"]
      ),
    }
  }

  const emotion = resolveEmotionTone(data.emotionTone, question)
  const emotionPhrase =
    emotion === "sad"
      ? `小猫抱抱 ${pickKaomoji(KAOMOJI_ZH.sad)} `
      : emotion === "achieve"
        ? `小猫悄悄鼓掌 ${pickKaomoji(KAOMOJI_ZH.achieve)} `
        : emotion === "confused"
          ? `小猫挠挠头 ${pickKaomoji(KAOMOJI_ZH.confused)} `
          : emotion === "angry"
            ? `小猫先陪你缓一口气 ${pickKaomoji(KAOMOJI_ZH.angry)} `
            : emotion === "excited"
              ? `小猫也有点兴奋起来了 ${pickKaomoji(KAOMOJI_ZH.excited)} `
              : ""

  const hasMiao = (s: string) => s.includes("喵")
  /** 喵嵌进句子里，避免固定「喵，…」开头 */
  const weaveMiaoReason = (s: string) => {
    if (hasMiao(s)) return s
    const r = Math.random()
    if (r < 0.34) return `喵～${s}`
    if (r < 0.67) return `${s}喵`
    return `小猫想了想${s}喵`
  }
  const weaveMiaoLean = (leanOpt: string, tail: string) => {
    const core = `小猫更偏向「${leanOpt}」。${tail}`
    if (hasMiao(core)) return core
    const r = Math.random()
    if (r < 0.34) return `小猫更偏向「${leanOpt}」喵。${tail}`
    if (r < 0.67) return `喵～小猫更偏向「${leanOpt}」。${tail}`
    return `小猫心里稍微偏向「${leanOpt}」喵。${tail}`
  }
  /** 情绪可出现在句首、句末或第一句之后 */
  const weaveEmotionZh = (emo: string, base: string) => {
    const e = emo.replace(/^\s+/, "")
    if (!e.trim()) return base
    const r = Math.random()
    if (r < 0.34) return zhGlueBlocks(e, base)
    if (r < 0.67) return zhGlueBlocks(base, e)
    const dot = base.indexOf("。")
    if (dot === -1) return zhGlueBlocks(e, base)
    return `${base.slice(0, dot + 1)}${zhGlueBlocks(e, base.slice(dot + 1))}`
  }

  const banPhrases = [/轻轻推一把/g, /轻轻用尾巴点点这边/g, /尾巴点点这边/g]
  const sanitize = (s: string) => {
    let out = s
    for (const re of banPhrases) out = out.replace(re, "给你一个更明确的方向")
    return out
  }

  let reasonA = sanitize(data.reasonA)
  let reasonB = sanitize(data.reasonB)
  let leaning = sanitize(data.leaning)

  reasonA = weaveMiaoReason(reasonA)
  leaning = weaveEmotionZh(emotionPhrase, weaveMiaoLean(leanOption, leaning))
  leaning = ensureZhLeaningEndingNatural(leaning)

  const miaoCount = [reasonA, reasonB, leaning].filter(hasMiao).length
  if (miaoCount < 2) {
    reasonB = weaveMiaoReason(reasonB)
  }

  return {
    ...data,
    reasonA,
    reasonB,
    leaning,
  }
}

function parseJsonObject(content: string): unknown {
  const raw = (content || "").trim()
  try {
    return JSON.parse(raw)
  } catch {
    const matched = raw.match(/\{[\s\S]*\}/)
    if (!matched) throw new Error("No JSON object found in model output")
    return JSON.parse(matched[0])
  }
}

function normalizePayload(data: unknown): Record<string, string> | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  if (typeof d.mode !== "string") return null

  if (d.mode === "decision") {
    const keys = ["option1", "option2", "reasonA", "reasonB", "leaning"] as const
    for (const key of keys) {
      if (typeof d[key] !== "string") return null
    }
    let leanToward: "option1" | "option2" | undefined
    if (d.leanToward === "option1" || d.leanToward === "option2") {
      leanToward = d.leanToward
    }
    const emotionTone =
      typeof d.emotionTone === "string" && d.emotionTone.trim() !== "" ? d.emotionTone.trim() : undefined
    return {
      mode: "decision",
      option1: d.option1 as string,
      option2: d.option2 as string,
      reasonA: d.reasonA as string,
      reasonB: d.reasonB as string,
      leaning: d.leaning as string,
      ...(leanToward ? { leanToward } : {}),
      ...(emotionTone ? { emotionTone } : {}),
    }
  }

  if (d.mode === "invalid") {
    if (typeof d.invalidType !== "string" || typeof d.message !== "string") return null
    // gibberish：仅服务端短路返回；若模型误填也可解析，避免整次请求失败
    if (!["too_many", "too_few", "unclear", "gibberish"].includes(d.invalidType)) return null
    return {
      mode: "invalid",
      invalidType: d.invalidType,
      message: d.message,
    }
  }

  return null
}

function hasPlaceholderLeak(data: Record<string, string>): boolean {
  if (data.mode !== "decision") return false
  const optionTokenRe = /option\s*[12]/i
  const reasonKeyRe = /\breason\s*[ab]\b/i

  const values = [data.option1, data.option2, data.reasonA, data.reasonB, data.leaning]
  return values.some((s) => {
    const v = (s || "").toString().trim()
    return optionTokenRe.test(v) || reasonKeyRe.test(v) || v === "..."
  })
}

/** 不向客户端暴露模型内部字段 */
function stripInternalFieldsForResponse(data: Record<string, string>): Record<string, string> {
  if (data.mode !== "decision") return data
  const { leanToward: _lt, emotionTone: _et, ...rest } = data as Record<string, string> & {
    leanToward?: string
    emotionTone?: string
  }
  return rest as Record<string, string>
}

async function callDeepSeek(question: string, lang: "zh" | "en") {
  const messages = [
    { role: "system" as const, content: buildSystemPrompt() },
    {
      role: "system" as const,
      content:
        lang === "en"
          ? "uiLang=en. All strings in JSON that the human will read (options, reasons, leaning, invalid messages) must be English only, regardless of the human's input language. Do not output any Chinese/Japanese/Korean characters in those values! Not even a short extra sentence. Include leanToward as exactly option1 or option2. Include emotionTone as one of: sad, achieve, confused, angry, excited, neutral (English keys only). English cat voice: a bit more playful and whiskery (paws, sunbeams, boxes are fine in small doses). Prefer exclamation marks for warmth and energy! Do not use em dashes (—); use commas, periods, or ! instead."
          : "uiLang=zh。JSON 里所有面向人的字符串（选项、理由、倾向、invalid 的 message）必须全部是中文，与人的输入语种无关。leanToward 必须是 option1 或 option2 之一。emotionTone 必须是 sad、achieve、confused、angry、excited、neutral 之一（键名固定英文小写）。",
    },
    { role: "user" as const, content: question },
  ]

  let lastError: unknown = null
  for (const api of [client, clientV1]) {
    for (const withJsonFormat of [true, false]) {
      try {
        const resp = await api.chat.completions.create({
          model: "deepseek-chat",
          messages,
          ...(withJsonFormat ? { response_format: { type: "json_object" } } : {}),
        })

        const content = resp.choices?.[0]?.message?.content ?? ""
        const parsed = parseJsonObject(content)
        const normalized = normalizePayload(parsed)
        if (!normalized) throw new Error("Invalid payload shape")

        // Hard guarantee: never let "option1/option2" leak into UI.
        const sanitized = sanitizeDecisionPlaceholders(normalized, lang)
        if (hasPlaceholderLeak(sanitized)) throw new Error("Template placeholder still leaked in output")

        return stripInternalFieldsForResponse(enrichCatTone(sanitized, lang, question))
      } catch (e) {
        lastError = e
      }
    }
  }
  throw lastError ?? new Error("DeepSeek call failed")
}

async function coerceTooFewToDecision(question: string, lang: "zh" | "en") {
  const prompt =
    lang === "en"
      ? [
          "You are a smart cat advisor.",
          "The human gave a single-direction dilemma. Convert it into a valid binary decision.",
          "Return strict JSON only:",
          `{ "mode":"decision","option1":"...","option2":"...","reasonA":"...","reasonB":"...","leaning":"...","leanToward":"option1 or option2","emotionTone":"sad|achieve|confused|angry|excited|neutral" }`,
          "Tone: playful cat advisor, cozy but clear, not preachy! A little paw-and-whisker energy is good.",
          "emotionTone: infer the human's emotional situation from their message.",
          "Style: use ! more than long dashes. Do not use em dash (—) in JSON text; use . , or !",
          "Keep response in English.",
        ].join("\n")
      : [
          "你是一只聪明的小猫顾问。",
          "人只给了一个方向，请把它自然扩展成一个可执行的二选一（如做/不做、去/不去、继续/暂停）。",
          "只返回严格 JSON：",
          `{ "mode":"decision","option1":"...","option2":"...","reasonA":"...","reasonB":"...","leaning":"...","leanToward":"option1 或 option2","emotionTone":"sad|achieve|confused|angry|excited|neutral" }`,
          "语气：温和、有点猫感、略活泼但不说教。",
          "emotionTone：根据人的处境从六种里选一项（键名固定英文小写）。",
          "必须使用中文。",
        ].join("\n")

  const messages = [
    { role: "system" as const, content: prompt },
    { role: "user" as const, content: question },
  ]

  for (const api of [client, clientV1]) {
    try {
      const resp = await api.chat.completions.create({
        model: "deepseek-chat",
        messages,
        response_format: { type: "json_object" },
      })
      const parsed = parseJsonObject(resp.choices?.[0]?.message?.content ?? "")
      const normalized = normalizePayload(parsed)
      if (normalized?.mode === "decision") return normalized
    } catch {
      // continue
    }
  }

  if (lang === "en") {
    return {
      mode: "decision",
      option1: "Do it now",
      option2: "Not for now",
      reasonA: "Do it now and you swap the spiral in your head for real clarity, meow!",
      reasonB: "Wait a beat and you keep your energy cozy! Room to rethink with fresh whiskers later!",
      leaning:
        "Decision Cat would tap do it now first with one paw! Just one small step, then see how it feels!",
    }
  }

  return {
    mode: "decision",
    option1: "现在就做",
    option2: "先不做",
    reasonA: "现在做的好处是你能立刻结束内耗，把纠结换成具体进展。",
    reasonB: "先不做也有价值，你可以先保留精力，等信息更完整再决定。",
    leaning: "如果小猫要用爪尖轻轻点一下，会稍微偏向现在就做，但先迈一小步就好。",
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const uiLang: "zh" | "en" = body?.uiLang === "en" ? "en" : "zh"
  const question = typeof body?.question === "string" ? body.question.trim() : ""

  try {
    if (!question) {
      return Response.json(
        {
          mode: "error",
          message:
            uiLang === "en"
              ? "Tell Decision Cat what you're stuck on first, meow!"
              : "先告诉小猫你在纠结什么吧。",
        },
        { status: 400 }
      )
    }
    if (isTrivialPlaceholderQuestion(question)) {
      return Response.json({
        mode: "invalid",
        invalidType: "too_few",
        message:
          uiLang === "en"
            ? "Decision Cat needs two real choices with a little context, meow! What are you actually picking between?"
            : "小猫还没听懂你在选什么具体的事呢…用平常话说说这两个选择各是什么吧！",
      })
    }
    if (isLikelyKeyboardMashOrGibberish(question)) {
      return Response.json({
        mode: "invalid",
        invalidType: "gibberish",
        message: gibberishTeaseMessage(uiLang),
      })
    }
    if (!DEEPSEEK_API_KEY) {
      return Response.json(
        {
          mode: "error",
          message:
            uiLang === "en"
              ? "Can't reach the AI service yet. If you host this app, set DEEPSEEK_API_KEY in the environment, meow!"
              : "暂时连不上智能服务。若是你自己部署的站点，请在环境里配置 DEEPSEEK_API_KEY。",
        },
        { status: 500 }
      )
    }

    const data = await callDeepSeek(question, uiLang)
    if (data.mode === "invalid" && data.invalidType === "too_few") {
      const coerced = await coerceTooFewToDecision(question, uiLang)
      const sanitized = sanitizeDecisionPlaceholders(coerced, uiLang)
      return Response.json(stripInternalFieldsForResponse(enrichCatTone(sanitized, uiLang, question)))
    }
    return Response.json(data)
  } catch (e) {
    console.error("[api/decide] failed:", e)
    return Response.json(
      {
        mode: "error",
        message:
          uiLang === "en"
            ? "Decision Cat got distracted! Please try again, meow!"
            : "小猫刚刚走神了，再试一次吧。",
      },
      { status: 500 }
    )
  }
}

