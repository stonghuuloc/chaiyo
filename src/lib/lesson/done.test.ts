import { m } from '#lib/paraglide/messages.js';
import type { StudyEvent } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { dayCounted, doneNext, nextSection, sectionName } from './done';

const events: StudyEvent[] = [
	{ type: 'SectionDone', lesson: 'h1-01', section: 'grammar' },
	{ type: 'DayCounted', day: '2026-11-22', streak: 4 }
];

describe('done', () => {
	it('Given_EventsWithDayCounted_When_DayCounted_Then_ReturnsStreak', () => {
		// Arrange
		const input = events;
		// Act
		const n = dayCounted(input);
		// Assert
		expect(n).toBe(4);
	});

	it('Given_EventsWithoutDayCounted_When_DayCounted_Then_Null', () => {
		// Arrange
		const input = events.slice(0, 1);
		// Act
		const n = dayCounted(input);
		// Assert
		expect(n).toBeNull();
	});

	it('Given_Grammar_When_NextSection_Then_Dialogue', () => {
		// Arrange / Act
		const next = nextSection('h1-01', 'grammar');
		// Assert
		expect(next).toBe('dialogue');
	});

	it('Given_LastSection_When_NextSection_Then_Null', () => {
		// Arrange / Act
		const next = nextSection('h1-01', 'writing');
		// Assert
		expect(next).toBeNull();
	});

	it('Given_UnknownLesson_When_NextSection_Then_Null', () => {
		// Arrange / Act
		const next = nextSection('h9-99', 'grammar');
		// Assert
		expect(next).toBeNull();
	});

	it('Given_KnownAndUnknownIds_When_SectionName_Then_NameOrId', () => {
		// Arrange / Act
		const names = ['words', 'grammar', 'dialogue', 'listenSpeak', 'writing', 'nope'].map(
			sectionName
		);
		// Assert
		expect(names).toEqual(['Từ mới', 'Ngữ pháp', 'Hội thoại', 'Nghe & nói', 'Luyện viết', 'nope']);
	});

	it('Given_MiddleSection_When_DoneNext_Then_NextLabelAndSection', () => {
		// Arrange / Act
		const d = doneNext('h1-01', 'grammar');
		// Assert
		expect(d).toEqual({ label: m.done_next(), section: 'dialogue' });
		expect(d.label).toBe('Phần tiếp theo');
	});

	it('Given_LastSection_When_DoneNext_Then_BackLabelAndNull', () => {
		// Arrange / Act
		const d = doneNext('h1-01', 'writing');
		// Assert
		expect(d).toEqual({ label: m.done_back(), section: null });
		expect(d.label).toBe('Về bài học');
	});

	it('Given_Warmup_When_SectionName_Then_KhoiDong', () => {
		// Arrange / Act
		const name = sectionName('warmup');
		// Assert
		expect(name).toBe('Khởi động');
	});

	it('Given_Warmup_When_DoneNext_Then_NextIsWords', () => {
		// Arrange / Act
		const d = doneNext('h1-02', 'warmup');
		// Assert
		expect(d).toEqual({ label: 'Phần tiếp theo', section: 'words' });
	});

	it('Given_WarmupOfUnknownLesson_When_NextSection_Then_Null', () => {
		// Arrange / Act
		const next = nextSection('h9-99', 'warmup');
		// Assert
		expect(next).toBeNull();
	});

	it('Given_PrimerIds_When_SectionName_Then_VietnameseNames', () => {
		// Arrange
		const ids = ['tones', 'finals', 'initials', 'spelling', 'sandhi'];

		// Act
		const names = ids.map(sectionName);

		// Assert
		expect(names).toEqual(['Thanh điệu', 'Vận mẫu', 'Thanh mẫu', 'Quy tắc viết', 'Biến điệu']);
	});

	it('Given_Sandhi_When_DoneNext_Then_BackToHub', () => {
		// Arrange / Act
		const mid = doneNext('h0-00', 'tones');
		const last = doneNext('h0-00', 'sandhi');

		// Assert
		expect(mid).toEqual({ label: m.done_next(), section: 'finals' });
		expect(last).toEqual({ label: m.done_back(), section: null });
	});
});
