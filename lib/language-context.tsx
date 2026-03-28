"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Language = "zh" | "en"

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: (zh: string, en: string) => string
  isHydrated: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("language")
      if (saved === "zh" || saved === "en") {
        setLanguage(saved)
      }
    } catch {
      // 某些浏览器隐私模式/受限环境可能禁用 localStorage，忽略后继续使用默认语言
    } finally {
      // 无论是否能访问 localStorage，都要完成 hydration，避免文案一直锁在中文
      setIsHydrated(true)
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = language === "zh" ? "en" : "zh"
    // 即便 hydration 状态异常，也确保人点击后可以立即切换文案
    setIsHydrated(true)
    setLanguage(newLang)
    try {
      localStorage.setItem("language", newLang)
    } catch {
      // 无存储权限时不阻断切换，仅失去持久化能力
    }
  }

  // 优先尊重当前 language，避免在极端情况下被锁在中文
  const t = (zh: string, en: string) => {
    return language === "zh" ? zh : en
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isHydrated }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
