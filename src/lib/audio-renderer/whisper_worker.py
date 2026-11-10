"""Long-lived Whisper worker for the Azure gate. One JSON request per stdin line, one JSON reply per stdout line.
{"wav", "text"} -> {"heard", "missing"} | {"error"}
missing = syllables of text that Whisper did not hear (toneless pinyin, erhua 儿 ignored), at least 1 when the last one is not heard."""
import difflib
import json
import sys

import mlx_whisper
from pypinyin import Style, lazy_pinyin

MODEL = "mlx-community/whisper-large-v3-turbo"
DIGITS = dict(zip("0123456789", "零一二三四五六七八九"))


def syllables(text):
    hanzi = [c for c in "".join(DIGITS.get(c, c) for c in text.replace("您", "你")) if "\u3400" <= c <= "\u9fff"]
    erhua = [c == "儿" and 0 < i and hanzi[i - 1] not in "女婴幼孤健" and "".join(hanzi[i + 1:i + 2]) not in ("子", "童", "女")
             for i, c in enumerate(hanzi)]
    return lazy_pinyin("".join(c for c, e in zip(hanzi, erhua) if not e), style=Style.NORMAL)


def missing(text, heard):
    want, got = syllables(text), syllables(heard)
    matched = sum(b.size for b in difflib.SequenceMatcher(a=want, b=got, autojunk=False).get_matching_blocks())
    lost = len(want) - matched
    return max(lost, 1) if want and (not got or want[-1] != got[-1]) else lost


for line in sys.stdin:
    try:
        job = json.loads(line)
        heard = mlx_whisper.transcribe(job["wav"], path_or_hf_repo=MODEL, language="zh", temperature=0.0,
                                       condition_on_previous_text=False, initial_prompt="以下是普通话的句子。")["text"].strip()
        reply = {"heard": heard, "missing": missing(job["text"], heard)}
    except Exception as e:
        reply = {"error": str(e)}
    print(json.dumps(reply, ensure_ascii=False), flush=True)
