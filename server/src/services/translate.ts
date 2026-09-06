import { config } from '../config';

/**
 * 翻译服务（DeepSeek，OpenAI 兼容接口）。
 * 中文源 → 标准马来西亚马来语 / 英语。密钥在 server/.env 的 DEEPSEEK_API_KEY。
 */

// 马来语翻译约束：与 scripts/prompt-zh-ms.md 一致的核心规则（标准大马马来语，禁印尼词汇）
const MS_SYSTEM =
  '你是一名专业中文—马来语翻译专家。请严格遵守：1) 全程使用标准马来西亚马来语（Bahasa Melayu Malaysia），' +
  '严禁印尼特有词汇与印尼式拼写（如禁止 kamu，应使用 anda）；2) 严格遵循马来语官方语法，注意词缀 me-/men-/mem-/ber-/per- 与后缀 -kan/-lah 的正确使用；' +
  '3) 文旅描述可适度丰富，但术语要统一；4) 只输出译文本身，不要解释、不要双语对照、不要代码块。';

const EN_SYSTEM =
  'You are a professional Chinese-to-English translator. Translate naturally and fluently for English-speaking tourists. ' +
  'Keep terminology consistent. Output only the translation, with no explanation, no bilingual text, and no code blocks.';

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
}

async function call(messages: { role: string; content: string }[]): Promise<string> {
  const { apiKey, baseUrl, model } = config.deepseek;
  if (!apiKey) throw new Error('缺少 DEEPSEEK_API_KEY，请配置 server/.env');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`DeepSeek API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as DeepSeekResponse;
  return data.choices?.[0]?.message?.content ?? '';
}

function parseArray(content: string, expected: number): string[] {
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('无法解析返回的 JSON 数组: ' + content.slice(0, 300));
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr) || arr.length !== expected) {
    throw new Error(
      `翻译条数不匹配：期望 ${expected}，得到 ${Array.isArray(arr) ? arr.length : '非数组'}`,
    );
  }
  return arr as string[];
}

async function translateBatch(texts: string[], system: string, instruction: string): Promise<string[]> {
  const user =
    `${instruction}\n` +
    '请将下面 JSON 数组中的每一条中文文本逐条翻译，返回一个 JSON 数组，元素顺序与输入一致。只输出 JSON 数组本身。\n' +
    JSON.stringify(texts);
  const content = await call([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
  return parseArray(content, texts.length);
}

/** 中文 → 标准马来西亚马来语（批量，返回与输入等长数组） */
export function translateZhToMs(texts: string[]): Promise<string[]> {
  return translateBatch(
    texts,
    MS_SYSTEM,
    '请将每一条中文文本翻译成标准马来西亚马来语（Bahasa Melayu Malaysia），禁止印尼词汇。',
  );
}

/** 中文 → 英语（批量，返回与输入等长数组） */
export function translateZhToEn(texts: string[]): Promise<string[]> {
  return translateBatch(
    texts,
    EN_SYSTEM,
    '请将每一条中文文本翻译成自然流畅的英语。',
  );
}
