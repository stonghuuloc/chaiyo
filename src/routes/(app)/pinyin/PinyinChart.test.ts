import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/vi.json';
import chart from './chart.json';
import type { ChartCell } from './chart';
import PinyinChart from './PinyinChart.svelte';

const cells = chart as ChartCell[];
const html = (props: { cells?: ChartCell[]; open: string | null }) =>
	render(PinyinChart, { props: { cells, ...props } }).body;
const tbody = (body: string) => body.slice(body.indexOf('<tbody'), body.indexOf('</tbody>'));
const disabledButtons = (s: string) => s.match(/<button[^>]* disabled[ =>]/g) ?? [];
const dialog = (body: string) => body.slice(body.indexOf('role="dialog"'));

describe('table', () => {
	it('Given_Cells_When_Render_Then_402CellButtons_And_EmptyTds_And_EmptySetRowHeader', () => {
		// Arrange
		// Act
		const body = html({ open: null });
		const rows = tbody(body);
		// Assert
		expect(body).toContain(`aria-label="${messages.pinyin_grid_label}"`);
		expect(rows.match(/<button/g)).toHaveLength(402);
		expect(rows.match(/<td class="none /g)).toHaveLength(22 * 36 - 402);
		expect(rows.match(/<th scope="row"/g)).toHaveLength(22);
		expect(rows).toContain('∅');
		expect(body.match(/<th scope="col"/g)).toHaveLength(36);
		expect(body).not.toContain('role="dialog"');
	});

	it('Given_Cells_When_Render_Then_NoScoreText', () => {
		// Arrange
		// Act
		const text = html({ open: null }).replace(/<[^>]+>/g, ' ');
		// Assert
		expect(text).not.toMatch(/%|điểm/i);
	});
});

describe('tone sheet', () => {
	it('Given_Open_ba_When_Render_Then_DialogTitled_ba_With_Hint_And_4Tones_八拔把爸_4Contours', () => {
		// Arrange
		// Act
		const sheet = dialog(html({ open: 'ba' }));
		// Assert
		expect(sheet).toContain('>ba</h2>');
		expect(sheet).toContain(messages.pinyin_hint);
		expect(sheet).toContain(messages.pinyin_close);
		for (const t of ['bā', 'bá', 'bǎ', 'bà']) expect(sheet).toContain(`>${t}<`);
		for (const h of ['八', '拔', '把', '爸']) expect(sheet).toContain(`>${h}<`);
		expect(sheet.match(/viewBox="0 0 44 24"/g)).toHaveLength(4);
		expect(disabledButtons(sheet)).toHaveLength(0);
	});

	it('Given_Open_xyz_When_Render_Then_NoDialog', () => {
		// Arrange
		// Act
		const body = html({ open: 'xyz' });
		// Assert
		expect(body).not.toContain('role="dialog"');
	});

	it('Given_Open_a_When_Render_Then_ToneButtonsEnabled_With_EmptyHanzi_For_ǎ_à', () => {
		// Arrange
		// Act
		const sheet = dialog(html({ open: 'a' }));
		// Assert
		expect(sheet).toContain('>ǎ<');
		expect(sheet).toContain('>à<');
		expect(disabledButtons(sheet)).toHaveLength(0);
		expect(sheet.match(/class="font-hanzi[^"]*"[^>]*><\/span>/g)).toHaveLength(2);
	});

	it('Given_FixtureTone3KeyNull_When_Render_Then_Tone3DisabledDash', () => {
		// Arrange
		const ba = cells.find((c) => c.syllable === 'ba')!;
		const fixture: ChartCell = {
			...ba,
			tones: ba.tones.map((t, i) => (i === 2 ? { ...t, key: null } : t))
		};
		// Act
		const sheet = dialog(html({ cells: [fixture], open: 'ba' }));
		// Assert
		expect(disabledButtons(sheet)).toHaveLength(1);
		expect(sheet).toContain('>–<');
		expect(sheet).not.toContain('>bǎ<');
	});
});
