import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { fixtureRefs } from './lint/fixtures/refs';
import { lintDir } from './lint';
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

type Data = Primer & {
	sections: Record<
		string,
		{ cards: { syllables: unknown[]; pairs?: unknown[][] }[]; drills: unknown[] }
	>;
};
const syllablesText = readFileSync(join(root, 'syllables.yaml'), 'utf8');

const lintCopy = (mutate?: (data: Data) => void, syllableRows?: { syllable: string }[]) => {
	const dir = mkdtempSync(join(tmpdir(), 'primer-'));
	mkdirSync(join(dir, 'lessons/hsk1'), { recursive: true });
	const data = YAML.parse(text) as Data;
	mutate?.(data);
	writeFileSync(join(dir, 'lessons/hsk1/h0-00.yaml'), YAML.stringify(data));
	writeFileSync(
		join(dir, 'syllables.yaml'),
		syllableRows ? YAML.stringify(syllableRows) : syllablesText
	);
	try {
		return lintDir(dir, { refs: fixtureRefs }).errors;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

const paths = (errors: { path: string }[]) => errors.map((e) => e.path);

describe('h0-00 primer through lintDir', () => {
	it('AC1 lints with 0 errors', () => {
		expect(lintCopy()).toEqual([]);
	});

	it('AC2 chip replaced by the string xyz errors at sections.finals.cards[0].syllables[0]', () => {
		const errors = lintCopy((d) => {
			d.sections.finals.cards[0].syllables[0] = 'xyz';
		});
		expect(paths(errors)).toEqual(['sections.finals.cards[0].syllables[0]']);
	});

	it('AC2 pairs entry replaced by the string xyz errors at sections.initials.cards[0].pairs[0][1]', () => {
		const errors = lintCopy((d) => {
			d.sections.initials.cards[0].pairs![0][1] = 'xyz';
		});
		expect(paths(errors)).toEqual(['sections.initials.cards[0].pairs[0][1]']);
	});

	it('AC2 syllables.yaml without row ma errors on every entry with a ma piece', () => {
		const rows = (YAML.parse(syllablesText) as { syllable: string }[]).filter(
			(r) => r.syllable !== 'ma'
		);
		const expected = new Set<string>();
		for (const s of sectionNames)
			primer.sections[s].cards.forEach((card, c) => {
				const visit = (e: (typeof chips)[number], p: string) => {
					if (toneless(say(e)).split(' ').includes('ma'))
						expected.add(typeof e === 'string' ? p : p + '.say');
				};
				card.syllables.forEach((e, i) => visit(e, `sections.${s}.cards[${c}].syllables[${i}]`));
				card.pairs?.forEach((pair, i) =>
					pair.forEach((e, j) => visit(e, `sections.${s}.cards[${c}].pairs[${i}][${j}]`))
				);
			});
		const errors = lintCopy(undefined, rows);
		expect(expected.size).toBe(9);
		expect(errors).toHaveLength(10);
		expect(new Set(paths(errors))).toEqual(expected);
	});

	it('AC3 empty sandhi drills errors at sections.sandhi.drills', () => {
		const errors = lintCopy((d) => {
			d.sections.sandhi.drills = [];
		});
		expect(paths(errors)).toEqual(['sections.sandhi.drills']);
	});

	it('AC4 one item dropped per section (19, 5 sections) errors only on the count', () => {
		const errors = lintCopy((d) => {
			const seen = new Set<string>();
			const drop = new Set<number>();
			(d.gate.pool as { section: string }[]).forEach((q, i) => {
				if (!seen.has(q.section)) {
					seen.add(q.section);
					drop.add(i);
				}
			});
			d.gate.pool = d.gate.pool.filter((_, i) => !drop.has(i));
		});
		expect(paths(errors)).toEqual(['gate.pool']);
		expect(errors[0].message).toMatch(/19 questions/);
	});

	it('AC4 sandhi items retagged tones (24) errors only on missing sandhi', () => {
		const errors = lintCopy((d) => {
			for (const q of d.gate.pool as { section: string }[])
				if (q.section === 'sandhi') q.section = 'tones';
		});
		expect(paths(errors)).toEqual(['gate.pool']);
		expect(errors[0].message).toMatch(/sandhi/);
	});
});
