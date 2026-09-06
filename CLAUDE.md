# CLAUDE.md

丝路新“声”——面向马来西亚游客的西安三大景点（兵马俑/回民街/大雁塔）AI 语音导览系统，前后端分离（`server` Express+TS + `client` React+TS+Vite PWA）。

完整章程与决策记录见 **`PROJECT_CHARTER.md`**（最高决策依据，分歧时以它为准）。

## 快速开始
- 一键启动：双击 `start.bat`（自动装依赖+构建，单端口 `:3001`，后端同时托管前端 + API，打印局域网 IP）。
- 开发模式：根目录 `npm run dev`（concurrently 起 server:3001 + client:5173，Vite 代理 /api /audio /uploads）。

## 必须遵守
1. **三语同步**：任何新文案 zh-CN / ms-MY / en-US 三语齐全。景点内容改 `server/src/data/seed.json`，UI 文案改 `client/src/i18n/messages.json`。
2. **术语一致**：沿用 `PROJECT_CHARTER.md` 术语表（如 设置=Tetapan=Settings），不新造译法。
3. **改了中文文案 → 重跑翻译**：`cd server && node scripts/translate-content.mjs`（DeepSeek 翻译马来语并写回，key 在 `server/.env`）。
4. **密钥放 `server/.env`**，勿提交、勿硬编码。
5. **验证**：`cd server && npm run build`（tsc）与 `cd client && npm run build`（tsc+vite）均须通过。
