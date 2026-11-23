import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReminderTimeSection, { type ReminderTimeDeps } from './ReminderTimeSection.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWith = (over: Partial<ReminderTimeDeps> = {}, children = false) => {
	const deps = {
		time: '21:00',
		save: vi.fn<ReminderTimeDeps['save']>(async () => {}),
		notify: vi.fn<ReminderTimeDeps['notify']>(),
		...over
	} satisfies ReminderTimeDeps;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(ReminderTimeSection, {
		target,
		props: {
			deps,
			...(children && {
				children: createRawSnippet(() => ({ render: () => '<p data-testid="kid">kid</p>' }))
			})
		}
	}) as Record<string, unknown>;
	flushSync();
	return deps;
};

const preset = (t: string) =>
	[...document.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find((b) =>
		b.textContent?.includes(t)
	)!;
const pressedNow = () =>
	[...document.querySelectorAll<HTMLButtonElement>('button[aria-pressed="true"]')].map(
		(b) => b.querySelector('b')?.textContent
	);
const input = () => document.querySelector<HTMLInputElement>('input[type="time"]')!;
const other = () => input().closest('label')!;
const type = (v: string) => {
	input().value = v;
	input().dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
};
const commit = (v: string) => {
	input().value = v;
	input().dispatchEvent(new Event('input', { bubbles: true }));
	input().dispatchEvent(new Event('change', { bubbles: true }));
	flushSync();
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('ReminderTimeSection', () => {
	it('Given_Saved2100_When_Mount_Then_2100PressedInputEmpty', () => {
		mountWith();
		expect(document.querySelector('h2')?.textContent).toBe('Nhắc học');
		expect(document.body.textContent).toContain('Mỗi ngày một lời nhắc, đúng giờ bạn chọn.');
		expect(document.body.textContent).toContain('Giờ nhắc');
		expect(preset('07:00').getAttribute('aria-pressed')).toBe('false');
		expect(preset('12:30').getAttribute('aria-pressed')).toBe('false');
		expect(preset('21:00').getAttribute('aria-pressed')).toBe('true');
		expect(input().value).toBe('');
	});

	it('Given_Tap0700_Then_OneSavePressed', async () => {
		const deps = mountWith();
		preset('07:00').click();
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith('07:00');
		expect(pressedNow()).toEqual(['07:00']);
	});

	it('Given_Pressed0700_When_TapAgain_Then_NoSecondSave', async () => {
		const deps = mountWith();
		preset('07:00').click();
		await settle();
		preset('07:00').click();
		await settle();
		expect(deps.save).toHaveBeenCalledOnce();
	});

	it('Given_Tap0700Then1230_When_FirstPending_Then_SavesInOrder', async () => {
		const finishes: (() => void)[] = [];
		const order: string[] = [];
		const deps = mountWith({
			save: vi.fn(
				(t: string) =>
					new Promise<void>((r) => {
						order.push(`start:${t}`);
						finishes.push(() => {
							order.push(`end:${t}`);
							r();
						});
					})
			)
		});
		preset('07:00').click();
		flushSync();
		preset('12:30').click();
		flushSync();
		await settle();
		expect(order).toEqual(['start:07:00']);
		finishes[0]!();
		await settle();
		finishes[1]!();
		await settle();
		expect(vi.mocked(deps.save).mock.calls.map((c) => c[0])).toEqual(['07:00', '12:30']);
		expect(pressedNow()).toEqual(['12:30']);
	});

	it('Given_Input2015_When_NoChange_Then_NoSaveAndNoPreset', async () => {
		const deps = mountWith();
		type('20:15');
		await settle();
		expect(deps.save).not.toHaveBeenCalled();
		expect(pressedNow()).toEqual([]);
	});

	it('Given_Change2015_Then_OneSaveOtherSelected', async () => {
		const deps = mountWith();
		commit('20:15');
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith('20:15');
		expect(pressedNow()).toEqual([]);
		expect(input().value).toBe('20:15');
		expect(other().className).toContain('border-ink');
	});

	it('Given_Saved2015_When_Mount_Then_NoPresetInput2015', () => {
		mountWith({ time: '20:15' });
		expect(pressedNow()).toEqual([]);
		expect(input().value).toBe('20:15');
		expect(other().className).toContain('border-ink');
	});

	it('Given_Change0700_Then_PresetPressedInputEmpty', async () => {
		const deps = mountWith({ time: '20:15' });
		commit('07:00');
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith('07:00');
		expect(pressedNow()).toEqual(['07:00']);
		expect(input().value).toBe('');
	});

	it('Given_EmptyChange_Then_NoSave', async () => {
		const deps = mountWith();
		commit('');
		await settle();
		expect(deps.save).not.toHaveBeenCalled();
		expect(pressedNow()).toEqual(['21:00']);
	});

	it('Given_SaveRejects_When_Tap_Then_PreviousPressedAndErrorToast', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		preset('07:00').click();
		await settle();
		expect(pressedNow()).toEqual(['21:00']);
		expect(deps.notify).toHaveBeenCalledExactlyOnceWith('Chưa lưu được. Bạn thử lại nhé.');
	});

	it('Given_SaveRejects_When_Custom_Then_PreviousPresetBack', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		commit('20:15');
		await settle();
		expect(pressedNow()).toEqual(['21:00']);
		expect(input().value).toBe('');
		expect(deps.notify).toHaveBeenCalledOnce();
	});

	it('Given_Children_Then_RenderedInsideSection', () => {
		mountWith({}, true);
		expect(document.querySelector('section [data-testid="kid"]')).not.toBeNull();
	});
});
