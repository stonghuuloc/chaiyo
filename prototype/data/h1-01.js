// HSK1 Bài 1 "Xin chào": the prototype's copy of docs/content-schema.md (h1-01.yaml) plus the
// derived fields the importer would add (Hán Việt, spoken pinyin, audio keys = prototype/audio/<key>.mp3).

export const LESSON = { id: 'h1-01', level: 1, order: 1, title: 'Xin chào', titleHanzi: '你好', topic: 'Chào hỏi' };

// Cast voices: only Cast members who talk in canon speak lines.
export const CAST = {
  redpanda: { name: 'Gấu Đỏ', avatar: '../assets/avatars/redpanda.png' },
  takin: { name: 'Linh Ngưu', avatar: '../assets/avatars/takin.png' },
};

export const WORDS = [
  { hz: '你', py: 'nǐ', hv: 'nhĩ', vi: 'bạn, anh, chị', img: 'ni', a: '01',
    parts: [['亻', 'nhân đứng', 'người'], ['尔', 'nhĩ', 'phần đọc']], ex: ['你好！', 'nǐ hǎo', 'Chào bạn!', '11'] },
  { hz: '好', py: 'hǎo', hv: 'hảo', vi: 'tốt, khỏe, hay', img: 'hao', a: '02',
    parts: [['女', 'nữ', 'người mẹ'], ['子', 'tử', 'đứa con']], ex: ['你好！', 'nǐ hǎo', 'Chào bạn!', '11'] },
  { hz: '您', py: 'nín', hv: 'nâm', vi: 'ông, bà, thầy cô (lịch sự)', img: 'nin', a: '03',
    parts: [['你', 'nhĩ', 'bạn'], ['心', 'tâm', 'tấm lòng']], ex: ['您好！', 'nín hǎo', 'Chào ông/bà!', '12'] },
  { hz: '你们', py: 'nǐmen', hv: 'nhĩ môn', vi: 'các bạn', img: 'nimen', a: '04',
    chars: [['你', 'nǐ', 'nhĩ', 'bạn'], ['们', 'men', 'môn', 'chỉ số nhiều']], ex: ['你们好！', 'nǐmen hǎo', 'Chào các bạn!', '13'] },
  { hz: '你好', py: 'nǐ hǎo', say: ['ní', ' hǎo', 'hai thanh 3 liền nhau'], hv: 'nhĩ hảo', vi: 'xin chào', img: 'nihao', a: '05',
    chars: [['你', 'nǐ', 'nhĩ', 'bạn'], ['好', 'hǎo', 'hảo', 'tốt']], ex: ['你们好！', 'nǐmen hǎo', 'Chào các bạn!', '13'] },
  { hz: '对不起', py: 'duìbuqǐ', hv: 'đối bất khởi', vi: 'xin lỗi', img: 'duibuqi', a: '06',
    chars: [['对', 'duì', 'đối', 'đúng, đối với'], ['不', 'bu', 'bất', 'không'], ['起', 'qǐ', 'khởi', 'dậy, nổi']], ex: ['对不起！', 'duìbuqǐ', 'Xin lỗi!', '14'] },
  { hz: '没关系', py: 'méi guānxi', hv: 'một quan hệ', vi: 'không sao', img: 'meiguanxi', a: '07',
    chars: [['没', 'méi', 'một', 'không có'], ['关', 'guān', 'quan', 'liên quan'], ['系', 'xi', 'hệ', 'nối, buộc']], ex: ['没关系。', 'méi guānxi', 'Không sao.', '15'] },
  { hz: '谢谢', py: 'xièxie', hv: 'tạ tạ', vi: 'cảm ơn', img: 'xiexie', a: '08',
    chars: [['谢', 'xiè', 'tạ', 'cảm tạ']], ex: ['谢谢！', 'xièxie', 'Cảm ơn!', '16'] },
  { hz: '不客气', py: 'bù kèqi', say: ['bú', ' kèqi', '不 trước thanh 4'], hv: 'bất khách khí', vi: 'không có gì', img: 'bukeqi', a: '09',
    chars: [['不', 'bù', 'bất', 'không'], ['客', 'kè', 'khách', 'khách'], ['气', 'qi', 'khí', 'khí, khách sáo']], ex: ['不客气。', 'bú kèqi', 'Không có gì.', '17'] },
  { hz: '再见', py: 'zàijiàn', hv: 'tái kiến', vi: 'tạm biệt', img: 'zaijian', a: '10',
    chars: [['再', 'zài', 'tái', 'lại, nữa'], ['见', 'jiàn', 'kiến', 'gặp, thấy']], ex: ['再见！', 'zàijiàn', 'Tạm biệt!', '18'] },
];
export const word = (hz) => WORDS.find((w) => w.hz === hz);

// a = audio key. Takin lines use the Xiaoyi voice (m*), red panda lines Xiaoxiao.
export const SENTENCES = {
  's01': { hz: '你好！', py: 'nǐ hǎo', spoken: 'ní hǎo', vi: 'Chào bạn!', speaker: 'redpanda', a: '11' },
  's02': { hz: '你好！', py: 'nǐ hǎo', spoken: 'ní hǎo', vi: 'Chào bạn!', speaker: 'takin', a: 'm11' },
  's03': { hz: '对不起！', py: 'duìbuqǐ', vi: 'Xin lỗi!', speaker: 'takin', a: 'm14' },
  's04': { hz: '没关系。', py: 'méi guānxi', vi: 'Không sao.', speaker: 'redpanda', a: '15' },
  's05': { hz: '谢谢！', py: 'xièxie', vi: 'Cảm ơn!', speaker: 'redpanda', a: '16' },
  's06': { hz: '不客气。', py: 'bù kèqi', spoken: 'bú kèqi', vi: 'Không có gì.', speaker: 'takin', a: 'm17' },
  's07': { hz: '再见！', py: 'zàijiàn', vi: 'Tạm biệt!', speaker: 'takin', a: 'm18' },
  's08': { hz: '您好！', py: 'nín hǎo', vi: 'Chào ông/bà! (lịch sự)', a: '12' },
  's09': { hz: '你们好！', py: 'nǐmen hǎo', vi: 'Chào các bạn!', a: '13' },
};

export const DIALOGUE = [
  { title: 'Gặp nhau', lines: ['s01', 's02', 's03', 's04'] },
  { title: 'Chia tay', lines: ['s05', 's06', 's07'] },
];

export const GRAMMAR = {
  id: 'h1-g01', std: [], title: 'Chào hỏi: A + 好', pattern: ['你 / 您 / 你们', '好'],
  explain: 'Thêm 好 (hảo, “tốt”) sau người được chào. 您 (nâm) là cách lịch sự với người lớn tuổi, thầy cô.',
  more: 'Người kia chỉ cần chào lại bằng đúng câu đó: 你好！ → 你好！. 你们 = 你 + 们 (môn, số nhiều), nên 你们好 là chào cả nhóm.',
  examples: ['s08', 's09'], wrong: ['好你', '你好'],
};
