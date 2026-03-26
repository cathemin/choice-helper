"use client"

import { useMemo, useState } from "react"
import { CatFace, FishTreat, CatWand, PawPrint } from "@/components/cat-icon"
import { useLanguage } from "@/lib/language-context"

export default function AboutPage() {
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"
  const quotePool = useMemo(
    () => [
      {
        zh: "「决定本身没有对错，重要的是你愿意为它负责。」",
        en: '"A decision itself is not right or wrong. What matters is that you are willing to own it."',
      },
      {
        zh: "「人，别急着完美，先迈一小步就很厉害了喵。」",
        en: '"Human, don\'t chase perfect yet. One tiny step is already brave, meow."',
      },
      {
        zh: "「如果你还在犹豫，就先选那个让你眼睛亮一下的方向。」",
        en: '"If you are still hesitating, pick the direction that makes your eyes light up first."',
      },
      {
        zh: "「小猫不替你拍板，只陪你把心里的结慢慢解开。」",
        en: '"Decison Cat won\'t decide for you. It just stays close while your thoughts untangle."',
      },
      {
        zh: "「做决定像晒太阳，不用冲刺，找到舒服的位置就好喵。」",
        en: '"Making decisions is like sunbathing: no sprint needed, just find your warm spot, meow."',
      },
      {
        zh: "「你不是没主见，你只是很认真。认真本身就很可爱！」",
        en: '"You are not indecisive, you are careful. Care is adorable!"',
      },
    ],
    []
  )
  const [quoteIndex] = useState(() =>
    quotePool.length > 0 ? Math.floor(Math.random() * quotePool.length) : 0
  )

  return (
    <main className="min-h-[calc(100vh-200px)] bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <CatFace className="w-24 h-24 text-foreground" />
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance"
            style={{ fontFamily: titleFont }}
          >
            {t("关于这只小猫", "About This Cat")}
          </h1>
          <div className="flex justify-center items-center gap-4 text-muted-foreground">
            <FishTreat className="w-10 h-5" />
            <span>~</span>
            <CatWand className="w-10 h-7" />
          </div>
        </header>

        {/* Content */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section className="border-2 border-foreground p-8">
            <div className="flex items-start gap-4">
              <PawPrint className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h2 
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: titleFont }}
                >
                  {t("小猫不替你做决定", "Decison Cat Won't Decide for You")}
                </h2>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: bodyFont }}>
                  {t(
                    "这不是一个告诉你「正确答案」的工具。小猫不知道什么是对的，它只是一只猫。它能做的，是在你犹豫的时候，给你一个小小的理由。也许正好能戳中你内心深处最想要的那个点呢？",
                    "This isn't a tool that spits out the 'correct answer.' Decison Cat doesn't pretend to know what's absolutely right—it's just a cat, meow. What it can do is offer one tiny reason when you're stuck. Maybe that little reason lands exactly where your heart was already leaning."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="border-2 border-foreground p-8">
            <div className="flex items-start gap-4">
              <PawPrint className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h2 
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: titleFont }}
                >
                  {t("它会陪你把想法理顺", "Decison Cat Stays With You and Untangles Your Thoughts")}
                </h2>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: bodyFont }}>
                  {t(
                    "有时候你纠结的并不是答案，而是连问题都还没长清楚。当你还说不出准确的两个选项时，小猫会先帮你把那团模糊的念头收一收，整理成两个可以真正拿来选的方向。",
                    "Sometimes the real issue isn't the answer—it's that the question itself is still fuzzy. If you can't name two clear options yet, Decison Cat helps gather those messy thoughts first and lay them out as two paths you can actually choose between. A tidy little meow-style cleanup."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="border-2 border-foreground p-8">
            <div className="flex items-start gap-4">
              <PawPrint className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h2 
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: titleFont }}
                >
                  {t("它目前最擅长二选一", "Right Now, Decison Cat Is Best at Two-Option Choices")}
                </h2>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: bodyFont }}>
                  {t(
                    "小猫的能力范围有限。它最擅长的是在A和B之间帮你看看。如果你的问题更复杂，可以先用「帮你理清」功能，把一团纠结整理成两个方向，然后再让小猫来帮忙。",
                    "Decison Cat has limited abilities. It's best at helping you see between A and B. If your problem is more complex, try 'Help Me Clarify' first to sort your tangle into two directions, then let Decison Cat help."
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Philosophy */}
          <section className="text-center py-8 border-t-2 border-b-2 border-foreground">
            <p 
              className="text-lg text-foreground italic"
              style={{ fontFamily: titleFont }}
            >
              {language === "zh" ? quotePool[quoteIndex].zh : quotePool[quoteIndex].en}
            </p>
            <p className="text-muted-foreground text-sm mt-4" style={{ fontFamily: bodyFont }}>
              —— {t("决策喵", "Decision Cat")}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
