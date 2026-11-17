import { m } from '#lib/paraglide/messages.js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BARS } from '../../speak/hold';
import type { Answer, Cta } from '../types';
import Speak, { type Step } from './Speak.svelte';

const step: Step = {
	kind: 'speak',
	id: 'q-h1-01-s01',
	ask: 'Nói · đọc to',
	title: 'Đọc to câu này',
	hanzi: '不客气。',
	pinyin: 'bú kèqi',
	meaning: 'Không có gì.'
};

class FakeContext {
	close = vi.fn(async () => {});
	constructor() {
		contexts.push(this);
	}
	analyser = {
		fftSize: 1024,
		getByteTimeDomainData: (buf: Uint8Array) => {
			buf.fill(255);
		}
	};
	createAnalyser() {
		return this.analyser;
	}
	createMediaStreamSource() {
		return { connect: () => {} };
	}
}

let tracks: { stop: Mock }[] = [];
let contexts: FakeContext[] = [];

const fakeStream = () => {
	const track = { stop: vi.fn() };
	tracks.push(track);
	return { getTracks: () => [track] };
};

const setMic = (value: unknown) =>
	Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value });

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
let cta: Cta | undefined;
let calls: (Answer | undefined)[] = [];

const mountSpeak = (s: Step = step) => {
	if (app) unmount(app as never);
	target?.remove();
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Speak, {
		target,
		props: {
			step: s,
			mode: 'feedback',
			last: false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
};

const settle = async () => {
	await vi.advanceTimersByTimeAsync(0);
	flushSync();
};

const press = async () => {
	cta!.hold!.onpress();
	await settle();
};

const release = () => {
	cta!.hold!.onrelease();
	flushSync();
};

const text = () => target!.textContent ?? '';

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
	vi.stubGlobal('AudioContext', FakeContext as unknown as typeof globalThis.AudioContext);
	vi.stubGlobal('MediaRecorder', vi.fn());
	tracks = [];
	contexts = [];
	cta = undefined;
	calls = [];
	setMic({ getUserMedia: vi.fn(async () => fakeStream()) });
	mountSpeak();
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('Speak', () => {
	it('Given_Idle_When_Mounted_Then_HoldCtaAndIdleCopy', () => {
		// Assert
		expect(cta!.label).toBe(m.lesson_speak_hold());
		expect(typeof cta!.hold?.onpress).toBe('function');
		expect(text()).toContain(m.lesson_speak_idle());
	});

	it('Given_MicOn_When_Held3s_Then_28BarsTimer0_03AndReleaseLabel', async () => {
		// Act
		await press();
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();

		// Assert
		expect(target!.querySelectorAll('[data-bar]')).toHaveLength(BARS);
		expect(target!.querySelector('[data-timer]')!.textContent).toBe('0:03');
		expect(cta!.label).toBe(m.lesson_speak_release());
		expect(text()).toContain(m.lesson_speak_listening());
		expect(
			[...target!.querySelectorAll<HTMLElement>('[data-bar]')].map((b) => b.style.height)
		).toContain('61px');
	});

	it('Given_Held3s_When_Release_Then_ContinueAndNextWithNoArg', async () => {
		// Arrange
		await press();
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();

		// Act
		release();
		cta!.onclick();

		// Assert
		expect(cta!.label).toBe(m.lesson_continue());
		expect(cta!.caret).toBe(true);
		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeUndefined();
	});

	it('Given_Held500ms_When_Release_Then_TooShortAndHoldAgain', async () => {
		// Arrange
		await press();
		await vi.advanceTimersByTimeAsync(500);
		flushSync();

		// Act
		release();

		// Assert
		expect(text()).toContain(m.lesson_speak_short());
		expect(cta!.label).toBe(m.lesson_speak_hold());
		expect(calls).toHaveLength(0);
	});

	it('Given_ReleaseBeforeMicOn_When_Resolved_Then_TooShortAndTracksStopped', async () => {
		// Arrange
		const { promise, resolve } = Promise.withResolvers<unknown>();
		const stream = fakeStream();
		setMic({ getUserMedia: vi.fn(() => promise) });
		cta!.hold!.onpress();
		flushSync();
		expect(text()).toContain(m.lesson_speak_opening());

		// Act
		release();
		resolve(stream);
		await settle();

		// Assert
		expect(text()).toContain(m.lesson_speak_short());
		expect(tracks[0].stop).toHaveBeenCalledTimes(1);
	});

	it('Given_FullHold_When_Done_Then_NoFetchBeaconRecorderStorageIdb', async () => {
		// Arrange
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const beacon = vi.fn();
		Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
		const recorder = vi.mocked(globalThis.MediaRecorder);
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		const open = globalThis.indexedDB ? vi.spyOn(globalThis.indexedDB, 'open') : null;

		// Act
		await press();
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();
		release();

		// Assert
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(beacon).not.toHaveBeenCalled();
		expect(recorder).not.toHaveBeenCalled();
		expect(setItem).not.toHaveBeenCalled();
		expect(open?.mock.calls ?? []).toHaveLength(0);
	});

	it('Given_Release_When_Done_Then_EveryTrackStoppedAndContextClosed', async () => {
		// Arrange
		await press();
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();

		// Act
		release();

		// Assert
		expect(tracks[0].stop).toHaveBeenCalledTimes(1);
		expect(contexts[0].close).toHaveBeenCalledTimes(1);
	});

	it('Given_LiveHold_When_Unmount_Then_TracksStoppedAndContextClosed', async () => {
		// Arrange
		await press();
		await vi.advanceTimersByTimeAsync(1_000);
		flushSync();

		// Act
		unmount(app as never);
		app = undefined;

		// Assert
		expect(tracks[0].stop).toHaveBeenCalledTimes(1);
		expect(contexts[0].close).toHaveBeenCalledTimes(1);
	});

	it('Given_Opening_When_UnmountThenResolve_Then_TracksStopped', async () => {
		// Arrange
		const { promise, resolve } = Promise.withResolvers<unknown>();
		const stream = fakeStream();
		setMic({ getUserMedia: vi.fn(() => promise) });
		cta!.hold!.onpress();
		flushSync();

		// Act
		unmount(app as never);
		app = undefined;
		resolve(stream);
		await settle();

		// Assert
		expect(tracks[0].stop).toHaveBeenCalledTimes(1);
	});

	it('Given_AudioContextThrows_When_Press_Then_TracksStoppedAndBlocked', async () => {
		// Arrange
		vi.stubGlobal(
			'AudioContext',
			class {
				constructor() {
					throw new Error('no audio');
				}
			}
		);

		// Act
		await press();

		// Assert
		expect(tracks[0].stop).toHaveBeenCalledTimes(1);
		expect(text()).toContain(m.lesson_speak_blocked());
		expect(cta!.label).toBe(m.lesson_speak_skip());
	});

	it('Given_NoPress_When_Release_Then_IdleCopyUnchanged', () => {
		// Act
		cta!.hold!.onrelease();
		flushSync();

		// Assert
		expect(text()).toContain(m.lesson_speak_idle());
		expect(text()).not.toContain(m.lesson_speak_short());
		expect(cta!.label).toBe(m.lesson_speak_hold());
	});

	it('Given_NotAllowedError_When_Press_Then_BlockedCopyAndSkip', async () => {
		// Arrange
		setMic({
			getUserMedia: vi.fn(async () => {
				throw new DOMException('denied', 'NotAllowedError');
			})
		});

		// Act
		await press();

		// Assert
		expect(text()).toContain(m.lesson_speak_blocked());
		expect(cta!.label).toBe(m.lesson_speak_skip());
	});

	it('Given_NoMediaDevices_When_Press_Then_BlockedCopyAndSkip', async () => {
		// Arrange
		setMic(undefined);

		// Act
		await press();

		// Assert
		expect(text()).toContain(m.lesson_speak_blocked());
		expect(cta!.label).toBe(m.lesson_speak_skip());
	});

	it('Given_Blocked_When_Skip_Then_NextWithNoArg', async () => {
		// Arrange
		setMic(undefined);
		await press();

		// Act
		cta!.onclick();

		// Assert
		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeUndefined();
	});

	it('Given_StepWithoutHanzi_When_Mounted_Then_NoSentenceCard', () => {
		// Act
		mountSpeak({
			kind: 'speak',
			id: 'q-h1-01-s02',
			ask: 'Nói · trả lời',
			title: 'Bạn khoẻ không?'
		});

		// Assert
		expect(target!.querySelector('.font-hanzi')).toBeNull();
		expect(text()).not.toContain(step.pinyin!);
	});

	it('Given_HanziOnly_When_Mounted_Then_NoPinyinNoMeaning', () => {
		// Act
		mountSpeak({ ...step, pinyin: undefined, meaning: undefined });

		// Assert
		expect(target!.querySelector('.font-hanzi')!.textContent).toBe(step.hanzi);
		expect(text()).not.toContain(step.pinyin!);
		expect(text()).not.toContain(step.meaning!);
	});

	it('Given_Live_When_PressAgain_Then_MicOpenedOnce', async () => {
		// Arrange
		const getUserMedia = vi.fn(async () => fakeStream());
		setMic({ getUserMedia });
		const hold = cta!.hold!;
		await press();

		// Act
		hold.onpress();
		await settle();

		// Assert
		expect(getUserMedia).toHaveBeenCalledTimes(1);
		expect(cta!.label).toBe(m.lesson_speak_release());
	});
});
