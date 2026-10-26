// Bài 0 · Nhập môn (Pinyin Primer). Shape follows docs/content-schema.md "Pinyin Primer (Bài 0)".
// Syllable keys are numbered pinyin (ma1, lv3 for lǚ, zhi4; tone 5 = neutral). Audio: audio/py/<key>.mp3.
// Question kinds (drill + gate pool):
//   tone    { key, opts: [syllable keys], ans }            nghe rồi chọn thanh (contour glyphs)
//   pinyin  { key, opts: [pinyin strings], ans }           nghe rồi chọn pinyin
//   spell   { prompt, key?, opts, ans }                    cách viết nào đúng?
//   sandhi  { key, prompt, opts, ans }                     nghe rồi chọn thanh thực tế đọc ra
// Every question may carry `why` (one short Vietnamese line shown after the answer).

const MARK = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

/** 'lv3' → 'lǚ', 'liu2' → 'liú', 'ma5' → 'ma'. Mark goes on a, then e, then o of "ou", else the last vowel (iu, ui, uo). */
export function py(key) {
  const m = /^([a-zü]+?)([1-5])$/.exec(key);
  if (!m) return key;
  const base = m[1].replace(/v/g, 'ü'), t = +m[2];
  if (t === 5) return base;
  let i = base.search(/[ae]/);
  if (i < 0 && base.includes('ou')) i = base.indexOf('ou');
  if (i < 0) for (let k = base.length - 1; k >= 0; k--) if (MARK[base[k]]) { i = k; break; }
  return (i < 0 ? base : base.slice(0, i) + MARK[base[i]][t - 1] + base.slice(i + 1)).normalize('NFC');
}
export const toneOf = (key) => +key.slice(-1);

/** Hanzi shown under a single syllable chip (only where a hanzi helps). */
export const HZ = {
  ma1: '妈', ma2: '麻', ma3: '马', ma4: '骂', ma5: '吗',
  de5: '的', le5: '了', ne5: '呢',
};

/** Phrase keys: citation pinyin as written (sandhi that is written is written), hanzi, and how it is actually said. */
export const PHRASE = {
  ni3hao3: { hz: '你好', py: 'nǐ hǎo', say: 'ní hǎo' },
  hen3hao3: { hz: '很好', py: 'hěn hǎo', say: 'hén hǎo' },
  shui3guo3: { hz: '水果', py: 'shuǐ guǒ', say: 'shuí guǒ' },
  lao3shi1: { hz: '老师', py: 'lǎo shī', say: 'lǎo shī' },
  hao3chi1: { hz: '好吃', py: 'hǎo chī', say: 'hǎo chī' },
  ni3men5: { hz: '你们', py: 'nǐ men', say: 'nǐ men' },
  yi1tian1: { hz: '一天', py: 'yì tiān', say: 'yì tiān' },
  yi1nian2: { hz: '一年', py: 'yì nián', say: 'yì nián' },
  yi1qi3: { hz: '一起', py: 'yì qǐ', say: 'yì qǐ' },
  yi1ding4: { hz: '一定', py: 'yí dìng', say: 'yí dìng' },
  yi1xia4: { hz: '一下', py: 'yí xià', say: 'yí xià' },
  yi1ge4: { hz: '一个', py: 'yí gè', say: 'yí gè' },
  shi2yi1: { hz: '十一', py: 'shí yī', say: 'shí yī' },
  bu4shi4: { hz: '不是', py: 'bú shì', say: 'bú shì' },
  bu4qu4: { hz: '不去', py: 'bú qù', say: 'bú qù' },
  bu4chi1: { hz: '不吃', py: 'bù chī', say: 'bù chī' },
  bu4lai2: { hz: '不来', py: 'bù lái', say: 'bù lái' },
  bu4hao3: { hz: '不好', py: 'bù hǎo', say: 'bù hǎo' },
  dui4bu5qi3: { hz: '对不起', py: 'duì bu qǐ', say: 'duì bu qǐ' },
  ma1ma5: { hz: '妈妈', py: 'mā ma', say: 'mā ma' },
};
/** Label for any key (single syllable or phrase). */
/** A syllable item may be 'audioKey=label' (finals/initials: toneless label, audio of a real tone-1 syllable). */
export const audioKey = (item) => item.split('=')[0];
export const label = (item) => { const [key, lab] = item.split('='); return (lab ?? PHRASE[key]?.py ?? py(key)).normalize('NFC'); };

