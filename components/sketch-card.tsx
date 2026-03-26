"use client"

import { PawPrint } from "./cat-icon"
import { useLanguage } from "@/lib/language-context"

interface SketchCardProps {
  title: string
  content: string
  rotation?: string
}

export function SketchCard({ title, content, rotation = "0" }: SketchCardProps) {
  const { language } = useLanguage()
  const titleFont = language === "zh" ? "var(--font-title-zh)" : "var(--font-title-en)"
  const bodyFont = language === "zh" ? undefined : "var(--font-body-en)"

  return (
    <div 
      className="relative bg-card p-6 border-2 border-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--foreground)]"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="flex items-start gap-3">
        <PawPrint className="w-6 h-6 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: titleFont }}>{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: bodyFont }}>{content}</p>
        </div>
      </div>
    </div>
  )
}
