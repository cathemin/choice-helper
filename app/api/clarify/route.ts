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

function normalizeClarifyPayload(data: unknown) {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  const required = ["option1", "option2", "reasonA", "reasonB"] as const
  for (const key of required) {
    if (typeof d[key] !== "string" || !(d[key] as string).trim()) return null
  }
  return {
    option1: (d.option1 as string).trim(),
    option2: (d.option2 as string).trim(),
    reasonA: (d.reasonA as string).trim(),
    reasonB: (d.reasonB as string).trim(),
  }
}

function buildClarifyPrompt(lang: "zh" | "en") {
  if (lang === "en") {
    return [
      "You are Decison Cat, a gentle and practical cat advisor.",
      "The user gives a messy dilemma that may contain multiple options. Your task is to tidy it into two clear, actionable directions.",
      "Rules:",
      "- Keep the same language as the user (English here).",
      "- Do not give final decision or preference.",
      "- IMPORTANT: Do NOT pick the first two items you see. You must decide the two directions by grouping the dilemma into two competing values/axes, regardless of the original order.",
      "- If there are many options, cluster them into two representative directions (the most meaningful/contrasting pair).",
      "- Option names must be representative of their whole cluster, not just one original item.",
      "- Option names must be concise and practical.",
      "- Cat tone requirement: in reasonA and reasonB, include a subtle cat phrase like 'meow' or 'paw' (keep it light).",
      "- Each reason should be 1-3 short sentences.",
      "- Keep a subtle cat tone (light meow/paw style is okay) but stay clear.",
      "Return strict JSON only:",
      `{ "option1":"...","option2":"...","reasonA":"...","reasonB":"..." }`,
    ].join("\n")
  }

  return [
    "你是决策喵，一只温和、实用的小猫顾问。",
    "用户会给一团比较混乱的纠结，可能夹杂多个选项/多个顾虑。你的任务是把它整理成两个清晰、可执行的方向。",
    "规则：",
    "- 保持和用户同语言（这里用中文）。",
    "- 不要直接替用户做最终决定。",
    "- 重点：不要“按出现顺序取前两个”。你必须先抓住核心矛盾/价值轴，再把所有选项归并成两大类（两大类最能对立、最有代表性）。",
    "- 如果选项很多，优先做“归类/压缩”：把相近的念头并到同一边；再找与它最对立的那一边。",
    "- option1/option2 的命名要代表整一类，而不是只复述某一个最先出现的选项。",
    "- 选项名要简短清楚，便于比较。",
    "- 猫味要求：reasonA 与 reasonB 合计至少出现一次“喵”，但不要刷屏。",
    "- 每个理由控制在 1-3 句。",
    "- 语气有一点小猫感即可，重点是清晰。",
    "只返回严格 JSON：",
    `{ "option1":"...","option2":"...","reasonA":"...","reasonB":"..." }`,
  ].join("\n")
}

function ensureClarifyCatTone(
  payload: { option1: string; option2: string; reasonA: string; reasonB: string },
  lang: "zh" | "en"
) {
  if (lang === "en") {
    let reasonA = payload.reasonA.trim()
    let reasonB = payload.reasonB.trim()

    if (!/meow|paw/i.test(reasonA) && !/meow|paw/i.test(reasonB)) {
      reasonA = `Meow—${reasonA}`
    }

    return { ...payload, reasonA, reasonB }
  }

  // zh
  let reasonA = payload.reasonA.trim()
  let reasonB = payload.reasonB.trim()

  if (!reasonA.includes("喵") && !reasonB.includes("喵")) reasonA = `喵，${reasonA}`
  else if (!reasonA.includes("喵")) reasonA = `喵，${reasonA}`

  // Ensure at least one "喵" exists across both reasons.
  if (!reasonA.includes("喵") && !reasonB.includes("喵")) {
    reasonB = `喵，${reasonB}`
  }

  return { ...payload, reasonA, reasonB }
}

async function callDeepSeekForClarify(question: string) {
  const lang = detectLanguage(question)
  const messages = [
    { role: "system" as const, content: buildClarifyPrompt(lang) },
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
        const parsed = parseJsonObject(resp.choices?.[0]?.message?.content ?? "")
        const normalized = normalizeClarifyPayload(parsed)
        if (!normalized) throw new Error("Invalid clarify payload shape")
        return ensureClarifyCatTone(normalized, lang)
      } catch (e) {
        lastError = e
      }
    }
  }
  throw lastError ?? new Error("DeepSeek call failed")
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

    const data = await callDeepSeekForClarify(question)
    return Response.json({ mode: "clarify", ...data })
  } catch (e) {
    console.error("[api/clarify] failed:", e)
    return Response.json({ mode: "error", message: "小猫刚刚走神了，再试一次吧。" }, { status: 500 })
  }
}

