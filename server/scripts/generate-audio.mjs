// -*- coding: utf-8 -*-
/**
 * 丝路新声 —— 预生成全部导览语音（主景点 + 子景点 × 三语 × 性别）
 *
 * 用法（在 server/ 目录下运行）：
 *   node scripts/generate-audio.mjs [female|male] [--limit N]
 *
 * 语音路由与 services/tts.ts 一致：
 *   - 中文 zh-CN / 英语 en-US → 小米 MiMo V2.5 TTS（年轻音色，缺 key 回退 edge-tts）
 *   - 马来语 ms-MY          → edge-tts（Yasmin 女 / Osman 男）
 *
 * 输出：public/audio/{slug}-{lang}-{gender}.mp3（主景点）
 *       public/audio/{slug}-{spotSlug}-{lang}-{gender}.mp3（子景点）
 */
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- 加载 server/.env ----
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (process.env[k] == null) process.env[k] = v;
  }
}

const gender = (process.argv.find((a) => a === 'female' || a === 'male')) || 'female';
const limitIdx = process.argv.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) || 0 : 0;

const MIMO_VOICES = {
  'zh-CN': {
    female: process.env.MIMO_VOICE_ZH_FEMALE || process.env.MIMO_VOICE_ZH || '冰糖',
    male: process.env.MIMO_VOICE_ZH_MALE || '白桦',
  },
  'en-US': {
    female: process.env.MIMO_VOICE_EN_FEMALE || process.env.MIMO_VOICE_EN || 'Mia',
    male: process.env.MIMO_VOICE_EN_MALE || 'Dean',
  },
};
const EDGE_VOICES = {
  'zh-CN': { female: 'zh-CN-XiaoxiaoNeural', male: 'zh-CN-YunxiNeural' },
  'ms-MY': { female: 'ms-MY-YasminNeural', male: 'ms-MY-OsmanNeural' },
  'en-US': { female: 'en-US-AriaNeural', male: 'en-US-GuyNeural' },
};

async function mimoTts(text, lang, outFile) {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
  const model = process.env.MIMO_MODEL || 'mimo-v2.5-tts';
  if (!apiKey) throw new Error('缺少 MIMO_API_KEY');
  const voice = (MIMO_VOICES[lang] && MIMO_VOICES[lang][gender]) || 'mimo_default';
  const prompt =
    lang === 'en-US'
      ? 'Read the following text in a warm, youthful and lively tone at a moderate pace, pausing naturally at punctuation, like a friendly young tour guide.'
      : '请用年轻、活泼、亲切的语气朗读下面的文本，像一位热情年轻的导游小姐姐，语速适中，语调自然有活力，并根据标点符号自然停顿断句，符合真人说话习惯。';
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: text },
      ],
      audio: { format: 'mp3', voice },
    }),
  });
  if (!res.ok) throw new Error(`MiMo HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data?.choices?.[0]?.message?.audio?.data;
  if (!b64) throw new Error('MiMo 响应缺少音频数据');
  fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
}

async function edgeTts(text, lang, outFile) {
  const voice = EDGE_VOICES[lang][gender] || EDGE_VOICES[lang].female;
  await exec('edge-tts', ['--voice', voice, '--text', text, '--write-media', outFile]);
}

async function synth(text, lang, outFile) {
  if (lang === 'ms-MY') {
    await edgeTts(text, lang, outFile);
    return 'edge';
  }
  try {
    await mimoTts(text, lang, outFile);
    return 'mimo';
  } catch (err) {
    console.warn(`  [fallback] ${path.basename(outFile)}: ${err.message}`);
    await edgeTts(text, lang, outFile);
    return 'edge';
  }
}

const seedPath = path.resolve(__dirname, '..', 'src', 'data', 'seed.json');
const outDir = path.resolve(__dirname, '..', 'public', 'audio');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
fs.mkdirSync(outDir, { recursive: true });

const langs = ['zh-CN', 'ms-MY', 'en-US'];
const jobs = [];
for (const a of seed.attractions) {
  jobs.push({ slug: a.slug, spotSlug: null, transcript: a.track.transcript });
  for (const s of a.spots || []) {
    jobs.push({ slug: a.slug, spotSlug: s.slug, transcript: s.transcript });
  }
}

console.log(`[generate-audio] gender=${gender} tracks=${jobs.length} langs=${langs.length} total=${jobs.length * langs.length}`);
let ok = 0;
let fail = 0;
let processed = 0;

for (const j of jobs) {
  for (const lang of langs) {
    if (limit && processed >= limit) break;
    processed++;
    const lines = j.transcript[lang];
    if (!lines || !lines.length) continue;
    const text = lines.join(' ');
    const base = j.spotSlug ? `${j.slug}-${j.spotSlug}-${lang}` : `${j.slug}-${lang}`;
    const outFile = path.join(outDir, `${base}-${gender}.mp3`);
    try {
      const provider = await synth(text, lang, outFile);
      ok++;
      console.log(`[ok:${provider}] ${path.basename(outFile)}`);
    } catch (err) {
      fail++;
      console.log(`[skip] ${path.basename(outFile)}: ${err.message}`);
    }
  }
}
console.log(`done: ok=${ok} fail=${fail}`);
