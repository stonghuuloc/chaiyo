# CHY-27 S1 — spec
ACs: AC1, AC2, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb; **builds on CHY-26 S1**)

## Behaviour
- [AC1] `src/lib/welcome/welcome.ts` (new, pure) also exports `canNext(s) = s.step !== 0 || s.name.trim() !== ''`, `pickPreset(s, t)`, `pickCustom(s, t)`, `pressed(s)` and `noChannel(s)`.
- [AC1] `fromUser(user)` → `{ step: 0, name, photo, email, time: '21:00', push: false, pushDenied: false, emailOn: true, telegram: false }` with `name = (meta.full_name || meta.name || '').trim().slice(0, 30)`, `photo = meta.avatar_url || meta.picture || null`, `email = user?.email ?? ''`, with `meta = user?.user_metadata ?? {}`. `initials(name)` = first letters of the last 2 words, upper case, "?" when empty (prototype/o1-welcome.html:76).
- [AC1] `/welcome` (`src/routes/(onboard)/welcome/+page.svelte`, replaces CHY-26 S1's stub): a 3-segment progress bar and a back button (hidden on step 0). Step 0: h2 "Chào bạn!" (reuses CHY-26 S1's `welcome_title`), lead "Đây là tên và ảnh bạn bè sẽ thấy. Lấy từ tài khoản Google, sửa được.", the photo (or initials) with a camera button that opens a hidden `<input type=file accept="image/*">` and previews the chosen file, the email in small text, and the field "Tên hiển thị" (`maxlength=30`). "Tiếp" is disabled while `name.trim()` is empty.
- [AC2] Step 1: h2 "Nhắc học mỗi ngày", lead "Mỗi ngày một lời nhắc, đúng giờ bạn chọn.", label "Giờ nhắc" with 3 preset buttons "07:00 Sáng", "12:30 Trưa", "21:00 Tối" (`aria-pressed` = `time === preset`) and "Giờ khác" with `<input type=time>`. Picking a value there sets `time` to it, and no preset is pressed unless the value equals one; an empty value is ignored (time unchanged, prototype/o1-welcome.html:119). Label "Nhắc qua": switches (`role=switch`, `aria-checked`) "Thông báo" ("Trên máy này"), "Email" (the email) and "Telegram" ("Mở @ChaiyoBot để kết nối"); the meta line "Đổi lúc nào cũng được ở Tôi → Cài đặt.".
- [AC4] With push, email and Telegram all off, the hint "Không chọn kênh nào: sẽ không có lời nhắc" shows under "Tiếp" and "Tiếp" stays enabled (`noChannel(s)`).
- [AC4] Step 2 (offer): "Bạn đã biết tiếng Trung chưa?", lead "Làm bài kiểm tra để bỏ qua phần đã biết.", three ticks ("Chỉ đọc và nghe.", "Câu khó dần. Không biết thì bấm “Không biết”.", "Bài tự dừng khi tới trình độ của bạn."), primary "Kiểm tra trình độ" (wired in S2: `/placement` exists only after CHY-28 S2, and `resolve()` type-checks only existing routes, WAVE-PLAN C-M4-3), text button "Học từ đầu" → `goto(resolve('/(app)/(tabs)/today'))`. Saving is S2.
- [AC2] In this slice the "Thông báo" switch toggles `push` only; the permission prompt is S2.
- [CHORE] Copy in messages/vi.json (`welcome_*`). `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- AC3 permission prompt, AC5 saving, AC6 Home/Placement outcome with saved data → S2.

## Seam
None new.

## Test contract
CI (vitest, node, `src/lib/welcome/welcome.test.ts`):
- [AC1] `fromUser({ email: 'tong.loc@gmail.com', user_metadata: { full_name: 'Tống Lộc', avatar_url: 'https://lh3.googleusercontent.com/a/x' } })` → name "Tống Lộc", photo that URL, time "21:00", emailOn true, push false, telegram false. `user_metadata: { name: 'Lộc' }` → "Lộc". `user_metadata: {}` → name "", photo null. `fromUser(undefined)` (null session) → name "", photo null, email "". `full_name: ''` with `name: 'Lộc'` → "Lộc" (the rule uses `||`, not `??`). A 35-character `full_name` → its first 30 characters; `'  ' + 'a'.repeat(32)` → `'a'.repeat(30)`.
- [AC1] `initials('Tống Lộc')` → "TL"; `initials('  ')` → "?"; `canNext({ step: 0, name: '  ' })` → false; `{ name: 'Lộc' }` → true.
- [AC2] `pickCustom(s, '06:15').time` → "06:15"; `pressed(s)` for that state → none of the 3 presets; `pickPreset(s, '07:00')` → pressed "07:00" only; the initial state → "21:00" only; `pickCustom(s, '').time` → "21:00" (unchanged).
- [AC4] `noChannel` → true only when push, emailOn, telegram are all false (8 combinations).
Local proof (tester, Mac, `supabase start`, `pnpm dev --host 127.0.0.1`, Playwright Chromium): make the learner with the service role (`auth.admin.createUser({ email: 'tong.loc@gmail.com', email_confirm: true, user_metadata: { full_name: 'Tống Lộc', avatar_url: … } })`), sign in by link (CHY-26 S1) → `/welcome`:
- [AC1] the two texts; field value "Tống Lộc", `maxlength` 30; clear it → "Tiếp" disabled; type "Lộc" → enabled.
- [AC2] step 1: "21:00" pressed; fill "Giờ khác" with 06:15 → all 3 presets `aria-pressed=false`, the time input holds 06:15.
- [AC4] switch Email off (push and Telegram are off) → the hint shows; "Tiếp" → offer step; "Học từ đầu" → `/today`.

## Open assumptions
- None.
