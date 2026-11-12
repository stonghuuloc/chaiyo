import { describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState } from '#lib/study/index.js';
import {
	advance,
	askPush,
	finishWelcome,
	canNext,
	photoPicker,
	fromUser,
	initials,
	noChannel,
	pickCustom,
	pickPreset,
	pressed,
	pushBlocked,
	retreat,
	toggleChannel
} from './welcome';

const base = fromUser(undefined);

describe('fromUser', () => {
	it('takes the Google name and photo', () => {
		const s = fromUser({
			email: 'tong.loc@gmail.com',
			user_metadata: { full_name: 'Tống Lộc', avatar_url: 'https://lh3.googleusercontent.com/a/x' }
		});
		expect(s).toMatchObject({
			step: 0,
			name: 'Tống Lộc',
			photo: 'https://lh3.googleusercontent.com/a/x',
			email: 'tong.loc@gmail.com',
			time: '21:00',
			emailOn: true,
			push: false,
			telegram: false
		});
	});
	it('falls back to name, then picture', () => {
		expect(fromUser({ user_metadata: { name: 'Lộc', picture: 'p' } })).toMatchObject({
			name: 'Lộc',
			photo: 'p'
		});
		expect(fromUser({ user_metadata: { full_name: '', name: 'Lộc' } }).name).toBe('Lộc');
	});
	it('is empty without metadata or a session', () => {
		expect(fromUser({ user_metadata: {} })).toMatchObject({ name: '', photo: null });
		expect(fromUser(undefined)).toMatchObject({ name: '', photo: null, email: '' });
		expect(fromUser(null).email).toBe('');
	});
	it('trims, then keeps 30 characters', () => {
		expect(fromUser({ user_metadata: { full_name: 'a'.repeat(35) } }).name).toBe('a'.repeat(30));
		expect(fromUser({ user_metadata: { full_name: '  ' + 'a'.repeat(32) } }).name).toBe(
			'a'.repeat(30)
		);
	});
});

describe('name', () => {
	it('initials', () => {
		expect(initials('Tống Lộc')).toBe('TL');
		expect(initials('  ')).toBe('?');
		expect(initials('Lộc')).toBe('L');
		expect(initials('a b c')).toBe('BC');
	});
	it('canNext blocks only a blank name on step 0', () => {
		expect(canNext({ step: 0, name: '  ' })).toBe(false);
		expect(canNext({ step: 0, name: 'Lộc' })).toBe(true);
		expect(canNext({ step: 1, name: '' })).toBe(true);
	});
});

describe('time', () => {
	it('starts on 21:00 only', () => expect(pressed(base)).toEqual(['21:00']));
	it('a preset presses itself only', () =>
		expect(pressed(pickPreset(base, '07:00'))).toEqual(['07:00']));
	it('a custom time presses no preset', () => {
		const s = pickCustom(base, '06:15');
		expect(s.time).toBe('06:15');
		expect(pressed(s)).toEqual([]);
	});
	it('a custom value equal to a preset presses it', () =>
		expect(pressed(pickCustom(base, '12:30'))).toEqual(['12:30']));
	it('an empty custom value is ignored', () => expect(pickCustom(base, '').time).toBe('21:00'));
	it('a preset after a custom time wins', () =>
		expect(pickPreset(pickCustom(base, '06:15'), '21:00').time).toBe('21:00'));
});

describe('noChannel', () => {
	const all = [true, false].flatMap((push) =>
		[true, false].flatMap((emailOn) =>
			[true, false].map((telegram) => ({ push, emailOn, telegram }))
		)
	);
	it('covers 8 combinations', () => expect(all).toHaveLength(8));
	it.each(all)('%j', (c) => expect(noChannel(c)).toBe(!c.push && !c.emailOn && !c.telegram));
	it('is true only for all off', () =>
		expect(all.filter(noChannel)).toEqual([{ push: false, emailOn: false, telegram: false }]));
});

describe('Study state for a learner with no placement', () => {
	it('has only the first lesson unlocked', () => {
		const s = initialState({ curriculum: CURRICULUM });
		expect(s.placed).toBe(0);
		expect(s.lessons['h0-00'].unlocked).toBe(true);
		expect(
			Object.entries(s.lessons)
				.filter(([, l]) => l.unlocked)
				.map(([id]) => id)
		).toEqual(['h0-00']);
	});
});

