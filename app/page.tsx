"use client"

import Link from "next/link"
import { CatFace, SketchQuestionMark, FishTreat, CatChasingButterfly } from "@/components/cat-icon"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export default function HomePage() {
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  return (
    <main className="min-h-[calc(100vh-200px)] bg-background">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center relative">
          <SketchQuestionMark className="absolute -left-16 top-0 w-12 h-24 text-muted-foreground hidden lg:block" />
          <SketchQuestionMark className="absolute -right-16 top-0 w-12 h-24 text-muted-foreground hidden lg:block" />
          
          <div className="flex justify-center mb-6">
            <CatFace className="w-24 h-24 text-foreground" />
          </div>
          
          <h1 
            className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-balance"
            style={{ fontFamily: titleFont }}
          >
            {t("让小猫帮你决定", "Let the Cat Decide")}
          </h1>
          
          <p 
            className="text-lg text-muted-foreground mb-12 max-w-md mx-auto"
            style={{ fontFamily: bodyFont ?? titleFont }}
          >
            {t(
              "人，纠结一定让你很苦恼吧，小猫来帮你啦！",
              "Hey human, being tangled up is exhausting, right? Decison Cat is here to help, meow!"
            )}
          </p>
          
          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/decide">
              <Button 
                className="bg-foreground text-background border-2 border-foreground px-8 py-6 text-lg font-bold hover:bg-background hover:text-foreground transition-all hover:shadow-[4px_4px_0_0_var(--foreground)] w-48"
                style={{ fontFamily: titleFont }}
              >
                {t("现在开始", "Start Now")}
              </Button>
            </Link>
            <Link href="/clarify">
              <Button 
                variant="outline"
                className="bg-background text-foreground border-2 border-foreground px-8 py-6 text-lg font-bold hover:bg-foreground hover:text-background transition-all hover:shadow-[4px_4px_0_0_var(--foreground)] w-48"
                style={{ fontFamily: titleFont }}
              >
                {t("先帮我理清思路", "Help Me Clarify")}
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center mt-4">
            <CatChasingButterfly className="w-48 h-16 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="px-4 py-16 border-t-2 border-foreground">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-2xl font-bold text-center mb-12"
            style={{ fontFamily: titleFont }}
          >
            {t("小猫可以帮你做什么", "What Can the Cat Do?")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Decide */}
            <Link href="/decide" className="group">
              <div className="border-2 border-foreground p-6 bg-card h-full transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--foreground)]">
                <div className="flex justify-center mb-4">
                  <SketchQuestionMark className="w-12 h-24 text-foreground" />
                </div>
                <h3 
                  className="text-xl font-bold mb-2 text-center"
                  style={{ fontFamily: titleFont }}
                >
                  {t("帮你决定", "Help You Decide")}
                </h3>
                <p className="text-sm text-muted-foreground text-center" style={{ fontFamily: bodyFont }}>
                  {t(
                    "在两个选项之间犹豫不决？小猫会给你小猫自己的看法。",
                    "Stuck between two options? Decision Cat will give you its own perspective."
                  )}
                </p>
              </div>
            </Link>

            {/* Card 2: Clarify */}
            <Link href="/clarify" className="group">
              <div className="border-2 border-foreground p-6 bg-card h-full transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--foreground)]">
                <div className="flex justify-center mb-4">
                  <FishTreat className="w-16 h-16 text-foreground" />
                </div>
                <h3 
                  className="text-xl font-bold mb-2 text-center"
                  style={{ fontFamily: titleFont }}
                >
                  {t("帮你理清", "Help You Clarify")}
                </h3>
                <p className="text-sm text-muted-foreground text-center" style={{ fontFamily: bodyFont }}>
                  {t(
                    "一团纠结？小猫帮你整理成两个清晰的方向。",
                    "A tangled mess? Decison Cat helps sort it into two clear paths."
                  )}
                </p>
              </div>
            </Link>

            {/* Card 3: About */}
            <Link href="/about" className="group">
              <div className="border-2 border-foreground p-6 bg-card h-full transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--foreground)]">
                <div className="flex justify-center mb-4">
                  <CatFace className="w-16 h-16 text-foreground" />
                </div>
                <h3 
                  className="text-xl font-bold mb-2 text-center"
                  style={{ fontFamily: titleFont }}
                >
                  {t("关于这只小猫", "About This Cat")}
                </h3>
                <p className="text-sm text-muted-foreground text-center" style={{ fontFamily: bodyFont }}>
                  {t(
                    "了解小猫的理念：小猫不会强势地替你做决定，毕竟，人，你比小猫聪明嘛。",
                    "Learn the cat's philosophy: it won't decide for you, after all, you're smarter than catss."
                  )}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
