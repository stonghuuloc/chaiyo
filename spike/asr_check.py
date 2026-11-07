"""Transcribe clips with Whisper. Usage: python asr_check.py < [{"mp3": path}, ...]; prints {path: text}."""
import json, sys
import whisper

clips = json.load(sys.stdin)
model = whisper.load_model("small")
out = {}
for c in clips:
    r = model.transcribe(whisper.audio.load_audio(c["mp3"]), language="zh", fp16=False, initial_prompt="简体中文。")
    out[c["mp3"]] = r["text"].strip()
print(json.dumps(out, ensure_ascii=False))
