import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { PRODUCTION_ROOTS, scopeFor } from '#lib/content/import/scope.js';
import { createMemorySink } from '#lib/content/import/sink.js';
import { describe, expect, it } from 'vitest';
import { drillStep } from '../[section]/primer';
import { gateSteps } from './gate';
import { primerGate } from './primer-gate';

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
if (!('kind' in lesson.lesson)) throw new Error('h0-00 is not a Primer');
const pool = lesson.lesson.gate.pool as { id: string; section: string; prompt: { kind: string } }[];
const sectionOf = new Map(pool.map((q) => [q.id, q.section]));
const sections = ['tones', 'finals', 'initials', 'spelling', 'sandhi'];

const seeded = (seed: number) => {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const mapped = (id: string) => {
	const q = pool.find((x) => x.id === id);
	if (!q) throw new Error(`no ${id}`);
	return drillStep(lesson, q as never);
};

describe('primerGate', () => {
	it('Given_200Seeds_When_Draw_Then_TenTwoPerSectionUnique', () => {
		// Arrange
		const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

		// Act
		const draws = seeds.map((s) => primerGate(lesson, seeded(s)));

		// Assert
		for (const steps of draws) {
			expect(steps).toHaveLength(10);
			expect(new Set(steps.map((s) => s.id)).size).toBe(10);
			const counts = sections.map((sec) => steps.filter((s) => sectionOf.get(s.id) === sec).length);
			expect(counts).toEqual([2, 2, 2, 2, 2]);
		}
	});

	it('Given_TwoSeeds_When_Draw_Then_OrdersDiffer', () => {
		// Arrange
		const ids = (seed: number) => primerGate(lesson, seeded(seed)).map((s) => s.id);

		// Act
		const [a, b] = [ids(1), ids(2)];

		// Assert
		expect(a).not.toEqual(b);
	});

	it('Given_Draw_When_Mapped_Then_SyllableStepsHaveAudio', () => {
		// Arrange
		const syllable = new Set(pool.filter((q) => q.prompt.kind === 'syllable').map((q) => q.id));
		expect(syllable.size).toBe(23);

		// Act
		const all = pool.map((q) => mapped(q.id));

		// Assert
		for (const step of all) {
			expect(step.kind).toBe('choice');
			if (syllable.has(step.id)) expect(step).toHaveProperty('audio');
			else expect(step).not.toHaveProperty('audio');
		}
	});

	it('Given_Draw_When_Mapped_Then_NoCardField', () => {
		// Arrange
		const steps = primerGate(lesson, seeded(7));

		// Act
		const withCard = steps.filter((s) => 'card' in s);

		// Assert
		expect(withCard).toEqual([]);
	});

	it.each([
		['q-h0-00-g-tones-02', 2],
		['q-h0-00-g-finals-01', 1],
		['q-h0-00-g-sandhi-01', 2]
	])('Given_%s_When_Mapped_Then_Tone%i', (id, tone) => {
		// Arrange
		const want = tone;

		// Act
		const step = mapped(id);

		// Assert
		expect(step).toMatchObject({ tone: want });
	});

	it('Given_Spelling05_When_Mapped_Then_NoTone', () => {
		// Arrange
		const id = 'q-h0-00-g-spelling-05';

		// Act
		const step = mapped(id);

		// Assert
		expect(step).not.toHaveProperty('tone');
		expect(step).toMatchObject({ ask: 'Chọn pinyin đúng' });
	});

	it('Given_Primer_When_GateSteps_Then_Ten', () => {
		// Arrange
		const random = seeded(3);

		// Act
		const steps = gateSteps(lesson, random);

		// Assert
		expect(steps).toHaveLength(10);
	});
});
