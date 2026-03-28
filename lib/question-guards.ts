/**
 * 无实质信息的二选一占位（仅字母/代号/符号等），不应调用模型胡编理由。
 */
export function isTrivialPlaceholderQuestion(raw: string): boolean {
  const t = raw.trim()
  if (!t) return true

  const compact = t.replace(/\s+/g, "")
  if (!compact) return true

  if (/^[0-9\s.,!?;:，。！？；、'"''""（）()\[\]{}<>《》｜|/\\+=\-_*#@$%^&`~]+$/.test(compact)) return true

  const hasHan = /[\u4e00-\u9fff]/.test(t)

  const binaryPlaceholder =
    /^[选選]?[ABab一二12甲乙](?:还是|或者|或|与|and|or|vs\.?|\/|、|,)[ABab一二12甲乙][？?！!。.…]*$/i.test(
      compact
    ) || /^[ABab一二12](?:还是|或者|或|与|or|vs\.?|\/)[ABab一二12][？?！!。.]*$/i.test(compact)

  if (binaryPlaceholder) return true

  const lettersOnly = compact.replace(/[^a-zA-Z]/g, "")
  if (!hasHan) {
    if (lettersOnly.length <= 2 && compact.length <= 14) return true
    if (/^[a-z]{1,3}[?!.,]?$/i.test(compact)) return true
  }

  const core = compact
    .replace(/我要|我该|应该|帮我|请问|选择|选|哪个|什么|怎么|如何|吗|呢|吧|啊|呀|么|the|should|choose|pick|between|which|what|please|help/gi, "")
    .replace(/还是|或者|或|与|or|vs\.?/gi, "")
    .replace(/[\s.,!?;:，。！？；、'"''""（）()\[\]{}<>《》｜|/\\+=\-_*#@$%^&`~？?]/g, "")
  if (!hasHan && core.length > 0 && core.length <= 2 && /^[a-z0-9]+$/i.test(core)) return true

  return false
}

/**
 * 脸滚键盘式乱敲、无元音长串、符号乱炖等（不误伤正常短句）。
 */
export function isLikelyKeyboardMashOrGibberish(raw: string): boolean {
  const t = raw.trim()
  if (t.length < 6) return false

  const compact = t.replace(/\s+/g, "")

  if (/^(.)\1{5,}$/.test(compact)) return true

  if (
    /asdfgh|sdfghj|dfghjk|fghjkl|qwerty|wertyu|ertyui|zxcvbn|xcvbnm|qazwsx|wsxedc|hjkl;|vbnm,/i.test(t)
  )
    return true

  const latinLetters = t.replace(/[^a-zA-Z]/g, "")
  if (latinLetters.length >= 10) {
    const vowels = (latinLetters.match(/[aeiouAEIOU]/g) || []).length
    if (vowels / latinLetters.length < 0.11) return true
  }

  const hasHan = /[\u4e00-\u9fff]/.test(t)
  if (!hasHan && compact.length >= 14 && compact.length <= 160) {
    const lower = compact.toLowerCase()
    const uniq = new Set([...lower]).size
    if (uniq / compact.length >= 0.52 && !/\d{5,}/.test(compact)) return true
  }

  const nonWordish = t.replace(/[\s\u4e00-\u9fff.a-zA-Z0-9，。！？、；：'"「」（）]/g, "")
  if (t.length >= 12 && nonWordish.length / t.length >= 0.42) return true

  return false
}

export function gibberishTeaseMessage(lang: "zh" | "en"): string {
  if (lang === "en") {
    const pool = [
      "Wait! Did your face just roll across the keyboard? Decision Cat does paw-drumming too when nap mode wins, meow! Try typing again when you're fully upright!",
      "Hmm, this looks like pure whisker-static! Did a fluffy paw skid across the keys? The cat has totally been there! One more try, nice and human-clear?",
      "Meow? That's a secret cat cipher! …Or maybe a cheek landed on the keys? Little cats sometimes stomp out mystery code too. Breathe, stretch, type again slowly!",
    ]
    return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
  }
  const pool = [
    "等等…是不是刚刚脸滚键盘啦？小猫困的时候也忍不住用肉垫啪嗒啪嗒敲两下喵～清醒一点再写一次好不好？",
    "咦，这串小猫一个字都看不懂…是不是爪子滑过键盘啦？小猫有时也会踩出一行神秘代码喵！再好好说一次呗～",
    "喵？这是小猫才看得懂的暗号吗？…还是脸贴键盘了呀？小猫困急了也会在上面滚一圈的！深呼吸，揉揉脸，再写一次～",
  ]
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
}

function isShortListToken(p: string): boolean {
  const x = p.trim()
  return /^[A-Za-z0-9]{1,2}$/.test(x) || /^[一二三四五六七八九十]$/.test(x)
}

/**
 * 「理清」结果若把多个代号塞进一个选项（如「b或c」），会导致决定页仍判 too_many。
 */
export function clarifyOptionLabelsAreWeak(option1: string, option2: string): boolean {
  for (const o of [option1, option2]) {
    const s = o.trim()
    if (s.length < 2) return true
    if (/^[a-zA-Z0-9]$/.test(s)) return true

    if (/或/.test(s)) {
      const parts = s.split(/或/).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2 && parts.every(isShortListToken)) return true
    }
    if (/\s+or\s+/i.test(s)) {
      const parts = s.split(/\s+or\s+/i).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2 && parts.every((p) => /^[A-Za-z0-9]{1,2}$/.test(p))) return true
    }
    if (/\/[A-Za-z0-9]{1,2}\//.test(s) || /^[A-Za-z0-9]{1,2}\/[A-Za-z0-9]{1,2}$/.test(s)) return true
  }
  return false
}