const MA = ['ma1', 'ma2', 'ma3', 'ma4'];
const tone = (key, opts, why) => ({ t: 'tone', key, opts, ans: key, why });
const pin = (key, ans, opts, why, title) => ({ t: 'pinyin', key, ans, opts, why, title });
const fin = (key, ans, opts, why) => pin(key, ans, opts, why, 'Nghe rồi chọn vận mẫu');
const ini = (key, ans, opts, why) => pin(key, ans, opts, why, 'Nghe rồi chọn thanh mẫu');
const spell = (prompt, ans, opts, why, key) => ({ t: 'spell', prompt, ans, opts, why, key });
const sandhi = (key, prompt, ans, opts, why) => ({ t: 'sandhi', key, prompt, ans, opts, why });

export const SECTIONS = ['tones', 'finals', 'initials', 'spelling', 'sandhi'];

const sections = {
  tones: {
    title: 'Thanh điệu', hint: '4 thanh, cộng ghi chú thanh nhẹ',
    cards: [
      { title: 'Thanh 1: cao đều (55)', explain: 'Thang cao độ chia 5 mức, 5 là cao nhất. Thanh 1 giữ giọng ở mức 5 từ đầu đến cuối, không lên không xuống.', syllables: ['ma1'] },
      { title: 'Thanh 2: lên (35)', explain: 'Giọng bắt đầu ở mức 3 rồi đi lên mức 5, một đường lên liền mạch.', syllables: ['ma2'] },
      { title: 'Thanh 3: xuống rồi lên (214)', explain: 'Giọng hạ từ mức 2 xuống mức 1 rồi nâng lên mức 4. Khi nói nhanh, thường chỉ đọc nửa đầu: xuống thấp rồi dừng.', syllables: ['ma3'] },
      { title: 'Thanh 4: rơi từ cao (51)', explain: 'Giọng bắt đầu ở mức 5 rồi rơi thẳng xuống mức 1, ngắn và dứt khoát.', syllables: ['ma4'] },
      { title: 'Thanh nhẹ', explain: 'Một số chữ đọc nhẹ và ngắn, không nhấn, không có dấu trong pinyin: ma, de, le. Chỉ cần nhớ: gặp chữ không dấu thì đừng nhấn.', syllables: [] },
      { title: 'So sánh bốn thanh', explain: 'Cùng một âm ma, mỗi thanh là một chữ khác nhau. Nghe lần lượt từ trái sang phải.', syllables: ['ma1', 'ma2', 'ma3', 'ma4'] },
    ],
    drills: [
      { ...tone('ma2', MA, 'thanh 2 đi lên'), },
      { ...tone('ma4', MA, 'thanh 4 rơi mạnh') },
      { ...tone('ma3', MA, 'thanh 3 xuống thấp rồi lên') },
      { ...tone('ma1', MA, 'thanh 1 cao và đều') },
    ],
  },

  finals: {
    title: 'Vận mẫu', hint: 'a o e i u ü, vần ghép, vần mũi',
    cards: [
      { title: 'a, o, e', explain: 'Ba nguyên âm đơn. a miệng mở rộng, lưỡi thấp; o môi tròn; e miệng mở vừa, lưỡi sau, môi không tròn.', syllables: ['a1=a', 'o1=o', 'e1=e'] },
      { title: 'i, u, ü', explain: 'i lưỡi trước, môi dẹt; u lưỡi sau, môi tròn; ü lưỡi trước như i nhưng môi tròn. Hãy nghe riêng ü so với i và u.', syllables: ['yi1=i', 'wu1=u', 'yu1=ü'] },
      { title: 'ai, ei, ao, ou', explain: 'Vần ghép: trượt từ âm đầu sang âm sau trong một hơi, không tách ra.', syllables: ['ai1=ai', 'ei2=ei', 'ao1=ao', 'ou1=ou'] },
      { title: 'Vần mũi: -n và -ng', explain: '-n kết thúc bằng đầu lưỡi chạm lợi trên; -ng bằng cuống lưỡi chạm vòm mềm. Có thêm ong.', syllables: ['an1=an', 'en1=en', 'ang1=ang', 'deng1=eng', 'dong1=ong'] },
      { title: 'Vần ghép với i-', explain: 'Bắt đầu bằng i rồi trượt sang vần sau: ia, ie, iao, iu. Khi không có phụ âm đầu, i viết thành y (xem phần Quy tắc viết).', syllables: ['ya1=ia', 'ye1=ie', 'yao1=iao', 'you1=iu'] },
      { title: 'Vần ghép với u-', explain: 'Bắt đầu bằng u rồi trượt sang vần sau: ui (thực chất là uei), un (thực chất là uen).', syllables: ['wei1=ui', 'wen1=un'] },
    ],
    drills: [
      fin('an1', 'an', ['an', 'ang'], '-n: lưỡi chạm lợi'),
      fin('ang1', 'ang', ['an', 'ang'], '-ng: cuối lưỡi chạm vòm mềm'),
      fin('ei2', 'ei', ['ei', 'ai'], 'ei trượt từ e sang i'),
      fin('ao1', 'ao', ['ao', 'ou'], 'ao trượt từ a sang o'),
    ],
  },

  initials: {
    title: 'Thanh mẫu', hint: 'Theo thứ tự bảng pinyin',
    cards: [
      { title: 'b p m f · âm môi', explain: 'b, p, m dùng hai môi; f dùng răng trên chạm môi dưới. p bật hơi mạnh, b không bật hơi.', syllables: ['bo1=b', 'po1=p', 'mo1=m', 'fo2=f'], pairs: [['bo1=b', 'po1=p']] },
      { title: 'd t n l · âm đầu lưỡi', explain: 'Đầu lưỡi chạm lợi trên. t bật hơi mạnh, d không bật hơi; n thoát hơi qua mũi, l qua hai bên lưỡi.', syllables: ['de2=d', 'te4=t', 'ne4=n', 'le1=l'], pairs: [['de2=d', 'te4=t']] },
      { title: 'g k h · âm cuống lưỡi', explain: 'Cuống lưỡi nâng lên chạm hoặc gần vòm mềm. k bật hơi mạnh, g không bật hơi; h là âm xát.', syllables: ['ge1=g', 'ke1=k', 'he1=h'], pairs: [['ge1=g', 'ke1=k']] },
      { title: 'j q x · âm mặt lưỡi', explain: 'Mặt lưỡi áp ngạc cứng, môi dẹt. q là j bật hơi; x là âm xát. Ba âm này chỉ ghép với i và ü.', syllables: ['ji1=j', 'qi1=q', 'xi1=x'], pairs: [['ji1=j', 'qi1=q']] },
      { title: 'zh ch sh r · âm uốn lưỡi', explain: 'Đầu lưỡi cong lên chạm hoặc gần ngạc cứng. ch bật hơi, zh không bật hơi; sh là âm xát, r là âm xát hữu thanh.', syllables: ['zhi1=zh', 'chi1=ch', 'shi1=sh', 'ri4=r'], pairs: [['zhi1=zh', 'chi1=ch']] },
      { title: 'z c s · âm đầu lưỡi trước', explain: 'Đầu lưỡi phẳng, chạm hoặc gần mặt sau răng cửa trên. c bật hơi, z không bật hơi; s là âm xát.', syllables: ['zi1=z', 'ci1=c', 'si1=s'], pairs: [['zi1=z', 'ci1=c']] },
      { title: 'Đối chiếu theo vị trí lưỡi', explain: 'Ba nhóm j q x, zh ch sh, z c s có cùng cách phát âm nhưng khác vị trí lưỡi: mặt lưỡi, đầu lưỡi cong, đầu lưỡi phẳng.', syllables: [], pairs: [['ji1=j', 'zhi1=zh'], ['qi1=q', 'chi1=ch'], ['xi1=x', 'shi1=sh'], ['si1=s', 'shi1=sh']] },
    ],
    drills: [
      ini('po1', 'p', ['b', 'p'], 'p bật hơi, b không bật hơi'),
      ini('zhi1', 'zh', ['zh', 'j'], 'zh uốn lưỡi, j dùng mặt lưỡi'),
      ini('qi1', 'q', ['ch', 'q'], 'q dùng mặt lưỡi, ch uốn lưỡi'),
      ini('shi1', 'sh', ['s', 'sh'], 'sh uốn lưỡi, s đầu lưỡi phẳng'),
    ],
  },

  spelling: {
    title: 'Quy tắc viết', hint: 'y, w, yu · ü · dấu thanh',
    cards: [
      { title: 'i, u, ü đứng đầu → y, w, yu', explain: 'Khi vần bắt đầu bằng i, u, ü mà không có phụ âm đầu, viết thành yi, wu, yu.', syllables: ['yi1', 'wu3', 'yu2'] },
      { title: 'ü mất hai chấm sau j, q, x, y', explain: 'Sau j, q, x, y chỉ có thể là ü nên viết u: qù, jú, yú. Sau n, l vẫn giữ hai chấm: nǚ, lǚ.', syllables: ['qu4', 'ju2', 'nv3', 'lv3'] },
      { title: 'iou → iu, uei → ui, uen → un', explain: 'Sau phụ âm, ba vần này viết gọn: liù, duì, chūn, không viết liou, duei, chuen.', syllables: ['liu4', 'dui4', 'chun1'] },
      { title: 'Dấu thanh đặt ở đâu', explain: 'Ưu tiên a, rồi o hoặc e. Trong iu và ui, dấu đặt ở chữ thứ hai: liù, duì.', syllables: ['hao3', 'ou1', 'ye3', 'liu4', 'dui4'] },
    ],
    drills: [
      spell('Nghe <span class="hz">去</span> (đi). Pinyin đúng là…', 'qù', ['qù', 'qǜ', 'qiù'], 'sau q, ü viết u, không có hai chấm', 'qu4'),
      spell('<span class="hz">女</span> (con gái): sau n, ü viết thế nào?', 'nǚ', ['nǔ', 'nǚ'], 'sau n, l thì ü giữ hai chấm'),
      spell('Nghe <span class="hz">六</span> (sáu). Pinyin đúng là…', 'liù', ['liù', 'lioù', 'liou'], 'iou viết gọn thành iu, dấu ở chữ thứ hai', 'liu4'),
      spell('Âm “u” đứng một mình, không có phụ âm đầu, viết là…', 'wu', ['wu', 'u', 'vu'], 'u đứng đầu viết thành w'),
    ],
  },

  sandhi: {
    title: 'Biến điệu', hint: 'Thanh 3 + 3, 不, 一',
    cards: [
      { title: 'Thanh 3 + thanh 3', explain: 'Hai thanh 3 liền nhau thì chữ đầu đọc thành thanh 2. Nhưng pinyin vẫn viết nǐ hǎo, không viết ní hǎo.', syllables: ['ni3hao3', 'hen3hao3', 'shui3guo3'] },
      { title: 'Nửa thanh 3', explain: 'Thanh 3 đứng trước thanh 1, 2, 4 hoặc thanh nhẹ thì chỉ xuống thấp, không lên lại.', syllables: ['lao3shi1', 'hao3chi1', 'ni3men5'] },
      { title: '不: bù hay bú', explain: 'Trước thanh 4, 不 đổi thành bú và pinyin viết luôn bú. Trước thanh 1, 2, 3 vẫn đọc bù.', syllables: ['bu4shi4', 'bu4qu4', 'bu4chi1', 'bu4lai2', 'bu4hao3'] },
      { title: '一: yí hay yì', explain: 'Trước thanh 4, 一 đọc yí. Trước thanh 1, 2, 3, 一 đọc yì. Pinyin viết đúng như đọc.', syllables: ['yi1ge4', 'yi1xia4', 'yi1ding4', 'yi1tian1', 'yi1nian2', 'yi1qi3'] },
      { title: '一 đứng một mình: yī', explain: 'Đọc số hoặc đứng ở cuối từ thì 一 giữ nguyên yī.', syllables: ['shi2yi1'] },
      { title: 'Thanh nhẹ trong từ', explain: 'Âm sau của từ lặp và chữ 不 ở giữa đọc nhẹ và ngắn: māma, duìbuqǐ.', syllables: ['ma1ma5', 'dui4bu5qi3'] },
    ],
    drills: [
      sandhi('ni3hao3', 'Chữ đầu của <span class="hz">你好</span> (viết nǐ hǎo) thực tế đọc là…', 'ní', ['ní', 'nǐ'], 'thanh 3 + 3: chữ đầu đọc thành thanh 2, nhưng vẫn viết nǐ'),
      sandhi('bu4shi4', 'Chữ <span class="hz">不</span> trong <span class="hz">不是</span> đọc là…', 'bú', ['bù', 'bú'], 'trước thanh 4, 不 thành bú'),
      sandhi('yi1tian1', 'Chữ <span class="hz">一</span> trong <span class="hz">一天</span> đọc là…', 'yì', ['yī', 'yí', 'yì'], 'trước thanh 1, 2, 3, 一 đọc yì'),
      sandhi('yi1ge4', 'Chữ <span class="hz">一</span> trong <span class="hz">一个</span> đọc là…', 'yí', ['yī', 'yí', 'yì'], 'trước thanh 4, 一 đọc yí'),
    ],
  },
};

