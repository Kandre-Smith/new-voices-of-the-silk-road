# 丝路新“声” · 项目宪章

> 版本 v1.6 · 2026-09-09 · 适用范围：本项目全部后续开发与功能优化
> 本文是项目的「最高决策依据」——遇到分歧时，以本宪章为准；重大决策变更须更新本文。

---

## 一、项目愿景

面向**马来西亚游客**，为西安三大景点（秦始皇兵马俑、回民街、大雁塔）提供**中文 / 马来语 / 英语**三语的 **AI 语音导览**服务，让语言不再成为游览西安的障碍。

## 二、目标用户与场景

- **用户**：以马来语 / 英语为母语、可能仅略懂中文的马来西亚游客。
- **场景**：行前了解（看景点、看 tips）→ 现场导览（地图定位 + 音频讲解 + 滚动字幕）→ 出行参考（开放时间 / 票价 / 交通 / 参观提示）。

## 三、核心原则（不可协商）

1. **三语平等**：`zh-CN / ms-MY / en-US` 三语始终同步，任何新增文案必须三语齐全，缺一不可上线。
2. **术语一致**：同一功能名词在项目内固定统一译法（见第九节术语表），禁止同一词多译。
3. **前后端分离**：前端 PWA 一套代码双端（Web + 移动端）；后端为纯 REST JSON API，无页面渲染。
4. **离线可用优先**：语音讲解在无网络、无 TTS key 时也必须能出声（预生成音频 + Web Speech API 兜底）。
5. **单一数据源**：景点内容唯一来源 `seed.json`；UI 文案唯一来源 `messages.json`。
6. **密钥不进仓库**：所有 API key 放 `server/.env`（已 gitignore），绝不硬编码进源码。

## 四、已实现功能范围（9 页面）

首页（顶部 3 景点无缝单向轮播 + 景点卡片，真实照片、缺图回退渐变+emoji，轮播文字带渐变蒙版保证清晰）→ 讲解页（讲解点位横滑卡片 → 逐字高亮字幕 → 抖音式播放器）→ 出行 tips；
导览页（自绘 SVG 地图[导入 OSM 真实水系/绿地/城区块/主干道 + 手绘城墙/地铁 + 3D 图钉景点标记 + 缩放拖拽] + 点击两个景点规划通行路线 + 内嵌播放条）；语言设置 / 设置总页 / 字体调节 / 问题反馈（文字+图片）/ 关于我们，含全部跳转链路。
播放器支持女声/男声切换、四档语速（0.75x / 1x / 1.5x / 2x）；语音逐句合成、以每句真实时长做逐字对齐，字幕逐字高亮与进度条一一对应，点击任意字幕行即跳转并同步播放（网易云歌词式）。
讲解页另挂景点级「门票信息」静态展示（仅信息，无选票/下单，统一「票价公示 + 减免政策折叠面板 + 前往官方购票」卡片式格式）：兵马俑「购票预约」与大雁塔「门票信息」均为该格式（大雁塔另有运营时间/容量敬告，按环境跳转官方购票）。

## 五、非目标（明确暂不做）

- 账号 / 登录体系、支付 / 购票、后台 CMS、实时多人协作、AR 导航。
- 原生 App 上架（仅在明确需要时用 Capacitor 打包）。
- 真实地图瓦片（当前为自绘 SVG 地图，见 ADR-007）。

## 六、技术架构与选型

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | React 18 + TypeScript + Vite 5 + React Router 6 + 自定义 CSS | 移动优先响应式 SPA |
| 移动端 | PWA（manifest + Service Worker） | 预留 Capacitor 打包原生 |
| 后端 | Node.js + TypeScript + Express 4 | 纯 REST JSON API |
| 数据 | JSON 仓库（seed.json / feedback.json） | 抽象好可切 PostgreSQL |
| 语音 | 可插拔 TTS + 翻译链路（按语言路由，支持女声/男声 + 四档语速） | 中文/英语→小米 MiMo（冰糖女/白桦男、Mia女/Dean男，语气年轻活泼），马来语→edge-tts（Yasmin女/Osman男），翻译统一 DeepSeek，缺 key 回退 edge-tts，前端 Web Speech 兜底 |
| 翻译 | DeepSeek（OpenAI 兼容接口） | 提示词 + key 管理 |
| 地图 | 自绘 SVG 地图（真实经纬度投影，叠加 OSM 真实地理要素[水系/公园绿地/城区块/主干道/兵马俑博物馆建筑]＋手绘明城墙/地铁线，三大景点用 3D 图钉[照片+专属图标+投影]标记，缩放/拖拽/两点路线规划） | 免外部 API key、完全离线（OSM 数据烘焙为静态 JSON） |

