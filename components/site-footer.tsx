"use client"

import { CatFace } from "./cat-icon"
import { useLanguage } from "@/lib/language-context"

export function SiteFooter() {
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  return (
    <footer className="border-t-2 border-foreground bg-background mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <CatFace className="w-10 h-10 text-muted-foreground" />
          <p 
            className="text-sm text-muted-foreground max-w-md"
            style={{ fontFamily: bodyFont ?? titleFont }}
          >
            {t(
              "小猫只会给你小猫角度的建议，然后你自己拍板哟",
              "Decison Cat offers a cat-flavored perspective, and then you make the final call, meow."
            )}
          </p>
          <p 
            className="text-xs text-muted-foreground"
            style={{ fontFamily: titleFont }}
          >
            {t("决策喵", "Decision Meow")} · 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
