import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { config } from '../config';
import { Lang } from '../types';
import { translateZhToMs, translateZhToEn } from './translate';

const exec = promisify(execFile);

/** 音色性别：女声 / 男声 */
export type Gender = 'female' | 'male';

/**
 * 可插拔 TTS 适配器。
 * 每个 provider 实现 synthesize(text, lang, gender, outFile)。默认（且兜底）用 edge-tts（免费、零 key）。
 *   - 中文 zh-CN：小米 MiMo（年轻女声 冰糖 / 男声 白桦）
 *   - 马来语 ms-MY：edge-tts（女声 Yasmin / 男声 Osman）
 *   - 英语 en-US：小米 MiMo（年轻女声 Mia / 男声 Dean）
 * 缺 key 时自动回退 edge-tts。
 */

const EDGE_VOICES: Record<Lang, Record<Gender, string>> = {
  'zh-CN': { female: 'zh-CN-XiaoxiaoNeural', male: 'zh-CN-YunxiNeural' },
  'ms-MY': { female: 'ms-MY-YasminNeural', male: 'ms-MY-OsmanNeural' },
  'en-US': { female: 'en-US-AriaNeural', male: 'en-US-GuyNeural' },
};

export interface TtsResult {
  provider: string;
  file?: string;
  fallback?: boolean;
  message?: string;
}

async function edgeTts(text: string, lang: Lang, gender: Gender, outFile: string): Promise<void> {
  const voice = EDGE_VOICES[lang][gender] || EDGE_VOICES[lang].female;
  await exec('edge-tts', [
    '--voice',
    voice,
    '--text',
    text,
    '--write-media',
    outFile,
  ]);
}

/**
 * 小米 MiMo V2.5 TTS（中文 / 英语）。
 * 参考：https://platform.xiaomimimo.com —— OpenAI 兼容 chat/completions，audio.data 为 base64。
 * 提示词要求语气年轻活泼、按标点自然断句。
 */
async function mimoTts(text: string, lang: Lang, gender: Gender, outFile: string): Promise<void> {
  const p = config.tts.providers.mimo;
  if (!p.apiKey) throw new Error('MiMo TTS 未配置 MIMO_API_KEY');
  const voices = p.voice[lang] as Record<string, string> | undefined;
  const voice = (voices && voices[gender]) || (voices && voices.female) || 'mimo_default';
  const prompt =
    lang === 'en-US'
      ? 'Read the following text in a warm, youthful and lively tone at a moderate pace, pausing naturally at punctuation, like a friendly young tour guide.'
      : '请用年轻、活泼、亲切的语气朗读下面的文本，像一位热情年轻的导游小姐姐，语速适中，语调自然有活力，并根据标点符号自然停顿断句，符合真人说话习惯。';

  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'api-key': p.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: p.model,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: text },
      ],
      audio: { format: 'mp3', voice },
    }),
  });
  if (!res.ok) throw new Error(`MiMo TTS HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    choices?: { message?: { audio?: { data?: string } } }[];
  };
  const b64 = data.choices?.[0]?.message?.audio?.data;
  if (!b64) throw new Error('MiMo TTS 响应缺少音频数据');
  fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
}

/**
 * TTSmaker（保留适配器，路由已不再使用；马来语现走 edge-tts）。
 */
async function ttsmakerTts(text: string, lang: Lang, _gender: Gender, outFile: string): Promise<void> {
  const p = config.tts.providers.ttsmaker;
  if (!p.token) throw new Error('TTSmaker 未配置 TTSMAKER_TOKEN');
  const voice = p.voice[lang] || '';
  if (!voice) throw new Error('TTSmaker 未配置马来语 voice_id（TTSMAKER_VOICE_MS）');

  const order = await fetch(`${p.baseUrl}/create-tts-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: p.token,
      text,
      voice_id: voice,
      audio_format: 'mp3',
      audio_speed: 1.0,
      audio_volume: 0,
      text_paragraph_pause_time: 0,
    }),
  });
  if (!order.ok) throw new Error(`TTSmaker HTTP ${order.status}: ${(await order.text()).slice(0, 300)}`);
  const data = (await order.json()) as { audio_file_url?: string; status?: string; error_details?: string };
  const url = data.audio_file_url;
  if (!url) throw new Error(`TTSmaker 响应缺少 audio_file_url: ${data.error_details ?? data.status ?? ''}`);

  const audio = await fetch(url);
  if (!audio.ok) throw new Error(`TTSmaker 下载音频失败 HTTP ${audio.status}`);
  fs.writeFileSync(outFile, Buffer.from(await audio.arrayBuffer()));
}

async function iflytekTts(_text: string, _lang: Lang, _gender: Gender): Promise<never> {
  // TODO: 集成讯飞 WebAPI 语音合成（config.tts.providers.iflytek 已预留 appId/apiKey/apiSecret）
  throw new Error('iFlytek TTS 尚未接入');
}

async function azureTts(_text: string, _lang: Lang, _gender: Gender): Promise<never> {
  // TODO: 集成 Azure Speech（config.tts.providers.azure 已预留 key/region/voice）
  throw new Error('Azure TTS 尚未接入');
}

type ProviderImpl = (t: string, l: Lang, g: Gender, o: string) => Promise<void>;

const PROVIDERS: Record<string, ProviderImpl> = {
  edge: edgeTts,
  mimo: mimoTts,
  ttsmaker: ttsmakerTts,
  iflytek: iflytekTts,
  azure: azureTts,
};

/** 按语言路由到对应 provider 合成语音；provider 失败/缺 key 时自动回退 edge-tts。 */
export async function synthesize(
  text: string,
  lang: Lang,
  outFile: string,
  gender: Gender = 'female',
): Promise<TtsResult> {
  const provider = config.tts.routing[lang] || 'edge';
  const impl = PROVIDERS[provider];

  if (impl && provider !== 'edge') {
    try {
      await impl(text, lang, gender, outFile);
      return { provider, file: outFile };
    } catch (err) {
      const msg = (err as Error).message;
      console.warn(`[tts] ${provider} 合成失败，回退 edge-tts: ${msg}`);
      await edgeTts(text, lang, gender, outFile);
      return { provider: 'edge', file: outFile, fallback: true, message: msg };
    }
  }

  await edgeTts(text, lang, gender, outFile);
  return { provider: 'edge', file: outFile };
}

/**
 * 完整 TTS&翻译链路：给定「中文源文本」+ 目标语言，翻译（如需）后合成语音。
 *   - zh-CN：中文直接走小米 MiMo
 *   - ms-MY：中文 → DeepSeek（标准大马马来语）→ edge-tts
 *   - en-US：中文 → DeepSeek（英文）→ 小米 MiMo
 */
export async function synthesizeFromChinese(
  zhText: string,
  targetLang: Lang,
  outFile: string,
  gender: Gender = 'female',
): Promise<TtsResult & { translatedText?: string }> {
  if (targetLang === 'zh-CN') {
    return synthesize(zhText, 'zh-CN', outFile, gender);
  }
  const translated = (targetLang === 'ms-MY' ? await translateZhToMs([zhText]) : await translateZhToEn([zhText]))[0];
  const result = await synthesize(translated, targetLang, outFile, gender);
  return { ...result, translatedText: translated };
}
