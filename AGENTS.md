# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 智慧微项目边界

- 智慧微是独立客服 IM 项目，不得复用、覆盖或切换柏木 V2 的生产配置、数据库、域名和服务。
- 视觉真源是 `C:\Users\zhuan\Desktop\自己的视频\屏幕录制 2026-08-21 111005.mp4` 中的“微聊”客服后台。
- 腾讯云即时通信 IM 仅供智慧微使用；SDKAppID 可以进入非敏感配置，SecretKey 只能保存在服务端安全配置中。
- 正式连接前必须保留安全演示模式，不得把演示数据或静态界面称为真实 IM 已接入。
- 核心工作流必须可用：会话筛选、消息收发、客户档案、拉黑、附件、AI 建议、定时发送和导出。