## 七、技术决策记录（ADR）

| 编号 | 决策 | 理由 | 何时重新评估 |
|---|---|---|---|
| ADR-001 | 移动端用 **PWA + Capacitor** 而非 React Native | 一套代码双端，交付快；用户已确认 | 需上架应用商店时 |
| ADR-002 | 后端用 **Express** 而非 NestJS | 轻量、手写可控、Windows 免 CLI 脚手架 | 服务复杂度明显上升时 |
| ADR-003 | 数据用 **JSON 仓库** 而非 SQLite | 避免 Windows 下原生模块编译（node-gyp）风险 | 需并发写入/多实例时切 PostgreSQL |
| ADR-004 | **可插拔 TTS + 按语言路由（女声/男声）**：中文/英语→小米 MiMo V2.5（冰糖女/白桦男、Mia女/Dean男，语气年轻活泼），马来语→edge-tts（Yasmin女/Osman男），翻译统一 DeepSeek，缺 key 回退 edge-tts | 用户指定：中/英用小米免费 TTS 且要年轻自然的女声；马来语改用 edge-tts（免 token、音色稳定，已 `pip install edge-tts`） | 拿到商用 key / 需讯飞·Azure 音色时 |
| ADR-005 | 语音**双轨**：预生成 mp3 + 浏览器 Web Speech 兜底 | 无 key/无网络也能演示出声 | — |
| ADR-006 | 马来语翻译**接 DeepSeek**，提示词落盘 `prompt-zh-ms.md` | 用户指定；质量可控、可复跑 | 换翻译源时 |
| ADR-007 | 地图用**自绘 SVG + 导入 OSM 真实地理要素**（真实经纬度投影；水系/绿地/城区块/主干道/兵马俑博物馆建筑来自 OpenStreetMap 烘焙的静态 JSON，城墙/地铁线手绘，三大景点 3D 图钉标记）而非高德/Leaflet 在线瓦片 | 免 key、完全离线、无需稳定联网；高德/百度/Mapbox 均需申请 key 且无法离线，Leaflet+OSM 在线瓦片需联网且有 GCJ-02 偏移 | 需真实定位/实时导航时换真实瓦片或地图 SDK |
| ADR-008 | UI 文案抽到 **messages.json** | 便于翻译脚本自动写回 | — |
| ADR-009 | **单端口一体化部署**（后端托管 `client/dist` + SPA 回退） | 一键启动、手机一个链接即可用 | 前端独立 CDN 部署时 |
| ADR-010 | **主景点下挂子景点 `spots[]`**，讲解页主+子景点切换、上/下一曲优先遍历当前景点子景点 | 三大景点各含多个讲解点位（兵马俑/回民街/大雁塔），主景点 tips 与子景点音轨解耦 | 子景点内容过多、需二级目录时 |
| ADR-011 | **语音逐句合成 + 真实句时长逐字对齐**：播放器把整段讲解按句分别合成、顺序播放，用每句真实时长做句内逐字高亮 | 整段按字数加权估算的句边界会漂移；逐句合成拿到真实句时长后「字↔进度条」才严格对应；合成期间显示加载态、不误触 Web Speech 兜底 | TTS 提供逐字时间戳时换真时间戳 |
| ADR-012 | **门票信息静态展示 + 自研 Vant 风格弹窗/Toast**：兵马俑/大雁塔门票模块统一为「票价公示 + 减免政策折叠面板」卡片式、仅静态展示票价与政策，不接真实购票后端、下单跳官方渠道；弹窗/Toast 用自研 `Modal.tsx`（Vant4 是 Vue 组件库、React 无法直接使用，故按 Vant 风格手写） | 用户要求「仅信息参考、参照大雁塔格式」；避免引入不兼容/过重的 Vue 组件库 | 需真实购票下单 / 引入 React 原生 UI 库时 |
| ADR-013 | **景点间路线规划用静态三语数据**（前端 `lib/routes.ts`，3 对景点×双向×1–2 方案，`findRoute(from,to)` 精确匹配）而非实时导航 API | 免 key、离线可用；需求是「给通行建议」而非实时导航 | 需实时路况/导航时接高德或地图 SDK |

