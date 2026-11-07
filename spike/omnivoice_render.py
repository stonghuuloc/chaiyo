"""Render a job list with OmniVoice. Usage: python omnivoice_render.py < jobs.json
Each job: { out, text, seed, instruct?, ref_audio?, ref_text? }. Writes 24 kHz mono wav to out.
The model loads once; a job whose out exists is skipped."""
import json, os, sys
import numpy as np
import soundfile as sf
import torch
from omnivoice import OmniVoice

jobs = json.load(sys.stdin)
todo = [j for j in jobs if not os.path.exists(j["out"])]
if todo:
    model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="mps", dtype=torch.float16)
for j in todo:
    torch.manual_seed(j["seed"])
    kw = {"text": j["text"]}
    if j.get("instruct"):
        kw["instruct"] = j["instruct"]
    if j.get("ref_audio"):
        kw["ref_audio"] = j["ref_audio"]
        kw["ref_text"] = j["ref_text"]
    audio = model.generate(**kw)[0]
    audio = audio.squeeze().float().cpu().numpy() if hasattr(audio, "cpu") else np.asarray(audio)
    os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
    sf.write(j["out"], audio, 24000)
    print("rendered", j["out"], flush=True)
