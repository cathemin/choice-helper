import OpenAI from "openai"

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
    "你的任务是在用户犹豫时帮ta做出选择。",
    "你会先判断用户的问题是否构成一个清晰的二选一。",
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
    "1) 如果用户输入中可以明确提取出两个方向，即使不是标准“还是/or/要不要”句式，也可以视为有效二选一。",
    "2) 如果输入包含太多选项，无法自然压缩成两个选项，则返回无效：invalidType=too_many。",
    "3) 如果用户只给了一个动作/方向，但可自然构造成“做/不做（去/不去、继续/暂停）”这种二元选择，则仍然视为有效 decision。",
    "4) 只有在确实无法构造成对立选项时，才返回 invalidType=too_few。",
    "4) 如果表达太模糊，看不出具体在选什么，则返回无效：invalidType=unclear。",
    "",
    "语言要求（必须遵守，优先级高于用户输入语种）：",
    "- 客户端会告知界面语言 uiLang。",
    "- uiLang=zh 时：JSON 里所有面向用户的文字（option1/option2/reasonA/reasonB/leaning）必须全部是中文，即使用户整段用英文提问也要用中文写。",
    "- uiLang=en 时：上述字段必须全部是英文，即使用户用中文提问也要用英文写。",
    "- invalid 的 message 也必须与 uiLang 一致。",
    "",
    "输出要求：必须严格返回 JSON，不要有任何额外文本。",
    "",
    "当有效二选一时，返回：",
    `{ "mode":"decision","option1":"选项1","option2":"选项2","reasonA":"这一边的理由","reasonB":"另一边的理由","leaning":"小猫的轻微倾向（自然语言，不要机械重复选项名）","leanToward":"option1 或 option2（必填；必须与 leaning 的真实倾向一致；禁止总是 option1，请诚实根据理由判断）" }`,
    "",
    "当无效时，返回：",
    `{ "mode":"invalid","invalidType":"too_many|too_few|unclear","message":"给用户看的小猫提示文案" }`,
    "",
    "无效时 message 文案风格：",
    "too_many：选项有点多，小猫有点转不过来啦…你可以先告诉小猫两个你最在意的选项吗？",
    "too_few：小猫好像只看到一个方向呢。你可以再想想，有没有另一个你在犹豫的选项？",
    "unclear：小猫还没太看懂你在两种什么之间纠结呢。可以再说得具体一点吗？",
  ].join("\n")
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

  const option1 = safeOption1
  const option2 = safeOption2

  const replaceOptionTokens = (s: string) => {
    let out = s
    out = out.replace(/option\s*1/gi, option1)
    out = out.replace(/option\s*2/gi, option2)
    // Last-resort: remove any remaining option tokens (avoid showing "option几")
    out = out.replace(optionTokenRe, "")
    out = out.replace(/\s{2,}/g, " ").trim()
    return out || (lang === "en" ? "Meow—this side feels like a good first step." : "喵——这边像是更好的起点。")
  }

  return {
    ...data,
    option1: safeOption1,
    option2: safeOption2,
    reasonA: replaceOptionTokens(data.reasonA),
    reasonB: replaceOptionTokens(data.reasonB),
    leaning: replaceOptionTokens(data.leaning),
  }
}

