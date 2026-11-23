import { describe, expect, it } from 'vitest';
import { pushBlocked, pushPermission, type PushPermission } from './push-state';

describe('pushBlocked', () => {
	it.each([
		['denied', true],
		['unsupported', true],
		['default', false],
		['granted', false]
	] as [PushPermission, boolean][])('%s -> %s', (permission, blocked) => {
		expect(pushBlocked(permission)).toBe(blocked);
	});
});

describe('pushPermission', () => {
	it('Given_NoNotification_When_PushPermission_Then_Unsupported', () => {
		expect(pushPermission({ PushManager: class {} })).toBe('unsupported');
	});

	it('Given_NoPushManager_When_PushPermission_Then_Unsupported', () => {
		expect(pushPermission({ Notification: { permission: 'granted' } })).toBe('unsupported');
	});

	it('Given_Denied_When_PushPermission_Then_Denied', () => {
		expect(pushPermission({ Notification: { permission: 'denied' }, PushManager: class {} })).toBe(
			'denied'
		);
	});
});
