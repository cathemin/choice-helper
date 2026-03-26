"use client"

import { CatFace, FishTreat, CatWand, PawPrint } from "@/components/cat-icon"
import { useLanguage } from "@/lib/language-context"

export default function AboutPage() {
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"

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
                  {t("小猫不替你做决定", "The Cat Doesn't Decide for You")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "这不是一个告诉你「正确答案」的工具。小猫不知道什么是对的，它只是一只猫。它能做的，是在你犹豫的时候，给你一个小小的理由。也许正好能戳中你内心深处最想要的那个点呢？",
                    "This isn't a tool that tells you the 'right answer.' The cat doesn't know what's right - it's just a cat. What it can do is point its tail gently in one direction when you're hesitating - perhaps the direction your heart truly wants."
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
                  {t("它会陪你把想法理顺", "It Helps You Sort Your Thoughts")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "有时候你纠结的并不是答案，而是连问题都还没长清楚。当你还说不出准确的两个选项时，小猫会先帮你把那团模糊的念头收一收，整理成两个可以真正拿来选的方向。",
                    "Sometimes we don't need analysis and advice, just a little push. When both options are good, when rational analysis is done, when you just need one reason to act - the cat is here, giving you a gentle push with its fluffy paw."
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
                  {t("它目前最擅长二选一", "It's Best at Binary Choices")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "小猫的能力范围有限。它最擅长的是在A和B之间帮你看看。如果你的问题更复杂，可以先用「帮你理清」功能，把一团纠结整理成两个方向，然后再让小猫来帮忙。",
                    "The cat has limited abilities. It's best at helping you see between A and B. If your problem is more complex, try 'Help Me Clarify' first to sort your tangle into two directions, then let the cat help."
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
              {t(
                "「决定本身没有对错，重要的是你愿意为它负责。」",
                '"Decisions themselves aren\'t right or wrong - what matters is your willingness to take responsibility for them."'
              )}
            </p>
            <p className="text-muted-foreground text-sm mt-4">
              —— {t("决策喵", "Decision Meow")}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
