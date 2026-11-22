import { flushSync, mount, unmount, tick } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import { m } from '#lib/paraglide/messages.js';
import type { LessonContent } from '#lib/catalog/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type StudyEvent } from '#lib/study/index.js';
import type { Lesson, Primer } from '#lib/content/schemas.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DialogueSection from './DialogueSection.svelte';

let recorded: StudyEvent[] = [];
const ledger = {
	state: () => initialState(),
	record: async () => recorded
} as unknown as Ledger;

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));
vi.mock('#lib/audio/index.js', () => ({
	player: { playToEnd: vi.fn(async () => true), pause: vi.fn() }
}));

const session = { user: { id: 'u1' } } as never;

const content = (): LessonContent => ({
	contentSha: 'sha',
	lesson: {
		id: 'h1-01',
		level: 1,
		topic: 't',
		order: 1,
		title: 'Xin chào',
		titleHanzi: '你好',
		goal: 'g',
		scene: { file: 'f', cast: [], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids: [] },
			grammar: { ids: [], drills: [] },
			dialogue: {
				parts: [
					{ title: 'Gặp nhau', lines: ['s3', 's4'] },
					{ title: 'Chia tay', lines: ['s7'] }
				],
				questions: [
					{
						id: 'q-d01',
						type: 'choice',
						tests: { words: [] },
						ask: 'Gấu Đỏ nên trả lời thế nào?',
						prompt: { kind: 'audio', ref: 's3' },
						optionKind: 'hanzi',
						options: ['没关系。', '再见！'],
						answer: 0
					}
				]
			},
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 1 }
	} as Lesson,
	words: [],
	chars: [],
	sentences: [
		{ id: 's3', hanzi: '对不起！', pinyin: 'duìbuqǐ', vi: 'Xin lỗi!', speaker: 'takin', seg: [] },
		{
			id: 's4',
			hanzi: '没关系。',
			pinyin: 'méi guānxi',
			vi: 'Không sao.',
			speaker: 'redpanda',
			seg: []
		},
		{ id: 's7', hanzi: '再见！', pinyin: 'zàijiàn', vi: 'Tạm biệt!', speaker: 'takin', seg: [] }
	],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	for (let i = 0; i < 6; i++) {
		await tick();
		await Promise.resolve();
	}
	flushSync();
};

const mountSection = async (
	c: LessonContent,
	props: { session?: Session | null; ledger?: Promise<Ledger> } = {}
) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(DialogueSection, {
		target,
		props: { lesson: c, session: props.session === undefined ? session : props.session, ...props }
	}) as Record<string, unknown>;
	await settle();
};

const cta = () => target!.querySelector<HTMLButtonElement>('.actions button');
const press = async () => {
	cta()!.click();
	flushSync();
	await settle();
};

afterEach(() => {
	recorded = [];
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('DialogueSection', () => {
	it('Given_Bai1Dialogue_When_PlayBothPartsAndAnswer_Then_FeedbackAndDone', async () => {
		// Arrange
		recorded = [{ type: 'DayCounted', day: '2026-11-22', streak: 3 }];
		await mountSection(content());
		const kicker = target!.textContent;

		// Act
		await press();
		await press();
		const part2 = target!.textContent;
		await press();
		await press();
		target!.querySelector<HTMLButtonElement>('.body button')!.click();
		flushSync();
		await press();
		const feedback = target!.textContent;
		await press();

		// Assert
		expect(kicker).toContain('Đoạn 1/2');
		expect(part2).toContain('Đoạn 2/2');
		expect(feedback).toContain('Gấu Đỏ nên trả lời thế nào?');
		expect(feedback).toContain('méi guānxi · Không sao.');
		expect(target!.querySelector('[data-part="done-title"]')!.textContent).toBe(
			'Xong phần Hội thoại'
		);
		expect(target!.textContent).toContain(
			'Bạn đã nghe 2 đoạn hội thoại và thử một tình huống thật.'
		);
		const next = target!.querySelector('[data-part="done-next"] a')!;
		expect(next.textContent).toContain(m.done_next());
		expect(next.getAttribute('href')).toBe('/lesson/h1-01/listenSpeak');
		expect(document.querySelector('[role="dialog"] h2')!.textContent).toBe('Chuỗi lên 3 ngày!');
	});

	it('Given_NullSessionAndNoLedger_When_Mount_Then_Placeholder', async () => {
		// Arrange / Act
		await mountSection(content(), { session: null });

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(target!.querySelector('.actions')).toBeNull();
	});

	it('Given_NullSessionWithLedger_When_Mount_Then_RunnerUsesThatLedger', async () => {
		// Arrange / Act
		await mountSection(content(), { session: null, ledger: Promise.resolve(ledger) });

		// Assert
		expect(target!.textContent).toContain('Đoạn 1/2');
	});

	it('Given_LedgerFails_When_Mount_Then_Placeholder', async () => {
		// Arrange
		const failing = Promise.reject(new Error('no db'));
		failing.catch(() => {});

		// Act
		await mountSection(content(), { ledger: failing });

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
	});

	it('Given_PrimerLesson_When_Mount_Then_Placeholder', async () => {
		// Arrange
		const c = content();
		c.lesson = { kind: 'primer', id: 'h0-00', level: 1 } as unknown as Primer;

		// Act
		await mountSection(c);

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(target!.querySelector('.actions')).toBeNull();
	});
});
