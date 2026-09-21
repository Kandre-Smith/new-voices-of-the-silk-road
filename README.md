# 丝路新“声” · Silk Road New Voice

面向**马来西亚游客**的西安三大景点（**兵马俑 / 回民街 / 大雁塔**）**AI 语音导览**系统。
支持 **中文 / 马来语 / 英语** 三语切换，前后端分离，Web 与移动端（PWA，可安装到主屏、离线缓存）双端可用。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + React Router |
| 移动端 | PWA（manifest + Service Worker），预留 Capacitor 打包原生 |
| 后端 | Node.js + TypeScript + Express |
| 数据 | JSON 数据源（三景点三语内容），反馈持久化到本地 JSON 文件，可平滑替换 PostgreSQL |
| 语音 | 可插拔 TTS 适配器：默认 edge-tts 预生成；预留 讯飞 / TTSmaker / Azure；浏览器 Web Speech API 兜底 |
| 地图 | 自绘 SVG 地图：导入 OSM 真实地理要素（水系/绿地/城区块/主干道/兵马俑博物馆建筑）+ 手绘城墙/地铁 + 3D 图钉景点标记，免外部 API key、离线可用 |

## 目录结构

```
silk-road-voice/
├── server/                 # 后端
│   ├── src/
│   │   ├── data/seed.json  # 三景点三语内容（单一数据源）
│   │   ├── services/       # 业务逻辑 + TTS 适配器
│   │   ├── repositories/   # 反馈持久化
│   │   ├── routes/         # attractions / feedback / tts
│   │   └── app.ts, index.ts
│   ├── scripts/generate-audio.py   # 预生成三语音频
│   └── public/audio/       # 生成后的 mp3（静态托管）
└── client/                 # 前端
    ├── public/             # manifest / sw.js / icons
    └── src/
        ├── pages/          # 9 个页面
        ├── components/     # 播放器 / 地图 / 布局
        ├── store.tsx       # i18n（三语，文案在 i18n/messages.json）+ 字号
        └── api.ts
```

## 快速开始

```bash
# 1) 安装依赖
cd server && npm install
cd ../client && npm install

# 2) 启动后端（3001）
cd server && npm run dev

# 3) 启动前端（5173）
cd client && npm run dev
# 打开 http://localhost:5173
```

> 也可在项目根目录 `npm install` 后 `npm run dev` 一键启动前后端（concurrently）。

## 一键启动（含局域网手机访问）

双击根目录 **`start.bat`**：自动安装依赖、构建前后端，并单端口启动（`:3001`，后端同时托管前端页面 + API）。

- 电脑访问：`http://localhost:3001`
- **手机访问**：脚本启动时会打印本机局域网 IP，形如 `http://192.168.x.x:3001`；手机与电脑连同一 WiFi 后，在手机浏览器打开即可使用。
- 若手机打不开，请在 Windows 防火墙放行 3001 端口（或以管理员身份运行一次）。

## 公网 PWA（无需安装 Node）

项目提供面向 Gitee Pages 的纯静态构建，景点数据、图片和 102 个三语男女声音频文件会随站点发布：

```bash
cd client
npm run build:pages
```

构建产物位于 `client/dist`。公网版本使用 Hash 路由，兼容 Pages 子目录和页面刷新；景点、讲解、地图、行程提示、语言和字号功能均不依赖后端。反馈在静态版中仅保存在当前浏览器，本地/服务器完整版仍使用 Express 接口集中保存。

## 生成三语语音（可选）

免费默认方案用 edge-tts 预生成三语 mp3，离线可播：

```bash
pip install edge-tts
cd server && python scripts/generate-audio.py
```

生成后音频位于 `server/public/audio/{slug}-{lang}.mp3`。
**若未生成音频**，前端播放器会自动回退到浏览器 Web Speech API 朗读，演示仍可出声。

## 马来语翻译（DeepSeek）

马来语文案通过 DeepSeek 翻译生成，翻译提示词已配置在 `server/scripts/prompt-zh-ms.md`，密钥在 `server/.env`（已 gitignore）。

```bash
# 一键把 seed.json 景点内容 + messages.json UI 文案的中文重新翻译为马来语并写回
cd server && node scripts/translate-content.mjs
```

翻译工具：`server/scripts/translate.mjs`（`translateZhToMs` / `translateMsToZh`，双向、批量）。

## 接入 TTS / 翻译链路（按语言路由）

TTS 采用「中文源 →（翻译）→ 合成」链路，按语言自动路由（缺 key 时回退 edge-tts / 浏览器 Web Speech）：

| 语言 | 链路 | 环境变量 |
|---|---|---|
| 中文 zh-CN | 中文 → 小米 MiMo V2.5 TTS | `MIMO_API_KEY`（`MIMO_BASE_URL` / `MIMO_MODEL`） |
| 马来语 ms-MY | 中文 → DeepSeek（标准大马马来语，禁印尼词汇）→ TTSmaker | `DEEPSEEK_API_KEY` + `TTSMAKER_TOKEN` / `TTSMAKER_VOICE_MS` |
| 英语 en-US | 中文 → DeepSeek（英文）→ 小米 MiMo V2.5 TTS | `DEEPSEEK_API_KEY` + `MIMO_API_KEY` |

- 实现：翻译 `server/src/services/translate.ts`；TTS 适配器 `server/src/services/tts.ts`（`synthesize` 路由 + `synthesizeFromChinese` 全链路）。
- 小米 MiMo 接入参考：`作业二/mimo_tts.py`（OpenAI 兼容 `chat/completions`，`audio.data` 返回 base64）。密钥全部放 `server/.env`。
- 智能问答预留了 LLM 适配器（`config.llm`），接入 OpenAI 兼容接口后可在前端加入“问 AI”入口。

## API

- `GET  /api/attractions?lang=zh-CN|ms-MY|en-US`
- `GET  /api/attractions/:slug?lang=`
- `GET  /api/attractions/:slug/tracks?lang=` —— 返回「主景点 + 子景点」音轨数组（`kind: main|spot`、`spotSlug`）
- `GET  /api/attractions/:slug/tips?lang=`
- `POST /api/feedback`  body `{ text, images:[dataURL], lang }`
- `POST /api/tts`  body `{ text, lang, fromZh? }`（按需合成；`fromZh:true` 时走翻译链路）
- `GET  /api/health`

## 页面（对应需求文档）

首页 → 讲解页（字幕滚动 + 播放器）→ 出行 tips；导览页（地图标记 + 内嵌播放条）；
语言设置 / 设置总页 / 字体调节 / 问题反馈 / 关于我们，含全部跳转链路。

## 移动端

- 手机浏览器打开即为响应式布局；通过浏览器“添加到主屏”安装为 PWA。
- 后续打包原生：`npm i @capacitor/core @capacitor/cli`，`npx cap init` 后 `npx cap add ios/android`。

> 说明：马来语文案由 DeepSeek 按翻译提示词生成，发布前建议再由母语者复核一遍。
