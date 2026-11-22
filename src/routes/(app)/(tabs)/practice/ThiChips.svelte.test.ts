import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { initialState, type State } from '#lib/study/index.js';
import ThiChips from './ThiChips.svelte';
import { thiChips } from './thi';

const curriculum = {
	lessons: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
		id,
		level: i + 1,
		sections: [],
		words: []
	}))
};
const build = (unlockedTo: number, passed: string[] = []): State => {
	const state = initialState({ curriculum });
	for (const l of curriculum.lessons) {
		state.lessons[l.id].unlocked = l.level <= unlockedTo;
		state.lessons[l.id].passed = passed.includes(l.id);
	}
	return state;
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (state: State) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(ThiChips, { target, props: { view: thiChips(state) } }) as Record<string, unknown>;
	flushSync();
	return {
		heading: () => target!.querySelector('h2')?.textContent,
		chips: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-part=thi-chip]')],
		locks: () => target!.querySelectorAll('[data-part=thi-lock]').length,
		row: () => target!.querySelector<HTMLAnchorElement>('[data-part=thi-row]')!,
		tap: (level: number) => {
			target!
				.querySelector<HTMLButtonElement>(`[data-part=thi-chip][data-level="${level}"]`)!
				.click();
			flushSync();
		}
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('ThiChips', () => {
	it('Given_Level1_When_Mount_Then_HeadingSixChipsFiveLocksHsk1Selected', () => {
		// Arrange
		// Act
		const view = render(build(1));
		// Assert
		expect(view.heading()).toBe('Thi thử');
		expect(view.chips().map((c) => c.textContent?.trim())).toEqual([
			'HSK 1',
			'HSK 2',
			'HSK 3',
			'HSK 4',
			'HSK 5',
			'HSK 6'
		]);
		expect(view.locks()).toBe(5);
		expect(view.chips().map((c) => c.getAttribute('aria-selected'))).toEqual([
			'true',
			'false',
			'false',
			'false',
			'false',
			'false'
		]);
	});

	it('Given_Level1_When_Mount_Then_RowMoKhiQuaBai5HrefLv1', () => {
		// Arrange
		// Act
		const view = render(build(1));
		// Assert
		expect(view.row().textContent).toContain('Thi thử HSK 1');
		expect(view.row().textContent).toContain('mở khi qua Bài 5');
		expect(view.row().getAttribute('href')).toMatch(/\?k=thi&lv=1$/);
	});

	it('Given_Level1_When_TapHsk2_Then_SelectedAndMoKhiDoThiThuHsk1HrefLv2', () => {
		// Arrange
		const view = render(build(1));
		// Act
		view.tap(2);
		// Assert
		expect(view.chips()[1].getAttribute('aria-selected')).toBe('true');
		expect(view.chips()[0].getAttribute('aria-selected')).toBe('false');
		expect(view.row().textContent).toContain('mở khi đỗ thi thử HSK 1');
		expect(view.row().getAttribute('href')).toMatch(/&lv=2$/);
	});

	it('Given_Level3_When_TapHsk1_Then_DaDo', () => {
		// Arrange
		const view = render(build(3));
		// Act
		view.tap(1);
		// Assert
		expect(view.row().textContent).toContain('đã đỗ · làm lại bất cứ lúc nào');
	});

	it('Given_Level5AllPassed_When_Mount_Then_DaMo', () => {
		// Arrange
		// Act
		const view = render(build(5, ['e']));
		// Assert
		expect(view.row().textContent).toContain('đã mở · chưa có đề trong bản demo');
	});
});
