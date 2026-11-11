import { describe, expect, it } from 'vitest';
import { callbackOutcome, daysLeft, landing, okEmail, resendLabel } from './login';

describe('okEmail', () => {
	it.each([
		['tong.loc@', false],
		['tong.loc@gmail', false],
		['tong.loc@gmail.com', true]
	])('%s -> %s', (v, ok) => expect(okEmail(v)).toBe(ok));
});

describe('resendLabel', () => {
	it.each([
		[0, 'Gửi lại sau 60s', true],
		[999, 'Gửi lại sau 60s', true],
		[1000, 'Gửi lại sau 59s', true],
		[59_000, 'Gửi lại sau 1s', true],
		[60_000, 'Gửi lại link', false],
		[61_000, 'Gửi lại link', false]
	])('t=%i -> %s', (t, text, disabled) => expect(resendLabel(0, t)).toEqual({ text, disabled }));
});

describe('callbackOutcome', () => {
	const base = 'http://127.0.0.1:5173/auth/callback';
	it.each([
		[`${base}#access_token=a&refresh_token=b&type=magiclink`, 'ok'],
		[
			`${base}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`,
			'expired'
		],
		[`${base}?error=access_denied&error_code=otp_expired`, 'expired'],
		[`${base}#error=access_denied&error_code=bad_oauth_state`, 'error'],
		[`${base}?error=access_denied&error_code=bad_oauth_state`, 'error'],
		[base, 'ok']
	])('%s -> %s', (href, out) => expect(callbackOutcome(href)).toBe(out));
});

describe('daysLeft', () => {
	const now = Date.parse('2026-11-11T03:00:00Z');
	it.each([
		['2026-11-16T02:00:00Z', 5],
		['2026-11-16T03:00:00Z', 5],
		['2026-11-16T03:00:00.001Z', 6],
		['2026-11-11T03:00:00.001Z', 1]
	])('%s -> %i', (at, days) => expect(daysLeft(at, now)).toBe(days));
});

describe('landing', () => {
	const now = Date.parse('2026-11-11T03:00:00Z');
	const done = '2026-11-01T00:00:00Z';
	it('offers restore while deletion is pending', () => {
		expect(landing({ onboarded_at: done, delete_at: '2026-11-16T02:00:00Z' }, now)).toBe('restore');
	});
	it('sends an onboarded learner to Today, a past or empty delete_at included', () => {
		expect(landing({ onboarded_at: done, delete_at: null }, now)).toBe('/(app)/(tabs)/today');
		expect(landing({ onboarded_at: done, delete_at: '2026-11-11T02:00:00Z' }, now)).toBe(
			'/(app)/(tabs)/today'
		);
	});
	it('sends a new learner to Welcome', () => {
		expect(landing({ onboarded_at: null, delete_at: null }, now)).toBe('/(onboard)/welcome');
		expect(landing(null, now)).toBe('/(onboard)/welcome');
	});
});
