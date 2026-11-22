import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ClipCast from './ClipCast.svelte';

const hoisted = vi.hoisted(() => ({ rates: [] as number[] }));

vi.mock('$app/env/public', () => ({ PUBLIC_AUDIO_BASE_URL: '' }));
vi.mock('#lib/audio/index.js', async () => {
	const { createPlayer } = await import('#lib/audio/player.js');
	const audio = {
		paused: true,
		ended: false,
		currentTime: 0,
		src: '',
		addEventListener() {},
		removeEventListener() {},
		playbackRate: 1,
		play(this: { playbackRate: number }) {
			hoisted.rates.push(this.playbackRate);
			return Promise.resolve();
		}
	} as unknown as HTMLAudioElement & { playbackRate: number };
	return { player: createPlayer({ base: '/a', createAudio: () => audio }) };
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	hoisted.rates.length = 0;
});

describe('ClipCast', () => {
	it('Given_Autoplay_When_TapTwice_Then_FirstTapNormalSecondSlow', async () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(ClipCast, { target, props: { clip: 'word/ni', label: 'Nghe' } }) as Record<
			string,
			unknown
		>;
		await vi.waitFor(() => expect(hoisted.rates).toHaveLength(1), { timeout: 10_000 });
		flushSync();
		const tap = () =>
			target!.querySelector<HTMLButtonElement>('button[aria-label="Nghe"]')!.click();

		// Act
		tap();
		tap();

		// Assert
		expect(hoisted.rates).toEqual([1, 1, 0.5]);
	});
});
