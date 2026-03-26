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
    "",
    "判断标准（由你完成，不要让程序用关键词/规则判断）：",
    "1) 如果用户输入中可以明确提取出两个方向，即使不是标准“还是/or/要不要”句式，也可以视为有效二选一。",
    "2) 如果输入包含太多选项，无法自然压缩成两个选项，则返回无效：invalidType=too_many。",
    "3) 如果用户只给了一个动作/方向，但可自然构造成“做/不做（去/不去、继续/暂停）”这种二元选择，则仍然视为有效 decision。",
    "4) 只有在确实无法构造成对立选项时，才返回 invalidType=too_few。",
    "4) 如果表达太模糊，看不出具体在选什么，则返回无效：invalidType=unclear。",
    "",
    "语言要求：",
    "- 必须与用户输入语言保持一致（中文输入返回中文；英文输入返回英文）。",
    "- 不要把英文问题回复成中文，也不要把中文问题回复成英文。",
    "",
    "输出要求：必须严格返回 JSON，不要有任何额外文本。",
    "",
    "当有效二选一时，返回：",
    `{ "mode":"decision","option1":"选项1","option2":"选项2","reasonA":"这一边的理由","reasonB":"另一边的理由","leaning":"小猫的轻微倾向" }`,
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

function enrichCatTone(data: Record<string, string>, lang: "zh" | "en"): Record<string, string> {
  if (data.mode !== "decision") return data

  if (lang === "en") {
    // Keep English natural while adding a subtle cat persona.
    const ensurePurr = (text: string, fallback: string) =>
      /meow|purr|paw/i.test(text) ? text : `${text} ${fallback}`

    return {
      ...data,
      reasonA: ensurePurr(data.reasonA, "Meow, this side feels steadier and easier to start with!"),
      reasonB: ensurePurr(data.reasonB, "Meow—this side looks exciting, though a bit less predictable!"),
      leaning: ensurePurr(data.leaning, "The cat vibe leans here today; calm but lively!"),
    }
  }

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

  reasonA = addMiaoFlavor(reasonA, "喵，小猫闻了闻，")
  leaning = addMiaoFlavor(leaning, "喵！小猫认真看完后，")
  if (!/[!！]$/.test(leaning)) leaning = `${leaning}！`

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

function detectLanguage(question: string): "zh" | "en" {
  const zhCount = (question.match(/[\u4e00-\u9fff]/g) || []).length
  const enCount = (question.match(/[A-Za-z]/g) || []).length
  return enCount > zhCount ? "en" : "zh"
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
    return {
      mode: "decision",
      option1: d.option1 as string,
      option2: d.option2 as string,
      reasonA: d.reasonA as string,
      reasonB: d.reasonB as string,
      leaning: d.leaning as string,
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

async function callDeepSeek(question: string) {
  const lang = detectLanguage(question)
  const messages = [
    { role: "system" as const, content: buildSystemPrompt() },
    {
      role: "system" as const,
      content:
        lang === "en"
          ? "Output must be English. Keep all fields and tones in English."
          : "输出必须使用中文，所有字段内容都使用中文。",
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
        return enrichCatTone(normalized, lang)
      } catch (e) {
        lastError = e
      }
    }
  }
  throw lastError ?? new Error("DeepSeek call failed")
}

async function coerceTooFewToDecision(question: string) {
  const lang = detectLanguage(question)
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
      leaning: "If the cat has to tap one side with a paw, the cat slightly leans to doing it now—just one small step first.",
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
  try {
    const body = await request.json().catch(() => ({}))
    const question = typeof body?.question === "string" ? body.question.trim() : ""

    if (!question) {
      return Response.json({ mode: "error", message: "先告诉小猫你在纠结什么吧。" }, { status: 400 })
    }
    if (!DEEPSEEK_API_KEY) {
      return Response.json({ mode: "error", message: "小猫刚刚走神了，再试一次吧。" }, { status: 500 })
    }

    const data = await callDeepSeek(question)
    if (data.mode === "invalid" && data.invalidType === "too_few") {
      const coerced = await coerceTooFewToDecision(question)
      return Response.json(coerced)
    }
    return Response.json(data)
  } catch (e) {
    console.error("[api/decide] failed:", e)
    return Response.json({ mode: "error", message: "小猫刚刚走神了，再试一次吧。" }, { status: 500 })
  }
}