## 八、数据模型

- `Attraction`：id、slug、order、coords(lat/lng)、emoji、accent（封面主色）、image（封面图路径）、name、intro。
- `AttractionContent`（多语言）：attractionId + language → 名称 / 介绍。
- `Spot`（子景点）：slug、order、emoji、image（点位图路径）、name、transcript、duration（每主景点挂 `spots[]`）。
- `AudioTrack`：attractionId + language + kind（main|spot）+ spotSlug → title、image、intro（简短配文：主=景点 intro，子=讲解首句）、emoji、accent、transcript（字幕行数组）、duration、audioUrl（主：`/audio/{slug}-{lang}.mp3`，子：`/audio/{slug}-{spotSlug}-{lang}.mp3`）。
- 图片约定（真实照片由用户提供，前端 `CoverImage` 缺图回退渐变+emoji）：景点 `client/public/images/attractions/{slug}.{ext}`，子景点 `client/public/images/spots/{slug}.{ext}`；扩展名随文件（`.jpg`/`.webp`/`.jpeg`/`.png`），以 `seed.json` 的 `image` 字段为准。三大景点照片均已就位。
- `TravelTip`：openHours、ticketPrice、suggestedDuration、transport、tips（每景点每语言一份）。
- `Feedback`：id、text（≤1000 字）、images（≤3 张 base64→存 uploads/）、lang、createdAt。
- `RoutePair`（前端 `lib/routes.ts`，三语静态）：from/to（景点 slug）+ options[]（title/meta/steps，交通方式与换乘说明）；导览页按「点击两个景点」精确匹配，给 1–2 条通行建议。

三景点 slug：`terracotta-army`（兵马俑）、`muslim-quarter`（回民街）、`big-wild-goose-pagoda`（大雁塔）。

## 九、目录结构与职责

```
silk-road-voice/
├── start.bat                       # 一键启动（装依赖+装 edge-tts+构建+单端口 :3001，打印局域网 IP）
├── PROJECT_CHARTER.md / README.md
├── server/
│   ├── src/data/seed.json          # 景点内容单一数据源（三语）
│   ├── src/services/               # 业务逻辑 + tts.ts（可插拔 TTS）+ translate.ts（DeepSeek 翻译）
│   ├── src/repositories/           # feedback 持久化
│   ├── src/routes/                 # attractions / feedback / tts
│   ├── scripts/generate-audio.py   # 预生成三语音频（edge-tts）
│   ├── scripts/translate.mjs       # DeepSeek 翻译工具（双向）
│   ├── scripts/translate-content.mjs  # 一键重译并写回
│   ├── scripts/prompt-zh-ms.md     # 马来语翻译提示词
│   └── .env                        # DEEPSEEK_API_KEY 等（勿提交）
└── client/
    ├── src/i18n/messages.json      # UI 文案单一数据源（三语）
    ├── src/lib/timing.ts           # 逐句 + 逐字时间轴（按字/词加权）
    ├── src/lib/tickets.ts          # 兵马俑票种/票价静态数据
    ├── src/lib/pagodaTicket.ts     # 大雁塔门票渠道配置（占位待填）
    ├── src/lib/routes.ts           # 景点间通行路线建议（三语静态数据，导览页路线规划用）
    ├── src/lib/mapFeatures.ts/.json # 西安真实地理要素（OSM 烘焙，导览页底图，© OSM ODbL）
    ├── src/store.tsx               # i18n + 字号 上下文
    ├── src/components/             # Screen / BottomNav / AudioPlayer / MapCanvas / CoverImage / Modal / Ticketing / PagodaTicket / TicketEntry
    └── src/pages/                  # 9 个页面
```

