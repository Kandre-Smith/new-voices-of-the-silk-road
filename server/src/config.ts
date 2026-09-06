import fs from 'fs';
import path from 'path';

/**
 * 启动时加载 server/.env（若存在），不覆盖已有环境变量。
 * 与 scripts/translate.mjs 的 loadEnv 逻辑保持一致，保证密钥集中放 .env 且不进仓库。
 */
function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
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
loadEnvFile();

/**
 * 集中配置。生产环境通过环境变量覆盖。
 *
 * TTS 采用「按语言路由」的可插拔适配器（含「中文源 → 翻译 → 合成」链路）：
 *   - 中文 zh-CN  小米 MiMo V2.5 TTS（年轻女声/男声，语气年轻活泼）
 *   - 马来语 ms-MY edge-tts（女声 Yasmin / 男声 Osman）
 *   - 英语 en-US  小米 MiMo V2.5 TTS（年轻女声/男声，语气年轻活泼）
 * 翻译统一走 DeepSeek（中文源 → 马来语 / 英语）；缺 key / 未启用时自动回退 edge-tts。
 */
export const config = {
  port: Number(process.env.PORT) || 3001,
  publicDir: path.resolve(process.cwd(), 'public'),
  uploadDir: path.resolve(process.cwd(), 'uploads'),

  /** 翻译（DeepSeek，OpenAI 兼容接口）：中文源 → 马来语 / 英语 */
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  tts: {
    // 各语言使用哪个 provider（中文/英语→mimo，马来语→edge-tts）
    routing: {
      'zh-CN': (process.env.TTS_ROUTING_ZH || 'mimo') as string,
      'ms-MY': (process.env.TTS_ROUTING_MS || 'edge') as string,
      'en-US': (process.env.TTS_ROUTING_EN || 'mimo') as string,
    },
    providers: {
      edge: { enabled: true },
      // 小米 MiMo V2.5 TTS（中文/英语，自然女声/男声）
      mimo: {
        enabled: process.env.MIMO_ENABLED !== '0',
        apiKey: process.env.MIMO_API_KEY || '',
        baseUrl: process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1',
        model: process.env.MIMO_MODEL || 'mimo-v2.5-tts',
        // 音色（年轻自然）：中文 冰糖(女,活泼少女)/白桦(男)；英文 Mia(女)/Dean(男)
        voice: {
          'zh-CN': {
            female: process.env.MIMO_VOICE_ZH_FEMALE || process.env.MIMO_VOICE_ZH || '冰糖',
            male: process.env.MIMO_VOICE_ZH_MALE || '白桦',
          },
          'ms-MY': { female: '', male: '' },
          'en-US': {
            female: process.env.MIMO_VOICE_EN_FEMALE || process.env.MIMO_VOICE_EN || 'Mia',
            male: process.env.MIMO_VOICE_EN_MALE || 'Dean',
          },
        },
      },
      // TTSmaker（马来语）
      ttsmaker: {
        enabled: process.env.TTSMAKER_ENABLED !== '0',
        token: process.env.TTSMAKER_TOKEN || '',
        baseUrl: process.env.TTSMAKER_BASE_URL || 'https://api.ttsmaker.com/v1',
        // TTSmaker 马来语 voice_id（在控制台查看具体数字 ID 后填入）
        voice: {
          'zh-CN': '',
          'ms-MY': process.env.TTSMAKER_VOICE_MS || '',
          'en-US': '',
        },
      },
      iflytek: {
        enabled: false,
        appId: process.env.IFLYTEK_APP_ID || '',
        apiKey: process.env.IFLYTEK_API_KEY || '',
        apiSecret: process.env.IFLYTEK_API_SECRET || '',
        voice: { 'zh-CN': 'xiaoyan', 'ms-MY': '', 'en-US': 'xiaoqian' },
      },
      azure: {
        enabled: false,
        key: process.env.AZURE_SPEECH_KEY || '',
        region: process.env.AZURE_SPEECH_REGION || 'southeastasia',
        voice: {
          'zh-CN': 'zh-CN-XiaoxiaoNeural',
          'ms-MY': 'ms-MY-YasminNeural',
          'en-US': 'en-US-AriaNeural',
        },
      },
    },
  },

  llm: {
    provider: process.env.LLM_PROVIDER || 'openai-compatible',
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || '',
    model: process.env.LLM_MODEL || '',
  },
};
