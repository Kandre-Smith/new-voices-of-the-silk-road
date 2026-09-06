import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { synthesize, synthesizeFromChinese, type Gender } from '../services/tts';
import { normalizeLang } from '../data';
import { config } from '../config';

export const ttsRouter = Router();

/**
 * POST /api/tts  body: { text, lang, gender?, fromZh? }
 *   - text：待合成文本（fromZh=false 时为目标语言文本；fromZh=true 时为中文源文本）
 *   - lang：目标语言 zh-CN / ms-MY / en-US
 *   - gender：female | male（默认 female；中/英→MiMo，马来语→edge-tts）
 *   - fromZh：true 时走「中文 → DeepSeek 翻译 → TTS」链路
 * 返回 { provider, url, translatedText? }。
 */
ttsRouter.post('/', async (req, res) => {
  const { text, lang: langRaw, gender: genderRaw, fromZh } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  const lang = normalizeLang(langRaw);
  const gender: Gender = genderRaw === 'male' ? 'male' : 'female';
  const outDir = path.join(config.publicDir, 'audio');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}.mp3`;
  const outFile = path.join(outDir, file);

  try {
    const source = String(text).slice(0, 1500);
    const result = fromZh
      ? await synthesizeFromChinese(source, lang, outFile, gender)
      : await synthesize(source, lang, outFile, gender);
    res.json({ ...result, url: `/audio/${file}` });
  } catch (err) {
    res.status(501).json({ error: (err as Error).message });
  }
});