/** Gate pool: 4 tones + 5 per other section (24). Gate draws 2 per section → 10. */
const POOL = {
  tones: [
    tone('ma1', MA, 'thanh 1 cao và đều'), tone('ma2', MA, 'thanh 2 đi lên'), tone('ma3', MA, 'thanh 3 xuống thấp rồi lên'), tone('ma4', MA, 'thanh 4 rơi mạnh'),
  ],
  finals: [
    fin('an1', 'an', ['an', 'ang'], '-n: lưỡi chạm lợi'), fin('ang1', 'ang', ['an', 'ang'], '-ng: cuối lưỡi chạm vòm mềm'),
    fin('ei2', 'ei', ['ei', 'ai'], 'ei trượt từ e sang i'), fin('ai1', 'ai', ['ai', 'ei'], 'ai trượt từ a sang i'),
    fin('ou1', 'ou', ['ou', 'ao'], 'ou trượt từ o sang u'),
  ],
  initials: [
    ini('bo1', 'b', ['b', 'p'], 'b không bật hơi'), ini('po1', 'p', ['b', 'p'], 'p bật hơi'),
    ini('chi1', 'ch', ['ch', 'q'], 'ch uốn lưỡi, q dùng mặt lưỡi'), ini('ji1', 'j', ['zh', 'j'], 'j dùng mặt lưỡi, zh uốn lưỡi'),
    ini('si1', 's', ['s', 'sh'], 's đầu lưỡi phẳng, sh uốn lưỡi'),
  ],
  spelling: [
    spell('Nghe <span class="hz">去</span> (đi). Pinyin đúng là…', 'qù', ['qù', 'qǜ', 'qiù'], 'sau q, ü viết u', 'qu4'),
    spell('<span class="hz">女</span> (con gái): sau n, ü viết thế nào?', 'nǚ', ['nǔ', 'nǚ'], 'sau n, l thì ü giữ hai chấm'),
    spell('Nghe <span class="hz">六</span> (sáu). Pinyin đúng là…', 'liù', ['liù', 'lioù', 'liou'], 'iou viết gọn thành iu', 'liu4'),
    spell('Dấu thanh 4 trên vần “ui” của <span class="hz">对</span> đặt ở…', 'duì', ['duì', 'dùi'], 'trong iu và ui, dấu ở chữ thứ hai', 'dui4'),
    spell('Âm “i” đứng một mình, không có phụ âm đầu, viết là…', 'yi', ['yi', 'i', 'ji'], 'i đứng đầu viết thành y'),
  ],
  sandhi: [
    sandhi('ni3hao3', 'Chữ đầu của <span class="hz">你好</span> (viết nǐ hǎo) thực tế đọc là…', 'ní', ['ní', 'nǐ'], 'thanh 3 + 3: chữ đầu đọc thành thanh 2'),
    sandhi('bu4qu4', 'Chữ <span class="hz">不</span> trong <span class="hz">不去</span> đọc là…', 'bú', ['bù', 'bú'], 'trước thanh 4, 不 thành bú'),
    sandhi('bu4lai2', 'Chữ <span class="hz">不</span> trong <span class="hz">不来</span> đọc là…', 'bù', ['bù', 'bú'], 'trước thanh 2, 不 giữ bù'),
    sandhi('yi1qi3', 'Chữ <span class="hz">一</span> trong <span class="hz">一起</span> đọc là…', 'yì', ['yī', 'yí', 'yì'], 'trước thanh 1, 2, 3, 一 đọc yì'),
    sandhi('yi1xia4', 'Chữ <span class="hz">一</span> trong <span class="hz">一下</span> đọc là…', 'yí', ['yī', 'yí', 'yì'], 'trước thanh 4, 一 đọc yí'),
  ],
};
const pool = SECTIONS.flatMap((k) => POOL[k].map((q) => ({ ...q, s: k })));

export const PRIMER = {
  kind: 'primer', id: 'h0-00', level: 1, order: 0, title: 'Nhập môn', titleHanzi: '拼音',
  scene: { file: 'assets/home/lesson-next.png', cast: ['panda'], prompt: 'reuse' },
  sections,
  gate: { pool, draw: 10, testOut: true },
};
