/**
 * 逐句 + 逐字时间轴。
 * 句子层：整段音频时长按句子长度（字数/词数）加权摊到每句；
 * 字层：单句内部再按「字/词」加权，把当前播放时间映射到具体 token，
 * 让「语音进度」与「字幕逐字高亮」一一对应。
 *
 * 权重规则：中文等无空格语系按字数，含空格的拉丁语系（马来/英）按词数。
 */

export interface SentenceTimings {
  starts: number[];
  ends: number[];
  total: number;
}

export interface TokenSpan {
  text: string;
  start: number;
  end: number;
}

const CJK = /[一-鿿]/;

/** 把一句文本切成 token：中文逐字、拉丁逐词；跳过空白，保留原始字符偏移 */
export function tokenSpans(text: string): TokenSpan[] {
  const spans: TokenSpan[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (CJK.test(ch)) {
      spans.push({ text: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    let j = i;
    while (j < text.length && !/\s/.test(text[j]) && !CJK.test(text[j])) j++;
    spans.push({ text: text.slice(i, j), start: i, end: j });
    i = j;
  }
  return spans;
}

function tokenWeight(s: string): number {
  const letters = s.replace(/[^\p{L}\p{N}]/gu, '');
  if (!letters) return 0.3; // 纯标点：短停顿
  if (/^[一-鿿]$/.test(s)) return 1;
  return letters.length;
}

function weightOf(s: string): number {
  const t = s.trim();
  if (!t) return 1;
  const words = t.split(/\s+/).filter(Boolean);
  // 拉丁语系（马来语/英语）：词数是更好的时长代理
  if (words.length > 1) return words.length;
  // 中文等：字数
  return t.length;
}

export function sentenceTimings(lines: string[], totalSec: number): SentenceTimings {
  const n = lines.length;
  const total = Math.max(0.001, totalSec);
  const weights = lines.map(weightOf);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const unit = total / sum;

  const starts = new Array<number>(n);
  const ends = new Array<number>(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    starts[i] = acc;
    acc += weights[i] * unit;
    ends[i] = acc;
  }
  return { starts, ends, total: acc };
}

/** 给定当前秒数，返回所属句子下标（越界归到最后一句） */
export function lineAtTime(t: number, timings: SentenceTimings): number {
  const { starts, ends } = timings;
  for (let i = 0; i < starts.length; i++) {
    if (t < ends[i]) return i;
  }
  return starts.length - 1;
}

/** 单句内按权重把 [0,1] 进度映射到 token 下标 */
export function tokenIndexForFraction(spans: TokenSpan[], fraction: number): number {
  const n = spans.length;
  if (n === 0) return 0;
  const weights = spans.map((s) => tokenWeight(s.text));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const target = Math.min(1, Math.max(0, fraction)) * sum;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += weights[i];
    if (target < acc) return i;
  }
  return n - 1;
}

/** 格式化 mm:ss */
export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
