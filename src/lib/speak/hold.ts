export const MIN_HOLD_MS = 700;

export const BARS = 28;

export const held = (micOnAt: number | null, releasedAt: number): 'short' | 'done' =>
	micOnAt === null || releasedAt - micOnAt < MIN_HOLD_MS ? 'short' : 'done';

export const clock = (ms: number) => {
	const sec = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

export const level = (buf: Uint8Array) => {
	let sum = 0;
	for (const v of buf) {
		const d = (v - 128) / 128;
		sum += d * d;
	}
	return Math.min(1, Math.sqrt(sum / buf.length) * 5);
};

export const push = (levels: number[], v: number) => [...levels, v].slice(-BARS);
