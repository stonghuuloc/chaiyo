# Lesson content schema

How lesson content is written, checked and loaded. Screens that read it: `docs/screens.md`. Terms: `CONTEXT.md`.

## Rules this schema enforces

1. **Content lives in git as YAML, never edited in the app** (Admin is not a content editor). An importer validates it and loads Postgres; Learners read it, never write it.
2. **Sentences are the atom.** Every Chinese line (example, dialogue line, question stem, listening clip) is one `Sentence` with one id. Audio, tap-lookup segmentation and Error Report context all hang off that id.
3. **Words and characters are shared, lessons only reference them.** A Word Page is built from `Word` + its `Char`s + every lesson that references it. Nothing about a word is written inside a lesson file.
4. **Authors write citation pinyin; the importer derives spoken pinyin.** Tone sandhi (3-3, 一, 不) is computed; an author override exists for exceptions.
5. **Only content is authored.** Audio keys, review cards, Gate Test draws, warm-up sets and Dictionary links are derived.
6. **The vault contract becomes the linter.** `~/Documents/second-brain/mandarin/_lesson-contract.md` rules map 1:1 to lint checks below.

## Entity map

```
                 ┌──────────┐ 1..n  ┌──────────┐
                 │   Char   │◀──────│   Word   │◀───────────── Dictionary entry (122k, thin)
                 │ 你 nhĩ   │       │ 你好     │                 word_id set when taught
                 └──────────┘       └────┬─────┘
                                         │ taught in 1, used in n
 ┌───────────┐  sections   ┌─────────────┴───┐  refs   ┌──────────────┐
 │  Lesson   │────────────▶│ words · grammar │────────▶│ GrammarPoint │
 │ h1-01     │             │ dialogue · etc  │         └──────────────┘
 └─────┬─────┘             └───────┬─────────┘
       │ topic, order              │ every Chinese line
       ▼                           ▼
 ┌───────────┐              ┌────────────┐ derived ┌────────────────────────────┐
 │  Topic    │              │  Sentence  │────────▶│ audio key sha256(text|voice|rate)
 │  Level    │              │ s-h1-01-07 │         │ segmentation → tap lookup  │
 └───────────┘              └─────┬──────┘         └────────────────────────────┘
                                  │ stem / options
                            ┌─────▼──────┐
                            │  Question  │──▶ Attempt (per Learner, append-only)
                            └────────────┘
```

## Files

```
content/
  cast.yaml                 Cast members + fixed voice ids
  chars/你.yaml             one file per character (generated from vault, then hand-fixed)
  words/你好.yaml           one file per word; polyphones split: words/行-xing.yaml, words/行-hang.yaml
  grammar/h1-g01.yaml       one file per grammar point
  levels/hsk1.yaml          topics + lesson order for the level
  lessons/hsk1/h1-01.yaml   one file per lesson: sections, dialogue, questions, inline sentences
  lessons/hsk1/h0-00.yaml   the Pinyin Primer (Bài 0): kind: primer, see below
  syllables.yaml            every valid pinyin syllable (initial × final), source of the Pinyin Table
  mock/hsk1/m1-official.yaml
```

## Types

TypeScript is the source of truth; the importer validates YAML against these with Zod.

