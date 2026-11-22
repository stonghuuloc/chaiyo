import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SKILL_KEYS, type SkillKey } from './skills';

vi.mock('$app/paths', () => ({
	resolve: (id: string) => (id === '/(app)/(tabs)/practice' ? '/practice' : id)
}));

const { default: Page } = await import('./+page.svelte');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
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
});
