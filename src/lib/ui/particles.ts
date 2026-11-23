export type Kind = 'ember' | 'snow';
export type Particle = { left: number; size: number; duration: number; delay: number };

const COUNT = 18;

export function particles(kind: Kind, rand: () => number = Math.random): Particle[] {
	const base = kind === 'ember' ? 10 : 12;
	const span = kind === 'ember' ? 12 : 14;
	return Array.from({ length: COUNT }, () => ({
		left: rand() * 100,
		size: base + rand() * span,
		duration: 3 + rand() * 3,
		delay: rand() * 1.5
	}));
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
