import { flushSync, mount, unmount, tick } from 'svelte';
import { IDBFactory } from 'fake-indexeddb';
import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import { Lesson, Word } from '#lib/content/schemas.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sections } from './sections';
import WarmupSection from './WarmupSection.svelte';

const PREV = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'];
const PINYIN: Record<string, string> = {
	你: 'nǐ',
	好: 'hǎo',
	您: 'nín',
	你们: 'nǐmen',
	你好: 'nǐ hǎo',
	对不起: 'duìbuqǐ',
	没关系: 'méi guānxi',
	谢谢: 'xièxie',
	不客气: 'bú kèqi',
	再见: 'zàijiàn'
};
const vi_ = (id: string) => `vi-${id}`;

const word = (id: string): ImportedWord => ({
	...Word.parse({
		id,
		hanzi: id,
		pinyin: PINYIN[id],
		level: 1,
		pos: ['n'],
		senses: [{ vi: vi_(id) }],
		examples: []
	}),
	listedIn: ['h1-01'],
	audio: `word/${id}`
});

const lessonContent = (id: string, order: number, words: ImportedWord[]): LessonContent => ({
	contentSha: `sha-${id}`,
	lesson: Lesson.parse({
		id,
		level: 1,
		topic: 't',
		order,
		title: 'T',
		titleHanzi: '你',
		goal: 'g',
		scene: { file: 's.webp', cast: ['takin'], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids: words.map((w) => w.id) },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 0 }
	}),
	words,
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

const prevContent = lessonContent('h1-01', 1, PREV.map(word));
const current = lessonContent('h1-02', 2, []);

const env = vi.hoisted(() => ({ ledger: null as unknown, failCatalog: false }));
vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => env.ledger }));
vi.mock('#lib/catalog/app.js', () => ({
	catalog: {
		lesson: async () => {
			if (env.failCatalog) throw new Error('offline');
			return (globalThis as { __prev?: LessonContent }).__prev;
		}
	}
}));
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const session = { user: { id: 'u1' } } as never;

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
let ledger: Ledger;

const seed = async (ids: string[]) => {
	for (const [i, id] of ids.entries())
		await ledger.record({
			id: `seed-${i}`,
			at: new Date(Date.now() - 86_400_000).toISOString(),
			questionId: `seed-q-${i}`,
			contentSha: 'sha-h1-01',
			correct: true,
			ms: 1,
			card: { word: id, skill: 'the' }
		});
};

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountSection = async () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WarmupSection, { target, props: { lesson: current, session } }) as Record<
		string,
		unknown
	>;
	await settle();
};

const part = (p: string) => target!.querySelector<HTMLElement>(`[data-part="${p}"]`);
const cta = () => target!.querySelector<HTMLButtonElement>('.actions button');
const options = () => [...target!.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];

const ANSWERS = ['你', vi_('好'), PINYIN['您'], '你们', '你好', vi_('对不起')];

const answerAll = async (wrong: number[]) => {
	for (const [i, right] of ANSWERS.entries()) {
		await vi.waitFor(() => {
			expect(options().length).toBe(4);
			expect(target!.textContent).toContain(`${i + 1}/6`);
		});
		const pick = options().find((b) =>
			wrong.includes(i) ? b.textContent?.trim() !== right : b.textContent?.trim() === right
		);
		if (!pick)
			throw new Error(
				`card ${i} want ${right}: ${options().map((b) => b.textContent?.trim())} / ${target!.textContent}`
			);
		pick.click();
		await settle();
		cta()!.click();
		await settle();
		cta()!.click();
		await settle();
	}
};

beforeEach(async () => {
	globalThis.indexedDB = new IDBFactory();
	(globalThis as { __prev?: LessonContent }).__prev = prevContent;
	env.failCatalog = false;
	ledger = await openLedger({
		initial: initialState({ curriculum: CURRICULUM, tz: 'UTC' }),
		store: memoryStore(),
		db: 'warmup-test'
	});
	env.ledger = ledger;
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('WarmupSection', () => {
	it('Given_SectionsRecord_When_Lookup_Then_WarmupMountsWarmupSection', () => {
		expect(sections.warmup).toBe(WarmupSection);
	});

	it('Given_FiveOfSixRight_When_Finish_Then_DoneCopy', async () => {
		// Arrange
		await seed(PREV);
		await mountSection();

		// Act
		await answerAll([1]);

		// Assert
		await vi.waitFor(() => expect(part('done-title')?.textContent).toBe('Xong phần Khởi động'));
		expect(part('done-text')?.textContent).toBe('5/6 đúng · từ sai sẽ quay lại sớm hơn');
		const href = part('done-next')?.querySelector('a')?.getAttribute('href') ?? '';
		expect(href.endsWith('/lesson/h1-02/words')).toBe(true);
	});

	it('Given_SixRight_When_Finish_Then_AllRightCopy', async () => {
		// Arrange
		await seed(PREV);
		await mountSection();

		// Act
		await answerAll([]);

		// Assert
		await vi.waitFor(() =>
			expect(part('done-text')?.textContent).toBe('6/6 đúng · cả sáu từ đều chắc tay')
		);
	});

	it('Given_WrongAnswer_When_Finish_Then_WrongCardDueEarlier', async () => {
		// Arrange
		await seed(PREV);
		await mountSection();

		// Act
		await answerAll([1]);
		await vi.waitFor(() => expect(part('done-title')).not.toBeNull());

		// Assert
		const due = (id: string) => Date.parse(ledger.state().lexicon[id].cards.the!.due);
		expect(due('好')).toBeLessThan(due('你们'));
		expect(due('好')).toBeLessThan(due('对不起'));
	});

	it('Given_NoCandidates_When_Open_Then_Placeholder', async () => {
		// Arrange / Act
		await mountSection();

		// Assert
		expect(target!.textContent).toContain('Phần học');
		expect(options()).toHaveLength(0);
	});

	it('Given_CatalogError_When_Open_Then_Placeholder', async () => {
		// Arrange
		await seed(PREV);
		env.failCatalog = true;

		// Act
		await mountSection();

		// Assert
		expect(options()).toHaveLength(0);
		expect(part('done-title')).toBeNull();
	});

	it('Given_NoPreviousLesson_When_Open_Then_Placeholder', async () => {
		// Arrange
		await seed(PREV);
		const first = lessonContent('h0-00', 0, []);
		target = document.createElement('div');
		document.body.append(target);

		// Act
		app = mount(WarmupSection, { target, props: { lesson: first, session } }) as Record<
			string,
			unknown
		>;
		await settle();

		// Assert
		expect(options()).toHaveLength(0);
	});
});
