import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import HanziStrokes from './HanziStrokes.svelte';

describe('HanziStrokes server render', () => {
	it('Given_QuizMode_When_ServerRender_Then_ToolsAndEmptyCounter', () => {
		// Arrange / Act
		const { body } = render(HanziStrokes, { props: { char: '你', mode: 'quiz' } });
		// Assert
		for (const s of ['Xem mẫu', 'Gợi ý', 'Viết lại', 'nét 0/–']) expect(body).toContain(s);
	});

	it('Given_AnimateMode_When_ServerRender_Then_PadOnly', () => {
		// Arrange / Act
		const { body } = render(HanziStrokes, { props: { char: '你', mode: 'animate' } });
		// Assert
		for (const s of ['Xem mẫu', 'Gợi ý', 'Viết lại', 'nét 0']) expect(body).not.toContain(s);
	});
});
