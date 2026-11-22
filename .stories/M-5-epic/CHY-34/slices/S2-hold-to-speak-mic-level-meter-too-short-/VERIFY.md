# CHY-34 S2 — verify
Env: vite dev on :5199 from the M-5 stack tip (CHY-39 branch), local Supabase, agent-browser (Chrome 156 headless, session `verify-a`), 2026-11-17. Routes: `/dev/speak` (3 speak steps, IndexedDB `chaiyo-dev-speak`) and the real `/lesson/h1-01/listenSpeak` signed in as a fresh OTP user.

**Mic source.** Chrome launched with `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` (confirmed on the process). Headless Chrome on macOS still answered `NotAllowedError`, even after a CDP `Browser.setPermission microphone=granted`. That denial is the AC5 run. For AC2/AC3 the page's `navigator.mediaDevices.getUserMedia` was replaced in-page by a WebAudio oscillator stream (`MediaStreamDestination`). The real `Speak.svelte`, `openMic`, `AudioContext` and `AnalyserNode` ran unchanged. The same script spied on `MediaRecorder`, `fetch`, XHR, `sendBeacon`, `Storage.setItem`, `indexedDB.open`, track `stop()` and `AudioContext.close()`.

| AC | Verdict | Evidence |
|---|---|---|
| AC2 | ✅ | Idle: button "Giữ để nói", area "Giữ nút đỏ bên dưới khi nói, nói xong thì thả." Mouse down 3.3 s → 28 `[data-bar]`, timer "0:01" then "0:03", caption "Đang nghe… thả nút khi nói xong", button "Thả khi nói xong" (`ac2-live-3s.png`). With an amplitude-modulated input the bar heights change frame to frame: `61,61,61,59,53…5,5,…25` → all `61` → `61,61,57,51…5…31` (`ac2-bars-moving.png`). Release → "Tiếp", still "1/3" (the release click did not press it); a new tap → "2/3". 0.3 s tap → "Ngắn quá — giữ nút lâu hơn một chút rồi nói.", button back to "Giữ để nói" (`ac2-too-short.png`). Keyboard: trusted CDP Space keyDown 1.6 s → "0:01 · Đang nghe…", "Thả khi nói xong"; keyUp → "Tiếp", still "3/3". Real route `/lesson/h1-01/listenSpeak` → "1/3" "Nói · đọc to" / "Đọc to câu này" / 不客气。 / bú kèqi / Không có gì.; "2/3" "Nói · trả lời" / "Bạn làm đổ trà của bạn mình. Nói gì?"; "3/3" "Bạn gặp cô giáo ở cổng trường. Chào cô." (`ac2-real-step1.png`). |
| AC3 | ✅ | Spy totals over press → hold → release ×5 on `/dev/speak`: `opened:5, stopped:5, ctxClosed:5, recorders:0, net:[], storage:0`. `idbOpen:1` was the verifier's own row reader. `performance.getEntriesByType('resource')` after page load → `[]`. ✕ "Lưu và về bài học" pressed mid-hold → `opened:1, stopped:1, ctxClosed:1`. Stored Attempts: `dev-s01/f01/f02` and real `q-h1-01-s01/f01/f02` each `{correct:null, ms:0}` with keys `at, contentSha, id, ms, questionId, step` only. No audio field. |
| AC5 | ✅ | Real denied mic (`NotAllowedError`): hold → "Không dùng được micro — bỏ qua phần nói, phần học vẫn tính là xong.", button "Bỏ qua" (`ac5-blocked.png`); mouse up did not press "Bỏ qua" (still "1/3"). "Bỏ qua" ×3 → `finished`, 3 Attempts `correct:null`. On the real route the 3rd step's end went to the lesson hub ("Phần học"). |

**The AC2 row is scoped.** Proven: the full hold flow on pointer and Space. Not proven live: the exact 0.69 s / 0.70 s boundary, which a browser can't time to the millisecond (`hold.test.ts` covers it). Also not proven: a real microphone signal. The input was synthetic because headless Chrome here refuses mic permission.

## Tests
`vitest --run --coverage` on the stack tip: Tests 3164 passed | 2 skipped, branches 79.19% (one run, this tree).

## Residual risk
- Headless Chrome on this Mac cannot open the fake mic; a headed manual run with a real mic is still worth one pass before release.
