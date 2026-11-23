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
	},
	有: { readings: [r('yǒu', 'hữu')], radical: '月', ids: '⿸𠂇月', strokes: 6, kind: 'etymology' },
	口: { readings: [r('kǒu', 'khẩu')], radical: '口', ids: '口', strokes: 3, kind: 'etymology' },
	人: { readings: [r('rén', 'nhân')], radical: '人', ids: '人', strokes: 2, kind: 'etymology' },
	两: {
		readings: [r('liǎng', 'lưỡng')],
		radical: '一',
		ids: '⿱一⿻冂从',
		strokes: 7,
		kind: 'invented'
	},
	个: {
		readings: [r('gè', 'cá'), r('gě', 'cá', true)],
		radical: '丨',
		ids: '⿱人丨',
		strokes: 3,
		kind: 'invented'
	},
	儿: { readings: [r('ér', 'nhi')], radical: '儿', ids: '⿰丿乚', strokes: 2, kind: 'etymology' },
	子: {
		readings: [r('zǐ', 'tử'), r('zi', 'tử', true)],
		radical: '子',
		ids: '子',
		strokes: 3,
		kind: 'etymology'
	},
	女: { readings: [r('nǚ', 'nữ')], radical: '女', ids: '女', strokes: 3, kind: 'etymology' },
	孩: { readings: [r('hái', 'hài')], radical: '子', ids: '⿰子亥', strokes: 9, kind: 'etymology' },
	都: {
		readings: [r('dōu', 'đô'), r('dū', 'đô')],
		radical: '邑',
		ids: '⿰者阝',
		strokes: 10,
		kind: 'etymology'
	},
	工: { readings: [r('gōng', 'công')], radical: '工', ids: '工', strokes: 3, kind: 'etymology' },
	作: {
		readings: [r('zuò', 'tác'), r('zuō', 'tác', true)],
		radical: '人',
		ids: '⿰亻乍',
		strokes: 7,
		kind: 'etymology'
	},
	做: { readings: [r('zuò', 'tố')], radical: '人', ids: '⿰亻故', strokes: 11, kind: 'etymology' },
	院: {
		readings: [r('yuàn', 'viện')],
		radical: '阜',
		ids: '⿰阝完',
		strokes: 9,
		kind: 'etymology'
	},
	先: {
		readings: [r('xiān', 'tiên')],
		radical: '儿',
		ids: '⿱𠂒儿',
		strokes: 6,
		kind: 'etymology'
	},
	哪: {
		readings: [r('nǎ', 'nả'), r('něi', 'nả', true)],
		radical: '口',
		ids: '⿰口那',
		strokes: 9,
		kind: 'etymology'
	},
	中: {
		readings: [r('zhōng', 'trung'), r('zhòng', 'trúng', true)],
		radical: '丨',
		ids: '⿻口丨',
		strokes: 4,
		kind: 'etymology'
	},
	国: { readings: [r('guó', 'quốc')], radical: '囗', ids: '⿴囗玉', strokes: 8, kind: 'etymology' },
	外: {
		readings: [r('wài', 'ngoại')],
		radical: '夕',
		ids: '⿰夕卜',
		strokes: 5,
		kind: 'etymology'
	},
	北: { readings: [r('běi', 'bắc')], radical: '匕', ids: '⿰③匕', strokes: 5, kind: 'etymology' },
	京: {
		readings: [r('jīng', 'kinh')],
		radical: '亠',
		ids: '⿳亠口小',
		strokes: 8,
		kind: 'etymology'
	},
	男: { readings: [r('nán', 'nam')], radical: '田', ids: '⿱田力', strokes: 7, kind: 'etymology' },
	会: {
		readings: [r('huì', 'hội'), r('kuài', 'cối', true)],
		radical: '人',
		ids: '⿱人云',
		strokes: 6,
		kind: 'invented'
	},
	能: {
		readings: [r('néng', 'năng')],
		radical: '肉',
		ids: '⿰䏍𫧇',
		strokes: 10,
		kind: 'etymology'
	},
	说: {
		readings: [r('shuō', 'thuyết'), r('shuì', 'thuyết', true)],
		radical: '言',
		ids: '⿰讠兑',
		strokes: 9,
		kind: 'etymology'
	},
	汉: { readings: [r('hàn', 'hán')], radical: '水', ids: '⿰氵又', strokes: 5, kind: 'etymology' },
	语: {
		readings: [r('yǔ', 'ngữ'), r('yù', 'ngự', true)],
		radical: '言',
		ids: '⿰讠吾',
		strokes: 9,
		kind: 'etymology'
	},
	文: { readings: [r('wén', 'văn')], radical: '文', ids: '⿱亠乂', strokes: 4, kind: 'etymology' },
	写: { readings: [r('xiě', 'tả')], radical: '冖', ids: '⿱冖与', strokes: 5, kind: 'invented' },
	读: {
		readings: [r('dú', 'độc'), r('dòu', 'đậu', true)],
		radical: '言',
		ids: '⿰讠卖',
		strokes: 10,
		kind: 'etymology'
	},
	跟: { readings: [r('gēn', 'cân')], radical: '足', ids: '⿰𧾷艮', strokes: 13, kind: 'etymology' },
	习: { readings: [r('xí', 'tập')], radical: '乙', ids: '⿹𠃌冫', strokes: 3, kind: 'invented' },
	校: {
		readings: [r('xiào', 'hiệu'), r('jiào', 'hiệu', true)],
		radical: '木',
		ids: '⿰木交',
		strokes: 10,
		kind: 'etymology'
	},
	教: {
		readings: [r('jiāo', 'giao'), r('jiào', 'giáo')],
		radical: '攴',
		ids: '⿰孝攵',
		strokes: 11,
		kind: 'etymology'
	},
	课: { readings: [r('kè', 'khoá')], radical: '言', ids: '⿰讠果', strokes: 10, kind: 'etymology' },
	本: { readings: [r('běn', 'bản')], radical: '木', ids: '本', strokes: 5, kind: 'etymology' },
	书: { readings: [r('shū', 'thư')], radical: '丨', ids: '书', strokes: 4, kind: 'invented' },
	小: { readings: [r('xiǎo', 'tiểu')], radical: '小', ids: '小', strokes: 3, kind: 'etymology' },
	很: { readings: [r('hěn', 'ngận')], radical: '彳', ids: '⿰彳艮', strokes: 9, kind: 'etymology' },
	非: { readings: [r('fēi', 'phi')], radical: '非', ids: '非', strokes: 8, kind: 'etymology' },
	常: {
		readings: [r('cháng', 'thường')],
		radical: '巾',
		ids: '⿱𫩠巾',
		strokes: 11,
		kind: 'etymology'
	},
	真: {
		readings: [r('zhēn', 'chân')],
		radical: '目',
		ids: '⿱十具',
		strokes: 10,
		kind: 'invented'
	},
	高: {
		readings: [r('gāo', 'cao')],
		radical: '高',
		ids: '⿳亠口冋',
		strokes: 10,
		kind: 'etymology'
	},
	兴: {
		readings: [r('xìng', 'hứng'), r('xīng', 'hưng', true)],
		radical: '八',
		ids: '⿳𭕄一八',
		strokes: 6,
		kind: 'invented'
	},
	认: { readings: [r('rèn', 'nhận')], radical: '言', ids: '⿰讠人', strokes: 4, kind: 'etymology' },
	识: { readings: [r('shí', 'thức')], radical: '言', ids: '⿰讠只', strokes: 7, kind: 'etymology' },
	累: {
		readings: [r('lèi', 'luỵ'), r('lěi', 'luỵ', true)],
		radical: '糸',
		ids: '⿱田糸',
		strokes: 11,
		kind: 'etymology'
	},
	忙: {
		readings: [r('máng', 'mang')],
		radical: '心',
		ids: '⿰忄亡',
		strokes: 6,
		kind: 'etymology'
	},
	太: { readings: [r('tài', 'thái')], radical: '大', ids: '⿵大丶', strokes: 4, kind: 'etymology' },
	百: { readings: [r('bǎi', 'bách')], radical: '白', ids: '⿱一白', strokes: 6, kind: 'invented' },
	零: {
		readings: [r('líng', 'linh')],
		radical: '雨',
		ids: '⿱雨令',
		strokes: 13,
		kind: 'etymology'
	},
	半: {
		readings: [r('bàn', 'bán')],
		radical: '十',
		ids: '⿱丷⿻二丨',
		strokes: 5,
		kind: 'invented'
	},
	杯: { readings: [r('bēi', 'bôi')], radical: '木', ids: '⿰木不', strokes: 8, kind: 'etymology' },
	页: { readings: [r('yè', 'hiệt')], radical: '页', ids: '页', strokes: 6, kind: 'invented' },
	次: { readings: [r('cì', 'thứ')], radical: '欠', ids: '⿰冫欠', strokes: 6, kind: 'etymology' },
	些: { readings: [r('xiē', 'ta')], radical: '二', ids: '⿱此二', strokes: 8, kind: 'invented' },
	年: { readings: [r('nián', 'niên')], radical: '干', ids: '年', strokes: 6, kind: 'invented' },
	月: { readings: [r('yuè', 'nguyệt')], radical: '月', ids: '月', strokes: 4, kind: 'etymology' },
	日: { readings: [r('rì', 'nhật')], radical: '日', ids: '日', strokes: 4, kind: 'etymology' },
	号: {
		readings: [r('hào', 'hiệu'), r('háo', 'hiệu', true)],
		radical: '口',
		ids: '⿱口丂',
		strokes: 5,
		kind: 'invented'
	},
	今: { readings: [r('jīn', 'kim')], radical: '人', ids: '⿱亽㇇', strokes: 4, kind: 'etymology' },
	天: {
		readings: [r('tiān', 'thiên')],
		radical: '大',
		ids: '⿱一大',
		strokes: 4,
		kind: 'etymology'
	},
	前: {
		readings: [r('qián', 'tiền')],
		radical: '刀',
		ids: '⿱䒑刖',
		strokes: 9,
		kind: 'etymology'
	},
	后: { readings: [r('hòu', 'hậu')], radical: '口', ids: '⿸𠂋口', strokes: 6, kind: 'etymology' },
	星: {
		readings: [r('xīng', 'tinh')],
		radical: '日',
		ids: '⿱日生',
		strokes: 9,
		kind: 'etymology'
	},
	期: { readings: [r('qī', 'kỳ')], radical: '月', ids: '⿰其月', strokes: 12, kind: 'etymology' },
	还: {
		readings: [r('hái', 'hoàn'), r('huán', 'hoàn')],
		radical: '辵',
		ids: '⿺辶不',
		strokes: 7,
		kind: 'etymology'
	},
	上: {
		readings: [r('shàng', 'thượng'), r('shǎng', 'thưởng', true)],
		radical: '一',
		ids: '⿱卜一',
		strokes: 3,
		kind: 'etymology'
	},
	午: { readings: [r('wǔ', 'ngọ')], radical: '十', ids: '⿱𠂉十', strokes: 4, kind: 'invented' },
	下: { readings: [r('xià', 'hạ')], radical: '一', ids: '⿱一卜', strokes: 3, kind: 'etymology' },
	早: { readings: [r('zǎo', 'tảo')], radical: '日', ids: '⿱日十', strokes: 6, kind: 'etymology' },
	晚: { readings: [r('wǎn', 'vãn')], radical: '日', ids: '⿰日免', strokes: 11, kind: 'etymology' },
	点: {
		readings: [r('diǎn', 'điểm')],
		radical: '火',
		ids: '⿱占灬',
		strokes: 9,
		kind: 'etymology'
	},
	分: {
		readings: [r('fēn', 'phân'), r('fèn', 'phận', true)],
		radical: '刀',
		ids: '⿱八刀',
		strokes: 4,
		kind: 'etymology'
	},
	现: {
		readings: [r('xiàn', 'hiện')],
		radical: '玉',
		ids: '⿰王见',
		strokes: 8,
		kind: 'etymology'
	},
	在: { readings: [r('zài', 'tại')], radical: '土', ids: '⿸才土', strokes: 6, kind: 'etymology' },
	时: { readings: [r('shí', 'thời')], radical: '日', ids: '⿰日寸', strokes: 7, kind: 'etymology' },
	候: { readings: [r('hòu', 'hậu')], radical: '人', ids: '⿰亻侯', strokes: 10, kind: 'etymology' },
	间: {
		readings: [r('jiān', 'gian'), r('jiàn', 'gián', true)],
		radical: '门',
		ids: '⿵门日',
		strokes: 7,
		kind: 'etymology'
	},
	床: {
		readings: [r('chuáng', 'sàng')],
		radical: '广',
		ids: '⿸广木',
		strokes: 7,
		kind: 'etymology'
	},
	睡: {
		readings: [r('shuì', 'thuỵ')],
		radical: '目',
		ids: '⿰目垂',
		strokes: 13,
		kind: 'etymology'
	},
	觉: {
		readings: [r('jiào', 'giáo'), r('jué', 'giác')],
		radical: '见',
		ids: '⿳𭕄冖见',
		strokes: 9,
		kind: 'etymology'
	},
	昨: { readings: [r('zuó', 'tạc')], radical: '日', ids: '⿰日乍', strokes: 9, kind: 'etymology' },
	明: {
		readings: [r('míng', 'minh')],
		radical: '日',
		ids: '⿰日月',
		strokes: 8,
		kind: 'etymology'
	},
	了: {
		readings: [r('le', 'liễu'), r('liǎo', 'liễu', true)],
		radical: '亅',
		ids: '⿱乛亅',
		strokes: 2,
		kind: 'invented'
	},
	来: { readings: [r('lái', 'lai')], radical: '木', ids: '来', strokes: 7, kind: 'invented' },
	回: { readings: [r('huí', 'hồi')], radical: '囗', ids: '⿴囗口', strokes: 6, kind: 'etymology' },
	去: { readings: [r('qù', 'khứ')], radical: '厶', ids: '⿱土厶', strokes: 5, kind: 'invented' }
};

