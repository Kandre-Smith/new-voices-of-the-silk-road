/**
 * 丝路新声 —— 中 ↔ 马来语翻译工具（DeepSeek API）
 *
 * 每次翻译前会读取 prompt-zh-ms.md 作为系统提示词（已按要求配置好全部约束规则），
 * 并读取 server/.env 中的 DEEPSEEK_API_KEY / BASE_URL / MODEL。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
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

function readPrompt() {
  return fs.readFileSync(path.join(__dirname, 'prompt-zh-ms.md'), 'utf-8');
}

export function getConfig() {
  loadEnv();
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

async function call(messages) {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) throw new Error('缺少 DEEPSEEK_API_KEY，请配置 server/.env');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`DeepSeek API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseArray(content, expected) {
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('无法解析返回的 JSON 数组: ' + content.slice(0, 300));
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr) || arr.length !== expected) {
    throw new Error(
      `翻译条数不匹配：期望 ${expected}，得到 ${Array.isArray(arr) ? arr.length : '非数组'}`,
    );
  }
  return arr;
}

/** 中文 → 马来语（批量，返回与输入等长的数组） */
export async function translateZhToMs(texts) {
  const system = readPrompt();
  const user =
    '请将下面 JSON 数组中的每一条中文文本翻译成标准马来西亚马来语（Bahasa Melayu Malaysia），逐条对应，返回一个 JSON 数组，元素顺序与输入一致。只输出 JSON 数组本身，不要任何解释、注释或代码块标记。\n' +
    JSON.stringify(texts);
  const content = await call([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
  return parseArray(content, texts.length);
}

/** 马来语 → 中文（批量，返回与输入等长的数组） */
export async function translateMsToZh(texts) {
  const system = readPrompt();
  const user =
    '请将下面 JSON 数组中的每一条马来语文本翻译成通顺标准中文，逐条对应，返回一个 JSON 数组，元素顺序与输入一致。只输出 JSON 数组本身，不要任何解释、注释或代码块标记。\n' +
    JSON.stringify(texts);
  const content = await call([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
  return parseArray(content, texts.length);
}
