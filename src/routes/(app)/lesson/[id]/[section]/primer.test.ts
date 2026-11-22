import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { PRODUCTION_ROOTS, scopeFor } from '#lib/content/import/scope.js';
import { createMemorySink } from '#lib/content/import/sink.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { closedRuns, primerScore, primerSteps } from './primer';

const load = async () => {
	const prev = process.env.CHAIYO_VAULT;
	process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
	try {
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		const b = buildBundle(sink.content!, 'h0-00');
		return createCatalog({ current: async () => b.sha, bundle: async () => b }).lesson('h0-00');
	} finally {
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
	}
};

const lesson = await load();
const sections = ['tones', 'finals', 'initials', 'spelling', 'sandhi'];

const run = (
	id: string,
	section: string,
	answers: Record<string, boolean>,
	closed = true
): State => {
	const s = initialState({ curriculum: CURRICULUM });
	s.runs[id] = {
		step: { kind: 'section', lesson: 'h0-00', section, run: id, of: Object.keys(answers).length },
		answers,
		...(closed ? { closed: true as const } : {})
	};
	return s;
};

describe('primerSteps', () => {
	it('Given_EachSection_When_Mapped_Then_CardsThenFourDrills', () => {
		// Arrange
		const expected = [6, 6, 7, 4, 6];

		// Act
		const counts = sections.map((s) => {
			const steps = primerSteps(lesson, s);
			return [
				steps.filter((x) => x.kind === 'card').length,
				steps.filter((x) => x.kind === 'choice').length,
				steps.map((x) => x.kind)
			] as const;
		});

		// Assert
		expect(counts.map((c) => c[0])).toEqual(expected);
		expect(counts.map((c) => c[1])).toEqual([4, 4, 4, 4, 4]);
		counts.forEach((c, i) =>
			expect(c[2]).toEqual([...Array(expected[i]).fill('card'), ...Array(4).fill('choice')])
		);
	});

	it('Given_TonesDrill1_When_Mapped_Then_HiddenTitleAndClip', () => {
		// Arrange / Act
		const d = primerSteps(lesson, 'tones').find((s) => s.id === 'q-h0-00-tones-01');

		// Assert
		expect(d).toMatchObject({
			kind: 'choice',
			title: '',
			answer: 'má',
			script: 'pinyin',
			explain: 'thanh 2 đi lên',
			audio: lesson.clips!['má']
		});
		expect(lesson.clips!['má']).toMatch(/^pinyin-chart\/[0-9a-f]{64}$/);
		expect(d).not.toHaveProperty('card');
	});

	it('Given_SandhiDrill1_When_Mapped_Then_SpokenChipClip', () => {
		// Arrange / Act
		const d = primerSteps(lesson, 'sandhi').find((s) => s.id === 'q-h0-00-sandhi-01');

		// Assert
		expect(d).toMatchObject({ kind: 'choice', audio: lesson.clips!['ní hǎo'] });
		expect(lesson.clips!['ní hǎo']).toMatch(/^chips\//);
	});

	it('Given_Cards_When_Mapped_Then_ChipsPairsAndEmptySyllables', () => {
		// Arrange / Act
		const tones = primerSteps(lesson, 'tones');
		const cards = tones.filter((s) => s.kind === 'card');
		const initials = primerSteps(lesson, 'initials').filter((s) => s.kind === 'card');

		// Assert
		expect(cards[0]).toMatchObject({ id: 'h0-00-tones-card-0', kicker: '1/6' });
		expect(cards.some((c) => c.chips.length === 0)).toBe(true);
		expect(cards.flatMap((c) => c.chips).some((c) => c.text === 'mā' && c.hanzi === '妈')).toBe(
			true
		);
		expect(cards.flatMap((c) => c.chips).every((c) => c.key !== null)).toBe(true);
		expect(initials.some((c) => c.pairs.length > 0)).toBe(true);
	});

	it('Given_MappedSteps_When_Scanned_Then_NfcNoCombiningMarks', () => {
		// Arrange
		const text = sections.map((s) => JSON.stringify(primerSteps(lesson, s))).join('\n');

		// Act
		const combining = text.match(/[̀-ͯ]/g);

		// Assert
		expect(text.normalize('NFC')).toBe(text);
		expect(combining).toBeNull();
	});

	it('Given_TonesDrill_When_Mapped_Then_ToneFromAnswer', () => {
		// Arrange / Act
		const d = primerSteps(lesson, 'tones').find((s) => s.id === 'q-h0-00-tones-01');

		// Assert
		expect(d).toMatchObject({ kind: 'choice', tone: 2 });
	});

	it('Given_FinalsDrillUnmarkedAnswer_When_Mapped_Then_ToneFromPrompt', () => {
		// Arrange / Act
		const d = primerSteps(lesson, 'finals').find((s) => s.id === 'q-h0-00-finals-01');

		// Assert
		expect(d).toMatchObject({ kind: 'choice', answer: 'an', tone: 1 });
	});

	it('Given_ViPromptNoAsk_When_Mapped_Then_ReadAsk', () => {
		// Arrange / Act
		const d = primerSteps(lesson, 'spelling').find((s) => s.id === 'q-h0-00-spelling-02');
		const heard = primerSteps(lesson, 'tones').find((s) => s.id === 'q-h0-00-tones-01');

		// Assert
		expect(d).toMatchObject({ kind: 'choice', ask: 'Chọn pinyin đúng' });
		expect(heard).toMatchObject({ ask: 'Nghe rồi chọn pinyin đúng' });
	});

	it('Given_UnknownSection_When_Mapped_Then_Empty', () => {
		// Arrange / Act / Assert
		expect(primerSteps(lesson, 'nope')).toEqual([]);
	});
});

describe('primerScore', () => {
	const drills = ['d1', 'd2', 'd3', 'd4'];

	it('Given_RunTwoOfFourRight_When_Score_Then_TwoOfFour', () => {
		// Arrange
		const s = run('r1', 'tones', {
			c0: false,
			c1: false,
			d1: true,
			d2: false,
			d3: true,
			d4: false
		});

		// Act
		const score = primerScore(s, new Set(), 'h0-00', 'tones', drills);

		// Assert
		expect(score).toEqual({ n: 2, total: 4 });
	});

	it('Given_OlderClosedRun_When_Score_Then_UsesNewRunOnly', () => {
		// Arrange
		const s = run('old', 'tones', { d1: true, d2: true, d3: true, d4: true });
		const before = closedRuns(s, 'h0-00', 'tones');
		s.runs.fresh = {
			step: { kind: 'section', lesson: 'h0-00', section: 'tones', run: 'fresh', of: 4 },
			answers: { d1: true, d2: false, d3: false, d4: false },
			closed: true
		};

		// Act
		const score = primerScore(s, before, 'h0-00', 'tones', drills);

		// Assert
		expect([...before]).toEqual(['old']);
		expect(score).toEqual({ n: 1, total: 4 });
	});

	it('Given_OpenRunOrOtherSection_When_Score_Then_Zero', () => {
		// Arrange
		const open = run('r1', 'tones', { d1: true }, false);
		const other = run('r2', 'finals', { d1: true, d2: true, d3: true, d4: true });

		// Act
		const a = primerScore(open, new Set(), 'h0-00', 'tones', drills);
		const b = primerScore(other, new Set(), 'h0-00', 'tones', drills);

		// Assert
		expect(a).toEqual({ n: 0, total: 4 });
		expect(b).toEqual({ n: 0, total: 4 });
	});
});
