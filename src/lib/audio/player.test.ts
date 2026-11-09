import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from './player';

type Seen = { rate: number; pitch: boolean; src: string };

class FakeAudio {
	src = '';
	playbackRate = 1;
	defaultPlaybackRate = 1;
	preservesPitch = false;
	currentTime = 5;
	seen: Seen[] = [];
	play = vi.fn(() => {
		this.seen.push({ rate: this.playbackRate, pitch: this.preservesPitch, src: this.src });
		return Promise.resolve();
	});
}

function setup(base?: string) {
	const el = new FakeAudio();
	const createAudio = vi.fn(() => el as unknown as HTMLAudioElement);
	const { play } = createPlayer({ base, createAudio });
	return { el, createAudio, play };
}

const rates = (el: FakeAudio) => el.seen.map((s) => s.rate);

describe('play toggle', () => {
	it('alternates 1x and 0.5x on the same key, pitch kept', async () => {
		const { el, play } = setup('/clips');
		for (let i = 0; i < 4; i++) expect(await play('11')).toBe(true);
		expect(rates(el)).toEqual([1, 0.5, 1, 0.5]);
		expect(el.seen.every((s) => s.pitch && s.src === '/clips/11.mp3')).toBe(true);
	});

	it('keeps the rate through a src load by setting defaultPlaybackRate', async () => {
		const { el, play } = setup();
		await play('11');
		await play('11');
		expect(el.defaultPlaybackRate).toBe(0.5);
	});

	it('forces the rate with slow and flips on the next bare tap', async () => {
		const { el, play } = setup();
		await play('a', { slow: true });
		await play('a');
		await play('b');
		await play('b', { slow: false });
		await play('b');
		expect(rates(el)).toEqual([0.5, 1, 1, 1, 0.5]);
	});

	it('starts a different clip at 1x and forgets the old count', async () => {
		const { el, play } = setup();
		for (const key of ['11', '11', '12', '11']) await play(key);
		expect(rates(el)).toEqual([1, 0.5, 1, 1]);
	});

	it('restarts a still-pending clip on one shared element', async () => {
		const { el, createAudio, play } = setup();
		const first = play('11');
		el.currentTime = 3;
		const second = play('11');
		expect(el.currentTime).toBe(0);
		expect(el.play).toHaveBeenCalledTimes(2);
		expect(createAudio).toHaveBeenCalledTimes(1);
		await Promise.all([first, second]);
	});
});

describe('one player across prefixes', () => {
	it('tone then chip: one element, the later clip replaces the earlier at 1x', async () => {
		const { el, createAudio, play } = setup('/az2');
		await play('cell', { base: '/az3' });
		await play('cell', { base: '/az3' });
		await play('chip');
		await play('cell', { base: '/az3' });
		expect(createAudio).toHaveBeenCalledTimes(1);
		expect(el.seen.map((s) => [s.src, s.rate])).toEqual([
			['/az3/cell.mp3', 1],
			['/az3/cell.mp3', 0.5],
			['/az2/chip.mp3', 1],
			['/az3/cell.mp3', 1]
		]);
	});

	it('chip then tone: repeat count restarts and flips per clip', async () => {
		const { el, createAudio, play } = setup('/az2');
		await play('chip');
		await play('cell', { base: '/az3' });
		await play('cell', { base: '/az3' });
		await play('chip');
		await play('chip');
		expect(createAudio).toHaveBeenCalledTimes(1);
		expect(el.seen.map((s) => [s.src, s.rate])).toEqual([
			['/az2/chip.mp3', 1],
			['/az3/cell.mp3', 1],
			['/az3/cell.mp3', 0.5],
			['/az2/chip.mp3', 1],
			['/az2/chip.mp3', 0.5]
		]);
	});
});

describe('quiet failure', () => {
	it('resolves false without an unhandled rejection and retries at 1x', async () => {
		const onUnhandled = vi.fn();
		process.on('unhandledRejection', onUnhandled);
		const { el, play } = setup();
		el.play.mockImplementationOnce(() =>
			Promise.reject(new DOMException('x', 'NotSupportedError'))
		);
		expect(await play('99')).toBe(false);
		expect(await play('99')).toBe(true);
		await new Promise((r) => setTimeout(r, 0));
		process.off('unhandledRejection', onUnhandled);
		expect(onUnhandled).not.toHaveBeenCalled();
		expect(rates(el)).toEqual([1]);
	});

	it('resolves false when play throws synchronously', async () => {
		const { el, play } = setup();
		el.play.mockImplementationOnce(() => {
			throw new Error('boom');
		});
		expect(await play('99')).toBe(false);
	});

	it('ignores a stale abort from an older clip', async () => {
		const { el, play } = setup();
		el.play.mockImplementationOnce(() => Promise.reject(new DOMException('x', 'AbortError')));
		const a = play('A');
		await play('B');
		expect(await a).toBe(false);
		await play('B');
		expect(rates(el)).toEqual([1, 0.5]);
	});
});

describe('iOS gesture', () => {
	it('calls element.play synchronously and builds no Audio at import', async () => {
		const { el, play } = setup();
		const pending = play('11');
		expect(el.play).toHaveBeenCalledTimes(1);
		await pending;
		expect('Audio' in globalThis).toBe(false);
		vi.resetModules();
		await expect(import('./player')).resolves.toHaveProperty('play');
	});
});
