import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it } from 'vitest';
import RoadmapSlice from './RoadmapSlice.svelte';
import { roadmapSlice, type RoadRow } from './roadmap';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const ac6 = (): RoadRow[] => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'].passed = true;
	state.lessons['h1-01'].unlocked = true;
	return roadmapSlice(state);
};

const mountSlice = (rows: RoadRow[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(RoadmapSlice, { target, props: { rows } }) as Record<string, unknown>;
	flushSync();
	const items = () => [...target!.querySelectorAll<HTMLElement>('[data-part=road-row]')];
	return {
		items,
		titles: () =>
			items().map((r) => r.querySelector('[data-part=road-title]')?.textContent?.trim()),
		notes: () => items().map((r) => r.querySelector('[data-part=road-note]')?.textContent?.trim()),
		rowAnchors: () => [...target!.querySelectorAll<HTMLAnchorElement>('[data-part=road-row] a')],
		all: () => target!.querySelector<HTMLAnchorElement>('[data-part=roadmap-all]')
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('RoadmapSlice', () => {
	it('Given_Ac6Rows_When_Render_Then_FourRowsTitlesAndNotes', () => {
		// Arrange / Act
		const slice = mountSlice(ac6());

		// Assert
		expect(slice.items()).toHaveLength(4);
		expect(slice.titles()).toEqual([
			'Bài 0 · Nhập môn 拼音',
			'Bài 1 · Xin chào 你好',
			'Bài 2 · Bạn tên gì? 你叫什么名字',
			'Bài 3 · Đây là ai? 这是谁'
		]);
		expect(slice.notes()).toEqual(['Đã xong', 'Đang học', 'Mở khi qua Bài 1', 'Mở khi qua Bài 2']);
	});

	it('Given_Ac6Rows_When_Render_Then_LessonLinksOnlyOnDoneAndNow', () => {
		// Arrange / Act
		const slice = mountSlice(ac6());

		// Assert
		const anchors = slice.rowAnchors();
		expect(anchors).toHaveLength(2);
		expect(anchors[0].getAttribute('href')).toMatch(/\/lesson\/h0-00$/);
		expect(anchors[1].getAttribute('href')).toMatch(/\/lesson\/h1-01$/);
		const locked = slice.items().filter((r) => r.getAttribute('data-status') === 'locked');
		expect(locked).toHaveLength(2);
		for (const r of locked) expect(r.querySelectorAll('a')).toHaveLength(0);
		expect(slice.all()!.closest('[data-part=road-row]')).toBeNull();
	});

	it('Given_Rows_When_Render_Then_XemTatCaLinksRoadmap', () => {
		// Arrange / Act
		const slice = mountSlice(ac6());

		// Assert
		expect(slice.all()!.textContent?.trim()).toBe('Xem tất cả');
		expect(slice.all()!.getAttribute('href')).toMatch(/\/roadmap$/);
	});

	it('Given_OpenRow_When_Render_Then_AnchorAndNoNote', () => {
		// Arrange
		const rows: RoadRow[] = [
			{ id: 'h1-02', n: 2, title: 'Bạn tên gì?', hanzi: '你叫什么名字', status: 'open' }
		];

		// Act
		const slice = mountSlice(rows);

		// Assert
		expect(slice.rowAnchors()).toHaveLength(1);
		expect(slice.rowAnchors()[0].getAttribute('href')).toMatch(/\/lesson\/h1-02$/);
		expect(slice.notes()).toEqual([undefined]);
	});
});
