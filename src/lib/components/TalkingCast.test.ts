import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import TalkingCast from './TalkingCast.svelte';
import {
	bob,
	isPlaying,
	envelope,
	frameFor,
	levelAt,
	smoothLevel,
	type TalkingCastPlayer
} from './talking-cast';

const steps = (from: number, target: number, n: number) => {
	const out: number[] = [];
	let level = from;
	for (let i = 0; i < n; i++) out.push((level = smoothLevel(level, target)));
	return out;
};

const fakePlayer = (srcOf: () => string | null) => {
	const play = vi.fn<TalkingCastPlayer['play']>(() => Promise.resolve());
	const player: TalkingCastPlayer = {
		play,
		url: (key) => `https://clips.test/${key}.mp3`,
		element: () => {
			const src = srcOf();
			return src === null ? null : ({ src } as HTMLAudioElement);
		}
	};
	return { player, play };
};

describe('frameFor', () => {
	it.each([
		[0.05, 0],
		[0.3, 1],
		[0.8, 2],
		[0.1799, 0],
		[0.18, 1],
		[0.4999, 1],
		[0.5, 2]
	])('Given_Level_%s_When_FrameFor_Then_Frame_%s', (level, frame) => {
		// Arrange
		// Act
		const f = frameFor(level);
		// Assert
		expect(f).toBe(frame);
	});
});

describe('envelope', () => {
	it('Given_ThreeWindows_When_Envelope_Then_ScaledToLoudestTimes1.3Capped', () => {
		// Arrange
		const samples = [0, 0, 1, 1, 0.5, 0.5];
		// Act
		const env = envelope(samples, 100);
		// Assert
		expect(env).toEqual([0, 1, 0.65]);
	});

	it('Given_LongClip_When_Envelope_Then_NoArgumentLimitError', () => {
		// Arrange
		const samples = new Float32Array(600_000).fill(0.5);
		// Act
		const env = envelope(samples, 100);
		// Assert
		expect(env).toHaveLength(300_000);
		expect(env[0]).toBe(1);
	});

	it('Given_Silence_When_Envelope_Then_AllZero', () => {
		// Arrange
		// Act
		const env = envelope([0, 0, 0, 0], 100);
		// Assert
		expect(env).toEqual([0, 0]);
	});

	it('Given_PastEnd_When_LevelAt_Then_Zero', () => {
		// Arrange
		const env = [0.2, 0.9];
		// Act
		// Assert
		expect(levelAt(env, 0.021)).toBe(0.9);
		expect(levelAt(env, 5)).toBe(0);
	});
});

describe('smoothLevel', () => {
	it('Given_Steady0.30_When_Smoothed_Then_HalfAtStep2', () => {
		// Arrange
		// Act
		const [, second] = steps(0, 0.3, 2);
		// Assert
		expect(frameFor(second)).toBe(1);
	});

	it('Given_Steady0.80_When_Smoothed_Then_HalfThenOpen', () => {
		// Arrange
		// Act
		const [first, second] = steps(0, 0.8, 2);
		// Assert
		expect(frameFor(first)).toBe(1);
		expect(frameFor(second)).toBe(2);
	});

	it('Given_ClipEnds_When_TargetZero_Then_ClosedAtStep4AndRestAtStep11', () => {
		// Arrange
		// Act
		const fall = steps(1, 0, 11);
		// Assert
		expect(frameFor(fall[2])).toBe(1);
		expect(frameFor(fall[3])).toBe(0);
		expect(fall[9]).toBeGreaterThan(0.01);
		expect(fall[10]).toBeLessThan(0.01);
	});
});

describe('bob', () => {
	it('Given_LoudAndSilent_When_Bob_Then_UpAndTiltOrIdentity', () => {
		// Arrange
		// Act
		const loud = bob(1, 0);
		const loudMoving = bob(1, (Math.PI / 2) * 140);
		const quiet = bob(0, 123);
		// Assert
		expect(loud).toEqual({ y: -5, deg: 0 });
		expect(loudMoving.deg).toBeCloseTo(1.4);
		expect(quiet.y + 0).toBe(0);
		expect(quiet.deg + 0).toBe(0);
	});
});

describe('isPlaying', () => {
	vi.stubGlobal('location', { href: 'https://app.test/lesson' });

	it.each([
		['https://clips.test/11.mp3', true],
		['https://clips.test/12.mp3', false],
		[null, false]
	])('Given_ElementSrc_%s_When_IsPlaying_Then_%s', (src, want) => {
		// Arrange
		const { player } = fakePlayer(() => src);
		// Act
		const got = isPlaying(player, '11', player.element());
		// Assert
		expect(got).toBe(want);
	});

	it('Given_RelativeUrl_When_IsPlaying_Then_MatchesAbsoluteElementSrc', () => {
		// Arrange
		const player: TalkingCastPlayer = {
			play: () => Promise.resolve(true),
			url: (key) => `/audio/${key}.mp3`,
			element: () => ({ src: 'https://app.test/audio/11.mp3' }) as HTMLAudioElement
		};
		// Act
		const got = isPlaying(player, '11', player.element());
		// Assert
		expect(got).toBe(true);
	});
});

describe('TalkingCast', () => {
	const { player } = fakePlayer(() => null);
	const out = render(TalkingCast, { props: { clip: '11', player, label: 'Nghe lại' } }).body;

	it('Given_Render_When_Server_Then_ThreeFramesOneOn', () => {
		// Arrange
		// Act
		const imgs = out.match(/<img[^>]*>/g) ?? [];
		// Assert
		expect(imgs).toHaveLength(3);
		expect(imgs.filter((i) => /class="[^"]*\bon\b/.test(i))).toHaveLength(1);
		expect(imgs[0]).toMatch(/\bon\b/);
		expect(imgs.every((i) => i.includes('alt=""'))).toBe(true);
	});

	it('Given_Render_When_Server_Then_OneLabelledPlayButtonAndHiddenPicture', () => {
		// Arrange
		// Act
		const labelled = out.match(/<button[^>]*aria-label="Nghe lại"[^>]*>/g) ?? [];
		// Assert
		expect(labelled).toHaveLength(1);
		expect(labelled[0]).toContain('type="button"');
		expect(out).toMatch(/<button[^>]*aria-hidden="true"/);
	});
});
