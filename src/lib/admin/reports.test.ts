import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { pagedRpc, REFERENCE_NOW, REFERENCE_ROWS } from './fixtures/reports';
import { inboxView, listReports, type InboxReport } from './reports';

const read = async (rows: unknown[] | null) => {
	const rpc = vi.fn(() => pagedRpc(rows));
	const out = await listReports({ rpc } as unknown as SupabaseClient);
	return { rpc, out };
};

const ten = async () => (await read(REFERENCE_ROWS)).out;
const card = async (n: number) =>
	inboxView(await ten(), REFERENCE_NOW).cards.find((c) => c.id === REFERENCE_ROWS[n - 1].id)!;

describe('listReports', () => {
	it('Given_RpcRows_Then_CamelCase', async () => {
		const { rpc, out } = await read(REFERENCE_ROWS);
		expect(rpc).toHaveBeenCalledWith('list_error_reports');
		expect(out).toHaveLength(10);
		expect(out[0]).toEqual({
			id: REFERENCE_ROWS[0].id,
			category: 'pinyin',
			word: '你好',
			lesson: 'h1-01',
			step: 'w03',
			note: 'Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.',
			status: 'new',
			at: '2026-11-24T09:48:00.000Z',
			reporter: 'Lan'
		} satisfies InboxReport);
	});

	it('Given_NullData_Then_Empty', async () => {
		expect((await read(null)).out).toEqual([]);
	});

	it('Given_RpcError_Then_Throws', async () => {
		const rpc = vi.fn(() => pagedRpc(null, { message: 'not admin' }));
		await expect(listReports({ rpc } as unknown as SupabaseClient)).rejects.toThrow('not admin');
	});
});

describe('inboxView', () => {
	it('Given_TenSpecRows_Then_Counts10And0', async () => {
		expect(inboxView(await ten(), REFERENCE_NOW).counts).toEqual({ new: 10, resolved: 0 });
	});

	it('Given_TenSpecRows_Then_Chips10_3_2_3_2', async () => {
		expect(inboxView(await ten(), REFERENCE_NOW).chips).toEqual([
			{ key: 'all', count: 10 },
			{ key: 'meaning', count: 3 },
			{ key: 'pinyin', count: 2 },
			{ key: 'audio', count: 3 },
			{ key: 'other', count: 2 }
		]);
	});

	it('Given_TenSpecRows_Then_CardsInInputOrder', async () => {
		const v = inboxView(await ten(), REFERENCE_NOW);
		expect(v.cards.map((c) => c.id)).toEqual(REFERENCE_ROWS.map((r) => r.id));
	});

	it('Given_R1_Then_WordCardBai1', async () => {
		expect(await card(1)).toEqual({
			id: REFERENCE_ROWS[0].id,
			chip: 'pinyin',
			head: { kind: 'word', hanzi: '你好', long: false, lesson: 1 },
			who: 'Lan',
			ago: '12 phút trước',
			note: 'Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.',
			status: 'new'
		});
	});

	it('Given_R2_Then_WordCardNoLesson', async () => {
		expect(await card(2)).toMatchObject({
			chip: 'audio',
			head: { kind: 'word', hanzi: '谢谢', long: false, lesson: null },
			ago: '1 giờ trước',
			note: null
		});
	});

	it('Given_R5_Then_LongHanzi', async () => {
		expect(await card(5)).toMatchObject({
			head: { kind: 'word', hanzi: '没关系', long: true, lesson: null },
			who: 'Người học',
			ago: 'Hôm qua'
		});
	});

	it('Given_R4_Then_LessonCardBai1XinChao', async () => {
		expect(await card(4)).toMatchObject({
			chip: 'other',
			head: { kind: 'lesson', n: 1, title: 'Xin chào', step: expect.anything() },
			ago: '5 giờ trước'
		});
	});

	it('Given_R8Hanviet_Then_OtherChip', async () => {
		expect(await card(8)).toMatchObject({ chip: 'other', ago: '3 ngày trước' });
	});

	it('Given_NullReporter_Then_NguoiHoc', async () => {
		expect(await card(7)).toMatchObject({ who: 'Người học', ago: '2 ngày trước' });
	});

	it('Given_UnknownLesson_Then_LessonCardShowsId', async () => {
		const [r4] = (await ten()).slice(3, 4);
		const v = inboxView(
			[
				{ ...r4, lesson: 'gone' },
				{ ...r4, id: 'x', lesson: null, step: null }
			],
			REFERENCE_NOW
		);
		expect(v.cards.map((c) => c.head)).toEqual([
			{ kind: 'lesson', n: 0, title: 'gone', step: r4.step },
			{ kind: 'lesson', n: 0, title: '', step: null }
		]);
	});

	it('Given_ResolvedRow_Then_CountedNotCarded', async () => {
		const rows: InboxReport[] = (await ten()).map((r, i) =>
			i < 2 ? { ...r, status: 'resolved' } : r
		);
		const v = inboxView(rows, REFERENCE_NOW);
		expect(v.counts).toEqual({ new: 8, resolved: 2 });
		expect(v.chips.map((c) => c.count)).toEqual([8, 3, 1, 2, 2]);
		expect(v.cards.map((c) => c.id)).toEqual(REFERENCE_ROWS.slice(2).map((r) => r.id));
	});

	it('Given_2500Reports_When_List_Then_ThreePagesAllRows', async () => {
		const base = REFERENCE_ROWS[0];
		const rows = Array.from({ length: 2500 }, (_, i) => ({ ...base, id: `r${i}` }));
		const rpc = vi.fn(() => pagedRpc(rows));
		const out = await listReports({ rpc } as unknown as SupabaseClient);
		expect(out).toHaveLength(2500);
		expect(out.at(-1)?.id).toBe('r2499');
		expect(rpc).toHaveBeenCalledTimes(3);
	});

	it('Given_Exactly1000Reports_When_List_Then_SecondPageEmptyStops', async () => {
		const rows = Array.from({ length: 1000 }, (_, i) => ({ ...REFERENCE_ROWS[0], id: `r${i}` }));
		const rpc = vi.fn(() => pagedRpc(rows));
		expect(await listReports({ rpc } as unknown as SupabaseClient)).toHaveLength(1000);
		expect(rpc).toHaveBeenCalledTimes(2);
	});
});