## 十、开发约定

### 术语表（固定译法，禁止改动）
| 中文 | 马来语 | 英语 |
|---|---|---|
| 设置 | Tetapan | Settings |
| 返回 | Kembali | Back |
| 提交 | Hantar | Submit |
| 播放 / 暂停 | Main / Jeda | Play / Pause |
| 上一曲 / 下一曲 | Sebelumnya / Seterusnya | Previous / Next |
| 景区 | Kawasan Pelancongan | Attractions |
| 讲解 | Penerangan | Audio |
| 主景点 | Tarikan Utama | Main Spot |
| 导览 | Panduan | Guide |
| 出行小贴士 | Tip Perjalanan | Travel Tips |
| 字体调节 | Pelarasan Saiz Fon | Font Size |
| 意见与反馈 | Maklum Balas | Feedback |
| 关于我们 | Tentang Kami | About Us |
| 女声 | Suara Wanita | Female voice |
| 男声 | Suara Lelaki | Male voice |
| 讲解点位 | Titik Penerangan | Audio Stops |
| 播放进度 | Kemajuan | Progress |

### 新增/修改文案的标准流程
1. 改中文来源：景点内容改 `seed.json` 的 `zh-CN`；UI 文案改 `messages.json` 的 `zh-CN`。
2. 跑 `cd server && node scripts/translate-content.mjs` 自动翻译马来语并写回；英语手工补。
3. 前端 `npm run build`、后端 `npm run build` 均须通过。

### 代码约定
- TypeScript `strict` 开启；未使用导入即删（`noUnusedLocals`）。
- 后端 CommonJS（`module: CommonJS`）；前端 ESM（Vite）。
- 语言参数统一用 `zh-CN / ms-MY / en-US`（后端 `normalizeLang` 可容错 zh/ms/en）。

## 十一、质量门槛与验证命令

每次改动后，以下必须全部通过：

```bash
cd server && npm run build        # tsc 类型检查
cd client && npm run build        # tsc -b && vite build
cd server && node dist/index.js &  # 启动后 curl 验证
curl http://localhost:3001/api/health
curl "http://localhost:3001/api/attractions?lang=ms-MY"
```

## 十二、安全与密钥管理

- 所有密钥（DeepSeek、小米 MiMo、讯飞、Azure、LLM）放 `server/.env`，该文件已 `.gitignore`（TTSmaker 已弃用，仅保留 config 占位）。
- 反馈上传：图片限 3 张、文本限 1000 字，存 `server/uploads/`（前端 base64 由后端解码落盘）。
- PWA 离线缓存 / 安装需 HTTPS 或 localhost；局域网 http 下仅作普通网页使用。

## 十三、路线图与待办

- [ ] 大雁塔官方购票地址 + 微信小程序原始ID/路径待填（`lib/pagodaTicket.ts`，当前以复制口令兜底）
- [ ] 智能问答「问 AI」入口（LLM 适配器已预留 `config.llm`）
- [ ] 界面草图 5 张 PNG 的像素级还原（此前无法渲染，需用户补图）
- [ ] 讯飞 / Azure TTS 仍为 stub（切换商用音色时接入）
- [ ] Capacitor 打包 iOS / Android
- [ ] JSON 仓库 → PostgreSQL（多实例 / 并发写入时）
- [ ] 自绘 SVG 地图 → 真实瓦片/导航（需实时定位导航时；当前已导入 OSM 静态地理要素，见 ADR-007）

## 十四、变更流程

1. 提需求 → 对照本宪章判断是否触碰「核心原则」。
2. 影响架构的决策 → 在第七节新增/更新 ADR。
3. 实现 → 过第十一节质量门槛 → 更新 README 与本宪章。

---
*本宪章随项目演进持续更新；任何与本宪章冲突的实现应先修订宪章或经明确讨论后豁免。*
