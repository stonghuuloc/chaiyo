import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { splitSyllables } from './derive/pinyin';
import { parseContent } from './parse';

const root = process.cwd();
const content = resolve(root, 'content');
const level1: string[] = (
	JSON.parse(readFileSync(resolve(root, 'prototype/data/dict.json'), 'utf8')) as unknown[][]
)
	.filter((row) => row[5] === 1)
	.map((row) => row[0] as string);

const lessonFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? lessonFiles(join(dir, e.name))
			: e.name.endsWith('.yaml')
				? [join(dir, e.name)]
				: []
	);
const lessonSentences = new Set(
	lessonFiles(join(content, 'lessons')).flatMap((f) =>
		(YAML.parse(readFileSync(f, 'utf8'))?.sentences ?? []).map((s: { id: string }) => s.id)
	)
);
const sentencesPath = join(content, 'sentences/hsk1.yaml');
const sentenceIds = new Set<string>(
	(YAML.parse(readFileSync(sentencesPath, 'utf8')) as { id: string }[]).map((s) => s.id)
);

type Sense = { pos?: string; rare?: unknown; example?: string };
const words = level1.map((hz) => {
	const path = join(content, 'words', hz + '.yaml');
	return { hz, path, text: existsSync(path) ? readFileSync(path, 'utf8') : '' };
});

describe('HSK 3.0 level 1 words', () => {
	it('has 505 words', () => expect(level1).toHaveLength(505));

	it('sentences/hsk1.yaml parses as Sentences', () => {
		expect(
			parseContent('Sentences', 'sentences/hsk1.yaml', readFileSync(sentencesPath, 'utf8'))
		).toMatchObject({ ok: true });
	});

	it.each(words.map((w) => [w.hz, w] as const))('%s has a complete entry', (_hz, w) => {
		expect(existsSync(w.path), `missing ${w.path}`).toBe(true);
		expect(parseContent('Word', `words/${w.hz}.yaml`, w.text)).toMatchObject({ ok: true });
		const senses: Sense[] = YAML.parse(w.text).senses;
		expect(senses.length).toBeGreaterThan(0);
		expect(senses.some((s) => s.pos)).toBe(true);
		for (const s of senses.filter((s) => s.pos)) {
			expect(s.example, `${w.hz} sense with pos has no example`).toBeDefined();
			expect(
				sentenceIds.has(s.example!) || lessonSentences.has(s.example!),
				`${s.example} unresolved`
			).toBe(true);
		}
	});

	it('flags rare senses with true only', () => {
		const all = words.flatMap((w) =>
			existsSync(w.path) ? (YAML.parse(w.text).senses as Sense[]) : []
		);
		expect(all.some((s) => s.rare === true)).toBe(true);
		expect(all.filter((s) => 'rare' in s && s.rare !== true)).toEqual([]);
	});

	it('leaves no unreferenced generated sentence', () => {
		const used = new Set(
			readdirSync(join(content, 'words'))
				.filter((f) => f.endsWith('.yaml'))
				.flatMap((f) => {
					const word = YAML.parse(readFileSync(join(content, 'words', f), 'utf8')) as {
						senses: Sense[];
						examples?: string[];
					};
					return [...word.senses.map((s) => s.example), ...(word.examples ?? [])];
				})
		);
		const orphans = [...sentenceIds].filter((id) => id.startsWith('s-w-') && !used.has(id));
		expect(orphans).toEqual([]);
	});

	it('writes citation pinyin: no 一 or 不 carries its sandhi tone (spoken is derived)', () => {
		const sentences = YAML.parse(readFileSync(sentencesPath, 'utf8')) as {
			id: string;
			hanzi: string;
			pinyin: string;
		}[];
		const marked: string[] = [];
		for (const s of sentences) {
			const chars = [...s.hanzi].filter((c) => /[\u3400-\u9fff]/.test(c));
			const { clauses, aligned } = splitSyllables(s.pinyin, chars.length);
			if (!aligned) continue;
			for (const syl of clauses.flat()) {
				const lower = syl.syl.toLowerCase();
				const hanzi = chars[syl.charIndex];
				if ((hanzi === '一' && /^y[íì]$/.test(lower)) || (hanzi === '不' && lower === 'bú'))
					marked.push(s.id);
			}
		}
		expect(marked).toEqual([]);
	});
	it('every sentence aligns syllable for syllable with its hanzi', () => {
		const sentences = YAML.parse(readFileSync(sentencesPath, 'utf8')) as {
			id: string;
			hanzi: string;
			pinyin: string;
		}[];
		const unaligned = sentences
			.filter((s) => {
				const count = [...s.hanzi].filter((c) => /[\u3400-\u9fff]/.test(c)).length;
				return !splitSyllables(s.pinyin, count).aligned;
			})
			.map((s) => s.id);
		expect(unaligned).toEqual([]);
	});
});
