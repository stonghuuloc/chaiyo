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
		const lede =
			'Quốc gia, học sinh, gia đình: Hán Việt đã nằm sẵn trong tiếng Việt. Chaiyo cùng bạn học nốt phần còn lại.';
		expect(body).toContain('Bạn đã biết một nửa tiếng Trung rồi.');
		expect(body).toContain(lede);
		for (const p of [
			'Mỗi chữ kèm phiên âm Hán Việt',
			'Nghe và nói với giọng đọc tự nhiên',
			'Lộ trình HSK3.0 mới nhất',
			'Mỗi ngày vài phút, học cùng những người bạn đáng yêu'
		])
			expect(body).toContain(p);
		expect(head).toContain('<title>Chaiyo! Bạn đã biết một nửa tiếng Trung rồi</title>');
		expect(head).toContain(`content="${lede}"`);
		expect(visible).not.toMatch(/bạn thú|dạy/i);
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
