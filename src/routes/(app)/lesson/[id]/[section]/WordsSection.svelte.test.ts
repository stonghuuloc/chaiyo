import { flushSync, mount, unmount, tick } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import { m } from '#lib/paraglide/messages.js';
import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import { Lesson } from '#lib/content/schemas.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type StudyEvent } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sections } from './sections';
import WordsSection from './WordsSection.svelte';

let recorded: StudyEvent[] = [];
const ledger = {
	state: () => initialState(),
	subscribe: () => () => {},
	record: async () => recorded
} as unknown as Ledger;

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));
vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../../../test/FakeStrokes.svelte')
);
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const { lookup } = vi.hoisted(() => ({
	lookup: vi.fn(async (sentenceId: string, i: number) => ({
		hanzi: '您',
		pinyin: 'nín',
		hanviet: 'nâm',
		meaning: 'ngài',
		sentenceId,
		start: i
	}))
}));

vi.mock('#lib/catalog/app.js', () => ({
	catalog: { lookup, thin: async () => null, find: async () => ({ word: null, char: null }) }
}));

const session = { user: { id: 'u1' } } as never;

const word = (id: string): ImportedWord => ({
	id,
	hanzi: id,
	pinyin: `p-${id}`,
	level: 1,
	pos: ['n'],
	senses: [{ vi: `vi-${id}` }],
	examples: [],
	listedIn: ['h1-01']
});

const content = (ids: string[]): LessonContent => ({
	contentSha: 'sha',
	lesson: Lesson.parse({
		id: 'h1-01',
		level: 1,
		topic: 't',
		order: 1,
		title: 'T',
		titleHanzi: '你',
		goal: 'g',
		scene: { file: 's.webp', cast: ['takin'], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 0 }
	}),
	words: ids.map(word),
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountSection = async (c: LessonContent, s: Session | null = session) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WordsSection, { target, props: { lesson: c, session: s } }) as Record<
		string,
		unknown
	>;
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
	return { cta: () => target!.querySelector<HTMLButtonElement>('.actions button') };
};

const part = (p: string) => target!.querySelector<HTMLElement>(`[data-part="${p}"]`);

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	recorded = [];
});

describe('WordsSection', () => {
	it('Given_SectionsRecord_When_Lookup_Then_WordsMountsWordsSection', () => {
		expect(sections.words).toBe(WordsSection);
	});

	it('Given_TwoCards_When_FinishEach_Then_DoneSaysTwoWordsEnteredTuCuaToi', async () => {
		// Arrange
		const v = await mountSection(content(['你', '好']));

		// Act
		for (let i = 0; i < 2; i++) {
			await vi.waitFor(() => expect(v.cta()?.textContent).toContain(m.words_next()));
			v.cta()!.click();
			await tick();
			await Promise.resolve();
			flushSync();
		}

		// Assert
		await vi.waitFor(() =>
			expect(part('done-title')?.textContent).toBe(m.done_title({ name: m.done_section_words() }))
		);
		expect(part('done-text')?.textContent).toBe(m.words_done_text({ n: 2 }));
		expect(part('done-text')?.textContent).toContain('2 từ đã vào Từ của tôi');
	});

	it('Given_NullSession_When_Mount_Then_PlaceholderNoRunner', async () => {
		// Arrange
		// Act
		const v = await mountSection(content(['你']), null);

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(v.cta()).toBeNull();
	});

	it('Given_NoWords_When_Mount_Then_Placeholder', async () => {
		// Arrange
		// Act
		await mountSection(content([]));

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
	});

	it('Given_Section_When_TapHanzi_Then_LookupPanelShown', async () => {
		// Arrange
		const c = content(['你']);
		c.sentences = [{ id: 's1', hanzi: '您好！', pinyin: 'nín hǎo', vi: 'Chào thầy cô!', seg: [] }];
		c.words[0].examples = ['s1'];
		await mountSection(c);
		// Act
		target!
			.querySelector('[data-part="example"] [data-i]')!
			.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
		for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
		flushSync();
		// Assert
		expect(lookup).toHaveBeenCalledWith('s1', 0);
		expect(document.body.querySelector('[data-part="lookup-panel"]')).not.toBeNull();
	});
});
