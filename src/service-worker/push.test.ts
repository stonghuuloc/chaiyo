import { describe, expect, it } from 'vitest';
import { clickTarget, notificationFrom } from './push';

describe('notificationFrom', () => {
	it('Given_ValidJson_When_NotificationFrom_Then_UsesPayload', () => {
		const { title, options } = notificationFrom('{"title":"T","body":"B","url":"/x"}');
		expect(title).toBe('T');
		expect(options).toEqual({ body: 'B', icon: '/brand/icon-192.png', data: { url: '/x' } });
	});

	it('Given_Null_When_NotificationFrom_Then_Default', () => {
		const { title, options } = notificationFrom(null);
		expect(title).toBe('Chaiyo!');
		expect(options.data).toEqual({ url: '/today' });
		expect(options.body).toBe('Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!');
	});

	it('Given_BadJson_When_NotificationFrom_Then_Default', () => {
		const { title, options } = notificationFrom('not json');
		expect(title).toBe('Chaiyo!');
		expect(options.data).toEqual({ url: '/today' });
	});
});

describe('clickTarget', () => {
	it('Given_OneClient_When_ClickTarget_Then_ThatClient', () => {
		const client = { url: '/a' } as WindowClient;
		expect(clickTarget([client])).toBe(client);
	});

	it('Given_NoClient_When_ClickTarget_Then_Null', () => {
		expect(clickTarget([])).toBeNull();
	});
});
