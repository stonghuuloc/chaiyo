import { flushSync, mount, unmount, tick } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import { m } from '#lib/paraglide/messages.js';
import type { LessonContent } from '#lib/catalog/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type StudyEvent } from '#lib/study/index.js';
import type { Lesson } from '#lib/content/schemas.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GrammarSection from './GrammarSection.svelte';

let recorded: StudyEvent[] = [];
const ledger = {
	state: () => initialState(),
	record: async () => recorded
} as unknown as Ledger;

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));

const session = { user: { id: 'u1' } } as never;

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
		grammar: {
			ids: ['g1'],
			drills: [
				{
					id: 'd1',
					type: 'choice',
					tests: { grammar: ['g1'] },
					prompt: { kind: 'vi', text: 'Chào thầy cô' },
					optionKind: 'hanzi',
					options: ['你好', '您好'],
					answer: 1
				},
				{
					id: 'd2',
					type: 'choice',
					tests: { grammar: ['g1'] },
					prompt: { kind: 'vi', text: 'Chào cả nhóm' },
					optionKind: 'hanzi',
					options: ['你好', '你们好'],
					answer: 1
				}
			]
		},
		dialogue: { parts: [], questions: [] },
		listenSpeak: { items: [] },
		writing: { chars: [] }
	},
	gate: { pool: [], draw: 1 },
	...over
});

const content = (over: Partial<Lesson> = {}, done?: string): LessonContent => {
	const l = lesson(over);
	return {
		contentSha: 'sha',
		lesson: { ...l, sections: { ...l.sections, grammar: { ...l.sections.grammar, done } } },
		words: [],
		chars: [],
		sentences: [],
		grammar: [
			{
				id: 'g1',
				level: 1,
				std: [],
				title: 'Chào hỏi: A + 好',
				pattern: '你 / 您 / 你们 + 好',
				labels: ['người được chào', 'luôn có'],
				explain: 'Thêm 好 sau người được chào.',
				examples: []
			}
		],
		questions: [],
		gateCoverage: {},
		thin: []
	};
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountSection = async (c: LessonContent, s: Session | null = session) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(GrammarSection, {
		target,
		props: { lesson: c, session: s }
	}) as Record<string, unknown>;
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
	return {
		options: () => [...target!.querySelectorAll<HTMLButtonElement>('.body button')],
		cta: () => target!.querySelector<HTMLButtonElement>('.actions button')
	};
};

const finish = async (cta: () => HTMLButtonElement | null) => {
	cta()!.click();
	flushSync();
	while (target!.querySelector('.actions button')) {
		const body = [...target!.querySelectorAll<HTMLButtonElement>('.body button')];
		if (body.length > 0) {
			body[1].click();
			flushSync();
		}
		const b = target!.querySelector<HTMLButtonElement>('.actions button');
		if (!b || b.disabled) break;
		b.click();
		flushSync();
		await Promise.resolve();
		flushSync();
	}
};

afterEach(() => {
	recorded = [];
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('GrammarSection', () => {
	it('Given_LastStep_When_Continue_Then_DoneTitleAndText', async () => {
		// Arrange
		const done = 'Mẫu A + 好 đã vào phần ôn tập.';
		const { options, cta } = await mountSection(content({}, done));
		expect(cta()!.textContent).toContain(m.grammar_start());

		// Act — explain step, then two drills, then finish.
		cta()!.click();
		flushSync();
		while (target!.querySelector('.actions button')) {
			const body = options();
			if (body.length > 0) {
				body[1].click();
				flushSync();
			}
			const b = target!.querySelector<HTMLButtonElement>('.actions button');
			if (!b || b.disabled) break;
			b.click();
			flushSync();
			await Promise.resolve();
			flushSync();
		}

		// Assert
		expect(target!.querySelector('[data-part="done-title"]')!.textContent).toBe(
			'Xong phần Ngữ pháp'
		);
		expect(target!.textContent).toContain(done);
		const next = target!.querySelector('[data-part="done-next"] a')!;
		expect(next.textContent).toContain(m.done_back());
		expect(next.getAttribute('href')).toBe('/lesson/h1-99');
		expect(document.querySelector('[role="dialog"]')).toBeNull();
	});

	it('Given_NoDoneText_When_Finish_Then_TitleOnly', async () => {
		// Arrange
		const { cta } = await mountSection(content());
		cta()!.click();
		flushSync();
		while (target!.querySelector('.actions button')) {
			const body = [...target!.querySelectorAll<HTMLButtonElement>('.body button')];
			if (body.length > 0) {
				body[1].click();
				flushSync();
			}
			const b = target!.querySelector<HTMLButtonElement>('.actions button');
			if (!b || b.disabled) break;
			b.click();
			flushSync();
			await Promise.resolve();
			flushSync();
		}

		// Act / Assert
		expect(target!.textContent).toContain('Xong phần Ngữ pháp');
		expect(target!.querySelector('[data-part="done-text"]')).toBeNull();
		expect(target!.querySelector('.actions')).toBeNull();
	});

	it('Given_LastRecordHasDayCounted_When_Finish_Then_StreakPopupOverDone', async () => {
		// Arrange
		recorded = [{ type: 'DayCounted', day: '2026-11-22', streak: 4 }];
		const { cta } = await mountSection(content());

		// Act
		await finish(cta);

		// Assert
		expect(target!.textContent).toContain('Xong phần Ngữ pháp');
		expect(document.querySelector('[role="dialog"] h2')!.textContent).toBe('Chuỗi lên 4 ngày!');
	});

	it('Given_NullSession_When_Mount_Then_PlaceholderNoRunner', async () => {
		// Arrange / Act
		await mountSection(content({}, 'x'), null);

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(target!.querySelector('.actions')).toBeNull();
		expect(target!.textContent).not.toContain('Chào hỏi: A + 好');
	});

	it('Given_PrimerLesson_When_Mount_Then_Placeholder', async () => {
		// Arrange
		const primer = { kind: 'primer', id: 'h0-00', level: 1 } as unknown as Lesson;

		// Act
		await mountSection(content({ ...primer }));

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(target!.querySelector('.actions')).toBeNull();
	});
});
