import { describe, expect, it } from 'vitest';
import { callbackOutcome, landing, okEmail, resendLabel } from './login';

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
			'error'
		],
		[`${base}?error=access_denied&error_code=bad_oauth_state`, 'error'],
		[base, 'ok']
	])('%s -> %s', (href, out) => expect(callbackOutcome(href)).toBe(out));
});

describe('landing', () => {
	it('sends a new learner to Welcome and an onboarded one to Today', () => {
		expect(landing(null)).toBe('/(onboard)/welcome');
		expect(landing({ onboarded_at: null })).toBe('/(onboard)/welcome');
		expect(landing({ onboarded_at: '2026-11-10T02:00:00Z' })).toBe('/(app)/(tabs)/today');
	});
});
