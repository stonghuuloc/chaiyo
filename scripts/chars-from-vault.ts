import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadVaultMnemonics } from '../src/lib/content/lint/refs';
import type { Mnemonic } from '../src/lib/content/lint/types';

const vault = process.env.CHAIYO_VAULT ?? join(homedir(), 'Documents/second-brain/mandarin');
const mnemonics = loadVaultMnemonics(vault);
if (!mnemonics) throw new Error(`vault not found: ${vault}`);

type Reading = { pinyin: string; hanviet: string; rare?: true };
type Row = {
	readings: Reading[];
	radical: string;
	ids: string;
	strokes: number;
	kind: 'etymology' | 'invented';
};

const r = (pinyin: string, hanviet: string, rare?: true): Reading => ({
	pinyin,
	hanviet,
	...(rare && { rare })
});

const rows: Record<string, Row> = {
	你: { readings: [r('nǐ', 'nhĩ')], radical: '亻', ids: '⿰亻尔', strokes: 7, kind: 'etymology' },
	好: {
		readings: [r('hǎo', 'hảo'), r('hào', 'hiếu')],
		radical: '女',
		ids: '⿰女子',
		strokes: 6,
		kind: 'etymology'
	},
	您: { readings: [r('nín', 'nâm')], radical: '心', ids: '⿱你心', strokes: 11, kind: 'invented' },
	们: { readings: [r('men', 'môn')], radical: '亻', ids: '⿰亻门', strokes: 5, kind: 'etymology' },
	对: { readings: [r('duì', 'đối')], radical: '寸', ids: '⿰又寸', strokes: 5, kind: 'invented' },
	不: { readings: [r('bù', 'bất')], radical: '一', ids: '不', strokes: 4, kind: 'invented' },
	起: { readings: [r('qǐ', 'khởi')], radical: '走', ids: '⿺走巳', strokes: 10, kind: 'etymology' },
	没: {
		readings: [r('méi', 'một'), r('mò', 'một', true)],
		radical: '氵',
		ids: '⿰氵殳',
		strokes: 7,
		kind: 'etymology'
	},
	关: { readings: [r('guān', 'quan')], radical: '丷', ids: '⿱丷天', strokes: 6, kind: 'invented' },
	系: {
		readings: [r('xì', 'hệ'), r('jì', 'hệ', true)],
		radical: '糸',
		ids: '⿱丿糸',
		strokes: 7,
		kind: 'etymology'
	},
	谢: { readings: [r('xiè', 'tạ')], radical: '讠', ids: '⿰讠射', strokes: 12, kind: 'invented' },
	客: { readings: [r('kè', 'khách')], radical: '宀', ids: '⿱宀各', strokes: 9, kind: 'etymology' },
	气: { readings: [r('qì', 'khí')], radical: '气', ids: '⿳𠂉一乁', strokes: 4, kind: 'etymology' },
	再: { readings: [r('zài', 'tái')], radical: '冂', ids: '⿱一冉', strokes: 6, kind: 'invented' },
	见: {
		readings: [r('jiàn', 'kiến'), r('xiàn', 'hiện', true)],
		radical: '见',
		ids: '见',
		strokes: 4,
		kind: 'etymology'
	},
	我: { readings: [r('wǒ', 'ngã')], radical: '戈', ids: '我', strokes: 7, kind: 'invented' },
	他: { readings: [r('tā', 'tha')], radical: '亻', ids: '⿰亻也', strokes: 5, kind: 'invented' },
	她: { readings: [r('tā', 'tha')], radical: '女', ids: '⿰女也', strokes: 6, kind: 'etymology' },
	叫: {
		readings: [r('jiào', 'khiếu')],
		radical: '口',
		ids: '⿰口丩',
		strokes: 5,
		kind: 'etymology'
	},
	什: {
		readings: [r('shén', 'thậm')],
		radical: '亻',
		ids: '⿰亻十',
		strokes: 4,
		kind: 'etymology'
	},
	么: { readings: [r('me', 'ma')], radical: '丿', ids: '⿱丿厶', strokes: 3, kind: 'invented' },
	名: {
		readings: [r('míng', 'danh')],
		radical: '口',
		ids: '⿱夕口',
		strokes: 6,
		kind: 'etymology'
	},
	字: { readings: [r('zì', 'tự')], radical: '子', ids: '⿱宀子', strokes: 6, kind: 'etymology' },
	这: { readings: [r('zhè', 'giá')], radical: '辶', ids: '⿺辶文', strokes: 7, kind: 'invented' },
	那: {
		readings: [r('nà', 'na')],
		radical: '阝',
		ids: '⿰⿻刀二阝',
		strokes: 6,
		kind: 'etymology'
	},
	是: { readings: [r('shì', 'thị')], radical: '日', ids: '⿱日𤴓', strokes: 9, kind: 'etymology' },
	谁: {
		readings: [r('shéi', 'thuỳ')],
		radical: '讠',
		ids: '⿰讠隹',
		strokes: 10,
		kind: 'etymology'
	},
	爸: { readings: [r('bà', 'bả')], radical: '父', ids: '⿱父巴', strokes: 8, kind: 'etymology' },
	妈: { readings: [r('mā', 'ma')], radical: '女', ids: '⿰女马', strokes: 6, kind: 'etymology' },
	哥: { readings: [r('gē', 'ca')], radical: '口', ids: '⿱可可', strokes: 10, kind: 'invented' },
	姐: { readings: [r('jiě', 'tỷ')], radical: '女', ids: '⿰女且', strokes: 8, kind: 'etymology' },
	朋: { readings: [r('péng', 'bằng')], radical: '月', ids: '⿰月月', strokes: 8, kind: 'invented' },
	友: { readings: [r('yǒu', 'hữu')], radical: '又', ids: '⿸𠂇又', strokes: 4, kind: 'etymology' },
	老: { readings: [r('lǎo', 'lão')], radical: '老', ids: '⿸耂匕', strokes: 6, kind: 'etymology' },
	师: {
		readings: [r('shī', 'sư')],
		radical: '巾',
		ids: '⿰⿰丨丿帀',
		strokes: 6,
		kind: 'invented'
	},
	也: { readings: [r('yě', 'dã')], radical: '乙', ids: '也', strokes: 3, kind: 'invented' },
	家: { readings: [r('jiā', 'gia')], radical: '宀', ids: '⿱宀豕', strokes: 10, kind: 'etymology' },
	弟: { readings: [r('dì', 'đệ')], radical: '弓', ids: '⿱丷𢎨', strokes: 7, kind: 'etymology' },
	妹: { readings: [r('mèi', 'muội')], radical: '女', ids: '⿰女未', strokes: 8, kind: 'invented' },
	同: { readings: [r('tóng', 'đồng')], radical: '口', ids: '⿵𠔼口', strokes: 6, kind: 'invented' },
	学: { readings: [r('xué', 'học')], radical: '子', ids: '⿳𭕄冖子', strokes: 8, kind: 'invented' },
	生: { readings: [r('shēng', 'sinh')], radical: '生', ids: '生', strokes: 5, kind: 'etymology' },
	医: { readings: [r('yī', 'y')], radical: '匚', ids: '⿷匚矢', strokes: 7, kind: 'etymology' },
	一: { readings: [r('yī', 'nhất')], radical: '一', ids: '一', strokes: 1, kind: 'etymology' },
	二: { readings: [r('èr', 'nhị')], radical: '二', ids: '⿱一一', strokes: 2, kind: 'etymology' },
	三: { readings: [r('sān', 'tam')], radical: '一', ids: '⿱一二', strokes: 3, kind: 'etymology' },
	四: { readings: [r('sì', 'tứ')], radical: '囗', ids: '⿴囗儿', strokes: 5, kind: 'invented' },
	五: { readings: [r('wǔ', 'ngũ')], radical: '二', ids: '⿱一𫝀', strokes: 4, kind: 'etymology' },
	六: { readings: [r('liù', 'lục')], radical: '八', ids: '⿱亠八', strokes: 4, kind: 'etymology' },
	七: { readings: [r('qī', 'thất')], radical: '一', ids: '⿻㇀乚', strokes: 2, kind: 'etymology' },
	八: { readings: [r('bā', 'bát')], radical: '八', ids: '八', strokes: 2, kind: 'etymology' },
	九: { readings: [r('jiǔ', 'cửu')], radical: '乙', ids: '九', strokes: 2, kind: 'etymology' },
	十: { readings: [r('shí', 'thập')], radical: '十', ids: '十', strokes: 2, kind: 'etymology' },
	几: {
		readings: [r('jǐ', 'kỷ'), r('jī', 'cơ', true)],
		radical: '几',
		ids: '几',
		strokes: 2,
		kind: 'etymology'
	},
	岁: { readings: [r('suì', 'tuế')], radical: '山', ids: '⿱山夕', strokes: 6, kind: 'invented' },
	吗: { readings: [r('ma', 'ma')], radical: '口', ids: '⿰口马', strokes: 6, kind: 'invented' },
	呢: { readings: [r('ne', 'ni')], radical: '口', ids: '⿰口尼', strokes: 8, kind: 'invented' },
	的: {
		readings: [r('de', 'đích'), r('dí', 'đích'), r('dì', 'đích'), r('dī', 'đích', true)],
		radical: '白',
		ids: '⿰白勺',
		strokes: 8,
		kind: 'invented'
	}
};