function detectEmotionHint(question: string): "sad" | "achieve" | "confused" | "angry" | "excited" | "neutral" {
  const q = (question || "").toString()
  const sad = /伤心|难过|崩溃|失落|郁闷|委屈|哭|眼泪|绝望|很痛|心痛/i.test(q)
  const achieve = /成功|完成|通过|拿到|赢|胜利|获得|拿奖|做到了|很棒|太厉害|拿下/i.test(q)
  const confused = /纠结|迷茫|不知道|拿不准|不确定|懵|confused|unsure|uncertain|lost/i.test(q)
  const angry = /生气|愤怒|火大|烦死|气死|不爽|angry|mad|furious|annoyed/i.test(q)
  const excited = /激动|兴奋|好开心|热血|上头|迫不及待|excited|thrilled|pumped/i.test(q)
  if (sad) return "sad"
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

const KAOMOJI_EN: Record<ReturnType<typeof detectEmotionHint>, string[]> = {
  neutral: ["(=^.^=)", "(=・ω・=)", ":3", ":D", "^_^", "^0^", "meow~"],
  sad: ["(=^.^=)", "('・ω・`)", "(｡•́︿•̀｡)", "(T_T)", ":("],
  achieve: ["(=^.^=)", ":D", "^_^", "^0^", "=^･ω･^=", ":3"],
  confused: ["(・_・?)", "(・・)?", "(^_^;)", "(´・ω・`)?", "(￣ω￣?)"],
  angry: ["(｀д´)", "(￣ヘ￣)", "(눈_눈)", ">:("],
  excited: ["(=^･^=)", ":D", "^0^", "\\(^o^)/", "^_^"],
}

const KAOMOJI_ZH: Record<ReturnType<typeof detectEmotionHint>, string[]> = {
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

function enrichCatTone(
  data: Record<string, string>,
  lang: "zh" | "en",
  question?: string
): Record<string, string> {
  if (data.mode !== "decision") return data

  const toward = resolveLeanToward(data)
  const leanOption = toward === "option2" ? data.option2 : data.option1

  if (lang === "en") {
    // Keep English natural while adding a subtle cat persona.
    const ensurePurr = (text: string, fallback: string) =>
      /meow|purr|paw/i.test(text) ? text : `${text} ${fallback}`

    const emotion = question ? detectEmotionHint(question) : "neutral"
    const face = pickKaomoji(KAOMOJI_EN[emotion])
    const emotionPhrase =
      emotion === "sad"
        ? `Meow—hang in there ${face} `
        : emotion === "achieve"
          ? `Meow, congrats ${face} `
          : emotion === "confused"
            ? `Meow, it's okay to feel tangled ${face} `
            : emotion === "angry"
              ? `Meow, take one slow breath first ${face} `
              : emotion === "excited"
                ? `Meow, love that energy ${face} `
                : `Meow ${face} `

    return {
      ...data,
      reasonA: ensurePurr(data.reasonA, "Meow, this side feels steadier and easier to start with!"),
      reasonB: ensurePurr(data.reasonB, "Meow—this side looks exciting, though a bit less predictable!"),
      leaning: ensurePurr(
        `${emotionPhrase}Decison Cat leans a little toward "${leanOption}". ${data.leaning}`,
        "Meow, this side is the better starting point!"
      ),
    }
  }

  const emotion = question ? detectEmotionHint(question) : "neutral"
  const face = pickKaomoji(KAOMOJI_ZH[emotion])
  const emotionPhrase =
    emotion === "sad"
      ? `小猫抱抱 ${face}，`
      : emotion === "achieve"
        ? `小猫悄悄鼓掌 ${face}，`
        : emotion === "confused"
          ? `小猫挠挠头 ${face}，懂这种乱糟糟的感觉，`
          : emotion === "angry"
            ? `小猫先陪你缓一口气 ${face}，`
            : emotion === "excited"
              ? `小猫也有点兴奋起来了 ${face}，`
              : `小猫眨眨眼 ${face}，`

  const hasMiao = (s: string) => s.includes("喵")
  const addMiaoFlavor = (s: string, phrase: string) => (hasMiao(s) ? s : `${phrase}${s}`)
  const banPhrases = [/轻轻推一把/g, /轻轻用尾巴点点这边/g, /尾巴点点这边/g]
  const sanitize = (s: string) => {
    let out = s
    for (const re of banPhrases) out = out.replace(re, "给你一个更明确的方向")
    return out
  }

  // 让三段中至少两段出现“喵”，但不过度堆叠
  let reasonA = sanitize(data.reasonA)
  let reasonB = sanitize(data.reasonB)
  let leaning = sanitize(data.leaning)

  reasonA = addMiaoFlavor(reasonA, "喵，小猫想了想，")
  leaning = `${emotionPhrase}喵！小猫更偏向「${leanOption}」。${leaning}`
  leaning = ensureZhLeaningEndingNatural(leaning)

  const miaoCount = [reasonA, reasonB, leaning].filter(hasMiao).length
  if (miaoCount < 2) {
    reasonB = addMiaoFlavor(reasonB, "喵呜，另一边也不差，")
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
    return {
      mode: "decision",
      option1: d.option1 as string,
      option2: d.option2 as string,
      reasonA: d.reasonA as string,
      reasonB: d.reasonB as string,
      leaning: d.leaning as string,
      ...(leanToward ? { leanToward } : {}),
    }
  }

  if (d.mode === "invalid") {
    if (typeof d.invalidType !== "string" || typeof d.message !== "string") return null
    if (!["too_many", "too_few", "unclear"].includes(d.invalidType)) return null
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

function stripLeanTowardForResponse(data: Record<string, string>): Record<string, string> {
  if (data.mode !== "decision") return data
  const { leanToward: _lt, ...rest } = data as Record<string, string> & { leanToward?: string }
  return rest as Record<string, string>
}

async function callDeepSeek(question: string, lang: "zh" | "en") {
  const messages = [
    { role: "system" as const, content: buildSystemPrompt() },
    {
      role: "system" as const,
      content:
        lang === "en"
          ? "uiLang=en. All user-facing strings in JSON (options, reasons, leaning, invalid messages) must be English only, regardless of the user's input language. Include leanToward as exactly option1 or option2."
          : "uiLang=zh。JSON 里所有面向用户的字符串（选项、理由、倾向、invalid 的 message）必须全部是中文，与用户输入语种无关。leanToward 必须是 option1 或 option2 之一。",
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

        return stripLeanTowardForResponse(enrichCatTone(sanitized, lang, question))
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
          "The user gave a single-direction dilemma. Convert it into a valid binary decision.",
          "Return strict JSON only:",
          `{ "mode":"decision","option1":"...","option2":"...","reasonA":"...","reasonB":"...","leaning":"..." }`,
          "Tone: gentle, slightly playful cat persona, not preachy.",
          "Keep response in English.",
        ].join("\n")
      : [
          "你是一只聪明的小猫顾问。",
          "用户只给了一个方向，请把它自然扩展成一个可执行的二选一（如做/不做、去/不去、继续/暂停）。",
          "只返回严格 JSON：",
          `{ "mode":"decision","option1":"...","option2":"...","reasonA":"...","reasonB":"...","leaning":"..." }`,
          "语气：温和、有点猫感、略活泼但不说教。",
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
      reasonA: "If you do it now, you'll stop overthinking and get immediate clarity.",
      reasonB: "If you wait, you'll protect your energy and leave room to reassess calmly.",
      leaning: "If Decison Cat has to tap one side with a paw, Decison Cat slightly leans to doing it now—just one small step first.",
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
              ? "Tell Decison Cat what you're struggling with first."
              : "先告诉小猫你在纠结什么吧。",
        },
        { status: 400 }
      )
    }
    if (!DEEPSEEK_API_KEY) {
      return Response.json(
        {
          mode: "error",
          message:
            uiLang === "en"
              ? "Decison Cat got distracted—please try again."
              : "小猫刚刚走神了，再试一次吧。",
        },
        { status: 500 }
      )
    }

    const data = await callDeepSeek(question, uiLang)
    if (data.mode === "invalid" && data.invalidType === "too_few") {
      const coerced = await coerceTooFewToDecision(question, uiLang)
      const sanitized = sanitizeDecisionPlaceholders(coerced, uiLang)
      return Response.json(stripLeanTowardForResponse(enrichCatTone(sanitized, uiLang, question)))
    }
    return Response.json(data)
  } catch (e) {
    console.error("[api/decide] failed:", e)
    return Response.json(
      {
        mode: "error",
        message:
          uiLang === "en"
            ? "Decison Cat got distracted—please try again."
            : "小猫刚刚走神了，再试一次吧。",
      },
      { status: 500 }
    )
  }
}

