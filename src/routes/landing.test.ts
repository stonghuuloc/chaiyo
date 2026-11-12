import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import messages from '../../messages/vi.json';
import Page from './+page.svelte';
import * as page from './+page';

const { body, head } = render(Page);
const visible =
	(body + head).replace(/<[^>]+>/g, ' ') +
	[...head.matchAll(/content="([^"]*)"/g)].map((x) => x[1]).join(' ');

describe('landing page', () => {
	it('has two links to /login, the primary first', () => {
		const links = [...body.matchAll(/<a\b[^>]*href="\/login"[^>]*>([\s\S]*?)<\/a>/g)];
		expect(links).toHaveLength(2);
		expect(links[0][1]).toContain('Bắt đầu học');
	});

	it('holds the copy and no placeholder text', () => {
		expect(body).toContain('Học tiếng Trung bằng tiếng Việt');
		expect(body).toContain('Mỗi ngày một chút, cùng các bạn thú.');
		for (const p of [
			'Mỗi chữ có Hán Việt',
			'Nghe giọng thật từ các bạn thú',
			'Mỗi ngày một chút, có lộ trình HSK'
		])
			expect(body).toContain(p);
		expect(head).toContain('<title>Chaiyo! Học tiếng Trung bằng tiếng Việt</title>');
		expect(head).toContain('content="Mỗi ngày một chút, cùng các bạn thú."');
		expect(visible).not.toMatch(/lorem|ipsum|TODO|TBD|placeholder|Hello|Welcome/i);
	});

	it('serves one image per device through picture sources', () => {
		expect(body).toContain('media="(min-width: 1024px)"');
		expect(body).toContain('landing-tall.webp');
		expect(body).toContain('landing-wide.webp');
		expect(body).toContain('fetchpriority="high"');
	});

	it('has non-empty landing messages', () => {
		const values = Object.entries(messages).filter(([k]) => k.startsWith('landing_'));
		expect(values.length).toBeGreaterThan(0);
		for (const [, v] of values) expect(v).not.toBe('');
	});

	it('is prerendered without client JS', () => {
		expect(page.prerender).toBe(true);
		expect(page.ssr).toBe(true);
		expect(page.csr).toBe(false);
	});
});
