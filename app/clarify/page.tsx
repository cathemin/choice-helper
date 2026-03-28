"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CatFace, FishTreat, CatWand } from "@/components/cat-icon"
import { SketchCard } from "@/components/sketch-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

export default function ClarifyPage() {
  const [text, setText] = useState("")
  const [results, setResults] = useState<Array<{ title: string; content: string }> | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q") ?? ""
    if (query) setText((prev) => prev || query)
  }, [])

  const handleClarify = async () => {
    if (!text.trim()) {
      setResults(null)
      setStatusMessage(t("先告诉小猫你在纠结什么吧。", "Tell Decision Cat what you're stuck on first, meow!"))
      return
    }

    setIsAnalyzing(true)
    setStatusMessage("")

    try {
      const resp = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim(), uiLang: language }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setResults(null)
        setStatusMessage(
          typeof data.message === "string" && data.message
            ? data.message
            : t("小猫刚刚走神了，再试一次吧。", "Decision Cat got distracted! Please try again, meow!")
        )
        return
      }
      if (
        data?.mode !== "clarify" ||
        typeof data.option1 !== "string" ||
        typeof data.option2 !== "string" ||
        typeof data.reasonA !== "string" ||
        typeof data.reasonB !== "string"
      ) {
        throw new Error("Invalid clarify payload")
      }
      setResults([
        { title: data.option1, content: data.reasonA },
        { title: data.option2, content: data.reasonB },
      ])
      setStatusMessage("")
    } catch {
      setResults(null)
      setStatusMessage(t("小猫刚刚走神了，再试一次吧。", "Decision Cat got distracted! Please try again, meow!"))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-200px)] bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 relative">
          <div className="flex justify-center mb-4">
            <CatFace className="w-20 h-20 text-foreground" />
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance"
            style={{ fontFamily: titleFont }}
          >
            {t("让小猫帮你理清", "Let the Cat Clarify")}
          </h1>
          <p
            className="text-muted-foreground mt-4 text-lg"
            style={{ fontFamily: bodyFont ?? titleFont }}
          >
            {t("把一团纠结整理成两个方向", "Sort a tangled mess into two directions")}
          </p>
        </header>

        {/* Textarea */}
        <div className="relative mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(
              "把你的纠结都写下来，不用整理，想到什么写什么...",
              "Write down everything on your mind—no need to organize it first. Just type whatever comes up..."
            )}
            aria-label={t("输入你的纠结", "Enter your dilemma")}
            className="min-h-[180px] border-2 border-foreground bg-card text-foreground placeholder:text-muted-foreground focus:shadow-[4px_4px_0_0_var(--foreground)] transition-shadow resize-none text-base p-6"
            style={{ fontFamily: bodyFont }}
          />
        </div>

        {/* Button */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <Button
              onClick={handleClarify}
              disabled={!text.trim() || isAnalyzing}
              className="bg-foreground text-background border-2 border-foreground px-8 py-6 text-lg font-bold hover:bg-background hover:text-foreground transition-all hover:shadow-[4px_4px_0_0_var(--foreground)] disabled:opacity-50"
              style={{ fontFamily: titleFont }}
            >
              {isAnalyzing
                ? t("小猫正在整理…", "Decision Cat is sorting it out...")
                : t("帮我理清", "Help Me Clarify")}
            </Button>
            <FishTreat className="absolute -left-20 top-1/2 -translate-y-1/2 w-14 h-7 text-muted-foreground hidden sm:block" />
            <CatWand className="absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-9 text-muted-foreground hidden sm:block" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground min-h-6 mb-4" style={{ fontFamily: bodyFont }}>
          {statusMessage}
        </p>

        {/* Result Cards */}
        {results && (
          <div className="mt-16 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SketchCard
                title={results[0].title}
                content={results[0].content}
                rotation="-0.5"
              />
              <SketchCard
                title={results[1].title}
                content={results[1].content}
                rotation="0.5"
              />
            </div>

            {/* Continue to Decide */}
            <div className="text-center pt-8 border-t-2 border-muted">
              <p className="text-muted-foreground mb-4 text-sm" style={{ fontFamily: bodyFont }}>
                {t("理清了？现在可以让小猫帮你做决定", "Cleared up? Now let Decision Cat help you decide!")}
              </p>
              <div className="mt-3">
                <Link
                  href={`/decide?q=${encodeURIComponent(
                    language === "zh"
                      ? `${results[0].title} 还是 ${results[1].title}？`
                      : `${results[0].title} or ${results[1].title}?`
                  )}`}
                >
                  <Button
                    variant="outline"
                    className="bg-background text-foreground border-2 border-foreground px-6 py-4 font-bold hover:bg-foreground hover:text-background transition-all hover:shadow-[4px_4px_0_0_var(--foreground)]"
                    style={{ fontFamily: titleFont }}
                  >
                    {t("直接带着这两个选项去决定", "Decide with these two options now")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