```ts
type Level = 1 | 2 | 3 | 4 | 5;
type CastId = 'panda' | 'redpanda' | 'fawn' | 'takin' | string;

interface Char {
  hanzi: string;                    // one code point, never U+2E80–U+2FDF
  readings: { pinyin: string; hanviet: string; rare?: boolean }[]; // every reading, HV mandatory
  radical: string;                  // dictionary radical, spelled from IDS
  ids: string;                      // ⿰亻尔
  strokes: number;
  mnemonic?: {                      // vault "4 neo", copied verbatim (meo.py)
    hinh: string; am: string; doiThat: string; tuongPhan: string;
    kind: 'etymology' | 'invented';
  };
  traditional?: string;
}

interface Word {
  id: string;                       // '你好', or '行-hang' for a polyphone split
  hanzi: string;
  pinyin: string;                   // citation, tone marks: 'nǐ hǎo'
  spoken?: string;                  // override only; default derived by sandhi
  level: Level;
  pos: ('n' | 'v' | 'adj' | 'adv' | 'pron' | 'num' | 'mw' | 'prep' | 'conj' | 'part' | 'interj' | 'phrase')[];
  senses: { vi: string; note?: string }[];   // one per meaning group, most used first
  collocations?: { hanzi: string; pinyin: string; vi: string }[]; // 搭配, shown first on Word Page
  examples: SentenceId[];           // 1–3, Word Page
  image?: { file: string; cast: CastId[]; prompt: string };
  taughtIn?: LessonId;              // set by importer from lessons; never authored here
}

type SentenceId = string;           // 's-h1-01-07'
interface Sentence {
  id: SentenceId;
  hanzi: string;
  pinyin: string;                   // citation; spoken derived
  vi: string;
  speaker?: CastId;                 // dialogue only; picks the voice
  seg?: string[];                   // word boundaries for tap lookup; derived, override allowed
  unknown?: { hanzi: string; pinyin: string; vi: string }[]; // 80% rule escape hatch, shown inline
}

interface GrammarPoint {
  id: string;                       // 'h1-g01'
  level: Level;
  std: number[];                    // GF 0025-2021 Appendix A item numbers (data/sources/hsk30-grammar.csv); [] = vocabulary pattern, no item
  title: string;                    // Vietnamese
  pattern: string;                  // 'A + 好'
  explain: string;                  // Vietnamese markdown, short; long parts behind "Xem thêm"
  examples: SentenceId[];
  pitfalls?: { wrong: string; right: string; why: string }[];
}

type LessonId = string;             // 'h1-01'
interface Lesson {
  id: LessonId;
  level: Level;
  topic: string;                    // topic id from levels/hsk1.yaml
  order: number;
  title: string;                    // Vietnamese, e.g. 'Xin chào'
  titleHanzi: string;               // '你好'
  scene: { file: string; cast: CastId[]; prompt: string };
  sentences: Sentence[];            // every inline sentence used in this lesson
  sections: {
    warmup: { extra?: SentenceId[] };                    // set derived: due words + previous lesson
    words: { ids: string[] };                            // 8–15
    grammar: { ids: string[]; drills: Question[] };
    dialogue: { parts: { title?: string; lines: SentenceId[] }[]; questions: Question[] };
    listenSpeak: { items: Question[] };                  // listening + Speaking Answers
    writing: { chars: string[] };                        // Hanzi Writer targets
  };
  gate: { pool: Question[]; draw: number };              // pool ≥ 2 × draw so retries differ
}

type Prompt =
  | { kind: 'hanzi'; ref: SentenceId | string }          // sentence or word id
  | { kind: 'audio'; ref: SentenceId | string }
  | { kind: 'image'; ref: string }                       // word id → its picture
  | { kind: 'vi'; text: string }
  | { kind: 'syllable'; text: string };                   // pinyin syllable(s) with tone marks; audio = narrator voice

type Question = {
  id: string;                       // 'q-h1-01-g03'
  tests: { words?: string[]; grammar?: string[]; tone?: boolean }; // feeds Learner Stats
} & (
  | { type: 'choice'; prompt: Prompt; options: string[]; answer: number; optionKind: 'hanzi' | 'pinyin' | 'vi' | 'hanviet' | 'image' }
  | { type: 'tone'; prompt: Prompt; syllable: number; answer: 1 | 2 | 3 | 4 | 5 }
  | { type: 'typePinyin'; prompt: Prompt; answer: string }        // tone marks or digits accepted
  | { type: 'order'; tiles: string[]; answer: SentenceId }         // build the sentence
  | { type: 'fill'; sentence: SentenceId; blank: number; options: string[]; answer: number }
  | { type: 'trueFalse'; prompt: Prompt; statement: string; answer: boolean }
  | { type: 'readAloud'; sentence: SentenceId }                    // scored per syllable
  | { type: 'freeAnswer'; prompt: Prompt; rubric: string[]; minChars?: number }
);
```

Review cards are not authored. R1 builds them per Word in the Lexicon: `hanzi→vi`, `audio→hanzi`, `vi→typePinyin`, `hanzi→hanviet`, with distractors from the same level.

## Example: HSK1 Bài 1