describe('inboxView tab and chip', () => {
	const done = (rows: InboxReport[], pick: (r: InboxReport, i: number) => boolean) =>
		rows.map((r, i): InboxReport => (pick(r, i) ? { ...r, status: 'resolved' } : r));
	const ids = (v: ReturnType<typeof inboxView>) => v.cards.map((c) => c.id);
	const rid = (...n: number[]) => n.map((k) => REFERENCE_ROWS[k - 1].id);

	it('Given_AudioChipOnNew_Then_R2R6R10', async () => {
		const v = inboxView(await ten(), REFERENCE_NOW, { chip: 'audio' });
		expect(ids(v)).toEqual(rid(2, 6, 10));
		expect(v.empty).toBeNull();
	});

	it('Given_R1Resolved_When_TabResolved_Then_Chips1_0_1_0_0', async () => {
		const rows = done(await ten(), (_, i) => i === 0);
		const v = inboxView(rows, REFERENCE_NOW, { tab: 'resolved' });
		expect(v.chips.map((c) => c.count)).toEqual([1, 0, 1, 0, 0]);
		expect(ids(v)).toEqual(rid(1));
		expect(v.cards[0].status).toBe('resolved');
		expect(v.counts).toEqual({ new: 9, resolved: 1 });
	});

	it('Given_AllResolved_When_NewAnyChip_Then_InboxClear', async () => {
		const rows = done(await ten(), () => true);
		for (const chip of ['all', 'meaning', 'audio'] as const)
			expect(inboxView(rows, REFERENCE_NOW, { chip }).empty).toEqual({ kind: 'inbox-clear' });
	});

	it('Given_NoneResolved_When_TabResolved_Then_NoneDone', async () => {
		const v = inboxView(await ten(), REFERENCE_NOW, { tab: 'resolved', chip: 'pinyin' });
		expect(v.cards).toEqual([]);
		expect(v.empty).toEqual({ kind: 'none-done' });
	});

	it('Given_AudioAllResolved_When_NewAudio_Then_ChipEmpty', async () => {
		const rows = done(await ten(), (r) => r.category === 'audio');
		const v = inboxView(rows, REFERENCE_NOW, { chip: 'audio' });
		expect(v.cards).toEqual([]);
		expect(v.empty).toEqual({ kind: 'chip', tab: 'new', chip: 'audio' });
	});

	it('Given_R1Resolved_When_ResolvedMeaning_Then_ChipEmpty', async () => {
		const rows = done(await ten(), (_, i) => i === 0);
		const v = inboxView(rows, REFERENCE_NOW, { tab: 'resolved', chip: 'meaning' });
		expect(v.empty).toEqual({ kind: 'chip', tab: 'resolved', chip: 'meaning' });
	});

	it('Given_DefaultArgs_Then_S1Output', async () => {
		const rows = await ten();
		const v = inboxView(rows, REFERENCE_NOW);
		expect(v).toEqual(inboxView(rows, REFERENCE_NOW, { tab: 'new', chip: 'all' }));
		expect(v.cards).toHaveLength(10);
		expect(v.empty).toBeNull();
	});
});
