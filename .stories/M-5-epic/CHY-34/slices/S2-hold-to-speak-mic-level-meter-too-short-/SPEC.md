# CHY-34 S2 — spec
ACs: AC2, AC3, AC5  ·  Repo: chaiyo  ·  rev 2

## Behaviour
- [AC2] A `speak` step kind exists in `LessonStep`. It renders an ask line, a title, and either a
  target sentence (hanzi 不客气。, pinyin bú kèqi, meaning "Không có gì.") or a free-answer prompt
  ("Bạn làm đổ trà của bạn mình. Nói gì?"), plus a recorder area. (Sample-clip playback reads
  `sentence.audio` from CHY-33.S1's bundle field — not in this slice's ACs, so no play button here.)
- [AC2] The section "Nghe & nói" (`[section]` = `listenSpeak`) turns every `readAloud` item into a
  speak step titled "Đọc to câu này" with its sentence's hanzi / spoken pinyin / vi, and every
  `freeAnswer` item into a speak step titled with its prompt text. h1-01 → 3 speak steps (s01, f01, f02).
- [AC2] Idle: the bottom red button reads "Giữ để nói"; the recorder area reads
  "Giữ nút đỏ bên dưới khi nói, nói xong thì thả."
- [AC2] Press-and-hold the red button (pointer down, or Space/Enter key down) → the browser
  microphone opens (`getUserMedia({ audio: true })`). While opening: "Đang bật micro…".
- [AC2] Mic on → 28 level bars that move with the live input level every animation frame, a timer
  `m:ss` that starts at "0:00" and reads "0:03" after 3 s, caption "Đang nghe… thả nút khi nói xong",
  and the button reads "Thả khi nói xong".
- [AC2] Release (pointer up / cancel, key up) after ≥ 700 ms of mic-on time → recording ends; the
  button becomes "Tiếp" and advances to the next step with no answer.
- [AC2] Release after < 700 ms of mic-on time, or before the mic opened → the area shows
  "Ngắn quá — giữ nút lâu hơn một chút rồi nói." and the button returns to "Giữ để nói"; the learner
  can hold again. 0.69 s → too short; 0.70 s → accepted.
- [AC2] [AC5] The click a browser fires after a hold ends (pointer up, Space key up) never presses the
  button that replaced it: a release that turns the button into "Tiếp" or "Bỏ qua" needs a new tap.
- [AC2] A release with no press in progress (e.g. the Enter key up left over from the previous step's
  "Tiếp") changes nothing: no too-short copy, button stays "Giữ để nói".
- [AC3] The audio stream feeds only an `AnalyserNode`. No `MediaRecorder` is created, no sample buffer
  outlives one analyser frame, and no `fetch`, `XMLHttpRequest`, `sendBeacon`, `localStorage`,
  `sessionStorage` or IndexedDB call carries audio.
- [AC3] On release, on step change and on unmount mid-hold — including while the mic is still opening
  (stream arrives after unmount) — every track of the stream is stopped and the `AudioContext` is closed.
  If the `AudioContext` cannot be built after the stream opened, the tracks are stopped and the step
  shows the blocked state (AC5).
- [AC3] The Attempt the runner records for a speak step holds no audio: `next()` is called with no
  answer (`correct: null`, recorded by CHY-30.S2).
- [AC5] Press when the mic is unavailable — `getUserMedia` rejects (NotAllowedError, NotFoundError,
  any error) or `navigator.mediaDevices` is undefined → the area shows
  "Không dùng được micro — bỏ qua phần nói, phần học vẫn tính là xong." and the button reads "Bỏ qua".
- [AC5] "Bỏ qua" calls `next()` with no answer. On the last step it finishes the section, so a learner
  with a blocked mic completes "Nghe & nói" (3 of 3 steps → `onfinish`).
- [LOCK] Pronunciation is not scored (E11). This slice shows no score.

## Not this slice
- AC1 tone / word / meaning listening questions and the talking clip → S1 (wave 3).
- AC4 sample tiles, "Kết quả mẫu (chưa chấm thật)", hint "Chưa chấm điểm thật…", "Nói lại" → S3.
- AC6 free-answer reveal 对不起！ / "Xin lỗi!" after speaking or skipping → S3.
- Ledger recording, resume, `ledger` prop → CHY-30.S2. `data.lesson` loading → CHY-25.S2.
  `[section]` map + switch → CHY-33.S1.

## Seam
`src/lib/lesson/steps/Speak.svelte` (`kind = 'speak'`) + optional `Cta.hold` on the runner's CTA.
Mic open/close + hold timing live in `src/lib/speak/`.

## Test contract
- [AC2] `hold.test.ts` (node): `held(0, 699)` → `'short'`, `held(0, 700)` → `'done'`; release before
  mic-on → `'short'`; `clock(3_000)` → `'0:03'`, `clock(61_000)` → `'1:01'`; `bars(levels)` keeps 28.
- [AC2] `Speak.svelte.test.ts` (jsdom, stubbed `getUserMedia` + `AudioContext`, fake timers):
  idle CTA "Giữ để nói" with `hold`; `onpress` → CTA "Thả khi nói xong", 28 `[data-bar]`, timer "0:03"
  after 3 s; `onrelease` at 3 s → CTA "Tiếp", click → `next()` called once with no argument;
  `onrelease` at 0.5 s → "Ngắn quá…" text, CTA "Giữ để nói", `next` not called; `onrelease` with no
  press → idle copy unchanged.
- [AC2] `StepRunner.svelte.test.ts`: a step that sets `hold` → `pointerdown` on the CTA calls
  `onpress` once, `pointerup` calls `onrelease` once; Space keydown/keyup does the same; a step
  without `hold` keeps click behaviour (existing tests unchanged); pointerdown → pointerup at 3 s →
  `click` → `next` not called, a second `click` → `next` called once [AC2]; same with Space keyup [AC2];
  blocked mic: pointerdown → pointerup → `click` → still on the blocked copy [AC5].
- [AC2] `listen-speak.test.ts`: h1-01 fixture bundle → 3 steps, first `{ kind:'speak', id:'q-h1-01-s01',
  hanzi:'不客气。', pinyin:'bú kèqi', meaning:'Không có gì.' }`; tone/choice items skipped.
- [AC3] `Speak.svelte.test.ts`: spies on `fetch`, `navigator.sendBeacon`, `MediaRecorder` ctor,
  `Storage.prototype.setItem`, `indexedDB.open` → 0 calls across press → 3 s → release; every stub
  track's `stop()` called once and `AudioContext.close()` called once; unmount mid-hold → same;
  unmount while `getUserMedia` is pending, then resolve → tracks stopped; `AudioContext` ctor throws →
  tracks stopped, blocked copy.
- [AC5] `Speak.svelte.test.ts`: `getUserMedia` rejects `NotAllowedError` → skip copy, CTA "Bỏ qua";
  `navigator.mediaDevices` undefined → same; click "Bỏ qua" → `next()` with no argument.
- [AC2] [AC5] Verify stage: agent-browser on `/dev/speak` with Chrome fake media
  (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`): hold 3 s → bars move, "0:03";
  tap → too-short copy. Mic permission denied → skip copy, "Bỏ qua" ×3 → finished.
  Network log over the whole run: 0 requests after page load.

## Open assumptions
- none. (Q1 answered C — `DISCUSSION.md` Resolved.)
