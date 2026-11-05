import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadVaultMnemonics } from '../src/lib/content/lint/refs';

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
		kind: 'invented'
	},
	谢: { readings: [r('xiè', 'tạ')], radical: '讠', ids: '⿰讠射', strokes: 12, kind: 'invented' },
	客: { readings: [r('kè', 'khách')], radical: '宀', ids: '⿱宀各', strokes: 9, kind: 'invented' },
	气: { readings: [r('qì', 'khí')], radical: '气', ids: '⿳𠂉一乁', strokes: 4, kind: 'etymology' },
	再: { readings: [r('zài', 'tái')], radical: '冂', ids: '⿱一冉', strokes: 6, kind: 'invented' },
	见: {
		readings: [r('jiàn', 'kiến'), r('xiàn', 'hiện', true)],
		radical: '见',
		ids: '见',
		strokes: 4,
		kind: 'etymology'
	}
};

mkdirSync('content/chars', { recursive: true });
for (const [hanzi, { kind, ...row }] of Object.entries(rows)) {
	const m = mnemonics.get(hanzi);
	const file = { hanzi, ...row, ...(m && { mnemonic: { ...m, kind } }) };
	writeFileSync(`content/chars/${hanzi}.yaml`, YAML.stringify(file, { lineWidth: 0 }));
}
