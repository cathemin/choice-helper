"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CatFace } from "./cat-icon"
import { useLanguage } from "@/lib/language-context"

const navItems = [
  { href: "/", labelZh: "首页", labelEn: "Home" },
  { href: "/decide", labelZh: "决定", labelEn: "Decide" },
  { href: "/clarify", labelZh: "理清", labelEn: "Clarify" },
  { href: "/about", labelZh: "关于", labelEn: "About" },
]

export function SiteNav() {
  const pathname = usePathname()
  const { language, toggleLanguage, t } = useLanguage()

  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"

  return (
    <nav className="border-b-2 border-foreground bg-background">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <CatFace className="w-8 h-8 text-foreground" />
          <span 
            className="text-lg font-bold text-foreground hidden sm:inline"
            style={{ fontFamily: titleFont }}
          >
            {t("决策喵", "Decision Cat")}
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-4 sm:gap-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-all hover:underline underline-offset-4 ${
                    pathname === item.href 
                      ? "text-foreground underline" 
                      : "text-muted-foreground"
                  }`}
                  style={{ fontFamily: titleFont }}
                >
                  {language === "zh" ? item.labelZh : item.labelEn}
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="text-xs border-2 border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors"
            style={{ fontFamily: titleFont }}
            aria-label={t("切换语言", "Toggle language")}
          >
            {language === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>
    </nav>
  )
}
