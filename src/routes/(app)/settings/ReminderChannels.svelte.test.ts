import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReminderChannels, { type Deps } from './ReminderChannels.svelte';

const TOKEN = '0123456789abcdef0123456789abcdef';
const BLOCKED =
	'Trình duyệt đang chặn thông báo. Nhắc qua Email hoặc Telegram, hoặc bật lại trong cài đặt trình duyệt.';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWith = (over: Partial<Deps> = {}) => {
	const deps = {
		bot: 'ChaiyoBot',
		permission: 'default',
		pushOn: false,
		linked: false,
		enablePush: vi.fn<Deps['enablePush']>(async () => 'on'),
		disablePush: vi.fn(async () => {}),
		issueToken: vi.fn(async () => TOKEN),
		isLinked: vi.fn<Deps['isLinked']>(async () => true),
		testTelegram: vi.fn<Deps['testTelegram']>(async () => ({ error: null })),
		unlink: vi.fn(async () => {}),
		email: 'linh@example.com',
		emailOn: true,
		saveEmail: vi.fn<Deps['saveEmail']>(async () => {}),
		notify: vi.fn<Deps['notify']>(),
		...over
	} satisfies Deps;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(ReminderChannels, { target, props: { deps } }) as Record<string, unknown>;
	flushSync();
	return deps;
};

const text = () => document.body.textContent ?? '';
const button = (label: string) =>
	[...document.querySelectorAll<HTMLButtonElement>('button')].find(
		(b) => b.textContent?.trim() === label
	);
const press = async (label: string) => {
	button(label)!.click();
	await settle();
};
const toggle = () => document.querySelector<HTMLButtonElement>('[role="switch"]')!;
const sw = (label: string) =>
	document.querySelector<HTMLButtonElement>(`[role="switch"][aria-label="${label}"]`)!;
