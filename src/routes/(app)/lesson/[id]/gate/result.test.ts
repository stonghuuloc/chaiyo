import type { LessonContent } from '#lib/catalog/index.js';
import type { Answer, LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import type { StudyEvent } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { pinyinLookup, resultView, reviewRows } from './result';

const answers = (right: number, of: number): Answer[] =>
	Array.from({ length: of }, (_, i) => ({
		questionId: `q${i}`,
		pick: 'x',
		correct: i < right,
		ms: 0
	}));

const PASSED: StudyEvent[] = [
	{ type: 'SectionDone', lesson: 'h1-01', section: 'gate' },
	{ type: 'GatePassed', lesson: 'h1-01', score: 90 },
	{ type: 'LessonUnlocked', lesson: 'h1-02' }
];
const DAY: StudyEvent = { type: 'DayCounted', day: '2026-11-22', streak: 4 };

describe('resultView', () => {
	it('Given_9of10_UnlockAndDay_When_View_Then_90PassFullLine', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(9, 10), events: [...PASSED, DAY], best: 90 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 90, right: 9, of: 10, pass: true, n: 1, art: 'b1-pass' });
		expect(v.line).toBe('Đã mở Bài 2 · +1 ngày chuỗi');
	});

	it('Given_9of10_NoDayCounted_When_View_Then_UnlockOnly', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(9, 10), events: PASSED, best: 90 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v.line).toBe('Đã mở Bài 2');
	});

	it('Given_Repass_NoEvents_When_View_Then_NullLine', () => {
		// Arrange
		const events: StudyEvent[] = [{ type: 'GatePassed', lesson: 'h1-01', score: 100 }];
		const input = { lesson: 'h1-01', answers: answers(10, 10), events, best: 100 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 100, pass: true, line: null });
	});

	it('Given_6of10_When_View_Then_60FailCalmLine', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(6, 10), events: [DAY], best: 60 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 60, right: 6, of: 10, pass: false, art: 'b1-fail' });
		expect(v.line).toBe('Gần được rồi. Cần 80% để mở Bài 2.');
	});

	it('Given_8of10_When_View_Then_PassAtThreshold', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(8, 10), events: [], best: 80 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 80, pass: true });
	});

	it('Given_Best70_Run60_When_View_Then_Best70', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(6, 10), events: [], best: 70 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 60, best: 70 });
	});

	it('Given_UnknownLesson_When_View_Then_NumberZero', () => {
		// Arrange
		const input = { lesson: 'x-99', answers: answers(1, 10), events: [], best: 10 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v.n).toBe(0);
		expect(v.line).toBe('Gần được rồi. Cần 80% để mở Bài 0.');
	});
});

const word = (hanzi: string, pinyin: string, vi: string, spoken?: string) => ({
	hanzi,
	pinyin,
	...(spoken ? { spoken } : {}),
	senses: [{ vi }]
});

const CONTENT = {
	words: [
		word('再见', 'zàijiàn', 'tạm biệt'),
		word('没关系', 'méi guānxi', 'không sao'),
		word('一点儿', 'yīdiǎnr', 'một chút', 'yì diǎnr')
	],
	sentences: [{ hanzi: '你们好！', pinyin: 'nǐmen hǎo' }]
} as unknown as LessonContent;

const LOOKUP = pinyinLookup(CONTENT);

const wrong = (questionId: string, pick: string): Answer => ({
	questionId,
	pick,
	correct: false,
	ms: 0
});

const rowFor = (step: LessonStep, pick: string) =>
	reviewRows([step], [wrong(step.id, pick)], LOOKUP);

