import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrivacySection, { type PrivacyDeps } from './PrivacySection.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWith = (over: Partial<PrivacyDeps> = {}) => {
	const deps = {
		hidden: false,
		save: vi.fn<PrivacyDeps['save']>(async () => {}),
		notify: vi.fn<PrivacyDeps['notify']>(),
		...over
	} satisfies PrivacyDeps;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(PrivacySection, { target, props: { deps } }) as Record<string, unknown>;
	flushSync();
	return deps;
};

const toggle = () => document.querySelector<HTMLButtonElement>('[role="switch"]')!;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('PrivacySection', () => {
	it('Given_Mount_Then_HintText', () => {
		mountWith();
		expect(document.querySelector('h2')?.textContent).toBe('Quyền riêng tư');
		expect(document.body.textContent).toContain('Ẩn hồ sơ công khai');
		expect(document.body.textContent).toContain(
			'Bật thì người khác không tìm thấy và không xem được hồ sơ của bạn.'
		);
		expect(toggle().getAttribute('aria-checked')).toBe('false');
	});

	it('Given_Visible_When_SwitchOn_Then_SaveHiddenTrueAndToast', async () => {
		const deps = mountWith();
		toggle().click();
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith({ hidden: true });
		expect(toggle().getAttribute('aria-checked')).toBe('true');
		expect(deps.notify).toHaveBeenCalledWith('Hồ sơ đã ẩn');
	});

	it('Given_Hidden_When_SwitchOff_Then_SaveFalseAndHienLai', async () => {
		const deps = mountWith({ hidden: true });
		expect(toggle().getAttribute('aria-checked')).toBe('true');
		toggle().click();
		await settle();
		expect(deps.save).toHaveBeenCalledExactlyOnceWith({ hidden: false });
		expect(toggle().getAttribute('aria-checked')).toBe('false');
		expect(deps.notify).toHaveBeenCalledWith('Hồ sơ đã hiện lại');
	});

	it('Given_SaveRejects_When_SwitchOn_Then_RevertsAndErrorToast', async () => {
		const deps = mountWith({ save: vi.fn(async () => Promise.reject(new Error('rls'))) });
		toggle().click();
		await settle();
		expect(toggle().getAttribute('aria-checked')).toBe('false');
		expect(deps.notify).toHaveBeenCalledExactlyOnceWith('Chưa lưu được. Bạn thử lại nhé.');
	});

	it('Given_Pending_When_ClickAgain_Then_OneSave', async () => {
		let finish = () => {};
		const deps = mountWith({
			save: vi.fn(() => new Promise<void>((r) => (finish = r)))
		});
		toggle().click();
		flushSync();
		toggle().click();
		flushSync();
		finish();
		await settle();
		expect(deps.save).toHaveBeenCalledOnce();
		expect(toggle().getAttribute('aria-checked')).toBe('true');
	});
});