const tap = async (label: string) => {
	sw(label).click();
	await settle();
};
const dialog = () => document.querySelector('[role="dialog"]');
const HINT = 'Không chọn kênh nào: sẽ không có lời nhắc.';

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('ReminderChannels telegram row', () => {
	it('Given_Unlinked_When_Mount_Then_OpenBotText', () => {
		mountWith();
		expect(text()).toContain('Mở @ChaiyoBot để kết nối');
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('false');
	});

	it('Given_Unlinked_When_TapTelegram_Then_SheetStepsLinkSwitchOff', async () => {
		const deps = mountWith();
		await tap('Telegram');
		expect(deps.issueToken).toHaveBeenCalledTimes(1);
		expect(dialog()).not.toBeNull();
		expect(dialog()!.textContent).toContain('Kết nối Telegram');
		expect(dialog()!.querySelectorAll('ol > li')).toHaveLength(3);
		const link = [...document.querySelectorAll<HTMLAnchorElement>('a')].find(
			(a) => a.textContent?.trim() === 'Mở Telegram'
		)!;
		expect(link.getAttribute('href')).toBe(`https://t.me/ChaiyoBot?start=${TOKEN}`);
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener');
		expect(button('Tôi đã bấm Start')).toBeDefined();
		expect(button('Để sau')).toBeDefined();
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('false');
	});

	it('Given_LinkedNow_When_Done_Then_SwitchOnLinkedTextToast', async () => {
		const deps = mountWith();
		await tap('Telegram');
		await press('Tôi đã bấm Start');
		expect(dialog()).toBeNull();
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('true');
		expect(text()).toContain('Đã kết nối @ChaiyoBot');
		expect(deps.notify).toHaveBeenCalledWith('Telegram đã kết nối');
	});

	it('Given_NotYetLinked_When_DoneTapped_Then_NotYetAndSheetOpen', async () => {
		const deps = mountWith({ isLinked: vi.fn(async () => false) });
		await tap('Telegram');
		await press('Tôi đã bấm Start');
		expect(deps.isLinked).toHaveBeenCalledTimes(1);
		expect(text()).toContain('Chưa thấy kết nối. Bấm Start trong Telegram rồi thử lại.');
		expect(dialog()).not.toBeNull();
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('false');
		expect(deps.notify).not.toHaveBeenCalled();
	});

	it('Given_Linked_When_DoneTapped_Then_ConnectedText', async () => {
		mountWith({ isLinked: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) });
		await tap('Telegram');
		await press('Tôi đã bấm Start');
		expect(text()).toContain('Chưa thấy kết nối');
		await press('Tôi đã bấm Start');
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(text()).toContain('Đã kết nối @ChaiyoBot');
		expect(text()).not.toContain('Chưa thấy kết nối');
	});

	it('Given_Later_When_Tapped_Then_ClosedSwitchOffNoWrite', async () => {
		const deps = mountWith();
		await tap('Telegram');
		await press('Để sau');
		expect(dialog()).toBeNull();
		expect(text()).toContain('Mở @ChaiyoBot để kết nối');
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('false');
		expect(deps.isLinked).not.toHaveBeenCalled();
		expect(deps.unlink).not.toHaveBeenCalled();
		expect(deps.notify).not.toHaveBeenCalled();
	});

	it('Given_Linked_When_TestOk_Then_SentText', async () => {
		const deps = mountWith({ linked: true });
		await press('Gửi thử');
		expect(deps.testTelegram).toHaveBeenCalledTimes(1);
		expect(text()).toContain('Đã gửi lời nhắc thử.');
	});

	it('Given_Linked_When_TestError_Then_ErrorText', async () => {
		mountWith({
			linked: true,
			testTelegram: vi.fn(async () => ({ error: { message: 'telegram: not linked' } }))
		});
		await press('Gửi thử');
		expect(text()).toContain('Lỗi: telegram: not linked');
	});

	it('Given_Linked_When_TestThrows_Then_ErrorText', async () => {
		mountWith({
			linked: true,
			testTelegram: vi.fn(async () => {
				throw new Error('offline');
			})
		});
		await press('Gửi thử');
		expect(text()).toContain('Lỗi: offline');
	});

	it('Given_Linked_When_TapTelegram_Then_UnlinkToast', async () => {
		const deps = mountWith({ linked: true });
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('true');
		expect(text()).toContain('Đã kết nối @ChaiyoBot');
		await tap('Telegram');
		expect(deps.unlink).toHaveBeenCalledTimes(1);
		expect(sw('Telegram').getAttribute('aria-checked')).toBe('false');
		expect(text()).toContain('Mở @ChaiyoBot để kết nối');
		expect(deps.notify).toHaveBeenCalledWith('Đã ngắt Telegram');
	});

	it('Given_NoBot_When_Mount_Then_NoTelegramRow', () => {
		mountWith({ bot: undefined });
		expect(text()).not.toContain('Telegram');
		expect(toggle()).not.toBeNull();
	});
});

describe('ReminderChannels push row', () => {
	it('Given_Denied_When_Mount_Then_SwitchEnabledWarnCopy', () => {
		mountWith({ permission: 'denied' });
		expect(sw('Thông báo').disabled).toBe(false);
		expect(sw('Thông báo').getAttribute('aria-checked')).toBe('false');
		const warn = [...document.querySelectorAll('small')].find((s) => s.textContent === BLOCKED)!;
		expect(warn.classList.contains('text-lantern-red-text')).toBe(true);
	});

	it('Given_Unsupported_When_Mount_Then_BlockedCopy', () => {
		mountWith({ permission: 'unsupported' });
		expect(text()).toContain(BLOCKED);
		expect(toggle().disabled).toBe(false);
	});

	it('Given_Default_When_Mount_Then_HereCopy', () => {
		mountWith({ permission: 'default' });
		expect(text()).toContain('Trên máy này');
		expect(text()).not.toContain(BLOCKED);
		expect(toggle().disabled).toBe(false);
	});

	it('Given_DefaultEnableDenied_When_Tap_Then_UncheckedWarnCopy', async () => {
		const deps = mountWith({ enablePush: vi.fn(async () => 'denied' as const) });
		await tap('Thông báo');
		expect(deps.enablePush).toHaveBeenCalledTimes(1);
		expect(sw('Thông báo').getAttribute('aria-checked')).toBe('false');
		const warn = [...document.querySelectorAll('small')].find((s) => s.textContent === BLOCKED)!;
		expect(warn.classList.contains('text-lantern-red-text')).toBe(true);
	});

	it('Given_EnableOn_When_SwitchOn_Then_Checked', async () => {
		mountWith();
		toggle().click();
		await settle();
		expect(toggle().getAttribute('aria-checked')).toBe('true');
		expect(text()).toContain('Trên máy này');
	});

	it('Given_PushOn_When_SwitchOff_Then_DisablePushAndUnchecked', async () => {
		const deps = mountWith({ pushOn: true });
		expect(toggle().getAttribute('aria-checked')).toBe('true');
		toggle().click();
		await settle();
		expect(deps.disablePush).toHaveBeenCalledTimes(1);
		expect(toggle().getAttribute('aria-checked')).toBe('false');
	});

	it('Given_EnableThrows_When_SwitchOn_Then_ErrorText', async () => {
		mountWith({
			enablePush: vi.fn(async () => {
				throw new Error('no service worker');
			})
		});
		toggle().click();
		await settle();
		expect(text()).toContain('Lỗi: no service worker');
	});
});

