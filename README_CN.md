# TelePrompt

[English](./README.md) | [中文](./README_CN.md)

免费的在线提词器，支持实时语音跟踪。自动滚动跟随你的语速，朗读时高亮显示文字。

## 功能特点

- **语音跟踪** — 使用语音识别，自动滚动跟随你的语速
- **自动滚动** — 匀速滚动，可选语音高亮
- **镜像模式** — 水平翻转文字，适用于硬件提词器
- **多语言** — 自动检测浏览器语言（English / 中文）
- **文稿模板** — 内置产品发布、新闻播报、主题演讲、Vlog 开场、科技评测、课程讲解等模板
- **自定义设置** — 字体大小、滚动速度、行高、颜色
- **文件上传** — 直接导入 .txt 文件

## 技术栈

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) — 无样式、可访问的组件
- [Zustand](https://zustand-demo.pmnd.rs/) — 状态管理
- [Lucide React](https://lucide.dev/) — 图标

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

在 Chrome 浏览器中打开 [http://localhost:3000](http://localhost:3000) 以获得最佳语音识别体验。

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |

## 浏览器支持

语音识别需要基于 Chromium 的浏览器（Chrome、Edge、Opera）。其他功能在所有现代浏览器中均可使用。

## 许可证

[MIT](./LICENSE)