```yaml
# content/lessons/hsk1/h1-01.yaml
id: h1-01
level: 1
topic: h1-t01-chao-hoi
order: 1
title: Xin chào
titleHanzi: 你好
scene:
  file: scenes/h1-01.webp
  cast: [panda, fawn]
  prompt: The baby panda waving hello to the fawn on a sunny path

sentences:
  - { id: s-h1-01-01, hanzi: 你好！, pinyin: nǐ hǎo, vi: Chào bạn!, speaker: redpanda }
  - { id: s-h1-01-02, hanzi: 你好！, pinyin: nǐ hǎo, vi: Chào bạn!, speaker: takin }
  - { id: s-h1-01-03, hanzi: 对不起！, pinyin: duìbuqǐ, vi: Xin lỗi!, speaker: takin }
  - { id: s-h1-01-04, hanzi: 没关系。, pinyin: méi guānxi, vi: Không sao., speaker: redpanda }
  - { id: s-h1-01-05, hanzi: 谢谢！, pinyin: xièxie, vi: Cảm ơn!, speaker: redpanda }
  - { id: s-h1-01-06, hanzi: 不客气。, pinyin: bù kèqi, vi: Không có gì., speaker: takin }
  - { id: s-h1-01-07, hanzi: 再见！, pinyin: zàijiàn, vi: Tạm biệt!, speaker: takin }
  - { id: s-h1-01-08, hanzi: 您好！, pinyin: nín hǎo, vi: Chào ông/bà! (lịch sự) }
  - { id: s-h1-01-09, hanzi: 你们好！, pinyin: nǐmen hǎo, vi: Chào các bạn! }

sections:
  warmup: {}                      # Bài 1: nothing due → skipped
  words:
    ids: [你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]
  grammar:
    ids: [h1-g01]
    drills:
      - id: q-h1-01-g01
        type: choice
        tests: { grammar: [h1-g01] }
        prompt: { kind: vi, text: Chào thầy cô (lịch sự) }
        optionKind: hanzi
        options: [你好, 您好, 你们好]
        answer: 1
  dialogue:
    parts:
      - lines: [s-h1-01-01, s-h1-01-02, s-h1-01-03, s-h1-01-04]
      - lines: [s-h1-01-05, s-h1-01-06, s-h1-01-07]
    questions:
      - id: q-h1-01-d01
        type: choice
        tests: { words: [没关系] }
        prompt: { kind: audio, ref: s-h1-01-03 }
        optionKind: hanzi
        options: [没关系。, 不客气。, 再见！]
        answer: 0
  listenSpeak:
    items:
      - id: q-h1-01-l01
        type: tone
        tests: { words: [好], tone: true }
        prompt: { kind: audio, ref: 好 }
        syllable: 0
        answer: 3
      - id: q-h1-01-s01
        type: readAloud
        tests: { words: [谢谢, 不客气], tone: true }
        sentence: s-h1-01-06
  writing:
    chars: [你, 好, 们]

gate:
  draw: 10
  pool:
    - id: q-h1-01-x01
      type: typePinyin
      tests: { words: [再见] }
      prompt: { kind: hanzi, ref: 再见 }
      answer: zàijiàn
    - id: q-h1-01-x02
      type: order
      tests: { grammar: [h1-g01] }
      tiles: [们, 你, 好]
      answer: s-h1-01-09
    # … ≥ 20 total
```

```yaml
# content/words/你好.yaml
id: 你好
hanzi: 你好
pinyin: nǐ hǎo                 # importer derives spoken: ní hǎo
level: 1
pos: [phrase]
senses: [{ vi: xin chào (dùng với một người ngang hàng) }]
examples: [s-h1-01-01]
image: { file: words/你好.webp, cast: [panda, fawn], prompt: The baby panda waving hello to the fawn }
```

```yaml
# content/chars/你.yaml — generated from vault chars/ + _hanviet.tsv + meo.py
hanzi: 你
readings: [{ pinyin: nǐ, hanviet: nhĩ }]
radical: 亻
ids: ⿰亻尔
strokes: 7
mnemonic:
  kind: etymology
  hinh: Người (亻) đứng trước mặt bạn, chính là 尔 (ngươi) — NGƯƠI/BẠN
  am: Hán-Việt nhĩ — 你好 đọc lối Hán-Việt là "nhĩ hảo"; 尔 cũng là "nhĩ".
  doiThat: câu chào "你好" khắp biển hiệu, nút "关注你" trên app mạng xã hội TQ
  tuongPhan: ≠ 您 (nín, kính ngữ) ≠ 他 (tā, ngôi 3)
```

## Pinyin Primer (Bài 0)

Bài 0 teaches pinyin, not words, so it has its own shape. It shares `id`, `order`, `scene`, `gate` and `Question` with `Lesson`; the importer tells them apart by `kind`.

```ts
interface Primer {
  kind: 'primer';
  id: LessonId;                      // 'h0-00'
  level: 1;                          // sits at the head of HSK1 on the Roadmap
  order: 0;
  title: string;                     // 'Nhập môn'
  titleHanzi: string;                // '拼音'
  scene: { file: string; cast: CastId[]; prompt: string };
  sections: {
    tones: PrimerSection;            // 4 tones + neutral
    finals: PrimerSection;           // a o e i u ü → compounds → nasals
    initials: PrimerSection;         // standard order: b p m f · d t n l · g k h · j q x · zh ch sh r · z c s
    spelling: PrimerSection;         // ü after j q x y, yi/wu/yu, iou→iu, uei→ui, uen→un
    sandhi: PrimerSection;           // 3-3, 不, 一 (vault _quy-tac-phat-am.md)
  };
  gate: { pool: Question[]; draw: number; testOut: true }; // may be taken before the sections
}

interface PrimerSection {
  cards: {
    title: string;                   // 'Thanh 3: xuống rồi lên'
    explain: string;                 // Vietnamese, ≤ 2 sentences
    syllables: string[];             // played on tap: ['mā','má','mǎ','mà','ma']
    pairs?: [string, string][];      // minimal pairs to contrast: [['zhī','jī'], ['bā','pā']]
  }[];
  drills: Question[];                // tone / choice(optionKind: 'pinyin') with Prompt kind 'syllable'
}
```

