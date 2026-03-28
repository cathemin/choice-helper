import OpenAI from "openai"
import {
  clarifyOptionLabelsAreWeak,
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
      "You are Decision Cat, a cozy, slightly silly cat advisor with soft paws and big opinions.",
      "The human gives a messy dilemma that may contain multiple options. Your task is to tidy it into two clear, actionable directions.",
      "Rules:",
      "- Output language is fixed to English (uiLang=en): all option names and reasons must be English even if the human writes in Chinese.",
      "- Do not give final decision or preference.",
      "- IMPORTANT: Do NOT pick the first two items you see. You must decide the two directions by grouping the dilemma into two competing values/axes, regardless of the original order.",
      "- If there are many options, cluster them into two representative directions (the most meaningful/contrasting pair).",
      "- Option names must be representative of their whole cluster, not just one original item.",
      "- Option names must be concise and practical.",
      "- HARD: Each option1 and option2 is exactly ONE umbrella title (a short phrase). Never squeeze two original picks into one field (no 'B or C', no 'b/c', no slash between two letters). Never use a single letter or digit as a title.",
      "- If the human listed A/B/C (or many items), merge them into TWO named camps (e.g. 'Speed first' vs 'Safety first'), not 'A' vs 'B or C'.",
      "- Cat tone: reasonA and reasonB should sound a little whiskery (meow, paw, sunbeam, box are fine). Keep it light and lively!",
      "- Each reason should be 1-3 short sentences. Use exclamation marks where it feels natural! Avoid em dashes (—); use commas, periods, or ! instead.",
      "- Stay clear, warm, and a bit playful, not preachy.",
      "Return strict JSON only:",
      `{ "option1":"...","option2":"...","reasonA":"...","reasonB":"..." }`,
    ].join("\n")
  }

  return [
    "你是决策喵，一只温和、实用的小猫顾问。",
    "人会给一团比较混乱的纠结，可能夹杂多个选项/多个顾虑。你的任务是把它整理成两个清晰、可执行的方向。",
    "规则：",
    "- 输出语言固定为中文（uiLang=zh）：即使人用英文写纠结，option1/option2/reasonA/reasonB 也必须全部是中文。",
    "- 不要直接替人做最终决定。",
    "- 重点：不要“按出现顺序取前两个”。你必须先抓住核心矛盾/价值轴，再把所有选项归并成两大类（两大类最能对立、最有代表性）。",
    "- 如果选项很多，优先做“归类/压缩”：把相近的念头并到同一边；再找与它最对立的那一边。",
    "- option1/option2 的命名要代表整一类，而不是只复述某一个最先出现的选项。",
    "- 硬性：每个选项名只能是**单独一个**标题（约 4～12 字），禁止在**同一字段**里写「B或C」「甲/乙」等把两个原选项摞在一起；禁止用单个字母、单个数字当标题。",
    "- 人列了 A、B、C 多项时，必须归纳为**两大阵营**的意义名称（如「求稳」「追新」），绝不能输出「A」对「B或C」这种结构。",
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
      reasonA = `Meow! ${reasonA}`
    }

    return { ...payload, reasonA, reasonB }
  }

  // zh
  let reasonA = payload.reasonA.trim()
  let reasonB = payload.reasonB.trim()

  if (!reasonA.includes("喵")) reasonA = `喵，${reasonA}`

  return { ...payload, reasonA, reasonB }
}

const CLARIFY_REGEN_ZH =
  "\n\n【硬规则·必须遵守】上一版不合格。每个 option1 / option2 必须是**单独一个**方向标题（约 4～12 字），例如「求稳路线」「体验优先」。" +
  "禁止在**同一字段**内出现「B或C」「甲/乙」等两个代号叠放；禁止用单个字母、单个数字作标题。" +
  "若人列了多项，请归纳为**两大阵营**的**意义名称**，绝不能是「A」对「B或C」。"

const CLARIFY_REGEN_EN =
  "\n\nCRITICAL FIX REQUIRED: Previous JSON was invalid. Each option1 and option2 must be ONE umbrella title (a short meaningful phrase)." +
  " Never put two picks in one field (no 'B or C', no 'b/c'). Never use a single letter or digit as a title." +
  " If the human listed many items, merge them into TWO named camps, never 'A' vs 'B or C'."

async function callDeepSeekForClarify(question: string, lang: "zh" | "en") {
  const reminder =
    lang === "en"
      ? "\n\nReminder: uiLang=en, English only in JSON values. Playful cat voice! Prefer ! over em dashes (—)."
      : "\n\n提醒：uiLang=zh，JSON 里所有文案必须中文。"

  let lastError: unknown = null
  let lastWeakPayload: {
    option1: string
    option2: string
    reasonA: string
    reasonB: string
  } | null = null

  outer: for (let attempt = 0; attempt < 3; attempt++) {
    const systemContent =
      buildClarifyPrompt(lang) + reminder + (attempt > 0 ? (lang === "en" ? CLARIFY_REGEN_EN : CLARIFY_REGEN_ZH) : "")

    const messages = [
      { role: "system" as const, content: systemContent },
      { role: "user" as const, content: question },
    ]

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
          if (clarifyOptionLabelsAreWeak(normalized.option1, normalized.option2)) {
            lastWeakPayload = normalized
            continue outer
          }
          return ensureClarifyCatTone(normalized, lang)
        } catch (e) {
          lastError = e
        }
      }
    }
  }

  if (lastWeakPayload) return ensureClarifyCatTone(lastWeakPayload, lang)
  throw lastError ?? new Error("DeepSeek call failed")
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
      return Response.json(
        {
          mode: "error",
          message:
            uiLang === "en"
              ? "Decision Cat needs a real tangle to sort out, meow! Describe what's on your mind in a sentence or two."
              : "小猫需要一点具体内容才能帮你理清…用一两句话说说你在纠结什么吧！",
        },
        { status: 400 }
      )
    }
    if (isLikelyKeyboardMashOrGibberish(question)) {
      return Response.json({ mode: "error", message: gibberishTeaseMessage(uiLang) }, { status: 400 })
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

    const data = await callDeepSeekForClarify(question, uiLang)
    return Response.json({ mode: "clarify", ...data })
  } catch (e) {
    console.error("[api/clarify] failed:", e)
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

