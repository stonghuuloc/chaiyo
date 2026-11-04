import { describe, expect, it } from 'vitest';
import type { Char } from '../schemas';
import { deriveHanViet } from './hanviet';

const ch = (hanzi: string, readings: Char['readings']) =>
	({ hanzi, readings, radical: '', ids: '', strokes: 1 }) as Char;

const chars: Record<string, Char> = {
	你: ch('你', [{ pinyin: 'nǐ', hanviet: 'nhĩ' }]),
	好: ch('好', [
		{ pinyin: 'hǎo', hanviet: 'hảo' },
		{ pinyin: 'hào', hanviet: 'hiếu' }
	]),
	爱: ch('爱', [{ pinyin: 'ài', hanviet: 'ái' }]),
	不: ch('不', [{ pinyin: 'bù', hanviet: 'bất' }]),
	客: ch('客', [{ pinyin: 'kè', hanviet: 'khách' }]),
	气: ch('气', [{ pinyin: 'qì', hanviet: 'khí', rare: false }]),
	尽: ch('尽', [{ pinyin: 'jǐn', hanviet: 'tận' }]),
	管: ch('管', [{ pinyin: 'guǎn', hanviet: 'quản' }]),
	怀: ch('怀', [{ pinyin: 'huái', hanviet: 'hoài' }]),
	念: ch('念', [{ pinyin: 'niàn', hanviet: 'niệm' }]),
	哪: ch('哪', [{ pinyin: 'nǎ', hanviet: 'ná' }]),
	儿: ch('儿', [{ pinyin: 'ér', hanviet: 'nhi' }]),
	女: ch('女', [{ pinyin: 'nǚ', hanviet: 'nữ' }])
};

const run = (hanzi: string, pinyin: string, hanviet?: string, c = chars) =>
	deriveHanViet({ hanzi, pinyin, hanviet }, c);

describe('deriveHanViet', () => {
	it.each([
		['你好', 'nǐ hǎo', 'nhĩ hảo'],
		['爱好', 'ài hào', 'ái hiếu'],
		['不客气', 'bù kèqi', 'bất khách khí'],
		['尽管', 'jǐnguǎn', 'tận quản'],
		['怀念', 'huáiniàn', 'hoài niệm'],
		['哪儿', 'nǎr', 'ná nhi'],
		['女儿', "nǚ'ér", 'nữ nhi']
	])('%s %s → %s', (h, p, out) => expect(run(h, p)).toEqual({ hanviet: out }));

	it('prefers an authored hanviet without reading chars', () => {
		expect(run('你好', 'nǐ hǎo', 'x', {})).toEqual({ hanviet: 'x' });
	});

	it('reports a char with no entry', () => {
		const rest = { ...chars };
		delete rest['你'];
		expect(run('你好', 'nǐ hǎo', undefined, rest)).toEqual({ missing: ['你'] });
	});

	it('reports a char with no matching reading', () => {
		const only = { ...chars, 好: ch('好', [{ pinyin: 'hào', hanviet: 'hiếu' }]) };
		expect(run('你好', 'nǐ hǎo', undefined, only)).toEqual({ missing: ['好'] });
	});

	it('reports a count mismatch', () => {
		expect(run('你好', 'nǐ')).toEqual({ missing: ['你', '好'] });
	});
});
