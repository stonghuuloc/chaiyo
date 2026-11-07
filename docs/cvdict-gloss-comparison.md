# CVDICT vs promoted HSK1 word glosses — 30-word sample

**Comparison only (issue #51 / LOC-107).** This PR adds one document. `content/` is untouched: no word entry, sentence or level file was regenerated or edited.

## Why this sample

The word-entry pipeline (`scripts/gen-entries.py`) already hands the editor model CVDICT’s Vietnamese glosses per reading as `cvdict_vi` — an aid, not the gloss source. LOC-107 asks whether CVDICT should feed the generator as the Vietnamese gloss source itself. This sample puts each raw CVDICT entry beside the promoted `content/words` gloss for 30 HSK1 words and records where each is better or worse.

## Data and method

- **CVDICT** — `CVDICT.u8` from [ph0ngp/CVDICT](https://github.com/ph0ngp/CVDICT) at `main` (`c379d909`, 2025-02-09), CC BY-SA 4.0. 122,597 data lines; 122,596 parse with the standard `trad simp [numbered pinyin] /gloss/gloss/…/` shape (one line with nested brackets does not). Sha256 of the file: `4dde4b204193efa9c192d7f7daeab1bb579c8ccd7c41ed90d1b6caee22ba0948`.
- **Current glosses** — `content/words/`: 547 word files at `level: 1` (506 plain entries plus 41 polyphone-reading splits); 546 of them are the HSK1 set promoted by `dd750eb`, and `你好.yaml` predates it.
- **Reference English** — CC-CEDICT senses from the pinned HSK list `drkameleon/complete-hsk-vocabulary@7ac65bf`, the source the generator edits.
- **Matching** — same simplified headword and the same numbered pinyin. The entry’s tone-marked `pinyin` is converted to tone digits (`dōng xi` → `dong1 xi5`); where a headword has several CVDICT rows, the lower-case (non-surname) row for that reading is used. All 30 words matched a CVDICT row exactly on the numbered pinyin — no fallback or fuzzy match was needed.
- **Sample** — 30 HSK1 words, chosen for coverage rather than by known strength: 10 grammatical/function words (的 了 呢 很 太 都 也 就 不 是), 10 single-character content words (人 大 小 好 多 水 天 看 说 走), 10 multi-character words (谢谢 对不起 没关系 不客气 再见 老师 学生 朋友 东西 什么). Every word is `level: 1` in `content/`.

The `cvdict_vi` aid the generator reads comes from `prototype/data/dict.json`, which was built by `scripts/build-dict.py` from `DucThanhNguyen/han-thong` — a repack of CVDICT plus per-reading Hán Việt. That repository is now 404. For 28 of the 30 sample readings the repack’s items are identical to this `CVDICT.u8` after `build-dict.py` strips the `LT:` classifier tags; 2 differ in wording (朋友 carries an extra `bạn bè`, 什么 an extra `cái gì`). So the existing aid and the canonical file are the same lineage, not two dictionaries.

## Verdicts at a glance

| Verdict | Count | Words |
| --- | --- | --- |
| Current ahead | 18 | 了 呢 很 太 都 就 是 大 小 好 水 天 看 说 走 没关系 东西 什么 |
| Even | 10 | 不 人 多 谢谢 对不起 不客气 再见 老师 学生 朋友 |
| Mixed | 2 | 的 也 |
| CVDICT ahead | 0 | — |

**Bottom line:** keep CVDICT as the sense/coverage input it already is, not as the Vietnamese gloss source. Raw CVDICT never produced the better HSK1 entry in this sample: for these words it reads like a first-pass translation, not a learner dictionary. Its value is in coverage (below) and in the 122,596 entries, far beyond the 4,233 rows of `dict.json`.

## Where CVDICT is better

1. **It keeps CEDICT’s sense inventory, item by item** (occasionally two CEDICT senses are joined with `;`). In the sample it holds two senses the promoted entries folded away — `的`’s sentence-final emphasizer (`dùng cuối câu trần thuật để nhấn mạnh`) and `也`’s `both … and …` pattern (`vừa … vừa …`) — and it names classifiers for 人, 老师, 朋友 and 东西 (`個|个`, `位`, `件`). The Word schema has no classifier field, so those tags are lost today by design.
2. **Because its items follow CEDICT’s order, it doubles as a coverage checklist.** A sense-by-sense audit can be made directly against the file. The current entries regroup senses by part of speech and learner need; their mapping from each CEDICT sense to the output sense (the model’s `src` / `dropped` fields) is checked when the entry is generated but not persisted — the staged `src/<id>.json` holds the numbered CEDICT senses, not the mapping.
3. **It covers far more headwords than `dict.json`’s 4,233 rows** (the HSK1–5 word list): the compounds and phrases beyond the HSK list, which is the raw material any Chuyên đề side-track vocabulary would need.

## Where CVDICT is worse

1. **It translates the English, not the Chinese usage.** It is an AI translation of CC-CEDICT definitions, so CEDICT’s English ambiguity comes through — and sometimes a mistranslation:

   | Word | CEDICT English | CVDICT | Current |
   | --- | --- | --- | --- |
   | 很 | adverb of degree; quite; very; awfully | `(phó từ mức độ)` / `khá` / `rất` / `cực kỳ` | `rất` |
   | 太 | highest; greatest; too (much); very; extremely | `cao nhất` / `vĩ đại` / `quá (nhiều)` / `rất` / `cực kỳ` | `quá, quá mức` / `rất, thật là (cảm thán)` |
   | 天 | day; sky; heaven | `ngày` / `trời` / `thượng đế` | `ngày` / `trời (bầu trời, thời tiết)` / `ông trời (天啊)` |
   | 大 | greatly; freely; fully | `rất; thoải mái; hoàn toàn` | `rất, hết sức, hoàn toàn` |
   | 走 | from; through | `từ` / `xuyên qua` | `đi qua, đi theo (đường)` |

   For 很 the generator prompt explicitly warns that CEDICT’s `quite` must be `rất`, not `khá`; CVDICT takes exactly the trap the editor avoids.

2. **Grammar explanations instead of glosses.** For particles and function words CVDICT gives a description, not a Vietnamese equivalent: `了` `(trợ từ chỉ hành động đã hoàn thành)` vs current `đã, xong (đặt sau động từ)`; same shape for 呢, 的, 就. The learner-facing word is missing.
3. **Structural noise that is not a gloss.** In this sample 7 of 131 CVDICT items carry no learner gloss: 4 classifier pointers (3 `LT:` tags plus 东西’s `lượng từ: 個|个[ge4], 件[jian4]`), 2 POS labels (`(phó từ mức độ)` for 很, `(phó từ để nhấn mạnh)` for 是) and 1 `cũng đọc là …` reading note. `build-dict.py` drops the `LT:`-prefixed tags and `biến thể` rows, but the `lượng từ:` pointer, POS labels and reading notes survive as if they were glosses (the classifier data itself is worth keeping in a real field).
4. **Over-splitting and no learner flags.** CVDICT splits synonyms the learner reads as one gloss (小 `nhỏ` / `bé` / `trẻ`, 东西 `đồ vật` / `thứ`) and carries no rare/common flag, no bound-form marker in the schema’s terms, and no “chỉ dùng trong …” compound list. Current entries label `rare: true` and name the compounds (水 → `药水, 香水, 墨水, 汗水`).
5. **No examples.** CVDICT ships no example sentences; the generator needs one per sense (Tatoeba or AI supplies them regardless).

## What the sample exposed in the current glosses

Observations only — this PR does not change content:

- `好` repeats the same gloss twice (`tốt, khỏe, hay` and `tốt, hay, khỏe`, the second with pos and example). A generator or lint defect, not a CVDICT issue.
- `的` has no sentence-final emphasizer and `也` folds `both … and …` into `cũng`. Whether those were dropped for a reason at generation time or missed cannot be told from the repository: the model’s `src` / `dropped` answer is validated by `scripts/gen-entries.py` but not persisted, and the staged `src/<id>.json` holds the numbered CEDICT senses, not the mapping.
- `学生` adds `sinh viên` beyond CEDICT’s `student / schoolchild`; `没关系` adds `không liên quan` beyond CEDICT’s single sense. Both are defensible editor additions, but they are not traceable to the committed content.

## Recommendation for LOC-107

1. **Do not copy raw CVDICT into glosses.** 18 of 30 HSK1 entries would get worse and none would get better; the literal-English failure mode (太 `vĩ đại`, 天 `thượng đế`, 很 `khá`, 走 `từ`) is exactly what the editor is for.
2. **Keep CVDICT as the coverage/reference input** and keep the editor. Add the sense audit to the generated entry itself: along with the promoted YAML, commit (or keep alongside) the mapping from each CEDICT sense to the output sense or its drop reason. Then a CVDICT cross-check can flag a missing sense with the CVDICT wording attached.
3. **If the goal is the plumbing** — the current `cvdict_vi` comes from a 404’d repack — rebuild `dict.json` from `ph0ngp/CVDICT.u8` plus Hán Việt from `ph0ngp/hanviet-pinyin-wordlist` (MIT): `CVDICT.u8` has no Hán Việt column, and that word list is traditional-only, so the join needs trad→simp (opencc, already a project dependency). Diff the rebuild against the committed `dict.json` before trusting it: the sample already shows 2 wording differences between the two CVDICT copies.

## Limitations

- 30 HSK1 words is a small sample, and HSK1 is the least favourable case for raw CVDICT: the words are basic and polysemous, and these entries went through the CHY-12 review rounds. HSK2–5 compounds may land differently.
- The verdicts are a reading against what a Word entry needs (an accurate gloss per CEDICT sense, natural learner Vietnamese, rare/bound/compound notes, one example per sense), not a corpus measurement. The per-word glosses and notes are listed so any verdict can be re-argued.
- CVDICT is an AI translation by its author’s own description (ChatGPT-4o fine-tune, hand-checked), so occasional errors are expected and acknowledged upstream.

## Word-by-word

### Current ahead (18)

The promoted gloss is the better word entry; CVDICT adds noise, a literal translation of CEDICT’s English, or nothing.

#### 了 — le5

- **Current** (`content/words/了.yaml`, `le`): `đã, xong (đặt sau động từ)` · `rồi (cuối câu, chỉ sự thay đổi)` · `quá, lắm (chỉ đi sau 极, 死, 坏, 多: 极了, 死了, 坏了; chỉ dùng trong 极了, 死了, 坏了, 多了)`
- **CVDICT** (`[le5]`): `(trợ từ chỉ hành động đã hoàn thành)` · `(trợ từ ngữ khí chỉ sự thay đổi trạng thái, tình huống hiện tại)` · `(trợ từ ngữ khí nhấn mạnh mệnh đề đứng trước)`
- **Why:** Same three functions, but CVDICT describes the grammar (`trợ từ chỉ hành động đã hoàn thành`) where current gives the Vietnamese a learner can use (`đã, xong`, `rồi`).

#### 呢 — ne5

- **Current** (`content/words/呢.yaml`, `ne`): `thì sao, còn ... thì sao (hỏi tiếp)` · `đâu (hỏi vị trí)` · `đang (cuối câu: việc, trạng thái còn tiếp diễn)` · `đấy, kìa (khẳng định mạnh, cuối câu)` · `thì (ngắt giọng sau chủ đề, nhấn mạnh)`
- **CVDICT** (`[ne5]`): `trợ từ chỉ rằng câu hỏi được hỏi trước đó áp dụng cho từ đứng trước ("Còn ...?", "Và ...?")` · `trợ từ để hỏi về địa điểm ("Ở đâu ...?")` · `trợ từ biểu thị ngắt quãng, nhấn mạnh từ đứng trước và cho người nghe thời gian tiếp nhận ("được không?", "bạn hiểu không?")` · `(cuối câu trần thuật) trợ từ chỉ sự tiếp tục của trạng thái hoặc hành động` · `trợ từ chỉ sự khẳng định mạnh mẽ`
- **Why:** Same five uses; CVDICT translates CEDICT’s long English descriptions literally, current compresses them to `thì sao`, `đâu`, `đang`, `đấy`, `thì`.

#### 很 — hen3

- **Current** (`content/words/很.yaml`, `hěn`): `rất`
- **CVDICT** (`[hen3]`): `(phó từ mức độ)` · `khá` · `rất` · `cực kỳ`
- **Why:** CVDICT leads with a POS label, keeps CEDICT’s `quite` as `khá` — the exact trap the generator prompt warns about for 很 — and lists `rất` and `cực kỳ` separately. Current is just `rất`.

#### 太 — tai4

- **Current** (`content/words/太.yaml`, `tài`): `quá, quá mức` · `rất, thật là (cảm thán)`
- **CVDICT** (`[tai4]`): `cao nhất` · `vĩ đại` · `quá (nhiều)` · `rất` · `cực kỳ`
- **Why:** CVDICT carries CEDICT’s archaic `highest; greatest` as `cao nhất; vĩ đại`, confusing for an HSK1 adverb entry; current keeps only the two live adverbial senses.

#### 都 — dou1

- **Current** (`content/words/都.yaml`, `dōu`): `đều, tất cả, cả` · `đã (nhấn mạnh thời điểm)` · `ngay cả, đến (cũng; chỉ dùng trong 连…都)` · `(không) chút nào, hề (không; chỉ dùng trong 一点都不, 一点都没)`
- **CVDICT** (`[dou1]`): `tất cả; cả hai; hoàn toàn` · `(dùng để nhấn mạnh) thậm chí` · `đã` · `(không) chút nào`
- **Why:** Same four senses. Current adds the bound patterns (`连…都`, `一点…都`) the learner needs; CVDICT’s `cả hai` adds nothing.

#### 就 — jiu4

- **Current** (`content/words/就.yaml`, `jiù`): `ngay, liền, sắp (nhanh, sớm)` · `hễ… là…, vừa… là… (mẫu 一…就…)` · `thì (sau mệnh đề giả định)` · `chính, đúng là, chỉ là (nhấn mạnh)` · `chỉ có, mới có (số lượng ít)` · `đến tận, nhiều đến (số lượng)` · `về, đối với, xét về` · `kèm với, ăn với (đồ ăn; thường dùng 就着)` · `nhân lúc, dựa vào (thường dùng 就着)` · `đảm nhận, nhận (việc, chức; chỉ dùng trong 就业, 就职, 就任)` · `lại gần, lấy gần (chỉ dùng trong 就近, 就医)` · `dù… cũng… (mẫu 就…也…)` · `không… thì… (mẫu 不…就…)`
- **CVDICT** (`[jiu4]`): `(sau một mệnh đề giả định) trong trường hợp đó; thì` · `(sau một mệnh đề hành động) ngay khi; ngay sau khi` · `(giống như 就是[jiu4 shi4]) chỉ; không gì khác ngoài; đơn giản là; chỉ là; chính xác; đúng` · `chỉ có; ít nhất là` · `nhiều đến; nhiều như` · `tiếp cận; tiến về` · `phụ trách; tham gia vào` · `(thường theo sau bởi 著|着[zhe5]) tận dụng` · `(về thức ăn) ăn cùng` · `về; liên quan đến` · `(mẫu câu: 就[jiu4] ... 也[ye3] ...) ngay cả nếu ... vẫn ...` · `(mẫu câu: 不[bu4] ... 就[jiu4] ...) nếu không ... thì phải ...`
- **Why:** Both list ~12 senses; CVDICT reads as translated CEDICT (`(sau một mệnh đề giả định) trong trường hợp đó; thì`), current is shorter, marks rare/bound senses and keeps the same coverage.

#### 是 — shi4

- **Current** (`content/words/是.yaml`, `shì`): `là` · `đúng, phải` · `vâng, dạ (đáp lại mệnh lệnh)` · `quả là, đúng là (nhấn mạnh)`
- **CVDICT** (`[shi4]`): `là (chỉ theo sau bởi danh từ)` · `đúng; phải; thật` · `sự thừa nhận tôn kính một mệnh lệnh: rất tốt` · `(phó từ để nhấn mạnh)`
- **Why:** Same four senses; CVDICT’s third is a literal rendering of CEDICT’s description (`sự thừa nhận tôn kính một mệnh lệnh: rất tốt`), current `vâng, dạ (đáp lại mệnh lệnh)`.

#### 大 — da4

- **Current** (`content/words/大.yaml`, `dà`): `to, lớn` · `lớn tuổi, nhiều tuổi` · `cả, lớn nhất (anh chị em; chỉ dùng trong 大哥, 大姐, 大伯)` · `rất, hết sức, hoàn toàn (chỉ dùng trong 大有, 大笑, 大哭, 大吃一惊, 大受欢迎)` · `cha, bố (phương ngữ)`
- **CVDICT** (`[da4]`): `to; lớn; vĩ đại` · `lớn tuổi hơn` · `người lớn nhất (như trong 大姐[da4 jie3])` · `rất; thoải mái; hoàn toàn` · `(phương ngữ) cha` · `(phương ngữ) chú (anh em của cha)`
- **Why:** CVDICT mistranslates CEDICT’s `freely` as `thoải mái` in `rất; thoải mái; hoàn toàn`; current `rất, hết sức, hoàn toàn`, and its compound notes (`大哥, 大姐, 大伯`) are more useful than CVDICT’s raw dialect list.

#### 小 — xiao3

- **Current** (`content/words/小.yaml`, `xiǎo`): `nhỏ, bé` · `nhỏ tuổi, ít tuổi` · `một chút, ít (trong 小有名气, 小半)`
- **CVDICT** (`[xiao3]`): `nhỏ` · `bé` · `một vài` · `trẻ`
- **Why:** CVDICT splits `nhỏ` / `bé` / `trẻ` — one Vietnamese distinction spread over three items; current merges `nhỏ, bé` and marks `nhỏ tuổi`, `một chút` correctly.

#### 好 — hao3

- **Current** (`content/words/好.yaml`, `hǎo`): `tốt, khỏe, hay` · `tốt, hay, khỏe` · `hợp, thích hợp` · `thân, thân thiết (hai người)` · `quá, thật là (nhấn mạnh, trước tính từ)` · `mấy, khá nhiều (trước số từ: 好几个, 好几天)` · `dễ (đứng trước động từ: 好用, 好找)` · `tốt để, dễ chịu khi (đứng trước động từ: 好吃, 好听, 好睡)` · `xong, hoàn tất (sau động từ)` · `được, ừ được (đồng ý)` · `chào (đứng sau đại từ)`
- **CVDICT** (`[hao3]`): `tốt` · `thích hợp; đúng` · `(trước động từ) dễ` · `(trước động từ) tốt để` · `(trước tính từ để nhấn mạnh) rất` · `(bổ ngữ động từ chỉ sự hoàn thành)` · `(hai người) thân thiết; có quan hệ gần gũi` · `(sau đại từ nhân xưng) xin chào`
- **Why:** Current gives 11 learner-ready senses with notes against CVDICT’s 8 translated descriptors — but its first two senses are near-duplicates (`tốt, khỏe, hay` / `tốt, hay, khỏe`), a defect of the promoted entry, not of CVDICT.

#### 水 — shui3

- **Current** (`content/words/水.yaml`, `shuǐ`): `nước` · `chất lỏng (chỉ dùng trong 药水, 香水, 墨水, 汗水)` · `đồ uống (chỉ dùng trong 茶水, 酒水, 汽水)` · `sông (chỉ dùng trong tên sông như 汉水, 渭水, 湘水)` · `khoản thu thêm, lợi lộc (chỉ dùng trong 外水, 油水)` · `lần (giặt quần áo)`
- **CVDICT** (`[shui3]`): `nước` · `sông` · `chất lỏng` · `đồ uống` · `phí hoặc thu nhập bổ sung` · `(quần áo) lượng từ cho số lần giặt`
- **Why:** Same six senses; current adds the `chỉ dùng trong` compound lists (`药水, 香水, 墨水…`) and rare flags, CVDICT is the bare list.

#### 天 — tian1

- **Current** (`content/words/天.yaml`, `tiān`): `ngày` · `trời (bầu trời, thời tiết)` · `ông trời (天啊: trời ơi)`
- **CVDICT** (`[tian1]`): `ngày` · `trời` · `thượng đế`
- **Why:** CVDICT turns CEDICT’s `heaven` into `thượng đế` (God), wrong register for 天; current `trời` and `ông trời (天啊)`.

#### 看 — kan4

- **Current** (`content/words/看.yaml`, `kàn`): `nhìn, xem` · `đọc (sách, báo)` · `đi khám (bệnh)` · `thăm, đến thăm (người)` · `tuỳ, phụ thuộc vào` · `thấy, cho rằng` · `xem như, coi như` · `coi chừng, cẩn thận` · `thử (đặt sau động từ)`
- **CVDICT** (`[kan4]`): `nhìn; xem` · `đọc` · `xem thăm; thăm viếng` · `xem như` · `coi như` · `chăm sóc` · `chữa (bệnh hoặc triệu chứng)` · `phụ thuộc` · `cảm thấy (rằng)` · `(sau động từ) thử làm` · `cẩn thận; coi chừng`
- **Why:** CVDICT keeps 11 CEDICT-faithful items, including `chăm sóc`, which overlaps the kān reading; current groups `nhìn, xem`, separates `đọc`, `đi khám`, `thăm`, `tuỳ`, `thấy/cho rằng`, `xem như`, `coi chừng`, `thử`.

#### 说 — shuo1

- **Current** (`content/words/说.yaml`, `shuō`): `nói` · `giải thích, nói rõ` · `mắng, trách (khẩu ngữ)` · `thuyết, học thuyết (chỉ dùng trong 学说, 假说, 邪说, 日心说, 地心说)`
- **CVDICT** (`[shuo1]`): `nói; trò chuyện; nói ra` · `giải thích; bình luận` · `mắng; quở trách` · `hình thức kết hợp: học thuyết; lý thuyết`
- **Why:** Same four senses; current keeps the colloquial note on `mắng, trách (khẩu ngữ)`, CVDICT merges `nói; trò chuyện; nói ra` into one item.

#### 走 — zou3

- **Current** (`content/words/走.yaml`, `zǒu`): `đi bộ, đi` · `rời đi, đi (khỏi)` · `đi qua, đi theo (đường)` · `chạy (xe, tàu)` · `thăm, qua lại (họ hàng, bạn bè; chỉ dùng trong 走亲戚, 走亲访友, 走访, 走动)` · `lệch, sai (hình dạng, giọng, nghĩa; chỉ dùng trong 走调, 走样, 走味, 走形)` · `mất, qua đời (nói tránh)` · `đi, mất (bổ ngữ sau động từ; chỉ dùng trong 拿走, 带走, 搬走, 送走)`
- **CVDICT** (`[zou3]`): `đi` · `bước` · `chạy` · `di chuyển (của phương tiện)` · `thăm` · `rời đi` · `đi khỏi` · `chết (nói giảm)` · `từ` · `xuyên qua` · `đi mất (trong động từ ghép, như 撤走[che4 zou3])` · `thay đổi (hình dạng, hình thức, ý nghĩa)`
- **Why:** CVDICT keeps CEDICT’s `from` / `through` as `từ` / `xuyên qua` — literal and misleading for an HSK1 verb; current merges `đi qua, đi theo (đường)` and flags the rare and bound senses.

#### 没关系 — mei2 guan1 xi5

- **Current** (`content/words/没关系.yaml`, `méi guān xi`): `không sao` · `không liên quan`
- **CVDICT** (`[mei2 guan1 xi5]`): `không sao đâu`
- **Why:** Current adds the literal `không liên quan` sense (这跟你没关系); CVDICT keeps CEDICT’s single `không sao`.

#### 东西 — dong1 xi5

- **Current** (`content/words/东西.yaml`, `dōng xi`): `đồ vật, thứ` · `người (cách gọi chê)`
- **CVDICT** (`[dong1 xi5]`): `đồ vật` · `thứ` · `người` · `lượng từ: 個|个[ge4], 件[jian4]`
- **Why:** CVDICT splits `đồ vật` / `thứ` (one gloss in Vietnamese) and adds the classifier tag; current merges them and keeps the insulting `người (cách gọi chê)`.

#### 什么 — shen2 me5

- **Current** (`content/words/什么.yaml`, `shén me`): `gì?, cái gì?` · `thứ gì đó` · `bất cứ thứ gì`
- **CVDICT** (`[shen2 me5]`): `gì?` · `điều gì đó; bất kỳ điều gì`
- **Why:** Current splits `gì?`, `thứ gì đó`, `bất cứ thứ gì`; CVDICT merges the last two (`something / anything`) into one item.

### Even (10)

Both are usable; the difference is style or trivia.

#### 不 — bu4

- **Current** (`content/words/不.yaml`, `bù`): `không, không phải`
- **CVDICT** (`[bu4]`): `không; không phải` · `(hình thức kết hợp) không; bất-`
- **Why:** Identical core. CVDICT’s extra item is the bound-form spelling `bất-`, not a separate meaning.

#### 人 — ren2

- **Current** (`content/words/人.yaml`, `rén`): `người`
- **CVDICT** (`[ren2]`): `người; mọi người` · `LT:個|个[ge4],位[wei4]`
- **Why:** CVDICT adds `mọi người` and the classifiers (`LT:個|个`, `LT:位`); `người` covers both in Vietnamese, and the Word schema has no classifier field to take the tags.

#### 多 — duo1

- **Current** (`content/words/多.yaml`, `duō`): `nhiều` · `đa-, nhiều- (trong từ ghép; chỉ dùng trong 多云, 多样, 多元, 多功能, 多媒体)` · `thừa ra, có thêm` · `quá nhiều, quá mức (sau động từ, 了)` · `hơn, lẻ (sau số từ)` · `bao nhiêu, đến mức nào (hỏi mức độ, trước tính từ)`
- **CVDICT** (`[duo1]`): `nhiều` · `quá nhiều; dư thừa` · `(sau một số) ... lẻ` · `như thế nào (mức độ nào) (cách phát âm ở Đài Loan [duo2])` · `(dạng kết hợp) đa-; nhiều-`
- **Why:** Both cover the same CEDICT senses; current merges `đa-, nhiều-` and marks the bound form, CVDICT renders `how (to what extent)` well. Style only.

#### 谢谢 — xie4 xie5

- **Current** (`content/words/谢谢.yaml`, `xiè xie`): `cảm ơn`
- **CVDICT** (`[xie4 xie5]`): `cảm ơn` · `cảm ơn bạn`
- **Why:** `cảm ơn` in both; CVDICT’s `cảm ơn bạn` is redundant.

#### 对不起 — dui4 bu5 qi3

- **Current** (`content/words/对不起.yaml`, `duì bu qǐ`): `xin lỗi` · `làm thất vọng`
- **CVDICT** (`[dui4 bu5 qi3]`): `Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ` · `làm (ai đó) thất vọng; không đạt kỳ vọng`
- **Why:** Both have the apology and the `disappoint` sense; CVDICT’s first is a fuller sentence (`Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ`), current’s `xin lỗi` is the card form.

#### 不客气 — bu4 ke4 qi5

- **Current** (`content/words/不客气.yaml`, `bù kè qi`): `không có gì` · `bất lịch sự, thô lỗ` · `thẳng thừng`
- **CVDICT** (`[bu4 ke4 qi5]`): `không có chi` · `đừng nhắc đến` · `không lịch sự` · `thô lỗ` · `cộc cằn`
- **Why:** Both cover the polite reply and the rude adjective; current merges the rude variants into two senses, CVDICT lists five CEDICT-faithful items.

#### 再见 — zai4 jian4

- **Current** (`content/words/再见.yaml`, `zài jiàn`): `tạm biệt`
- **CVDICT** (`[zai4 jian4]`): `tạm biệt` · `gặp lại sau`
- **Why:** `tạm biệt` in both; CVDICT adds `gặp lại sau`.

#### 老师 — lao3 shi1

- **Current** (`content/words/老师.yaml`, `lǎo shī`): `giáo viên`
- **CVDICT** (`[lao3 shi1]`): `giáo viên` · `LT: 個|个[ge4], 位[wei4]`
- **Why:** `giáo viên` in both; CVDICT’s second item is the classifier tag.

#### 学生 — xue2 sheng5

- **Current** (`content/words/学生.yaml`, `xué sheng`): `học sinh, sinh viên`
- **CVDICT** (`[xue2 sheng5]`): `học sinh` · `trẻ đi học`
- **Why:** CVDICT `học sinh` / `trẻ đi học` (CEDICT `student / schoolchild`); current `học sinh, sinh viên` adds the university sense a Vietnamese learner expects.

#### 朋友 — peng2 you5

- **Current** (`content/words/朋友.yaml`, `péng you`): `bạn, bạn bè`
- **CVDICT** (`[peng2 you5]`): `bạn` · `LT:個|个[ge4],位[wei4]`
- **Why:** `bạn` / `bạn, bạn bè`; no meaningful difference.

### Mixed (2)

Each side wins something: CVDICT has a sense the entry lacks, current has the usable wording.

#### 的 — de5

- **Current** (`content/words/的.yaml`, `de`): `của (chỉ sở hữu)` · `(đứng sau định ngữ, nối với danh từ)` · `cái, người (tạo cụm danh từ)`
- **CVDICT** (`[de5]`): `của; ~(hậu tố sở hữu)` · `(dùng sau định ngữ)` · `(dùng để tạo thành cụm danh từ)` · `(dùng cuối câu trần thuật để nhấn mạnh)` · `cũng đọc là [di4] hoặc [di5] trong thơ và bài hát`
- **Why:** CVDICT keeps a sense the current entry lacks — the sentence-final emphasizer (`dùng cuối câu trần thuật để nhấn mạnh`) — but its first item mixes a gloss with a template (`của; ~(hậu tố sở hữu)`) and its last item is a reading note, not a meaning. Current wording is cleaner for the three shared senses.

#### 也 — ye3

- **Current** (`content/words/也.yaml`, `yě`): `cũng (đứng trước vị ngữ)`
- **CVDICT** (`[ye3]`): `(phó từ) cũng; vừa ... vừa ... (chỉ dùng trước vị ngữ)` · `(văn viết) trợ từ có chức năng giống với 啊[a5]`
- **Why:** CVDICT spells out the `both … and …` / 也…也… pattern the current entry folds into `cũng`; its second item (a literary particle like 啊) is outside HSK1. Current is the cleaner entry, CVDICT the fuller inventory.
