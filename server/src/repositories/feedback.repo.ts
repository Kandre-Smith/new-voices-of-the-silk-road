import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

export interface FeedbackEntry {
  id: string;
  text: string;
  images: string[];
  lang: string;
  createdAt: string;
}

export interface FeedbackInput {
  text: string;
  /** base64 dataURL 数组 */
  images?: string[];
  lang?: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAll(): FeedbackEntry[] {
  const file = path.join(config.uploadDir, 'feedback.json');
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: FeedbackEntry[]) {
  ensureDir(config.uploadDir);
  fs.writeFileSync(
    path.join(config.uploadDir, 'feedback.json'),
    JSON.stringify(entries, null, 2),
    'utf-8',
  );
}

function saveImage(dataUrl: string): string {
  ensureDir(config.uploadDir);
  const m = /^data:(image\/(?:png|jpe?g|gif|webp));base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error('unsupported image');
  const ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const file = path.join(config.uploadDir, name);
  fs.writeFileSync(file, Buffer.from(m[2], 'base64'));
  return `/uploads/${name}`;
}

export function addFeedback(input: FeedbackInput): FeedbackEntry {
  if (!input.text || !input.text.trim()) throw new Error('text is required');
  const images = (input.images || [])
    .filter((i) => typeof i === 'string' && i.startsWith('data:'))
    .map(saveImage);

  const entry: FeedbackEntry = {
    id: crypto.randomBytes(6).toString('hex'),
    text: input.text.trim().slice(0, 1000),
    images,
    lang: input.lang || 'zh-CN',
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(entry);
  writeAll(all);
  return entry;
}

export function listFeedback(): FeedbackEntry[] {
  return readAll();
}