// drafts for chars the vault has not reached yet; the vault's own entry wins once it exists
const local: Record<string, Mnemonic> = {
	谁: {
		hinh: '讠 lời nói + 隹 con chim → nghe tiếng mà không thấy người: "ai nói đấy?"',
		am: 'Gõ cửa: "谁?" — "Thuỳ đây!"',
		doiThat: '谁啊？ khi có tiếng gõ cửa',
		tuongPhan: '什么 hỏi vật, 谁 hỏi người; 隹 cũng có trong 难, 准'
	},
	姐: {
		hinh: '女 người nữ + 且 bàn thờ tổ → người con gái đứng đầu hàng con cháu = chị',
		am: '"Tỷ tỷ" trong phim kiếm hiệp',
		doiThat: '姐姐, 小姐',
		tuongPhan: '妹 = 女 + 未 "chưa" → còn nhỏ = em gái'
	},
	友: {
		hinh: 'ナ + 又 = hai bàn tay phải nắm nhau → bạn',
		am: '"Bằng hữu"; yǒu nghe như "you"',
		doiThat: '朋友',
		tuongPhan: '有 yǒu cùng âm = tay cầm miếng thịt 月 → "có"; 友 là tay nắm tay'
	},
	弟: {
		hinh: 'Sợi dây quấn quanh cây gậy theo thứ tự → người đứng sau = em trai',
		am: '"Huynh đệ"; dì nghe như "đi" → em trai đi theo sau',
		doiThat: '弟弟',
		tuongPhan: '第 = 竹 + 弟 → "thứ tự" (第一)'
	},
	医: {
		hinh: '匚 cái hộp + 矢 mũi tên → hộp đựng mũi tên rút khỏi vết thương = chữa bệnh',
		am: '"Y" trong y sinh, y tá',
		doiThat: '医生, 医院',
		tuongPhan: '区 = 匚 + 乂; 矢 khác 失'
	},
	呢: {
		hinh: '口 miệng + 尼 (chỉ âm) → tiếng cuối câu để hỏi lại',
		am: 'ne nghe như "nè": 你呢？ = "còn bạn nè?"',
		doiThat: '我很好，你呢？',
		tuongPhan: '吗 hỏi có/không; 呢 hỏi lại "còn … thì sao?"'
	},
	系: {
		hinh: '丿 + 糸 sợi tơ → sợi dây buộc nối hai thứ với nhau',
		am: '"Hệ" trong quan hệ, hệ thống',
		doiThat: '没关系, 关系',
		tuongPhan: '糸/纟 là bộ tơ (丝, 红); 系 là sợi tơ đang buộc'
	},
	客: {
		hinh: '宀 mái nhà + 各 từng người → người từ ngoài đến dưới mái nhà = khách',
		am: 'kè nghe gần "khách"',
		doiThat: '不客气, 客人',
		tuongPhan: '各 gè "mỗi" không có mái; thêm 宀 thành khách'
	}
};

mkdirSync('content/chars', { recursive: true });
for (const [hanzi, { kind, ...row }] of Object.entries(rows)) {
	const m = mnemonics.get(hanzi) ?? local[hanzi];
	const file = { hanzi, ...row, ...(m && { mnemonic: { ...m, kind } }) };
	writeFileSync(`content/chars/${hanzi}.yaml`, YAML.stringify(file, { lineWidth: 0 }));
}
