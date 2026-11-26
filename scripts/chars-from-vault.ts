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
	去: { readings: [r('qù', 'khứ')], radical: '厶', ids: '⿱土厶', strokes: 5, kind: 'invented' },
	想: {
		readings: [r('xiǎng', 'tưởng')],
		radical: '心',
		ids: '⿱相心',
		strokes: 13,
		kind: 'etymology'
	},
	要: {
		readings: [r('yào', 'yếu'), r('yāo', 'yêu', true)],
		radical: '襾',
		ids: '⿱覀女',
		strokes: 9,
		kind: 'invented'
	},
	喝: { readings: [r('hē', 'hát')], radical: '口', ids: '⿰口曷', strokes: 12, kind: 'etymology' },
	茶: {
		readings: [r('chá', 'trà')],
		radical: '艸',
		ids: '⿳艹人朩',
		strokes: 9,
		kind: 'etymology'
	},
	水: { readings: [r('shuǐ', 'thuỷ')], radical: '水', ids: '水', strokes: 4, kind: 'etymology' },
	牛: { readings: [r('niú', 'ngưu')], radical: '牛', ids: '牛', strokes: 4, kind: 'etymology' },
	奶: { readings: [r('nǎi', 'nãi')], radical: '女', ids: '⿰女乃', strokes: 5, kind: 'etymology' },
	渴: { readings: [r('kě', 'khát')], radical: '水', ids: '⿰氵曷', strokes: 12, kind: 'etymology' },
	饿: { readings: [r('è', 'ngạ')], radical: '食', ids: '⿰饣我', strokes: 10, kind: 'etymology' },
	吃: { readings: [r('chī', 'cật')], radical: '口', ids: '⿰口乞', strokes: 6, kind: 'etymology' },
	饭: { readings: [r('fàn', 'phạn')], radical: '食', ids: '⿰饣反', strokes: 7, kind: 'etymology' },
	菜: {
		readings: [r('cài', 'thái')],
		radical: '艸',
		ids: '⿱艹采',
		strokes: 11,
		kind: 'etymology'
	},
	肉: { readings: [r('ròu', 'nhục')], radical: '肉', ids: '肉', strokes: 6, kind: 'etymology' },
	鸡: { readings: [r('jī', 'kê')], radical: '鸟', ids: '⿰又鸟', strokes: 7, kind: 'etymology' },
	蛋: { readings: [r('dàn', 'đản')], radical: '虫', ids: '⿱疋虫', strokes: 11, kind: 'invented' },
	面: {
		readings: [r('miàn', 'diện'), r('miàn', 'miến', true)],
		radical: '面',
		ids: '⿱丆囬',
		strokes: 9,
		kind: 'invented'
	},
	包: { readings: [r('bāo', 'bao')], radical: '勹', ids: '⿹勹巳', strokes: 5, kind: 'etymology' },
	条: { readings: [r('tiáo', 'điều')], radical: '木', ids: '⿱夂朩', strokes: 7, kind: 'invented' },
	和: {
		readings: [r('hé', 'hoà'), r('hè', 'hoạ', true), r('huó', 'hoà', true), r('huò', 'hoà', true)],
		radical: '口',
		ids: '⿰禾口',
		strokes: 8,
		kind: 'etymology'
	},
	请: {
		readings: [r('qǐng', 'thỉnh')],
		radical: '言',
		ids: '⿰讠青',
		strokes: 10,
		kind: 'etymology'
	},
	店: {
		readings: [r('diàn', 'điếm')],
		radical: '广',
		ids: '⿸广占',
		strokes: 8,
		kind: 'etymology'
	},
	给: {
		readings: [r('gěi', 'cấp'), r('jǐ', 'cấp', true)],
		radical: '糸',
		ids: '⿰纟合',
		strokes: 9,
		kind: 'etymology'
	},
	米: { readings: [r('mǐ', 'mễ')], radical: '米', ids: '米', strokes: 6, kind: 'etymology' },
	等: {
		readings: [r('děng', 'đẳng')],
		radical: '竹',
		ids: '⿱竹寺',
		strokes: 12,
		kind: 'etymology'
	},
	进: { readings: [r('jìn', 'tiến')], radical: '辵', ids: '⿺辶井', strokes: 7, kind: 'etymology' },
	买: { readings: [r('mǎi', 'mãi')], radical: '大', ids: '⿱乛头', strokes: 6, kind: 'invented' },
	多: { readings: [r('duō', 'đa')], radical: '夕', ids: '⿱夕夕', strokes: 6, kind: 'etymology' },
	少: {
		readings: [r('shǎo', 'thiểu'), r('shào', 'thiếu', true)],
		radical: '小',
		ids: '⿱小丿',
		strokes: 4,
		kind: 'invented'
	},
	钱: {
		readings: [r('qián', 'tiền')],
		radical: '金',
		ids: '⿰钅戋',
		strokes: 10,
		kind: 'etymology'
	},
	块: {
		readings: [r('kuài', 'khối')],
		radical: '土',
		ids: '⿰土夬',
		strokes: 7,
		kind: 'etymology'
	},
	元: {
		readings: [r('yuán', 'nguyên')],
		radical: '儿',
		ids: '⿱一兀',
		strokes: 4,
		kind: 'invented'
	},
	毛: {
		readings: [r('máo', 'mao')],
		radical: '毛',
		ids: '⿱丿⿻二乚',
		strokes: 4,
		kind: 'etymology'
	},
	贵: { readings: [r('guì', 'quý')], radical: '贝', ids: '⿱𠀐贝', strokes: 9, kind: 'etymology' },
	票: {
		readings: [r('piào', 'phiếu')],
		radical: '示',
		ids: '⿱覀示',
		strokes: 11,
		kind: 'invented'
	},
	喜: { readings: [r('xǐ', 'hỷ')], radical: '口', ids: '⿱壴口', strokes: 12, kind: 'etymology' },
	欢: {
		readings: [r('huān', 'hoan')],
		radical: '欠',
		ids: '⿰又欠',
		strokes: 6,
		kind: 'etymology'
	},
	爱: {
		readings: [r('ài', 'ái')],
		radical: '爪',
		ids: '⿱⿱爫冖友',
		strokes: 10,
		kind: 'invented'
	},
	最: { readings: [r('zuì', 'tối')], radical: '曰', ids: '⿱日取', strokes: 12, kind: 'etymology' },
	果: { readings: [r('guǒ', 'quả')], radical: '木', ids: '⿻日木', strokes: 8, kind: 'etymology' },
	唱: {
		readings: [r('chàng', 'xướng')],
		radical: '口',
		ids: '⿰口昌',
		strokes: 11,
		kind: 'etymology'
	},
	歌: { readings: [r('gē', 'ca')], radical: '欠', ids: '⿰哥欠', strokes: 14, kind: 'etymology' },
	打: {
		readings: [r('dǎ', 'đả'), r('dá', 'tá', true)],
		radical: '手',
		ids: '⿰扌丁',
		strokes: 5,
		kind: 'etymology'
	},
	球: { readings: [r('qiú', 'cầu')], radical: '玉', ids: '⿰王求', strokes: 11, kind: 'etymology' },
	玩: {
		readings: [r('wán', 'ngoạn')],
		radical: '玉',
		ids: '⿰王元',
		strokes: 8,
		kind: 'etymology'
	},
	电: { readings: [r('diàn', 'điện')], radical: '田', ids: '⿻日乚', strokes: 5, kind: 'invented' },
	影: {
		readings: [r('yǐng', 'ảnh')],
		radical: '彡',
		ids: '⿰景彡',
		strokes: 15,
		kind: 'etymology'
	},
	里: { readings: [r('lǐ', 'lý')], radical: '里', ids: '⿱⿻甲一一', strokes: 7, kind: 'invented' },
	左: { readings: [r('zuǒ', 'tả')], radical: '工', ids: '⿸𠂇工', strokes: 5, kind: 'etymology' },
	右: { readings: [r('yòu', 'hữu')], radical: '口', ids: '⿸𠂇口', strokes: 5, kind: 'etymology' },
	坐: { readings: [r('zuò', 'toạ')], radical: '土', ids: '⿻土从', strokes: 7, kind: 'etymology' },
	边: {
		readings: [r('biān', 'biên')],
		radical: '辵',
		ids: '⿺辶力',
		strokes: 5,
		kind: 'etymology'
	},
	别: { readings: [r('bié', 'biệt')], radical: '刀', ids: '⿰另刂', strokes: 7, kind: 'etymology' },
	旁: {
		readings: [r('páng', 'bàng')],
		radical: '方',
		ids: '⿱⿱⿱亠丷冖方',
		strokes: 10,
		kind: 'etymology'
	},
	大: {
		readings: [r('dà', 'đại'), r('dài', 'đại', true)],
		radical: '大',
		ids: '⿻一人',
		strokes: 3,
		kind: 'etymology'
	},
	图: { readings: [r('tú', 'đồ')], radical: '囗', ids: '⿴囗冬', strokes: 8, kind: 'etymology' },
	馆: {
		readings: [r('guǎn', 'quán')],
		radical: '食',
		ids: '⿰饣官',
		strokes: 11,
		kind: 'etymology'
	},
	桌: {
		readings: [r('zhuō', 'trác')],
		radical: '木',
		ids: '⿱卓木',
		strokes: 10,
		kind: 'etymology'
	},
	地: {
		readings: [r('dì', 'địa'), r('de', 'địa', true)],
		radical: '土',
		ids: '⿰土也',
		strokes: 6,
		kind: 'etymology'
	},
	方: {
		readings: [r('fāng', 'phương')],
		radical: '方',
		ids: '⿱亠⿰丿𠃌',
		strokes: 4,
		kind: 'etymology'
	},
	从: {
		readings: [r('cóng', 'tòng')],
		radical: '人',
		ids: '⿰人人',
		strokes: 4,
		kind: 'etymology'
	},
	到: { readings: [r('dào', 'đáo')], radical: '刀', ids: '⿰至刂', strokes: 8, kind: 'etymology' },
	看: {
		readings: [r('kàn', 'khán'), r('kān', 'khán', true)],
		radical: '目',
		ids: '⿱龵目',
		strokes: 9,
		kind: 'etymology'
	},
	病: {
		readings: [r('bìng', 'bệnh')],
		radical: '疒',
		ids: '⿸疒丙',
		strokes: 10,
		kind: 'etymology'
	},
	走: { readings: [r('zǒu', 'tẩu')], radical: '走', ids: '⿱土龰', strokes: 7, kind: 'etymology' },
	房: {
		readings: [r('fáng', 'phòng')],
		radical: '户',
		ids: '⿸户方',
		strokes: 8,
		kind: 'etymology'
	},
	视: { readings: [r('shì', 'thị')], radical: '见', ids: '⿰礻见', strokes: 8, kind: 'etymology' },
	脑: { readings: [r('nǎo', 'não')], radical: '月', ids: '⿰月㐫', strokes: 10, kind: 'etymology' },
	休: { readings: [r('xiū', 'hưu')], radical: '人', ids: '⿰亻木', strokes: 6, kind: 'etymology' },
	息: { readings: [r('xī', 'tức')], radical: '心', ids: '⿱自心', strokes: 10, kind: 'etymology' },
	冷: {
		readings: [r('lěng', 'lãnh')],
		radical: '冫',
		ids: '⿰冫令',
		strokes: 7,
		kind: 'etymology'
	},
	雨: { readings: [r('yǔ', 'vũ')], radical: '雨', ids: '⿱一𠕒', strokes: 8, kind: 'etymology' },
	风: {
		readings: [r('fēng', 'phong')],
		radical: '風',
		ids: '⿵几㐅',
		strokes: 4,
		kind: 'etymology'
	},
	热: {
		readings: [r('rè', 'nhiệt')],
		radical: '火',
		ids: '⿱执灬',
		strokes: 10,
		kind: 'etymology'
	},
	白: { readings: [r('bái', 'bạch')], radical: '白', ids: '白', strokes: 5, kind: 'etymology' },
	快: {
		readings: [r('kuài', 'khoái')],
		radical: '心',
		ids: '⿰忄夬',
		strokes: 7,
		kind: 'etymology'
	},
	比: { readings: [r('bǐ', 'tỷ')], radical: '比', ids: '比', strokes: 4, kind: 'etymology' },
	慢: { readings: [r('màn', 'mạn')], radical: '心', ids: '⿰忄曼', strokes: 14, kind: 'etymology' },
	飞: { readings: [r('fēi', 'phi')], radical: '乙', ids: '飞', strokes: 3, kind: 'etymology' },
	机: { readings: [r('jī', 'cơ')], radical: '木', ids: '⿰木几', strokes: 6, kind: 'etymology' },
	火: { readings: [r('huǒ', 'hoả')], radical: '火', ids: '⿱八人', strokes: 4, kind: 'etymology' },
	车: { readings: [r('chē', 'xa')], radical: '車', ids: '车', strokes: 4, kind: 'etymology' },
	汽: { readings: [r('qì', 'khí')], radical: '水', ids: '⿰氵气', strokes: 7, kind: 'etymology' },
	开: { readings: [r('kāi', 'khai')], radical: '廾', ids: '⿱一廾', strokes: 4, kind: 'etymology' },
	站: {
		readings: [r('zhàn', 'trạm')],
		radical: '立',
		ids: '⿰立占',
		strokes: 10,
		kind: 'etymology'
	},
	吧: { readings: [r('ba', 'ba')], radical: '口', ids: '⿰口巴', strokes: 7, kind: 'invented' },
	马: { readings: [r('mǎ', 'mã')], radical: '馬', ids: '马', strokes: 3, kind: 'etymology' },
	路: { readings: [r('lù', 'lộ')], radical: '足', ids: '⿰𧾷各', strokes: 13, kind: 'etymology' },
	远: {
		readings: [r('yuǎn', 'viễn')],
		radical: '辵',
		ids: '⿺辶元',
		strokes: 7,
		kind: 'etymology'
	},
	送: {
		readings: [r('sòng', 'tống')],
		radical: '辵',
		ids: '⿺辶关',
		strokes: 9,
		kind: 'etymology'
	},
	怎: { readings: [r('zěn', 'chẩm')], radical: '心', ids: '⿱乍心', strokes: 9, kind: 'invented' },
	出: { readings: [r('chū', 'xuất')], radical: '凵', ids: '⿱屮凵', strokes: 5, kind: 'etymology' },
	商: {
		readings: [r('shāng', 'thương')],
		radical: '口',
		ids: '⿱⿱亠丷冏',
		strokes: 11,
		kind: 'invented'
	},
	场: {
		readings: [r('chǎng', 'trường')],
		radical: '土',
		ids: '⿰土𠃓',
		strokes: 6,
		kind: 'invented'
	},
	帮: {
		readings: [r('bāng', 'bang')],
		radical: '巾',
		ids: '⿱邦巾',
		strokes: 9,
		kind: 'etymology'
	},
	手: { readings: [r('shǒu', 'thủ')], radical: '手', ids: '手', strokes: 4, kind: 'etymology' },
	找: {
		readings: [r('zhǎo', 'trảo')],
		radical: '手',
		ids: '⿰扌戈',
		strokes: 7,
		kind: 'etymology'
	},
	拿: { readings: [r('ná', 'nã')], radical: '手', ids: '⿱合手', strokes: 10, kind: 'etymology' },
	放: {
		readings: [r('fàng', 'phóng')],
		radical: '攴',
		ids: '⿰方攵',
		strokes: 8,
		kind: 'etymology'
	},
	新: { readings: [r('xīn', 'tân')], radical: '斤', ids: '⿰亲斤', strokes: 13, kind: 'etymology' },
	服: { readings: [r('fú', 'phục')], radical: '月', ids: '⿰月𠬝', strokes: 8, kind: 'etymology' },
	样: {
		readings: [r('yàng', 'dạng')],
		radical: '木',
		ids: '⿰木羊',
		strokes: 10,
		kind: 'etymology'
	},
	洗: { readings: [r('xǐ', 'tẩy')], radical: '水', ids: '⿰氵先', strokes: 9, kind: 'etymology' },
	用: {
		readings: [r('yòng', 'dụng')],
		radical: '用',
		ids: '⿵冂⿻二丨',
		strokes: 5,
		kind: 'invented'
	},
	穿: {
		readings: [r('chuān', 'xuyên')],
		radical: '穴',
		ids: '⿱穴牙',
		strokes: 9,
		kind: 'etymology'
	},
	衣: { readings: [r('yī', 'y')], radical: '衣', ids: '⿱亠𧘇', strokes: 6, kind: 'etymology' },
	门: { readings: [r('mén', 'môn')], radical: '門', ids: '门', strokes: 3, kind: 'etymology' }
};

