import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { PRODUCTION_ROOTS, scopeFor } from '#lib/content/import/scope.js';
import { createMemorySink } from '#lib/content/import/sink.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { hubView } from './hub';

const load = async () => {
	const prev = process.env.CHAIYO_VAULT;
	process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
	try {
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		const b = buildBundle(sink.content!, 'h0-00');
		return createCatalog({ current: async () => b.sha, bundle: async () => b }).lesson('h0-00');
	} finally {
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
	}
};

const lesson = await load();
const sections = CURRICULUM.lessons.find((l) => l.id === 'h0-00')!.sections;
const fresh = (): State => initialState({ curriculum: CURRICULUM });

const withDone = (done: string[], passed: boolean): State => {
	const s = fresh();
	s.lessons['h0-00'] = { unlocked: true, passed, done };
	return s;
};

describe('hubView on the Primer', () => {
	it('Given_FreshPrimer_When_HubView_Then_MetaNamesLinksStartCta', () => {
		// Arrange
		const state = fresh();

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(`${v.title} ${v.hanzi}`).toBe('Nhập môn 拼音');
		expect(v.meta).toBe('5 phần · không học từ mới · khoảng 25 phút');
		expect(v.progress).toBe('0/5 phần');
		expect(v.rows.map((r) => [r.id, r.name])).toEqual([
			['tones', 'Thanh điệu'],
			['finals', 'Vận mẫu'],
			['initials', 'Thanh mẫu'],
			['spelling', 'Quy tắc viết'],
			['sandhi', 'Biến điệu']
		]);
		expect(v.links).toEqual([{ id: 'pinyin', label: 'Bảng pinyin' }]);
		expect(v.gate).toEqual({ locked: false, sub: '', name: 'Kiểm tra Nhập môn' });
		expect(v.cta).toEqual({ section: 'tones', label: 'Bắt đầu: Thanh điệu' });
	});

	it('Given_FreshPrimer_When_HubView_Then_TestOutLink', () => {
		// Arrange
		const state = fresh();

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.testOut).toEqual({ label: 'Đã biết pinyin? Làm bài kiểm tra luôn' });
	});

	it('Given_Passed_When_HubView_Then_NoTestOut', () => {
		// Arrange
		const state = withDone(sections, true);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.testOut).toBeNull();
	});

	it('Given_OpenFinalsRun_When_HubView_Then_ResumeVanMau', () => {
		// Arrange
		const state = fresh();
		state.runs.r1 = {
			step: { kind: 'section', lesson: 'h0-00', section: 'finals', run: 'r1', of: 10 },
			answers: { a: true }
		};

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.cta).toEqual({ section: 'finals', label: 'Tiếp tục: Vận mẫu' });
	});

	it('Given_FiveDoneNotPassed_When_HubView_Then_GateCta', () => {
		// Arrange
		const state = withDone([...sections], false);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.progress).toBe('5/5 phần');
		expect(v.cta).toEqual({ section: 'gate', label: 'Làm bài kiểm tra' });
	});

	it('Given_FiveDonePassed_When_HubView_Then_NoCta', () => {
		// Arrange
		const state = withDone([...sections], true);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.cta).toBeNull();
	});
});
