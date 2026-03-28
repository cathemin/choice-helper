"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CatFace, SketchQuestionMark, FishTreat, CatWand } from "@/components/cat-icon"
import { SketchCard } from "@/components/sketch-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

export default function DecidePage() {
  const [text, setText] = useState("")
  const [results, setResults] = useState<Array<{ title: string; content: string }>>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [showClarifyCta, setShowClarifyCta] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q") ?? ""
    if (query) setText((prev) => prev || query)
  }, [])

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setResults([])
      setShowClarifyCta(false)
      setStatusMessage(t("先告诉小猫你在纠结什么吧。", "Tell Decison Cat what you're stuck on first, meow!"))
      return
    }

    setIsAnalyzing(true)
    setStatusMessage("")

    try {
      const resp = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim(), uiLang: language }),
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()

      if (!data || typeof data.mode !== "string") throw new Error("Invalid response shape")

      if (data.mode === "decision") {
        if (
          typeof data.option1 !== "string" ||
          typeof data.option2 !== "string" ||
          typeof data.reasonA !== "string" ||
          typeof data.reasonB !== "string" ||
          typeof data.leaning !== "string"
        ) {
          throw new Error("Invalid decision payload")
        }

        const safeOption1Title = data.option1.replace(/option\s*[12]/gi, "").trim() || (language === "zh" ? "选项A" : "Option A")
        const safeOption2Title = data.option2.replace(/option\s*[12]/gi, "").trim() || (language === "zh" ? "选项B" : "Option B")

        const safeContent = (s: string, which: "a" | "b") => {
          let out = s
          if (which === "a") out = out.replace(/option\s*1/gi, safeOption1Title).replace(/option\s*2/gi, safeOption2Title)
          if (which === "b") out = out.replace(/option\s*1/gi, safeOption1Title).replace(/option\s*2/gi, safeOption2Title)
          out = out.replace(/option\s*[12]/gi, "").replace(/\s{2,}/g, " ").trim()
          return out || (language === "zh" ? "小猫再认真想想…喵！" : "Meow! One more gentle thought from the cat!")
        }

        const safeLeaning = (s: string) => {
          let out = s
          out = out.replace(/option\s*1/gi, safeOption1Title).replace(/option\s*2/gi, safeOption2Title)
          out = out.replace(/option\s*[12]/gi, "").replace(/\s{2,}/g, " ").trim()
          return out || (language === "zh" ? "喵——小猫稍微偏向更合适的那边。" : "Meow! Decison Cat slightly leans toward what fits better!")
        }

        setResults(
          language === "zh"
            ? [
                {
                  title: safeOption1Title,
                  content: safeContent(data.reasonA, "a"),
                },
                {
                  title: safeOption2Title,
                  content: safeContent(data.reasonB, "b"),
                },
                {
                  title: "小猫的倾向",
                  content: safeLeaning(data.leaning),
                },
              ]
            : [
                {
                  title: safeOption1Title,
                  content: safeContent(data.reasonA, "a"),
                },
                {
                  title: safeOption2Title,
                  content: safeContent(data.reasonB, "b"),
                },
                {
                  title: "Cat's Preference",
                  content: safeLeaning(data.leaning),
                },
              ]
        )
        setStatusMessage("")
        setShowClarifyCta(false)
      } else {
        setResults([])
        const invalidType = typeof data.invalidType === "string" ? data.invalidType : ""
        setShowClarifyCta(invalidType === "too_many" || invalidType === "unclear")
        setStatusMessage(
          typeof data.message === "string" && data.message
            ? data.message
            : t("小猫刚刚走神了，再试一次吧。", "The cat got distracted! Please try again, meow!")
        )
      }
    } catch {
      setResults([])
      setShowClarifyCta(false)
      setStatusMessage(t("小猫刚刚走神了，再试一次吧。", "The cat got distracted for a second! Please try again, meow!"))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-200px)] bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 relative">
          <SketchQuestionMark className="absolute -left-12 top-8 w-10 h-20 text-muted-foreground hidden md:block" />
          <SketchQuestionMark className="absolute -right-12 top-8 w-10 h-20 text-muted-foreground hidden md:block" />

          <div className="flex justify-center mb-4">
            <CatFace className="w-20 h-20 text-foreground" />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance"
            style={{ fontFamily: titleFont }}
          >
            {t("让小猫帮你决定", "Let the Cat Decide")}
          </h1>
          <p
            className="text-muted-foreground mt-4 text-lg"
            style={{ fontFamily: bodyFont ?? titleFont }}
          >
            {t(
              "把你的纠结告诉小猫，它会帮你做出选择。",
              "Tell Decison Cat your dilemma! It'll help you pick a paw-print to land on."
            )}
          </p>
        </header>

        {/* Textarea with solid border */}
        <div className="relative mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(
              "写下你的纠结，比如：我要选A还是选B？",
              "Write your dilemma, e.g.: Should I choose A or B?"
            )}
            aria-label={t("输入你的纠结", "Enter your dilemma")}
            className="min-h-[160px] border-2 border-foreground bg-card text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0_0_var(--foreground)] transition-shadow resize-none text-base p-6"
            style={{ fontFamily: bodyFont }}
          />
        </div>

        {/* Button */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              className="bg-foreground text-background border-2 border-foreground px-8 py-6 text-lg font-bold hover:bg-background hover:text-foreground transition-all hover:shadow-[4px_4px_0_0_var(--foreground)] disabled:opacity-50"
              style={{ fontFamily: titleFont }}
            >
              {isAnalyzing
                ? t("小猫正在想…", "Cat is thinking...")
                : t("让小猫看看", "Let Cat See")}
            </Button>
            {/* Decorations beside button */}
            <FishTreat className="absolute -left-20 top-1/2 -translate-y-1/2 w-14 h-7 text-muted-foreground hidden sm:block" />
            <CatWand className="absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-9 text-muted-foreground hidden sm:block" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground min-h-6" style={{ fontFamily: bodyFont }}>{statusMessage}</p>
        {showClarifyCta && (
          <div className="mt-3 flex justify-center">
            <Link href={`/clarify?q=${encodeURIComponent(text.trim())}`}>
              <Button
                variant="outline"
                className="bg-background text-foreground border-2 border-foreground px-4 py-2 text-sm font-bold hover:bg-foreground hover:text-background transition-all hover:shadow-[4px_4px_0_0_var(--foreground)]"
                style={{ fontFamily: titleFont }}
              >
                {t("选项有点乱？先让小猫帮你理清", "Too tangled? Let Decison Cat sort it out first, meow!")}
              </Button>
            </Link>
          </div>
        )}

        {/* Result Cards */}
        {results.length > 0 && (
          <div className="mt-16 space-y-6">
            {/* A and B reasons side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SketchCard
                title={results[0].title}
                content={results[0].content}
                rotation="-1"
              />
              <SketchCard
                title={results[1].title}
                content={results[1].content}
                rotation="0.5"
              />
            </div>
            {/* Cat's preference below */}
            <SketchCard
              title={results[2].title}
              content={results[2].content}
              rotation="-0.5"
              emphasize
            />
          </div>
        )}
      </div>
    </main>
  )
}
