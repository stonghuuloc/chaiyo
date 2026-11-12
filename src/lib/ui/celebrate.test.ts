import { afterEach, describe, expect, it, vi } from 'vitest';
import { celebrate } from './celebrate';

function setup(reduced: boolean) {
	const canvas = {
		className: '',
		dataset: {} as Record<string, string>,
		width: 0,
		height: 0,
		attrs: {} as Record<string, string>,
		setAttribute(k: string, v: string) {
			this.attrs[k] = v;
		},
		getContext: () => ({
			scale() {},
			clearRect() {},
			save() {},
			restore() {},
			translate() {},
			rotate() {},
			fillRect() {},
			beginPath() {},
			arc() {},
			fill() {},
			set fillStyle(_v: string) {},
			set globalAlpha(_v: number) {}
		}),
		remove: vi.fn()
	};
	const append = vi.fn();
	let frame: ((t: number) => void) | undefined;
	vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
	vi.stubGlobal('document', { createElement: () => canvas, body: { append } });
	vi.stubGlobal('innerWidth', 400);
	vi.stubGlobal('innerHeight', 800);
	vi.stubGlobal('devicePixelRatio', 2);
	vi.stubGlobal('requestAnimationFrame', (f: (t: number) => void) => {
		frame = f;
		return 1;
	});
	const cancel = vi.fn();
	vi.stubGlobal('cancelAnimationFrame', cancel);
	return { canvas, append, cancel, step: (t: number) => frame?.(t) };
}

afterEach(() => vi.unstubAllGlobals());

describe('celebrate', () => {
	it('draws nothing under reduced motion', () => {
		const s = setup(true);
		celebrate({ big: true })();
		expect(s.append).not.toHaveBeenCalled();
	});

	it.each([false, true])(
		'big=%s adds a canvas and removes it when the last bit has fallen',
		(big) => {
			const s = setup(false);
			celebrate({ big });
			expect(s.append).toHaveBeenCalledWith(s.canvas);
			expect(s.canvas.dataset.testid).toBe('confetti');
			expect(s.canvas.width).toBe(800);
			for (let t = 0, n = 0; n < 3000 && !s.canvas.remove.mock.calls.length; t += 16, n++)
				s.step(t);
			expect(s.canvas.remove).toHaveBeenCalledOnce();
		}
	);

	it('stop() cancels the frame and removes the canvas', () => {
		const s = setup(false);
		const stop = celebrate();
		stop();
		expect(s.cancel).toHaveBeenCalled();
		expect(s.canvas.remove).toHaveBeenCalledOnce();
	});
});
