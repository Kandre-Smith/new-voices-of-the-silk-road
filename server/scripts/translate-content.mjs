/**
 * 一键把项目里的中文内容翻译成马来语并写回：
 *   1) server/src/data/seed.json    —— 景点名称/介绍/讲解字幕/出行 tips
 *   2) client/src/i18n/messages.json —— UI 文案
 *
 * 用法：node scripts/translate-content.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateZhToMs } from './translate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const seedPath = path.join(root, 'src', 'data', 'seed.json');
const msgsPath = path.join(root, '..', 'client', 'src', 'i18n', 'messages.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBatch(tasks, label) {
  const BATCH = 60;
  for (let i = 0; i < tasks.length; i += BATCH) {
    const chunk = tasks.slice(i, i + BATCH);
    let out;
    for (let attempt = 1; ; attempt++) {
      try {
        out = await translateZhToMs(chunk.map((t) => t.zh));
        break;
      } catch (e) {
        if (attempt >= 3) throw e;
        console.warn(`  [${label}] 第 ${attempt} 次重试: ${e.message}`);
        await sleep(1500);
      }
    }
    chunk.forEach((t, j) => t.set(out[j]));
    console.log(`  [${label}] ${Math.min(i + chunk.length, tasks.length)}/${tasks.length}`);
    await sleep(200);
  }
}

async function main() {
  // 1) 景点内容
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const seedTasks = [];
  for (const a of seed.attractions) {
    seedTasks.push({ zh: a.name['zh-CN'], set: (v) => void (a.name['ms-MY'] = v) });
    seedTasks.push({ zh: a.intro['zh-CN'], set: (v) => void (a.intro['ms-MY'] = v) });
    seedTasks.push({ zh: a.track.title['zh-CN'], set: (v) => void (a.track.title['ms-MY'] = v) });
    a.track.transcript['zh-CN'].forEach((zh, i) =>
      seedTasks.push({ zh, set: (v) => void (a.track.transcript['ms-MY'][i] = v) }),
    );
    // 子景点：名称 + 讲解字幕
    for (const s of a.spots ?? []) {
      seedTasks.push({ zh: s.name['zh-CN'], set: (v) => void (s.name['ms-MY'] = v) });
      s.transcript['zh-CN'].forEach((zh, i) =>
        seedTasks.push({ zh, set: (v) => void (s.transcript['ms-MY'][i] = v) }),
      );
    }
    for (const k of ['openHours', 'ticketPrice', 'suggestedDuration', 'transport', 'tips']) {
      seedTasks.push({ zh: a.tips['zh-CN'][k], set: (v) => void (a.tips['ms-MY'][k] = v) });
    }
  }
  console.log('翻译景点内容…');
  await runBatch(seedTasks, 'seed');
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

  // 2) UI 文案
  const msgs = JSON.parse(fs.readFileSync(msgsPath, 'utf-8'));
  const uiTasks = Object.keys(msgs['zh-CN']).map((k) => ({
    zh: msgs['zh-CN'][k],
    set: (v) => void (msgs['ms-MY'][k] = v),
  }));
  console.log('翻译 UI 文案…');
  await runBatch(uiTasks, 'ui');
  fs.writeFileSync(msgsPath, JSON.stringify(msgs, null, 2) + '\n', 'utf-8');

  console.log('全部完成 ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
