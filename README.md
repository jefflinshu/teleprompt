# TelePrompt

Free online teleprompter with real-time voice tracking. Auto-scroll follows your pace, highlights text as you read.

免费的在线提词器，支持实时语音跟踪。自动滚动跟随你的语速，朗读时高亮显示文字。

## Features

- **Voice Tracking** — Auto-scroll follows your speaking pace using speech recognition
- **Auto Scroll** — Constant speed scrolling with optional voice highlighting
- **Mirror Mode** — Flip text horizontally for hardware teleprompters
- **Multi-Language** — Auto-detects browser language (English / 中文)
- **Script Templates** — Pre-built templates for product launches, news, keynotes, vlogs, tech reviews, and courses
- **Customizable** — Font size, scroll speed, line height, colors
- **File Upload** — Import .txt files directly

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) — Unstyled, accessible components
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [Lucide React](https://lucide.dev/) — Icons

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome for the best speech recognition experience.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Browser Support

Speech recognition requires a Chromium-based browser (Chrome, Edge, Opera). Other features work in all modern browsers.

## License

MIT