describe('push permission', () => {
	const ask = (answer: () => Promise<string>) =>
		askPush({ Notification: { requestPermission: answer } });
	it('granted turns push on', async () => expect(await ask(async () => 'granted')).toBe(true));
	it('denied and default stay off', async () => {
		expect(await ask(async () => 'denied')).toBe(false);
		expect(await ask(async () => 'default')).toBe(false);
	});
	it('a thrown error stays off', async () =>
		expect(await ask(() => Promise.reject(new Error('x')))).toBe(false));
	it('a synchronous throw and an undefined answer stay off', async () => {
		expect(
			await ask(() => {
				throw new Error('x');
			})
		).toBe(false);
		expect(await ask(async () => undefined as never)).toBe(false);
	});
	it('no Notification API is denied', async () => expect(await askPush({})).toBe(false));
	it('blocked only when the permission is denied', () => {
		expect(pushBlocked({ Notification: { permission: 'denied' } })).toBe(true);
		expect(pushBlocked({ Notification: { permission: 'default' } })).toBe(false);
		expect(pushBlocked({})).toBe(false);
	});
});

describe('photoPicker', () => {
	const file = new File([], 'a.png');
	const later = <T>() => {
		let resolve!: (v: T) => void;
		let reject!: (e: Error) => void;
		const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
		return { promise, resolve, reject };
	};

	it('applies a decoded photo', async () => {
		const done = vi.fn();
		await photoPicker(async () => 'p1').pick(file, done, vi.fn());
		expect(done).toHaveBeenCalledWith('p1');
	});

	it('reports a decode failure', async () => {
		const fail = vi.fn();
		await photoPicker(() => Promise.reject(new Error('heic'))).pick(file, vi.fn(), fail);
		expect(fail).toHaveBeenCalledOnce();
	});

	it('ignores a superseded pick, success or failure', async () => {
		const first = later<string>();
		const second = later<string>();
		const queue = [first.promise, second.promise];
		const picker = photoPicker(() => queue.shift()!);
		const done = vi.fn();
		const fail = vi.fn();
		picker.pick(file, done, fail);
		const last = picker.pick(file, done, fail);
		second.resolve('new');
		first.reject(new Error('old'));
		await last;
		await picker.settled();
		expect(done.mock.calls).toEqual([['new']]);
		expect(fail).not.toHaveBeenCalled();
	});

	it('settled waits for the pending decode', async () => {
		const slow = later<string>();
		const picker = photoPicker(() => slow.promise);
		const done = vi.fn();
		picker.pick(file, done, vi.fn());
		const waited = picker.settled();
		expect(done).not.toHaveBeenCalled();
		slow.resolve('p2');
		await waited;
		expect(done).toHaveBeenCalledWith('p2');
	});
});

describe('steps', () => {
	it('advance stops at the last step and on a blank name', () => {
		expect(advance({ ...base, name: 'Lộc' }).step).toBe(1);
		expect(advance({ ...base, name: ' ' }).step).toBe(0);
		expect(advance({ ...base, name: 'Lộc', step: 2 }).step).toBe(2);
	});
	it('retreat stops at the first step', () => {
		expect(retreat({ ...base, step: 2 }).step).toBe(1);
		expect(retreat(base).step).toBe(0);
	});
});

describe('toggleChannel', () => {
	const on = { push: true, emailOn: true, telegram: false };
	const off = { push: false, emailOn: true, telegram: false };
	const yes = vi.fn(async () => true);
	const no = vi.fn(async () => false);
	it('flips email and telegram without asking', async () => {
		expect(await toggleChannel(off, 'emailOn', yes)).toEqual({ emailOn: false });
		expect(await toggleChannel(off, 'telegram', yes)).toEqual({ telegram: true });
		expect(yes).not.toHaveBeenCalled();
	});
	it('turns push off without asking', async () =>
		expect(await toggleChannel(on, 'push', yes)).toEqual({ push: false }));
	it('asks before turning push on', async () => {
		expect(await toggleChannel(off, 'push', yes)).toEqual({ push: true, pushDenied: false });
		expect(await toggleChannel(off, 'push', no)).toEqual({ push: false, pushDenied: true });
	});
});

describe('finishWelcome', () => {
	const calls: string[] = [];
	const parts = (save: () => Promise<void>) => ({
		settled: async () => void calls.push('settled'),
		save: async () => {
			calls.push('save');
			await save();
		},
		go: async () => void calls.push('go')
	});
	it('waits for the photo, saves, then navigates', async () => {
		calls.length = 0;
		expect(await finishWelcome(parts(async () => {}))).toBe(true);
		expect(calls).toEqual(['settled', 'save', 'go']);
	});
	it('a save error returns false and does not navigate', async () => {
		calls.length = 0;
		expect(await finishWelcome(parts(() => Promise.reject(new Error('x'))))).toBe(false);
		expect(calls).toEqual(['settled', 'save']);
	});
});
