import { describe, expect, it } from 'vitest';
import { deriveSpoken, resolveSpoken } from './spoken';

describe('deriveSpoken', () => {
	it.each([
		['nǐ hǎo', '你好', 'ní hǎo'],
		['bù kèqi', '不客气', 'bú kèqi'],
		['yī gè', '一个', 'yí gè'],
		['yī tiān', '一天', 'yì tiān']
	])('AC row %s', (p, h, out) => expect(deriveSpoken(p, h)).toBe(out));

	it.each([
		['wǒ hěn hǎo', '我很好', 'wó hén hǎo'],
		['nǐ yǐjīng yǒu hǎo', '你已经有好', 'ní yǐjīng yóu hǎo'],
		['nǐ hǎo, nǐ hǎo', '你好，你好', 'ní hǎo, ní hǎo'],
		['nǐmen hǎo', '你们好', 'nǐmen hǎo'],
		['yīfu', '衣服', 'yīfu'],
		['yībān', '一般', 'yìbān'],
		['yī kè', '一刻', 'yí kè'],
		['Yī gè', '一个', 'Yí gè'],
		['Bù qù', '不去', 'Bú qù'],
		["Ǒu'ěr", '偶尔', "Óu'ěr"],
		['yǒudiǎnr jǐnzhāng', '有点儿紧张', 'yóudiánr jǐnzhāng'],
		['yǒudiǎnr', '有点儿', 'yóudiǎnr'],
		['yǒudiǎnr bùduì', '有点儿不对', 'yóudiǎnr búduì'],
		['nǎr', '哪儿', 'nǎr'],
		["nǚ'ér", '女儿', "nǚ'ér"],
		['jǐnguǎn', '尽管', 'jínguǎn']
	])('%s / %s → %s', (p, h, out) => expect(deriveSpoken(p, h)).toBe(out));

	it('leaves 一 before a neutral syllable or at the end unchanged', () => {
		expect(deriveSpoken('yī ge', '一个')).toBe('yī ge');
		expect(deriveSpoken('yī', '一')).toBe('yī');
	});

	it('leaves 一 unchanged on a hanzi/pinyin count mismatch but still applies 3-3', () => {
		expect(deriveSpoken('yī gè', '一')).toBe('yī gè');
		expect(deriveSpoken('nǐ hǎo', '你')).toBe('ní hǎo');
	});

	it('matches the authored sentences', () => {
		expect(deriveSpoken('nǐ hǎo', '你好！')).toBe('ní hǎo');
		expect(deriveSpoken('bù kèqi', '不客气。')).toBe('bú kèqi');
		expect(deriveSpoken('wǒ yībān qī diǎn yī kè qǐchuáng.', '我一般七点一刻起床。')).toBe(
			'wǒ yìbān qī diǎn yí kè qǐchuáng.'
		);
		expect(deriveSpoken('wǒ xiān xǐzǎo, ránhòu chī zǎofàn.', '我先洗澡，然后吃早饭。')).toBe(
			'wǒ xiān xízǎo, ránhòu chī zǎofàn.'
		);
		expect(deriveSpoken('nǐ yǐjīng yǒu hǎo xíguàn le!', '你已经有好习惯了！')).toBe(
			'ní yǐjīng yóu hǎo xíguàn le!'
		);
	});

	it('normalizes to NFC whether or not a rule fires', () => {
		expect(deriveSpoken('ni\u030cmen', '你们')).toBe('nǐmen');
		expect(deriveSpoken('ni\u030c ha\u030co', '你好')).toBe('ní hǎo');
	});

	it('returns the input unchanged when no rule fires', () => {
		expect(deriveSpoken('xièxie', '谢谢')).toBe('xièxie');
	});
});

describe('resolveSpoken', () => {
	it('returns the authored value over the derived one', () => {
		expect(resolveSpoken({ hanzi: '你好', pinyin: 'nǐ hǎo', spoken: 'nǐ hǎo' })).toBe('nǐ hǎo');
	});

	it('derives when nothing is authored', () => {
		expect(resolveSpoken({ hanzi: '你好', pinyin: 'nǐ hǎo' })).toBe('ní hǎo');
	});

	it('resolves each item on its own', () => {
		const word = { hanzi: '你好', pinyin: 'nǐ hǎo', spoken: 'nǐ hǎo' };
		const sentence = { hanzi: '你好！', pinyin: 'nǐ hǎo' };
		expect(resolveSpoken(word)).toBe('nǐ hǎo');
		expect(resolveSpoken(sentence)).toBe('ní hǎo');
	});
});