- Nothing in the Primer enters the Lexicon or makes review cards. Its drill Attempts feed only the per-tone accuracy in Learner Stats.
- Audio key per syllable: `sha256(syllable|narrator)`. The Pinyin Table needs every syllable in `syllables.yaml` × 4 tones ≈ 1,600 clips, rendered once.
- Lint: checks 1–7 and the word-count part of 8 skip `kind: primer`; every `syllables` / `pairs` entry must exist in `syllables.yaml`; each section has ≥ 1 drill; gate pool ≥ 2 × draw and covers all 5 sections.

## Derived at import

| Output | From | Rule |
|---|---|---|
| Spoken pinyin | `pinyin` + sandhi | 3-3 → 2-3 · 不 before tone 4 → bú · 一 by next tone; `spoken` overrides |
| Hán Việt per word | `Char.readings` matched to word pinyin | polyphones pick the reading whose pinyin matches |
| `Word.taughtIn`, Word Page backlinks | `sections.words.ids` + every sentence's `seg` | first lesson that lists it in `words` |
| Audio key | `sha256(hanzi|voice)` per Sentence and Word, normal speed only | voice = speaker's Cast voice, else default narrator; slow play is the client replaying at 0.5× |
| `seg` | longest match against Dictionary, preferring lesson words | author override wins |
| Warm-up set | due Lexicon cards + previous lesson's words | runtime, not import |
| Gate draw | `gate.pool` | `draw` random items, covering every `words` id at least once across pool |
| Dictionary link | Dictionary row `word_id` | set when a Word with the same hanzi + pinyin is taught |

## Postgres

| Table | Key | Notes |
|---|---|---|
| `chars` | `hanzi` | JSONB `readings`, `mnemonic` |
| `words` | `id` | `taught_in` FK lessons |
| `word_chars` | `(word_id, pos)` | char order in word |
| `sentences` | `id` | `spoken`, `seg[]`, `audio_key` |
| `grammar_points` | `id` | |
| `lessons` | `id` | `(level, order)` unique; JSONB `sections` (ids only) |
| `lesson_words` / `lesson_grammar` | pair | backlinks, Roadmap counts |
| `questions` | `id` | JSONB body; `lesson_id`, `role` = drill / dialogue / listen / gate / mock |
| `dictionary` | `id` | 122k thin rows; `word_id` nullable |
| `content_versions` | `sha` | one row per import; questions are never deleted, so old Attempts still resolve |

Content tables: `select` for authenticated Learners, no writes (RLS). Attempts reference `question_id` + `content_sha`.

## Linter (from `_lesson-contract.md`)

| # | Check | Fails when |
|---|---|---|
| 1 | Hán Việt | any `Char.readings[].hanviet` empty or `—`; MIXED Nôm readings used |
| 2 | Polyphones | a char with ≥2 common readings lists fewer in `readings` |
| 3 | Tone marks | pinyin without marks or with digits in authored fields |
| 4 | Sandhi | sentence with 一/不 where derived spoken ≠ `spoken` override (flag to review) |
| 5 | 80% known chars | a sentence uses a char outside known-so-far (all earlier lessons' words + this lesson's) and not in `unknown` |
| 6 | Real glyphs | any code point in U+2E80–U+2FDF |
| 7 | Mnemonic reuse | `mnemonic` differs from vault `meo.py` output for that char |
| 8 | References | unknown word / sentence / grammar / Cast id; word count outside 8–15; gate pool < 2 × draw; a lesson word never tested in gate pool |
| 9 | Audio | sentence `speaker` is not a speaking Cast member (redpanda, takin); dialogue speakers not alternating voices |

## Open decisions

1. Do words listed in `sections.words` include single chars that also appear inside a compound (你 and 你好), or only the compound?
2. ~~Grammar point ids~~ **Decided 2026-10-26:** ids stay our own `h<L>-gNN`; each point carries `std` = the GF 0025-2021 item numbers it teaches. Lint: no item above the lesson level, at least one item at exactly that level.
3. Cast voice per member (and gender) waits on the VoiceStudio spike.
4. Mock Test sections need a `MockSection` type (timing, play limits, HSKK parts); deferred to P2.
