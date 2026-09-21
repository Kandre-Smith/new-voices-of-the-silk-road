import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectDir = resolve(clientDir, '..');
const seedSource = join(projectDir, 'server', 'src', 'data', 'seed.json');
const seedTarget = join(clientDir, 'src', 'data', 'seed.json');
const audioSource = join(projectDir, 'server', 'public', 'audio');
const audioTarget = join(clientDir, 'public', 'audio');

mkdirSync(dirname(seedTarget), { recursive: true });
mkdirSync(audioTarget, { recursive: true });
copyFileSync(seedSource, seedTarget);

const publishableAudio = /^(terracotta-army|muslim-quarter|big-wild-goose-pagoda).+-(female|male)\.mp3$/;
const mainAudio = /^(terracotta-army|muslim-quarter|big-wild-goose-pagoda)-(zh-CN|ms-MY|en-US)-(female|male)\.mp3$/;
let copied = 0;
for (const name of readdirSync(audioSource)) {
  if (!publishableAudio.test(name) && !mainAudio.test(name)) continue;
  const source = join(audioSource, name);
  if (!existsSync(source)) continue;
  copyFileSync(source, join(audioTarget, name));
  copied += 1;
}

if (copied !== 102) {
  throw new Error(`Expected 102 publishable audio files, found ${copied}`);
}

console.log(`Prepared static data and ${copied} audio files.`);
