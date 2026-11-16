import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { m } from '#lib/paraglide/messages.js';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle';
import { importContent } from '#lib/content/import/import';
import { scopeFor, PRODUCTION_ROOTS } from '#lib/content/import/scope';
import { createMemorySink } from '#lib/content/import/sink';
import type { GrammarPoint, Lesson, Primer, Question } from '#lib/content/schemas';
import type { ImportedSentence } from '#lib/content/import/sink';
import { describe, expect, it } from 'vitest';
import { grammarSteps } from './grammar';

const lesson = (over: Partial<Lesson> = {}): Lesson => ({
	id: 'h1-99',
	level: 1,
	topic: 'greetings',
	order: 1,
	title: 'Xin chào',
	titleHanzi: '你好',
	goal: 'Chào hỏi',
	scene: { file: 'h1-99.md', cast: ['redpanda'], prompt: 'Hai bạn chào nhau.' },
	sentences: [],
	sections: {
		warmup: {},
		words: { ids: [] },
		grammar: { ids: ['g1', 'g2'], drills: [] },
		dialogue: { parts: [], questions: [] },
		listenSpeak: { items: [] },
		writing: { chars: [] }
	},
	gate: { pool: [], draw: 1 },
	...over
});

const sentence = (id: string, hanzi: string, vi: string, audio?: string): ImportedSentence => ({
	id,
	hanzi,
	pinyin: 'p',
	vi,
	seg: [...hanzi],
	...(audio ? { audio } : {})
});

const point = (over: Partial<GrammarPoint> & { id: string }): GrammarPoint => ({
	level: 1,
	std: [],
	title: `Điểm ${over.id}`,
	pattern: 'A + B',
	explain: 'Đoạn một.',
	examples: [],
	...over
});

const choice = (id: string, gid: string, text: string, options: string[], answer: number): Question => ({
	id,
	type: 'choice',
	tests: { grammar: [gid] },
	prompt: { kind: 'vi', text },
	optionKind: 'hanzi',
	options,
	answer
});

const drills: Question[] = [
	choice('d1', 'g1', 'Chào thầy cô (lịch sự)', ['你好', '您好', '你们好'], 1),
	choice('d2', 'g1', 'Chào cả nhóm bạn', ['你好', '您好', '你们好'], 2),
	{ id: 'd3', type: 'order', tests: { grammar: ['g1'] }, tiles: ['们', '你', '好'], answer: 's3' },
	choice('d4', 'g2', 'Đáp lại 谢谢', ['不客气。', '没关系。', '再见！'], 0),
	choice('d5', 'g2', 'Đáp lại 对不起', ['不客气。', '没关系。', '再见！'], 1),
	choice('d6', 'g2', 'Bạn làm rơi bút của cô giáo. Nói gì?', ['谢谢', '对不起', '再见'], 1)
];

// A dialogue question testing g1 that lives outside the grammar section: it must not become a step.
const dialogue: Question = {
	id: 'q-d01',
	type: 'choice',
	tests: { grammar: ['g1'] },
	prompt: { kind: 'audio', ref: 's1' },
	optionKind: 'hanzi',
	options: ['您好！', '你们好！'],
	answer: 0
};

const content = (over: Partial<LessonContent> = {}): LessonContent => {
	const l = lesson();
	return {
		contentSha: 'sha',
		lesson: { ...l, sections: { ...l.sections, grammar: { ids: ['g1', 'g2'], drills } } },
		words: [],
		chars: [],
		sentences: [
			sentence('s1', '您好！', 'Chào thầy cô!', 'examples/aa'),
			sentence('s2', '你们好！', 'Chào các bạn!', 'examples/bb'),
			sentence('s3', '你们好！', 'Chào các bạn!', 'examples/cc'),
			sentence('s4', '谢谢！', 'Cảm ơn!', 'examples/dd'),
			sentence('s5', '不客气。', 'Không có gì.', 'examples/ee')
		],
		grammar: [
			point({
				id: 'g1',
				title: 'Chào hỏi: A + 好',
				pattern: '你 / 您 / 你们 + 好',
				labels: ['người được chào', 'luôn có'],
				explain: 'Thêm 好 sau người được chào.\n\nNgười kia chào lại bằng đúng câu đó.',
				examples: ['s1', 's2'],
				pitfalls: [{ wrong: '好你', right: '你好' }]
			}),
			point({
				id: 'g2',
				title: 'Câu không chủ ngữ',
				pattern: '谢谢 → 不客气 / 对不起 → 没关系',
				labels: ['người kia nói', 'bạn đáp'],
				explain: 'Mỗi câu có câu đáp riêng.',
				examples: ['s4', 's5'],
				pitfalls: [{ wrong: '谢谢！没关系。', right: '谢谢！不客气。' }]
			})
		],
		questions: [dialogue],
		gateCoverage: {},
		thin: [],
		...over
	};
};

