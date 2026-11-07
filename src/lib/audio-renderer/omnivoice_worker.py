"""Long-lived OmniVoice and Whisper worker. One JSON request per stdin line, one JSON reply per stdout line.
render:     {"op": "render", "out", "text", "seed", "instruct"?, "ref_audio"?, "ref_text"?} -> {"out"} | {"error"}
transcribe: {"op": "transcribe", "mp3"} -> {"text"} | {"error"}
Models load on first use."""
import json
import os
import sys

import numpy as np
import soundfile as sf
import torch

omnivoice = None
whisper_model = None


def render(job):
    global omnivoice
    if omnivoice is None:
        from omnivoice import OmniVoice

        omnivoice = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="mps", dtype=torch.float16)
    torch.manual_seed(job["seed"])
    kw = {"text": job["text"]}
    if job.get("instruct"):
        kw["instruct"] = job["instruct"]
    if job.get("ref_audio"):
        kw["ref_audio"] = job["ref_audio"]
        kw["ref_text"] = job["ref_text"]
    audio = omnivoice.generate(**kw)[0]
    audio = audio.squeeze().float().cpu().numpy() if hasattr(audio, "cpu") else np.asarray(audio)
    os.makedirs(os.path.dirname(job["out"]), exist_ok=True)
    sf.write(job["out"], audio, 24000)
    return {"out": job["out"]}


def transcribe(job):
    global whisper_model
    import whisper

    if whisper_model is None:
        whisper_model = whisper.load_model("small")
    r = whisper_model.transcribe(
        whisper.audio.load_audio(job["mp3"]), language="zh", fp16=False, initial_prompt="简体中文。"
    )
    return {"text": r["text"].strip()}


for line in sys.stdin:
    job = json.loads(line)
    try:
        reply = render(job) if job["op"] == "render" else transcribe(job)
    except Exception as e:
        reply = {"error": f"{type(e).__name__}: {e}"}
    print(json.dumps(reply, ensure_ascii=False), flush=True)
