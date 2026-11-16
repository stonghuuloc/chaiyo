import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import StepRunner from './StepRunner.svelte';
import type { LessonStep } from './steps';

const steps: LessonStep[] = Array.from({ length: 6 }, (_, i) => ({
	kind: 'choice',
	id: `q${i}`,
	ask: 'Chọn nghĩa',
	title: `Câu ${i}`,
	options: ['好', '你'],
	answer: '好'
}));

const ledger = { state: () => initialState(), record: async () => [] } as unknown as Ledger;

const html = () =>
	render(StepRunner, {
		props: {
			steps,
			exit: '/today',
			lesson: 'h1-01',
			section: 'dev',
			contentSha: 'x',
			ledger,
			onfinish: () => {}
		}
	}).body;

describe('StepRunner', () => {
	it('Given_SixSteps_When_Render_Then_ExitLinkSixSegmentsAndCounter', () => {
		// Arrange / Act
		const out = html();
		// Assert
		expect(out).toMatch(
			/<a[^>]*href="\/today"[^>]*aria-label="Lưu và về bài học"|<a[^>]*aria-label="Lưu và về bài học"[^>]*href="\/today"/
		);
		const seg = out.match(/<div[^>]*data-seg[^>]*>(.*?)<\/div>/s)?.[1] ?? '';
		expect(seg.match(/<i /g)).toHaveLength(6);
		expect(out).not.toContain('data-on="true"');
		expect(out).toContain('1/6');
	});

	it('Given_NoCtaYet_When_Render_Then_ButtonDisabled', () => {
		expect(html()).toMatch(/<button[^>]*disabled/);
	});
});
