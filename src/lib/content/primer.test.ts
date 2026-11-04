import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { parseContent } from './parse';
import type { Primer, Question } from './schemas';

const root = join(process.cwd(), 'content');
const text = readFileSync(join(root, 'lessons/hsk1/h0-00.yaml'), 'utf8');
const sectionNames = ['tones', 'finals', 'initials', 'spelling', 'sandhi'] as const;
const primer = YAML.parse(text) as Primer;
const syllables = new Set(
	(YAML.parse(readFileSync(join(root, 'syllables.yaml'), 'utf8')) as { syllable: string }[]).map(
		(s) => s.syllable
	)
);
const chips = sectionNames.flatMap((s) =>
	primer.sections[s].cards.flatMap((c) => [...c.syllables, ...(c.pairs ?? []).flat()])
);
const say = (chip: (typeof chips)[number]) => (typeof chip === 'string' ? chip : chip.say);
const toneless = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u0304\u030c]/g, '')
		.normalize('NFC');
const pool = primer.gate.pool as (Question & { section?: string })[];

describe('h0-00 primer', () => {
	it('AC1 parses as Primer with 0 errors', () => {
		const result = parseContent('Primer', 'lessons/hsk1/h0-00.yaml', text);
		expect(result.ok).toBe(true);
	});

	it('AC1 has 5 sections, 29 cards, 20 drills and gate draw 10 / pool 24', () => {
		expect(sectionNames.map((s) => primer.sections[s].cards.length)).toEqual([6, 6, 7, 4, 6]);
		expect(sectionNames.flatMap((s) => primer.sections[s].drills)).toHaveLength(20);
		expect(primer.gate).toMatchObject({ draw: 10, testOut: true });
		expect(pool).toHaveLength(24);
	});

	it('AC1 chips: 105 total, 15 plain, 62 labelled, 28 with hanzi', () => {
		expect(chips).toHaveLength(105);
		expect(chips.filter((c) => typeof c === 'string')).toHaveLength(15);
		expect(chips.filter((c) => typeof c !== 'string' && c.label)).toHaveLength(62);
		expect(chips.filter((c) => typeof c !== 'string' && c.hanzi)).toHaveLength(28);
	});

	it('AC2 every chip piece, tone marks dropped, is a syllables.yaml row', () => {
		const missing = chips.flatMap((c) =>
			toneless(say(c))
				.split(' ')
				.filter((p) => !syllables.has(p))
		);
		expect(missing).toEqual([]);
	});

	it('AC3 every section has at least one drill', () => {
		for (const s of sectionNames)
			expect(primer.sections[s].drills.length).toBeGreaterThanOrEqual(1);
	});

	it('AC4 pool covers the 5 sections and is at least 2 x draw', () => {
		const counts = sectionNames.map((s) => pool.filter((q) => q.section === s).length);
		expect(counts).toEqual([4, 5, 5, 5, 5]);
		expect(pool.length).toBeGreaterThanOrEqual(2 * primer.gate.draw);
	});

	it('AC1 question ids are unique and answers index into options', () => {
		const all = [...sectionNames.flatMap((s) => primer.sections[s].drills), ...pool];
		expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
		for (const q of all) if (q.type === 'choice') expect(q.options[q.answer]).toBeDefined();
	});
});
