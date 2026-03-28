"use client"

import { CatFace } from "./cat-icon"
import { useLanguage } from "@/lib/language-context"

export function SiteFooter() {
  const { language, t } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  return (
    <footer className="border-t-2 border-foreground bg-background mt-auto shrink-0">
      <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <CatFace className="w-8 h-8 text-muted-foreground shrink-0" />
          <div
            className={
              language === "en"
                ? "w-full max-w-full overflow-x-auto flex justify-center"
                : "max-w-md"
            }
          >
            <p
              className={`text-xs sm:text-sm text-muted-foreground leading-snug text-center ${
                language === "en" ? "whitespace-nowrap px-1" : ""
              }`}
              style={{ fontFamily: bodyFont ?? titleFont }}
            >
              {t(
                "小猫只会给你小猫角度的建议，然后你自己拍板哟",
                "Decision Cat offers a cat-flavored perspective! You still make the final call, meow!"
              )}
            </p>
          </div>
          <p
            className="text-[11px] sm:text-xs text-muted-foreground leading-tight"
            style={{ fontFamily: titleFont }}
          >
            {t("决策喵", "Decision Cat")} · 2026 · {t("Catherine Min", "Created by Catherine Min")}
          </p>
        </div>
      </div>
    </footer>
  )
}
