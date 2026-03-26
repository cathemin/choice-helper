"use client"

import { useState } from "react"
import { CatFace, SketchQuestionMark, FishTreat, CatWand } from "@/components/cat-icon"
import { SketchCard } from "@/components/sketch-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

export default function DecidePage() {
  const [text, setText] = useState("")
  const [results, setResults] = useState<Array<{ title: string; content: string }>>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setResults([])
      setStatusMessage(t("先告诉小猫你在纠结什么吧。", "Tell the cat what you're struggling with first."))
      return
    }

    setIsAnalyzing(true)
    setStatusMessage("")

    try {
      const resp = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim() }),
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

        setResults(
          language === "zh"
            ? [
                { title: data.option1, content: data.reasonA },
                { title: data.option2, content: data.reasonB },
                { title: "小猫的倾向", content: data.leaning },
              ]
            : [
                { title: data.option1, content: data.reasonA },
                { title: data.option2, content: data.reasonB },
                { title: "Cat's Preference", content: data.leaning },
              ]
        )
        setStatusMessage("")
      } else {
        setResults([])
        setStatusMessage(
          typeof data.message === "string" && data.message
            ? data.message
            : t("小猫刚刚走神了，再试一次吧。", "The cat got distracted. Please try again.")
        )
      }
    } catch {
      setResults([])
      setStatusMessage(t("小猫刚刚走神了，再试一次吧。", "The cat got distracted. Please try again."))
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
            style={{ fontFamily: titleFont }}
          >
            {t(
              "把你的纠结告诉小猫，它会帮你做出选择。",
              "Tell the cat your dilemma, and it will help you choose."
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

        <p className="text-center text-sm text-muted-foreground min-h-6">{statusMessage}</p>

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
            />
          </div>
        )}
      </div>
    </main>
  )
}
