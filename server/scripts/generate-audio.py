# -*- coding: utf-8 -*-
"""
丝路新声 —— 预生成三语导览音频（免费默认方案 edge-tts）

用法：
    pip install edge-tts
    python scripts/generate-audio.py

会读取 src/data/seed.json，为每个景点 × 三种语言各生成一条 mp3，
输出到 public/audio/{slug}-{lang}.mp3，供前端离线播放。
拿到讯飞 / TTSmaker / Azure 的 key 后，可替换 VOICES 与合成方式重新生成。
"""
import asyncio
import json
import os
import sys

try:
    import edge_tts
except ImportError:
    print("请先安装 edge-tts:  pip install edge-tts")
    sys.exit(1)

VOICES = {
    "zh-CN": "zh-CN-XiaoxiaoNeural",
    "ms-MY": "ms-MY-YasminNeural",
    "en-US": "en-US-AriaNeural",
}


async def generate(text: str, voice: str, out_file: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate="+0%")
    await communicate.save(out_file)


async def main() -> None:
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_path = os.path.join(base, "src", "data", "seed.json")
    out_dir = os.path.join(base, "public", "audio")

    with open(seed_path, encoding="utf-8") as f:
        data = json.load(f)

    os.makedirs(out_dir, exist_ok=True)

    for a in data["attractions"]:
        for lang, voice in VOICES.items():
            lines = a["track"]["transcript"][lang]
            text = " ".join(lines)
            out_file = os.path.join(out_dir, f"{a['slug']}-{lang}.mp3")
            try:
                await generate(text, voice, out_file)
                print(f"[ok] {os.path.basename(out_file)}")
            except Exception as exc:  # noqa: BLE001
                print(f"[skip] {os.path.basename(out_file)}: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
