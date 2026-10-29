import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('generated motion tokens', () => {
	const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

	it('has the fade duration', () => {
		expect(css).toContain('--motion-fade: 260ms;');
	});

	it('has the reduced-motion fade duration', () => {
		expect(css).toContain('--motion-fade-reduced: 150ms;');
	});
});
