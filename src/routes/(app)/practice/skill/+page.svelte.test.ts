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
});
