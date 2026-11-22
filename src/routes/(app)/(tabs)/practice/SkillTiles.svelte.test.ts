import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SkillTiles from './SkillTiles.svelte';
import type { Tile } from './tiles';

const tiles = (o: { nghe?: number; doan?: boolean } = {}): Tile[] => [
	{ key: 'the', count: 6, route: '/(app)/practice/session', query: 'skill=the' },
	{ key: 'nghe', count: o.nghe ?? 4, route: '/(app)/practice/session', query: 'skill=nghe' },
	{ key: 'viet', count: 2, route: '/(app)/practice/session', query: 'skill=viet' },
	{ key: 'noi', route: '/(app)/practice/skill', query: 'k=noi' },
	{ key: 'doan', open: o.doan ?? false, route: '/(app)/practice/skill', query: 'k=doan' }
];

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (t: Tile[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(SkillTiles, { target, props: { tiles: t } }) as Record<string, unknown>;
	flushSync();
	return {
		heading: () => target!.querySelector('h2')?.textContent,
		anchors: () => [...target!.querySelectorAll<HTMLAnchorElement>('[data-part=skill-tile]')],
		text: () => target!.textContent ?? ''
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('SkillTiles', () => {
	it('Given_Tiles6_4_2_When_Mount_Then_HeadingFiveAnchorsCounts', () => {
		// Arrange
		// Act
		const view = render(tiles());
		// Assert
		expect(view.heading()).toBe('Luyện riêng từng kỹ năng');
		expect(view.anchors()).toHaveLength(5);
		expect(view.anchors().map((a) => a.querySelector('b')?.textContent)).toEqual([
			'Thẻ từ',
			'Nghe',
			'Viết chữ',
			'Nói',
			'Viết đoạn'
		]);
		expect(view.text()).toContain('6 từ cần ôn');
		expect(view.text()).toContain('Đọc to, app chấm thanh điệu · sắp có');
	});

	it('Given_NgheCount0_When_Mount_Then_KhongCoTuCanOn', () => {
		// Arrange
		// Act
		const view = render(tiles({ nghe: 0 }));
		// Assert
		expect(view.anchors()[1].textContent).toContain('Không có từ cần ôn');
	});

	it('Given_DoanClosed_When_Mount_Then_MoTuHsk3', () => {
		// Arrange
		// Act
		const view = render(tiles({ doan: false }));
		// Assert
		expect(view.anchors()[4].textContent).toContain('Mở từ HSK 3');
	});

	it('Given_DoanOpen_When_Mount_Then_VietCauDoanNgan', () => {
		// Arrange
		// Act
		const view = render(tiles({ doan: true }));
		// Assert
		expect(view.anchors()[4].textContent).toContain('Viết câu, đoạn ngắn');
	});

	it('Given_Tiles_When_Mount_Then_HrefsEndSkillTheAndKDoan', () => {
		// Arrange
		// Act
		const hrefs = render(tiles())
			.anchors()
			.map((a) => a.getAttribute('href'));
		// Assert
		expect(hrefs[0]).toMatch(/\?skill=the$/);
		expect(hrefs[4]).toMatch(/\?k=doan$/);
	});
});