// drafts for chars the vault has not reached yet; the vault's own entry wins once it exists
const local: Record<string, Mnemonic> = {
	页: {
		hinh: '页 giản lược của 頁, gốc nghĩa là "cái đầu"; nay mượn để chỉ trang sách',
		am: 'hiệt — hiếm gặp, neo bằng nghĩa "trang"',
		doiThat: '一页纸, 十页',
		tuongPhan: '≠ 夜 (yè, đêm): cùng đọc yè, khác chữ và khác nghĩa'
	},
	号: {
		hinh: '口 miệng + 丂 hơi thở bật ra → hô to một con số, một hiệu',
		am: 'hiệu — "ký hiệu", "tín hiệu"',
		doiThat: '几号, 号码',
		tuongPhan: '≠ 句 (jù, câu): 号 có 丂, 句 có 勹'
	},
	期: {
		hinh: '其 gợi âm + 月 mặt trăng → một chu kỳ theo vầng trăng = một kỳ, một tuần',
		am: 'kỳ — "thời kỳ", "học kỳ"',
		doiThat: '星期, 学期',
		tuongPhan: '≠ 其 (qí): 期 thêm 月 thành "kỳ hạn"'
	},
	晚: {
		hinh: '日 mặt trời + 免 gợi âm → lúc mặt trời đã xuống = buổi tối, muộn',
		am: 'vãn — "vãn", "buổi vãn"',
		doiThat: '晚上, 晚饭',
		tuongPhan: '≠ 免 (miǎn): 晚 thêm 日 thành buổi tối'
	},
	候: {
		hinh: '亻 người + 侯 gợi âm → người đứng chờ đúng lúc = thời điểm',
		am: 'hậu — "thời hậu", "khí hậu"',
		doiThat: '时候, 等候',
		tuongPhan: '≠ 后 (hòu, sau): cùng đọc hòu, khác chữ và khác nghĩa'
	},
	床: {
		hinh: '广 mái che + 木 gỗ → cái giường gỗ đặt dưới mái nhà',
		am: 'sàng — "khởi sàng" (thức dậy)',
		doiThat: '起床, 床上',
		tuongPhan: '≠ 林 (lín, rừng): 床 chỉ có một 木 dưới 广'
	},
	睡: {
		hinh: '目 mắt + 垂 rủ xuống → mí mắt rủ xuống = ngủ',
		am: 'thuỵ — "thuỵ miên" (giấc ngủ)',
		doiThat: '睡觉, 睡着',
		tuongPhan: '≠ 垂 (chuí): 睡 thêm 目 thành ngủ'
	},
	语: {
		hinh: '讠 lời nói + 吾 gợi âm → lời nói, ngôn ngữ',
		am: 'ngữ — "ngôn ngữ", "ngữ pháp"',
		doiThat: '汉语, 外语',
		tuongPhan: '≠ 说 (shuō): cùng bộ 讠, nhưng 语 là ngôn ngữ, 说 là hành động nói'
	},
	习: {
		hinh: '习 giản lược của 習 (lông vũ 羽 + 白) → chim non vỗ cánh tập bay = tập, luyện',
		am: 'tập — "học tập", "tập quán"',
		doiThat: '学习, 练习',
		tuongPhan: '≠ 书 (shū): cùng ít nét, nhưng 习 đọc xí, nghĩa là tập'
	},
	校: {
		hinh: '木 gỗ + 交 gợi âm → hàng rào gỗ, nghĩa mở rộng thành trường học',
		am: 'hiệu — "học hiệu", "hiệu trưởng"',
		doiThat: '学校, 校长',
		tuongPhan: '≠ 交 (jiāo): 校 thêm 木 để thành trường'
	},
	课: {
		hinh: '讠 lời nói + 果 gợi âm → bài giảng, bài học',
		am: 'khoá — "khoá học", "bài khoá"',
		doiThat: '课本, 上课',
		tuongPhan: '≠ 果 (guǒ, quả): 课 thêm 讠 thành bài học'
	},
	兴: {
		hinh: '兴 giản lược của 興: nhiều bàn tay cùng nâng lên → hào hứng, hưng thịnh',
		am: 'hứng — "cao hứng", "hưng thịnh"',
		doiThat: '高兴',
		tuongPhan: '≠ 关 (guān): cùng mũ 丷, nhưng 兴 có 一 và 八 ở dưới'
	},
	识: {
		hinh: '讠 lời nói + 只 gợi âm → nghe lời mà nhận ra = biết, nhận biết',
		am: 'thức — "nhận thức", "tri thức"',
		doiThat: '认识',
		tuongPhan: '≠ 只 (zhǐ): 识 thêm 讠 thành biết'
	},
	孩: {
		hinh: '子 đứa trẻ + 亥 gợi âm → đứa bé: 孩子',
		am: 'hái nghe gần "hài" trong "hài nhi"',
		doiThat: '孩子, 小孩儿',
		tuongPhan: '≠ 子 (zǐ): 孩 thêm 亥 để gợi âm, nghĩa vẫn là trẻ con'
	},
	院: {
		hinh: '阝 bờ tường + 完 gợi âm → khoảng sân có tường bao quanh = viện',
		am: 'viện — "bệnh viện", "học viện"',
		doiThat: '医院, 学院',
		tuongPhan: '≠ 完 (wán, xong): thêm 阝 thành sân, viện'
	},
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
	const found = mnemonics.get(hanzi) ?? local[hanzi];
	const m = found && !/[\u2E80-\u2FDF]/.test(JSON.stringify(found)) ? found : undefined;
	const file = { hanzi, ...row, ...(m && { mnemonic: { ...m, kind } }) };
	writeFileSync(`content/chars/${hanzi}.yaml`, YAML.stringify(file, { lineWidth: 0 }));
}