describe('ReminderChannels card', () => {
	it('Given_Mount_Then_PushEmailTelegramSwitchesInOrder', () => {
		mountWith();
		const labels = [...document.querySelectorAll('[role="switch"]')].map((s) =>
			s.getAttribute('aria-label')
		);
		expect(labels).toEqual(['Thông báo', 'Email', 'Telegram']);
		expect(text()).toContain('Nhắc qua');
		expect(text()).toContain('linh@example.com');
		expect(sw('Email').getAttribute('aria-checked')).toBe('true');
	});
});

describe('ReminderChannels email row', () => {
	it('Given_EmailOn_When_Tap_Then_SaveFalseUnchecked', async () => {
		const deps = mountWith();
		await tap('Email');
		expect(deps.saveEmail).toHaveBeenCalledTimes(1);
		expect(deps.saveEmail).toHaveBeenCalledWith(false);
		expect(sw('Email').getAttribute('aria-checked')).toBe('false');
		expect(deps.notify).not.toHaveBeenCalled();
	});

	it('Given_SaveRejects_When_TapEmail_Then_CheckedAgainErrorToast', async () => {
		const deps = mountWith({ saveEmail: vi.fn(async () => Promise.reject(new Error('rls'))) });
		await tap('Email');
		expect(sw('Email').getAttribute('aria-checked')).toBe('true');
		expect(deps.notify).toHaveBeenCalledWith('Chưa lưu được. Bạn thử lại nhé.');
	});

	it('Given_TwoTaps_When_FirstPending_Then_SavesInOrder', async () => {
		const saved: boolean[] = [];
		let release = () => {};
		const deps = mountWith({
			saveEmail: vi.fn(async (on: boolean) => {
				if (saved.length === 0) await new Promise<void>((r) => (release = r));
				saved.push(on);
			})
		});
		sw('Email').click();
		flushSync();
		sw('Email').click();
		flushSync();
		expect(sw('Email').getAttribute('aria-checked')).toBe('true');
		await settle();
		expect(deps.saveEmail).toHaveBeenCalledTimes(1);
		release();
		await settle();
		await settle();
		expect(deps.saveEmail.mock.calls).toEqual([[false], [true]]);
		expect(saved).toEqual([false, true]);
		expect(sw('Email').getAttribute('aria-checked')).toBe('true');
	});

	it('Given_AllOff_Then_NoChannelHint', async () => {
		mountWith();
		expect(text()).not.toContain(HINT);
		await tap('Email');
		expect(text()).toContain(HINT);
	});

	it('Given_HintShown_When_EmailOn_Then_HintGone', async () => {
		mountWith({ emailOn: false });
		expect(text()).toContain(HINT);
		await tap('Email');
		expect(text()).not.toContain(HINT);
	});
});
