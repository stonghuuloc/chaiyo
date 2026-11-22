import { flushSync, mount, tick, unmount } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import { m } from '#lib/paraglide/messages.js';
import type { LessonContent } from '#lib/catalog/index.js';
import { Lesson } from '#lib/content/schemas.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sections } from './sections';
import WritingSection from './WritingSection.svelte';

const ledger = {
	state: () => initialState(),
	record: async () => []
} as unknown as Ledger;

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));
vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../../../test/FakeWriteStrokes.svelte')
);

const session = { user: { id: 'u1' } } as never;

const content = (chars: string[]): LessonContent => ({
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
			words: { ids: [] },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars }
		},
		gate: { pool: [], draw: 0 }
	}),
	words: [],
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
	app = mount(WritingSection, { target, props: { lesson: c, session: s } }) as Record<
		string,
		unknown
	>;
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('WritingSection', () => {
	it('Given_Sections_When_Lookup_Then_WritingRegistered', () => {
		expect(sections.writing).toBe(WritingSection);
	});

	it('Given_NullSession_When_Mounted_Then_Placeholder', async () => {
		// Arrange
		// Act
		await mountSection(content(['你']), null);

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
		expect(target!.querySelector('.top span')).toBeNull();
	});

	it('Given_NoChars_When_Mounted_Then_Placeholder', async () => {
		// Arrange
		// Act
		await mountSection(content([]));

		// Assert
		expect(target!.textContent).toContain(m.screen_lesson_section());
	});

	it('Given_H1_01_When_Mounted_Then_Counter1Of6', async () => {
		// Arrange
		// Act
		await mountSection(content(['你', '好', '们']));

		// Assert
		await vi.waitFor(() => expect(target!.querySelector('.top span')?.textContent).toBe('1/6'));
		expect(target!.textContent).toContain('Lần 1: viết theo nét mờ');
	});
});
