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
		expect(button('Kết nối Telegram')).toBeDefined();
	});

	it('Given_Connect_When_Tap_Then_SheetLinkHasToken', async () => {
		const deps = mountWith();
		await press('Kết nối Telegram');
		expect(deps.issueToken).toHaveBeenCalledTimes(1);
		const link = [...document.querySelectorAll<HTMLAnchorElement>('a')].find(
			(a) => a.textContent?.trim() === 'Mở Telegram'
		)!;
		expect(link.getAttribute('href')).toBe(`https://t.me/ChaiyoBot?start=${TOKEN}`);
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener');
		expect(document.querySelector('[role="dialog"]')).not.toBeNull();
		expect(button('Tôi đã bấm Start')).toBeDefined();
		expect(button('Để sau')).toBeDefined();
	});

	it('Given_NotYetLinked_When_DoneTapped_Then_NotYetAndSheetOpen', async () => {
		const deps = mountWith({ isLinked: vi.fn(async () => false) });
		await press('Kết nối Telegram');
		await press('Tôi đã bấm Start');
		expect(deps.isLinked).toHaveBeenCalledTimes(1);
		expect(text()).toContain('Chưa thấy kết nối. Bấm Start trong Telegram rồi thử lại.');
		expect(document.querySelector('[role="dialog"]')).not.toBeNull();
	});

	it('Given_Linked_When_DoneTapped_Then_ConnectedText', async () => {
		mountWith({ isLinked: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) });
		await press('Kết nối Telegram');
		await press('Tôi đã bấm Start');
		expect(text()).toContain('Chưa thấy kết nối');
		await press('Tôi đã bấm Start');
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(text()).toContain('Đã kết nối @ChaiyoBot');
		expect(text()).not.toContain('Chưa thấy kết nối');
	});

	it('Given_Later_When_Tapped_Then_SheetClosesStillUnlinked', async () => {
		mountWith();
		await press('Kết nối Telegram');
		await press('Để sau');
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		expect(text()).toContain('Mở @ChaiyoBot để kết nối');
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

	it('Given_Linked_When_Unlink_Then_UnlinkedText', async () => {
		const deps = mountWith({ linked: true });
		expect(text()).toContain('Đã kết nối @ChaiyoBot');
		await press('Ngắt kết nối');
		expect(deps.unlink).toHaveBeenCalledTimes(1);
		expect(text()).toContain('Mở @ChaiyoBot để kết nối');
		expect(button('Kết nối Telegram')).toBeDefined();
	});

	it('Given_NoBot_When_Mount_Then_NoTelegramRow', () => {
		mountWith({ bot: undefined });
		expect(text()).not.toContain('Telegram');
		expect(toggle()).not.toBeNull();
	});
});

describe('ReminderChannels push row', () => {
	it('Given_Denied_When_Mount_Then_BlockedCopyAndSwitchDisabled', () => {
		mountWith({ permission: 'denied' });
		expect(text()).toContain(BLOCKED);
		expect(toggle().disabled).toBe(true);
	});

	it('Given_Unsupported_When_Mount_Then_BlockedCopy', () => {
		mountWith({ permission: 'unsupported' });
		expect(text()).toContain(BLOCKED);
		expect(toggle().disabled).toBe(true);
	});

	it('Given_Default_When_Mount_Then_HereCopy', () => {
		mountWith({ permission: 'default' });
		expect(text()).toContain('Trên máy này');
		expect(text()).not.toContain(BLOCKED);
		expect(toggle().disabled).toBe(false);
	});

	it('Given_EnableDenied_When_SwitchOn_Then_BlockedCopy', async () => {
		const deps = mountWith({ enablePush: vi.fn(async () => 'denied' as const) });
		toggle().click();
		await settle();
		expect(deps.enablePush).toHaveBeenCalledTimes(1);
		expect(text()).toContain(BLOCKED);
		expect(toggle().disabled).toBe(true);
		expect(toggle().getAttribute('aria-checked')).toBe('false');
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
