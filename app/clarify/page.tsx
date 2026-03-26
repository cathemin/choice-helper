"use client"

import { useState } from "react"
import Link from "next/link"
import { CatFace, FishTreat, CatWand } from "@/components/cat-icon"
import { SketchCard } from "@/components/sketch-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

export default function ClarifyPage() {
  const [text, setText] = useState("")
  const [results, setResults] = useState<Array<{ title: string; content: string }> | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  const handleClarify = () => {
    if (!text.trim()) return

    setIsAnalyzing(true)

    // Simulate cat clarification
    setTimeout(() => {
      setResults(language === "zh" ? [
        {
          title: "方向 A",
          content: "这一边代表着安全与稳定。你可能更看重确定性，想要在熟悉的环境中继续前进。这是一条清晰的路。"
        },
        {
          title: "方向 B",
          content: "这一边代表着变化与可能。你可能内心有一团火，想要尝试新的东西。这是一条充满未知的路。"
        }
      ] : [
        {
          title: "Direction A",
          content: "This side stands for safety and stability. You may value certainty more, and want to keep moving in familiar surroundings. It's a clearer path."
        },
        {
          title: "Direction B",
          content: "This side stands for change and possibility. You may have a little fire inside and want to try something new. It's a path with more unknowns."
        }
      ])
      setIsAnalyzing(false)
    }, 1000)
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
                ? t("小猫正在整理…", "Decison Cat is sorting it out...")
                : t("帮我理清", "Help Me Clarify")}
            </Button>
            <FishTreat className="absolute -left-20 top-1/2 -translate-y-1/2 w-14 h-7 text-muted-foreground hidden sm:block" />
            <CatWand className="absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-9 text-muted-foreground hidden sm:block" />
          </div>
        </div>

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
                {t("理清了？现在可以让小猫帮你做决定", "Cleared up? Now let Decison Cat help you decide")}
              </p>
              <Link href="/decide">
                <Button
                  variant="outline"
                  className="bg-background text-foreground border-2 border-foreground px-6 py-4 font-bold hover:bg-foreground hover:text-background transition-all hover:shadow-[4px_4px_0_0_var(--foreground)]"
                  style={{ fontFamily: titleFont }}
                >
                  {t("继续让小猫帮你决定", "Continue and Let the Cat Decide")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
