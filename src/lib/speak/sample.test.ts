import { describe, expect, it } from 'vitest';
import { sampleTiles } from './sample';

describe('sampleTiles', () => {
	it('Given_BuKeqi_When_SampleTiles_Then_BuKeQiWeakTwoOfThree', () => {
		expect(sampleTiles('不客气。', 'bú kèqi')).toEqual({
			tiles: [
				{ hanzi: '不', syl: 'bú', weak: false },
				{ hanzi: '客', syl: 'kè', weak: false },
				{ hanzi: '气', syl: 'qi', weak: true }
			],
			ok: 2,
			total: 3
		});
	});

	it('Given_NiJiaoShenmeMingzi_When_SampleTiles_Then_SixTilesZiWeak', () => {
		const r = sampleTiles('你叫什么名字？', 'nǐ jiào shénme míngzi?');
		expect(r?.tiles.map((t) => `${t.hanzi} ${t.syl}`)).toEqual([
			'你 nǐ',
			'叫 jiào',
			'什 shén',
			'么 me',
			'名 míng',
			'字 zi'
		]);
		expect(r?.tiles.map((t) => t.weak)).toEqual([false, false, false, false, false, true]);
		expect([r?.ok, r?.total]).toEqual([5, 6]);
	});

	it('Given_Duibuqi_When_SampleTiles_Then_DuiBuQiWeak', () => {
		expect(sampleTiles('对不起！', 'duìbuqǐ')?.tiles).toEqual([
			{ hanzi: '对', syl: 'duì', weak: false },
			{ hanzi: '不', syl: 'bu', weak: false },
			{ hanzi: '起', syl: 'qǐ', weak: true }
		]);
	});

	it('Given_Erhua_When_SampleTiles_Then_OneTileSpansTwoChars', () => {
		expect(sampleTiles('一点儿', 'yìdiǎnr')?.tiles).toEqual([
			{ hanzi: '一', syl: 'yì', weak: false },
			{ hanzi: '点儿', syl: 'diǎnr', weak: true }
		]);
	});

	it('Given_MisalignedPinyin_When_SampleTiles_Then_Null', () => {
		expect(sampleTiles('你好', 'nǐ')).toBeNull();
	});

	it('Given_NoHanzi_When_SampleTiles_Then_Null', () => {
		expect(sampleTiles('？', 'a')).toBeNull();
	});
});
