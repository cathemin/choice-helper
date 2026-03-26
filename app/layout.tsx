import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { LanguageProvider } from "@/lib/language-context"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "决策喵",
    template: "%s · 决策喵",
  },
  description: "一个黑白极简的小猫决策实验室。小猫不替你拍板，只陪你把思路理清。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === "undefined") return;
                if (!window.crypto) return;
                if (typeof window.crypto.randomUUID === "function") return;
                window.crypto.randomUUID = function () {
                  // RFC4122 v4 fallback for non-secure/dev contexts.
                  const bytes = new Uint8Array(16);
                  window.crypto.getRandomValues(bytes);
                  bytes[6] = (bytes[6] & 0x0f) | 0x40;
                  bytes[8] = (bytes[8] & 0x3f) | 0x80;
                  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
                  return (
                    hex.slice(0, 8) + "-" +
                    hex.slice(8, 12) + "-" +
                    hex.slice(12, 16) + "-" +
                    hex.slice(16, 20) + "-" +
                    hex.slice(20)
                  );
                };
              })();
            `,
          }}
        />
        <LanguageProvider>
          <SiteNav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
