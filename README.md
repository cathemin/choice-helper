# v0-minimal-cat-ui

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_vtsFsJUBjlTpWdrbQH3FJaoEvjY3)

## 云端运行（不依赖本机 `pnpm dev`）

站点可以部署到 **Vercel**，人只打开线上地址即可；AI 在服务端 API Route 里调用 DeepSeek。

1. 把本仓库推到 GitHub（若 `git push` 失败，多为网络连不上 `github.com:443`，可换热点或配置代理后再推）。
2. 打开 [Vercel](https://vercel.com) → **Add New Project** → Import 该仓库。
3. Framework 选 **Next.js**，Build 用默认 `pnpm install` + `pnpm build`（或 `npm run build`）。
4. 在 **Settings → Environment Variables** 添加：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek API Key（Production / Preview 按需勾选）。
5. 保存后 **Redeploy** 一次。

部署成功后，线上地址即可访问；无需在本地长期开着开发服务器。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/cathemin/v0-minimal-cat-ui" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
