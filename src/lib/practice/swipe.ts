export const THRESHOLD = 0.28;
export const FLICK_V = 0.5;
export const FLICK_MIN = 24;

const THRESHOLD_PERCENT = THRESHOLD * 100;
const VELOCITY_WINDOW_MS = 100;

type Move = { dx: number; dy: number; width: number; vx: number };
type Sample = { x: number; t: number };

export function decide({ dx, dy, width, vx }: Move): 'right' | 'left' | null {
	const dir = dx > 0 ? 'right' : 'left';
	if (width > 0 && Math.abs(dx) * 100 >= Math.round(THRESHOLD_PERCENT) * width) return dir;
	const flick = Math.abs(vx) >= FLICK_V && Math.abs(dx) >= FLICK_MIN && Math.abs(dx) > Math.abs(dy);
	return flick && Math.sign(vx) === Math.sign(dx) ? dir : null;
}

export const stampOpacity = (dx: number, width: number) =>
	width > 0 ? Math.min(1, Math.abs(dx) / (THRESHOLD * width)) : 0;

export function velocity(samples: Sample[], now = samples.at(-1)?.t ?? 0) {
	const recent = samples.filter((p) => now - p.t <= VELOCITY_WINDOW_MS);
	if (recent.length < 2) return 0;
	const first = recent[0];
	const last = recent[recent.length - 1];
	return last.t === first.t ? 0 : (last.x - first.x) / (last.t - first.t);
}