describe('grammarSteps', () => {
	it('Given_TwoPoints_When_Build_Then_EightStepsInOrder', () => {
		// Arrange / Act
		const steps = grammarSteps(content());

		// Assert
		expect(steps.map((s) => s.kind)).toEqual([
			'grammar',
			'choice',
			'choice',
			'order',
			'grammar',
			'choice',
			'choice',
			'choice'
		]);
		expect(steps.map((s) => s.id)).toEqual([
			'g1',
			'd1',
			'd2',
			'd3',
			'g2',
			'd4',
			'd5',
			'd6'
		]);
		expect(steps.map((s) => s.id)).not.toContain('q-d01');
		expect(steps.map((s) => s.ask ?? '')).toEqual([
			'',
			m.grammar_drill({ n: 1, of: 3 }),
			m.grammar_drill({ n: 2, of: 3 }),
			m.grammar_drill({ n: 3, of: 3 }),
			'',
			m.grammar_drill({ n: 1, of: 3 }),
			m.grammar_drill({ n: 2, of: 3 }),
			m.grammar_drill({ n: 3, of: 3 })
		]);
		const first = steps[0];
		expect(first.kind === 'grammar' && first.kicker).toBe(m.grammar_point({ n: 1, of: 2 }));
		expect(first.kind === 'grammar' && first.drills).toBe(3);
	});

	it('Given_TwoPoints_When_Build_Then_ChoiceAndOrderCarryTheirAnswer', () => {
		// Arrange / Act
		const steps = grammarSteps(content());

		// Assert
		expect(steps[1]).toMatchObject({
			kind: 'choice',
			title: 'Chào thầy cô (lịch sự)',
			options: ['你好', '您好', '你们好'],
			answer: '您好'
		});
		expect(steps[3]).toMatchObject({
			kind: 'order',
			title: 'Chào các bạn!',
			tiles: ['们', '你', '好'],
			answer: '你们好'
		});
	});

	it('Given_Primer_When_Build_Then_NoSteps', () => {
		// Arrange
		const primer = { kind: 'primer', id: 'h0-00', level: 1 } as unknown as Primer;

		// Act
		const steps = grammarSteps(content({ lesson: primer }));

		// Assert
		expect(steps).toEqual([]);
	});

	it('Given_PairPattern_When_Build_Then_RowsSplitOnArrow', () => {
		// Arrange / Act
		const steps = grammarSteps(content());

		// Assert
		expect(steps[4]).toMatchObject({
			kind: 'grammar',
			rows: [
				['谢谢', '不客气'],
				['对不起', '没关系']
			],
			labels: ['người kia nói', 'bạn đáp'],
			lead: 'Mỗi câu có câu đáp riêng.',
			pitfall: { wrong: '谢谢！没关系。', right: '谢谢！不客气。' }
		});
	});

	it('Given_NoBlankLine_When_Build_Then_EmptyMore', () => {
		// Arrange / Act
		const steps = grammarSteps(content());

		// Assert
		expect(steps[4]).toMatchObject({ more: '' });
		expect(steps[0]).toMatchObject({
			lead: 'Thêm 好 sau người được chào.',
			more: 'Người kia chào lại bằng đúng câu đó.'
		});
	});
});

describe('grammarSteps on Bài 1', () => {
	const build = async (): Promise<LessonContent> => {
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		if (!sink.content) throw new Error('import wrote no content');
		const b = buildBundle(sink.content, 'h1-01');
		const source = { current: async () => b.sha, bundle: async () => b };
		return createCatalog(source).lesson('h1-01');
	};

	it('Given_Bai1_When_Build_Then_Ac1Ac2Strings', async () => {
		// Arrange
		const prev = process.env.CHAIYO_VAULT;
		process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');

		// Act
		const c = await build();
		const steps = grammarSteps(c);
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
		const text = JSON.stringify(steps);

		// Assert
		expect(steps.map((s) => s.kind)).toEqual([
			'grammar',
			'choice',
			'choice',
			'order',
			'grammar',
			'choice',
			'choice',
			'choice'
		]);
		expect(text).toContain('Chào hỏi: A + 好');
		expect(text).toContain('người được chào');
		expect(text).toContain('luôn có');
		expect(text).toContain('người kia nói');
		expect(text).toContain('bạn đáp');
		expect(text).toContain('您好');
		expect(text).toContain('不客气');
		expect(text).toContain('没关系');
		expect(text).toContain('对不起');
		expect(steps[3]).toMatchObject({ kind: 'order', answer: '你们好', title: 'Chào các bạn!' });
		expect(steps[0]).toMatchObject({ kind: 'grammar', pitfall: { wrong: '好你', right: '你好' } });
		const ex = steps[0].kind === 'grammar' ? steps[0].examples : [];
		expect(ex).toHaveLength(2);
		for (const e of ex) expect(e.audio).toMatch(/^examples\//);
		expect(('kind' in c.lesson ? '' : c.lesson.sections.grammar.done) ?? '').toBe(
			'Mẫu A + 好 và các câu đáp đã vào phần ôn tập, sẽ quay lại cùng các câu hỏi khác.'
		);
	});
});
