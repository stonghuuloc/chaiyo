import { flushSync, mount, tick, unmount } from 'svelte';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SKILL_KEYS, type SkillKey } from './skills';

vi.mock('$app/paths', () => ({
	resolve: (id: string) => (id === '/(app)/(tabs)/practice' ? '/practice' : id)
}));

const hoisted = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('#lib/learner/index.js', () => ({ learnerLedger: hoisted.load }));

const { default: Page } = await import('./+page.svelte');

const curriculum = {
	lessons: [
		{ id: 'a', level: 1, sections: [], words: [] },
		{ id: 'b', level: 2, sections: [], words: [] },
		{ id: 'c', level: 3, sections: [], words: [] }
	]
};
const atLevel = (level: 1 | 2 | 3): State => {
	const state = initialState({ curriculum });
	if (level >= 2) state.lessons.b.unlocked = true;
	if (level >= 3) state.lessons.c.unlocked = true;
	return state;
};

let current: State = atLevel(1);
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

const session = { user: { id: 'u1' } };
const DEMO_DOAN = 'Chưa có trong bản demo: cần AI chấm bài viết.';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	listeners.clear();
	hoisted.load.mockReset();
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

const mountPage = (k: SkillKey) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data: { k } } as never }) as Record<string, unknown>;
	flushSync();
	return target;
};

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountWithSession = async (k: SkillKey) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data: { k, session } } as never }) as Record<
		string,
		unknown
	>;
	await settle();
	return target;
};

const notes = (root: HTMLElement) => [...root.querySelectorAll('[data-part="demo-note"]')];

describe('practice skill entry', () => {
	it.each(SKILL_KEYS)('Given_EachK_%s_When_Render_Then_H1_ThreeLi_OneSample_BackLink', (k) => {
		// Arrange
		const titles = {
			noi: 'Đọc to, app chấm phát âm',
			doan: 'Viết câu, rồi viết đoạn ngắn',
			thi: 'Thi thử HSK 1, như thi thật'
		};

		// Act
		const root = mountPage(k);

		// Assert
		const h1s = root.querySelectorAll('h1');
		expect(h1s).toHaveLength(1);
		expect(h1s[0].textContent).toBe(titles[k]);
		expect(root.querySelectorAll('ol > li')).toHaveLength(3);
		expect(root.querySelectorAll('[data-part="sample"]')).toHaveLength(1);
		expect(root.querySelectorAll('[data-part="sample"] [lang="zh"]')).toHaveLength(1);
		const back = [...root.querySelectorAll('a')].filter(
			(a) => a.textContent?.trim() === 'Về Luyện tập'
		);
		expect(back).toHaveLength(1);
		expect(back[0].getAttribute('href')).toBe('/practice');
	});

	it.each(SKILL_KEYS)('Given_EachK_%s_Then_NoButtonInputMediaNorStart', (k) => {
		// Arrange
		// Act
		const root = mountPage(k);
		// Assert
		expect(root.querySelectorAll('button, input, audio, video')).toHaveLength(0);
		expect(root.textContent).not.toContain('Bắt đầu');
	});

	it.each(SKILL_KEYS)('Given_EachK_%s_Then_NoScorePattern', (k) => {
		// Arrange
		// Act
		const root = mountPage(k);
		// Assert
		expect(root.textContent).not.toMatch(/\d+\/\d+/);
		expect(root.querySelectorAll('[data-part="score"]')).toHaveLength(0);
	});

	it.each([
		[
			'noi',
			'Chưa có trong bản demo: cần máy chấm phát âm (xem kế hoạch chấm điểm Nói trong NOTES).'
		],
		['doan', 'Chưa có trong bản demo: cần AI chấm bài viết.'],
		['thi', 'Chưa có đề trong bản demo.']
	] as const)('Given_EachK_%s_Then_OneDashedNoteWithLiteral', (k, note) => {
		// Arrange
		// Act
		const root = mountPage(k);
		// Assert
		const notes = root.querySelectorAll('[data-part="demo-note"]');
		expect(notes).toHaveLength(1);
		expect(notes[0].textContent).toBe(note);
		expect(notes[0].classList.contains('border-dashed')).toBe(true);
	});

	it('Given_ThiAndLv1_Then_NoModePicker', () => {
		// Arrange
		const root = mountPage('thi');
		// Act
		const picker = root.querySelectorAll('[role="group"], [aria-pressed], button');
		// Assert
		expect(picker).toHaveLength(0);
	});

	it('Given_DoanSessionHsk1_Then_OneDashedNoteAc3Literal', async () => {
		// Arrange
		current = atLevel(1);
		hoisted.load.mockResolvedValue(ledger);
		// Act
		const root = await mountWithSession('doan');
		// Assert
		const found = notes(root);
		expect(found).toHaveLength(1);
		expect(found[0].textContent).toBe('Mở khi bạn tới HSK 3. Bạn đang ở HSK 1.');
		expect(found[0].classList.contains('border-dashed')).toBe(true);
	});

	it('Given_DoanHsk2_When_PublishHsk3_Then_DemoNote', async () => {
		// Arrange
		current = atLevel(2);
		hoisted.load.mockResolvedValue(ledger);
		const root = await mountWithSession('doan');
		expect(notes(root)[0].textContent).toBe('Mở khi bạn tới HSK 3. Bạn đang ở HSK 2.');
		// Act
		publish(atLevel(3));
		await settle();
		// Assert
		expect(notes(root)).toHaveLength(1);
		expect(notes(root)[0].textContent).toBe(DEMO_DOAN);
	});

	it('Given_DoanNoSession_Then_DemoNote', () => {
		// Arrange
		// Act
		const root = mountPage('doan');
		// Assert
		expect(notes(root)[0].textContent).toBe(DEMO_DOAN);
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_DoanLedgerRejects_Then_DemoNote', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('ledger down'));
		// Act
		const root = await mountWithSession('doan');
		// Assert
		expect(notes(root)).toHaveLength(1);
		expect(notes(root)[0].textContent).toBe(DEMO_DOAN);
	});

	it('Given_NoiSessionHsk1_Then_NoiNote', async () => {
		// Arrange
		current = atLevel(1);
		hoisted.load.mockResolvedValue(ledger);
		// Act
		const root = await mountWithSession('noi');
		// Assert
		expect(notes(root)[0].textContent).toBe(
			'Chưa có trong bản demo: cần máy chấm phát âm (xem kế hoạch chấm điểm Nói trong NOTES).'
		);
	});

	it('Given_DoanHsk1_Then_NoButtonNoInputOneNote', async () => {
		// Arrange
		current = atLevel(1);
		hoisted.load.mockResolvedValue(ledger);
		// Act
		const root = await mountWithSession('doan');
		// Assert
		expect(root.querySelectorAll('button, input')).toHaveLength(0);
		expect(notes(root)).toHaveLength(1);
	});
});