// drafts for chars the vault has not reached yet; the vault's own entry wins once it exists
const local: Record<string, Mnemonic> = {
	旁: {
		hinh: '方 phương hướng + 亠 mái che ở trên → vật ở ngay một phương cạnh mình = bên cạnh',
		am: 'bàng — "bàng quan", "bàng biên" (bên cạnh)',
		doiThat: '旁边',
		tuongPhan: '≠ 方 (fāng): 旁 thêm phần mái che phía trên'
	},
	图: {
		hinh: '囗 khung bao quanh + 冬 bên trong → bức vẽ nằm trong khung = bản đồ, tranh',
		am: 'đồ — "địa đồ", "đồ thư quán"',
		doiThat: '图书馆, 地图',
		tuongPhan: '≠ 国 (guó): cùng khung 囗, bên trong khác'
	},
	馆: {
		hinh: '饣 ăn + 官 gợi âm → nơi có người phục vụ, nhà, quán, viện',
		am: 'quán — "đồ thư quán", "phạn quán"',
		doiThat: '图书馆, 饭馆',
		tuongPhan: '≠ 官 (guān): 馆 thêm 饣 thành quán, nhà'
	},
	桌: {
		hinh: '卓 gợi âm + 木 gỗ → đồ làm bằng gỗ để đặt đồ = cái bàn',
		am: 'trác — "trác tử" (cái bàn)',
		doiThat: '桌子',
		tuongPhan: '≠ 卓 (zhuó): 桌 thêm 木 thành cái bàn'
	},
	病: {
		hinh: '疒 bộ bệnh + 丙 gợi âm → nằm trên giường vì ốm = bệnh',
		am: 'bệnh — "bệnh viện", "bệnh nhân"',
		doiThat: '生病, 看病',
		tuongPhan: '≠ 丙 (bǐng): 病 thêm 疒 thành bệnh'
	},
	房: {
		hinh: '户 cửa + 方 gợi âm → căn có cửa = nhà, phòng',
		am: 'phòng — "phòng ốc", "thư phòng"',
		doiThat: '房间, 房子',
		tuongPhan: '≠ 方 (fāng): 房 thêm 户 thành phòng'
	},
	视: {
		hinh: '礻 báo hiệu + 见 nhìn → nhìn kỹ = xem',
		am: 'thị — "điện thị", "thị lực"',
		doiThat: '电视',
		tuongPhan: '≠ 见 (jiàn): 视 thêm 礻 thành nhìn xem'
	},
	脑: {
		hinh: '月 thịt + 㐫 phần đầu → phần thịt trong đầu = não',
		am: 'não — "điện não", "đại não"',
		doiThat: '电脑',
		tuongPhan: '≠ 胸 (xiōng): cùng bộ 月, 脑 chỉ đầu'
	},
	息: {
		hinh: '自 mũi + 心 tim → hơi thở từ mũi và tim = hơi thở, nghỉ',
		am: 'tức — "hưu tức", "tin tức"',
		doiThat: '休息',
		tuongPhan: '≠ 思 (sī): cùng 心, trên khác'
	},
	渴: {
		hinh: '氵 nước + 曷 gợi âm → thiếu nước = khát',
		am: 'khát — "khát", "khát nước"',
		doiThat: '口渴, 渴了',
		tuongPhan: '≠ 喝 (hē): cùng 曷, 渴 có 氵 (nước), 喝 có 口 (miệng)'
	},
	鸡: {
		hinh: '鸟 chim + 又 giản lược → con gà, loài chim nuôi trong nhà',
		am: 'kê — "kê đản" (trứng gà)',
		doiThat: '鸡蛋, 鸡肉',
		tuongPhan: '≠ 鸟 (niǎo, chim): 鸡 thêm 又 thành con gà'
	},
	蛋: {
		hinh: '虫 sinh vật nhỏ + 疋 ở trên → nhớ như quả trứng có vỏ bọc, nở ra con vật',
		am: 'đản — "kê đản" (trứng gà)',
		doiThat: '鸡蛋, 蛋糕',
		tuongPhan: '≠ 虫 (chóng, sâu bọ): 蛋 có thêm 疋 ở trên'
	},
	包: {
		hinh: '勹 bao bọc + 巳 → bọc lấy thứ bên trong = gói, bao',
		am: 'bao — "bao bì", "bao gồm"',
		doiThat: '面包, 书包',
		tuongPhan: '≠ 已 (yǐ): 包 có 勹 bọc ngoài'
	},
	店: {
		hinh: '广 mái che + 占 gợi âm → cửa hàng dưới mái hiên',
		am: 'điếm — "tửu điếm", "thư điếm"',
		doiThat: '饭店, 商店',
		tuongPhan: '≠ 点 (diǎn): gần âm, 店 có 广 mái che'
	},
	块: {
		hinh: '土 đất + 夬 gợi âm → cục đất, miếng, khối',
		am: 'khối — "khối", "khối lượng"',
		doiThat: '一块钱, 一块肉',
		tuongPhan: '≠ 快 (kuài, nhanh): đồng âm kuài, 块 có 土'
	},
	毛: {
		hinh: 'hình sợi lông mọc ra → lông; mượn làm "hào" (một phần mười đồng)',
		am: 'mao — "lông mao"',
		doiThat: '一毛钱, 羽毛',
		tuongPhan: '≠ 手 (shǒu, tay): 毛 có nét cong ở dưới'
	},
	票: {
		hinh: '覀 + 示 → tờ giấy báo hiệu có quyền, tức vé, phiếu',
		am: 'phiếu — "phiếu", "bỏ phiếu"',
		doiThat: '车票, 门票',
		tuongPhan: '≠ 示 (shì): 票 thêm 覀 ở trên'
	},
	唱: {
		hinh: '口 miệng + 昌 gợi âm → mở miệng hát',
		am: 'xướng — "đề xướng", "xướng ngôn viên"',
		doiThat: '唱歌',
		tuongPhan: '≠ 昌 (chāng): 唱 thêm 口 thành hát'
	},
	歌: {
		hinh: '哥 gợi âm + 欠 há miệng → há miệng hát = bài ca',
		am: 'ca — "ca sĩ", "ca khúc"',
		doiThat: '唱歌, 歌手',
		tuongPhan: '≠ 哥 (gē, anh): đồng âm gē, 歌 có 欠'
	},
	打: {
		hinh: '扌 tay + 丁 gợi âm → tay gõ, đánh',
		am: 'đả — "đả kích", "đả đảo"',
		doiThat: '打球, 打电话',
		tuongPhan: '≠ 丁 (dīng): 打 thêm 扌 thành đánh'
	},
	球: {
		hinh: '王 (ngọc) + 求 gợi âm → viên ngọc tròn = quả cầu',
		am: 'cầu — "địa cầu", "bóng cầu"',
		doiThat: '打球, 足球',
		tuongPhan: '≠ 求 (qiú): đồng âm qiú, 球 có 王'
	},
	电: {
		hinh: 'giản lược của 電: tia chớp trong cơn mưa → điện',
		am: 'điện — "điện thoại", "điện ảnh"',
		doiThat: '电影, 电话',
		tuongPhan: '≠ 由 (yóu): 电 có nét móc cong ở dưới'
	},
	影: {
		hinh: '景 cảnh + 彡 nét vẽ → bóng, hình ảnh',
		am: 'ảnh — "điện ảnh", "ảnh hưởng"',
		doiThat: '电影',
		tuongPhan: '≠ 景 (jǐng): 影 thêm 彡 thành bóng, hình'
	},
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
	},
	怎: {
		hinh: '乍 chợt + 心 tim → chợt băn khoăn trong lòng "làm sao đây?" = thế nào, làm sao',
		am: '"chẩm" trong 怎么 (chẩm ma); zěn đọc gần "zẩn"',
		doiThat: '怎么办？ 怎么走？ — câu hỏi cách làm hằng ngày',
		tuongPhan: '≠ 作 (zuò, làm): 怎 có 心 ở dưới, 作 có 亻 ở bên'
	},
	汽: {
		hinh: '氵 nước + 气 hơi → nước bốc thành hơi = hơi nước',
		am: '"khí" trong 汽车 (khí xa), 汽水',
		doiThat: '汽车, 汽水 trên biển hiệu và thực đơn',
		tuongPhan: '≠ 气 (qì, khí): 汽 có 氵 chỉ hơi nước; 气 chỉ không khí'
	},
	站: {
		hinh: '立 đứng + 占 chiếm chỗ → đứng chiếm một chỗ = đứng, trạm dừng',
		am: '"trạm" trong xa trạm, trạm xe',
		doiThat: 'biển 车站, 地铁站 ở nhà ga',
		tuongPhan: '≠ 占 (zhàn, chiếm): 站 có 立 đứng ở bên trái'
	},
	路: {
		hinh: '足 bàn chân + 各 từng người → mỗi người đi bằng chân trên một lối = đường',
		am: '"lộ" trong đại lộ, công lộ',
		doiThat: 'biển 马路, 路口, 走路 ở ngã tư',
		tuongPhan: '≠ 跟 (gēn): cùng bộ 足 chân, 路 là đường, 跟 là theo'
	},
	远: {
		hinh: '辶 bước đi + 元 điểm đầu → đi mãi từ điểm đầu = xa',
		am: '"viễn" trong viễn thông, viễn xứ',
		doiThat: '离这儿远吗？ 不远 khi hỏi đường',
		tuongPhan: '≠ 近 (jìn, gần): cùng bộ 辶, nghĩa trái nhau'
	},
	送: {
		hinh: '辶 bước đi + 关 đóng cửa → đi cùng ai ra tới cửa rồi đóng lại = tiễn, đưa',
		am: '"tống" trong tống tiễn',
		doiThat: '我送你去车站 — đưa bạn ra ga; 送货 trên app giao hàng',
		tuongPhan: '≠ 进 (jìn): cùng bộ 辶; 送 đưa đi ra, 进 đi vào'
	},
	商: {
		hinh: '亠 + 丷 + 冏 ô cửa sáng → chỗ mở cửa trao đổi hàng hoá = buôn bán, thương mại',
		am: '"thương" trong thương mại, thương điếm',
		doiThat: '商店, 商场 trên biển hiệu phố mua sắm',
		tuongPhan: '≠ 高 (gāo, cao): 商 có thêm 丷 ở trên và 冏 ở dưới'
	},
	场: {
		hinh: '土 đất + 昜 ánh sáng trải rộng → khoảnh đất rộng để tụ họp = bãi, nơi, trường',
		am: '"trường" trong thương trường, quảng trường',
		doiThat: '商场 là trung tâm thương mại; 机场 là sân bay',
		tuongPhan: '≠ 地 (dì, đất): cùng bộ 土, 场 là bãi rộng, 地 là mặt đất'
	},
	帮: {
		hinh: '邦 nước + 巾 khăn → nhiều bàn tay khăn vải kết lại giúp nhau = giúp đỡ, bang hội',
		am: '"bang" trong bang hội, bang trợ',
		doiThat: '帮帮我 khi nhờ ai; nút "帮助" trong app',
		tuongPhan: '≠ 邦 (bāng): 帮 có thêm 巾 ở dưới'
	},
	找: {
		hinh: '扌 bàn tay + 戈 cây qua → tay cầm vũ khí lục tìm khắp nơi = tìm, kiếm',
		am: '"trảo" trong trảo (tìm); zhǎo đọc gần "chảo"',
		doiThat: '找钱 khi thối tiền; app tìm đường ghi "找路"',
		tuongPhan: '≠ 我 (wǒ, tôi): 找 có 扌 bên trái, 我 không có'
	},
	拿: {
		hinh: '合 gộp lại + 手 tay → tay gộp lại nắm vào = cầm, lấy',
		am: '"nã" trong nã (cầm bắt)',
		doiThat: '你拿着 khi đưa đồ; 拿铁 trên menu cà phê',
		tuongPhan: '≠ 合 (hé, hợp): 拿 có 手 ở dưới'
	},
	放: {
		hinh: '方 hướng + 攵 tay cầm gậy → đẩy ra một hướng cho đi = thả, đặt, để',
		am: '"phóng" trong phóng thích, phóng to',
		doiThat: '放这里 khi chỉ chỗ để đồ; 放假 là nghỉ lễ',
		tuongPhan: '≠ 方 (fāng, phương): 放 có thêm 攵 bên phải'
	},
	洗: {
		hinh: '氵 nước + 先 đi trước → đem nước làm cho sạch trước khi dùng = rửa, giặt',
		am: '"tẩy" trong tẩy rửa, tẩy trang',
		doiThat: '洗手间 là nhà vệ sinh; 洗衣机 là máy giặt',
		tuongPhan: '≠ 先 (xiān, trước): 洗 có 氵 bên trái'
	},
	穿: {
		hinh: '穴 cái hang + 牙 răng → răng nhọn đục xuyên hang = xuyên qua, mặc vào',
		am: '"xuyên" trong xuyên qua, xuyên suốt',
		doiThat: '穿衣服 là mặc quần áo; 穿过马路 là băng qua đường',
		tuongPhan: '≠ 牙 (yá, răng): 穿 có 穴 che bên trên'
	}
};

mkdirSync('content/chars', { recursive: true });
for (const [hanzi, { kind, ...row }] of Object.entries(rows)) {
	const found = mnemonics.get(hanzi) ?? local[hanzi];
	const m = found && !/[\u2E80-\u2FDF]/.test(JSON.stringify(found)) ? found : undefined;
	if (!m)
		console.warn(
			`chars-from-vault: ${hanzi} has no mnemonic${found ? ' (radical glyph in the vault entry)' : ''}`
		);
	const file = { hanzi, ...row, ...(m && { mnemonic: { ...m, kind } }) };
	writeFileSync(`content/chars/${hanzi}.yaml`, YAML.stringify(file, { lineWidth: 0 }));
}
