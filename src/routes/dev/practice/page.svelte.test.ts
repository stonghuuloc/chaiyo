import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('/dev/practice', () => {
	it('Given_Page_When_PickClear_Then_ClearCopy', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();
		const buttons = [...target.querySelectorAll<HTMLButtonElement>('[data-part=scenario]')];
		expect(target.textContent).toContain('khoảng 3 phút');

		// Act
		buttons.find((b) => b.textContent === 'clear')!.click();
		flushSync();

		// Assert
		expect(target.textContent).toContain('Hôm nay xong bài rồi!');
		expect(target.querySelector('[data-part=today-start]')).toBeNull();
	});

	const mountPage = () => {
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();
		return target;
	};
	const press = (root: HTMLElement, part: string, text: string) => {
		[...root.querySelectorAll<HTMLButtonElement>(`[data-part=${part}]`)]
			.find((b) => b.textContent === text)!
			.click();
		flushSync();
	};

	it('Given_Mix_When_PickNghe_Then_4SessionCards', () => {
		// Arrange
		const root = mountPage();
		expect(root.querySelectorAll('[data-part=session-card]')).toHaveLength(12);

		// Act
		press(root, 'skill', 'nghe');

		// Assert
		expect(root.querySelectorAll('[data-part=session-card]')).toHaveLength(4);
		expect(root.querySelectorAll('[data-part=skill-tile]')).toHaveLength(5);
	});

	it('Given_Level3_When_Toggle_Then_DoanOpenText', () => {
		// Arrange
		const root = mountPage();
		expect(root.textContent).toContain('Mở từ HSK 3');

		// Act
		press(root, 'level', '3');

		// Assert
		expect(root.textContent).toContain('Viết câu, đoạn ngắn');
	});

	it('Given_Level3_When_Toggle_Then_Hsk1DaDo', () => {
		// Arrange
		const root = mountPage();
		expect(root.querySelectorAll('[data-part=thi-lock]')).toHaveLength(5);

		// Act
		press(root, 'level', '3');
		root.querySelector<HTMLButtonElement>('[data-part=thi-chip][data-level="1"]')!.click();
		flushSync();

		// Assert
		expect(root.querySelector('[data-part=thi-row]')?.textContent).toContain(
			'đã đỗ · làm lại bất cứ lúc nào'
		);
	});

	it('Given_Words_When_Pick_Then_30TuDaHoc', () => {
		// Arrange
		const root = mountPage();

		// Act
		press(root, 'scenario', 'words');

		// Assert
		expect(root.querySelector('[data-part=mywords-link]')?.textContent).toContain(
			'30 từ đã học và đã lưu'
		);
	});
});
