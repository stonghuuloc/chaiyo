import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HanziStyleSection, { type HanziStyleDeps } from './HanziStyleSection.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWith = (over: Partial<HanziStyleDeps> = {}) => {
	const deps = {
		style: 'kai',
		save: vi.fn<HanziStyleDeps['save']>(async () => {}),
		apply: vi.fn<HanziStyleDeps['apply']>(),
		notify: vi.fn<HanziStyleDeps['notify']>(),
		...over
	} satisfies HanziStyleDeps;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(HanziStyleSection, { target, props: { deps } }) as Record<string, unknown>;
	flushSync();
	return deps;
};

const tile = (name: string) =>
	[...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) =>
		b.textContent?.includes(name)
	)!;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('HanziStyleSection', () => {
	it('Given_Kai_When_Mount_Then_KaiCheckedRovingTabindexHint', () => {
		mountWith();
		expect(document.querySelector('h2')?.textContent).toBe('Chữ Hán');
		expect(document.body.textContent).toContain('Kiểu chữ hiện trên thẻ từ và bài học.');
		expect(document.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe(
			'Kiểu chữ Hán'
		);
		expect(tile('Khải thư').getAttribute('aria-checked')).toBe('true');
		expect(tile('Khải thư').tabIndex).toBe(0);
		expect(tile('Hành thư').getAttribute('aria-checked')).toBe('false');
		expect(tile('Hành thư').tabIndex).toBe(-1);
		expect(document.body.textContent).toContain(
			'Hành thư chỉ là bản xem trước, đang dùng font gần giống. Máy bạn chưa có thì sẽ hiện nét tay bình thường.'
		);
		expect(tile('Khải thư').textContent).toContain('Nét rõ, dễ tập viết');
		expect(tile('Hành thư').textContent).toContain('Xem trước');
	});

	it('Given_Kai_When_ClickHanh_Then_SaveXingApplyXing', async () => {
		const deps = mountWith();
		tile('Hành thư').click();
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith('xing');
		expect(deps.apply).toHaveBeenCalledExactlyOnceWith('xing');
		expect(tile('Hành thư').getAttribute('aria-checked')).toBe('true');
		expect(tile('Hành thư').tabIndex).toBe(0);
		expect(tile('Khải thư').tabIndex).toBe(-1);
	});

	it('Given_Xing_When_ArrowLeft_Then_SaveKaiFocusKhai', async () => {
		const deps = mountWith({ style: 'xing' });
		tile('Hành thư').dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
		);
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith('kai');
		expect(deps.apply).toHaveBeenCalledExactlyOnceWith('kai');
		expect(tile('Khải thư').getAttribute('aria-checked')).toBe('true');
		expect(document.activeElement).toBe(tile('Khải thư'));
	});

	it('Given_Checked_When_ClickSame_Then_NoSave', async () => {
		const deps = mountWith();
		tile('Khải thư').click();
		await settle();
		expect(deps.save).not.toHaveBeenCalled();
		expect(deps.apply).not.toHaveBeenCalled();
	});

	it('Given_SaveRejects_When_ClickHanh_Then_KaiBackApplyKaiErrorToast', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		tile('Hành thư').click();
		await settle();
		expect(tile('Khải thư').getAttribute('aria-checked')).toBe('true');
		expect(deps.apply.mock.calls.map((c) => c[0])).toEqual(['xing', 'kai']);
		expect(deps.notify).toHaveBeenCalledExactlyOnceWith('Chưa lưu được. Bạn thử lại nhé.');
	});

	it('Given_Tiles_Then_KaiPreviewUsesKaishuVarXingUsesXingshu', () => {
		mountWith();
		const kai = tile('Khải thư').querySelector('[lang="zh-Hans"]')!;
		const xing = tile('Hành thư').querySelector('[lang="zh-Hans"]')!;
		expect(kai.textContent).toBe('你好');
		expect(kai.className).toContain('--font-hanzi-kaishu');
		expect(xing.className).toContain('font-hanzi-xingshu');
	});
});
