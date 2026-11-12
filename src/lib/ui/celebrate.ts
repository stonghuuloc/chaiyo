const COLORS = ['#c6301d', '#c6301d', '#e8604c', '#1d1814', '#f7f3ea', '#3f73b0'];
const SHAPES = ['rect', 'rect', 'circle', 'strip'] as const;

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

// Side cannons in waves, then a slow shower from the top, on one fixed canvas that is removed when the last bit has fallen.
// Draws nothing under prefers-reduced-motion. Returns a stop function.
export function celebrate({ big = false } = {}) {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	const dpr = devicePixelRatio || 1;
	const canvas = document.createElement('canvas');
	canvas.className = 'pointer-events-none fixed inset-0 z-100 size-full';
	canvas.dataset.testid = 'confetti';
	canvas.setAttribute('aria-hidden', 'true');
	canvas.width = innerWidth * dpr;
	canvas.height = innerHeight * dpr;
	document.body.append(canvas);
	const g = canvas.getContext('2d')!;
	g.scale(dpr, dpr);

	const bit = (x: number, y: number, vx: number, vy: number, slow: boolean) => ({
		x,
		y,
		vx,
		vy,
		slow,
		w: 6 + Math.random() * 6,
		h: 8 + Math.random() * 7,
		r: Math.random() * 6,
		vr: (Math.random() - 0.5) * 0.35,
		wob: Math.random() * 6,
		c: pick(COLORS),
		s: pick(SHAPES),
		life: 0
	});
	let bits: ReturnType<typeof bit>[] = [];

	const waves = big ? [0, 350, 750, 1200] : [0, 400, 850];
	const cannon = (power: number) => {
		for (let i = 0; i < (big ? 70 : 50); i++) {
			const left = i % 2 === 0;
			const angle = 0.5 + Math.random() * 0.5;
			const v = power * (0.7 + Math.random() * 0.6);
			bits.push(
				bit(
					left ? -4 : innerWidth + 4,
					innerHeight * (0.55 + Math.random() * 0.15),
					Math.cos(angle) * v * (left ? 1 : -1),
					-Math.sin(angle) * v - 3,
					false
				)
			);
		}
	};
	const showerSpan = big ? 3200 : 2200;
	const drops = Array.from({ length: big ? 160 : 90 }, () => 600 + Math.random() * showerSpan).sort(
		(a, b) => a - b
	);
	let nextWave = 0;
	let nextDrop = 0;

	let frameId = 0;
	let start = 0;
	const frame = (now: number) => {
		start ||= now;
		const t = now - start;
		while (nextWave < waves.length && waves[nextWave] <= t) cannon(15 + nextWave++);
		while (nextDrop < drops.length && drops[nextDrop] <= t) {
			nextDrop++;
			bits.push(
				bit(
					Math.random() * innerWidth,
					-12,
					(Math.random() - 0.5) * 1.5,
					1 + Math.random() * 2,
					true
				)
			);
		}

		g.clearRect(0, 0, innerWidth, innerHeight);
		bits = bits.filter((b) => b.y < innerHeight + 30 && b.life < 420);
		for (const b of bits) {
			b.life++;
			if (b.slow) {
				b.vy = Math.min(b.vy + 0.05, 2.6);
				b.wob += 0.08;
				b.x += b.vx + Math.sin(b.wob) * 0.8;
			} else {
				b.vy += 0.3;
				b.vx *= 0.982;
				b.vy *= 0.985;
				b.x += b.vx;
			}
			b.y += b.vy;
			b.r += b.vr;
			g.save();
			g.globalAlpha = b.life > 340 ? (420 - b.life) / 80 : 1;
			g.translate(b.x, b.y);
			g.rotate(b.r);
			g.scale(1, Math.cos(b.r * 2));
			g.fillStyle = b.c;
			if (b.s === 'circle') {
				g.beginPath();
				g.arc(0, 0, b.w / 2, 0, 7);
				g.fill();
			} else if (b.s === 'strip') g.fillRect(-1.5, -b.h, 3, b.h * 2);
			else g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
			g.restore();
		}

		if (bits.length || nextWave < waves.length || nextDrop < drops.length)
			frameId = requestAnimationFrame(frame);
		else canvas.remove();
	};
	frameId = requestAnimationFrame(frame);

	return () => {
		cancelAnimationFrame(frameId);
		canvas.remove();
	};
}
