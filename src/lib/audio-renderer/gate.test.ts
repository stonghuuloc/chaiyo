import { describe, expect, it } from 'vitest';
import { mp3Filter } from './gate';

const LOUDNORM = 'loudnorm=I=-16:TP=-1.5:LRA=11';
const TRIM =
	'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse';

describe('mp3Filter', () => {
	it('is loudnorm alone at tempo 1 without silence trim', () => {
		expect(mp3Filter(1)).toBe(LOUDNORM);
	});

	it('trims both silences before loudnorm', () => {
		expect(mp3Filter(1, { trimSilence: true })).toBe(`${TRIM},${LOUDNORM}`);
	});

	it('slows with atempo before loudnorm', () => {
		expect(mp3Filter(0.85)).toBe(`atempo=0.85,${LOUDNORM}`);
	});
});