describe('reviewRows', () => {
	it('Given_WrongChoiceHanzi_When_Rows_Then_PinyinFromWords', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'choice',
			id: 'c1',
			ask: 'Chọn chữ',
			title: 'không sao',
			options: ['对不起', '没关系'],
			answer: '没关系'
		};

		// Act
		const rows = rowFor(step, '对不起');

		// Assert
		expect(rows).toEqual([
			{
				id: 'c1',
				prompt: 'không sao',
				pick: '对不起',
				right: '没关系',
				pinyin: [{ text: 'méi guānxi', bold: false }]
			}
		]);
	});

	it('Given_WrongAudioChoiceMeaning_When_Rows_Then_AskPromptNoPinyin', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'choice',
			id: 'c2',
			ask: 'Nghe và chọn nghĩa',
			title: '',
			options: ['xin lỗi', 'tạm biệt'],
			answer: 'tạm biệt',
			audio: 'words/zaijian'
		};

		// Act
		const [row] = rowFor(step, 'xin lỗi');

		// Assert
		expect(row).toMatchObject({ prompt: 'Nghe và chọn nghĩa', right: 'tạm biệt', pinyin: null });
	});

	it('Given_WrongTrueFalse_When_Rows_Then_GlossFromStatement', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'choice',
			id: 'x20',
			ask: m.gate_true_false_ask(),
			title: '再见 nghĩa là xin chào.',
			options: [m.gate_true(), m.gate_false()],
			answer: m.gate_false(),
			script: 'text'
		};

		// Act
		const [row] = rowFor(step, m.gate_true());

		// Assert
		expect(row).toEqual({
			id: 'x20',
			prompt: '再见 nghĩa là xin chào.',
			pick: 'Đúng',
			right: 'Sai',
			pinyin: [{ text: '再见 zàijiàn = tạm biệt', bold: false }]
		});
	});

	it('Given_WrongTrueFalseUnknownHanzi_When_Rows_Then_NoGloss', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'choice',
			id: 'x21',
			ask: m.gate_true_false_ask(),
			title: '谢谢 nghĩa là xin lỗi.',
			options: [m.gate_true(), m.gate_false()],
			answer: m.gate_false()
		};

		// Act
		const [row] = rowFor(step, m.gate_true());

		// Assert
		expect(row.pinyin).toBe(null);
	});

	it('Given_WrongOrder_When_Rows_Then_SentencePinyin', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'order',
			id: 'o1',
			ask: 'Sắp xếp',
			title: 'Chào các bạn!',
			tiles: ['们', '你', '好'],
			answer: '你们好'
		};

		// Act
		const [row] = rowFor(step, '们你好');

		// Assert
		expect(row).toEqual({
			id: 'o1',
			prompt: 'Chào các bạn!',
			pick: '们你好',
			right: '你们好',
			pinyin: [{ text: 'nǐmen hǎo', bold: false }]
		});
	});

	it('Given_WrongPinyin_When_Rows_Then_NoPinyin', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'pinyin',
			id: 'p1',
			ask: 'Gõ pinyin',
			title: 'tạm biệt',
			hanzi: '再见',
			answer: 'zàijiàn'
		};

		// Act
		const [row] = rowFor(step, 'zaijian');

		// Assert
		expect(row).toEqual({
			id: 'p1',
			prompt: '再见 · tạm biệt',
			pick: 'zaijian',
			right: 'zàijiàn',
			pinyin: null
		});
	});

	it('Given_WrongTone3On_mei_When_Rows_Then_PickMěiTargetBold', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'tone',
			id: 't1',
			ask: 'Nghe thanh',
			audio: 'words/meiguanxi',
			answer: 2,
			syllable: 'méi',
			hanzi: '没关系',
			target: 0
		};

		// Act
		const [row] = rowFor(step, '3');

		// Assert
		expect(row).toEqual({
			id: 't1',
			prompt: '没关系',
			pick: 'měi',
			right: '没关系',
			pinyin: [
				{ text: 'méi', bold: true },
				{ text: 'guānxi', bold: false }
			]
		});
	});

	it('Given_ToneWordWithSpoken_When_Rows_Then_SpokenSplitTargetBold', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'tone',
			id: 't2',
			ask: 'Nghe thanh',
			audio: 'words/yidianr',
			answer: 3,
			syllable: 'diǎnr',
			hanzi: '一点儿',
			target: 1
		};

		// Act
		const [row] = rowFor(step, '4');

		// Assert
		expect(row.pick).toBe('diànr');
		expect(row.pinyin).toEqual([
			{ text: 'yì', bold: false },
			{ text: 'diǎnr', bold: true }
		]);
	});

	it('Given_ToneOnLü_When_Rows_Then_UmlautKept', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'tone',
			id: 't3',
			ask: 'Nghe thanh',
			audio: 'words/lv',
			answer: 4,
			syllable: 'lǜ',
			hanzi: '绿',
			target: 0
		};

		// Act
		const [row] = rowFor(step, '2');

		// Assert
		expect(row).toMatchObject({ pick: 'lǘ', pinyin: null });
	});

	it('Given_AllRight_When_Rows_Then_Empty', () => {
		// Arrange
		const step: LessonStep = {
			kind: 'pinyin',
			id: 'p1',
			ask: 'Gõ pinyin',
			title: 'tạm biệt',
			hanzi: '再见',
			answer: 'zàijiàn'
		};
		const right: Answer = { questionId: 'p1', pick: 'zàijiàn', correct: true, ms: 0 };

		// Act
		const rows = reviewRows([step], [right], LOOKUP);

		// Assert
		expect(rows).toEqual([]);
	});

	it('Given_StepWithoutAnswer_When_Rows_Then_Skipped', () => {
		// Arrange
		const steps: LessonStep[] = [
			{ kind: 'order', id: 'o1', ask: 'a', title: 't', tiles: ['你'], answer: '你' },
			{ kind: 'pinyin', id: 'p1', ask: 'a', title: 't', hanzi: '再见', answer: 'zàijiàn' }
		];

		// Act
		const rows = reviewRows(steps, [wrong('p1', 'x')], LOOKUP);

		// Assert
		expect(rows.map((r) => r.id)).toEqual(['p1']);
	});
});
