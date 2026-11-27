import { describe, expect, it } from 'vitest';
import { resultView } from './result';

const lesson = (n: number, level: number, title: string, titleHanzi: string, words: number) => ({
	id: `h${level}-${String(n).padStart(2, '0')}`,
	level,
	n,
	title,
	titleHanzi,
	sections: [],
	words: Array.from({ length: words }, (_, i) => `w${n}-${i}`)
});
const LESSONS = [
	lesson(0, 1, 'Nhập môn', '拼音', 0),
	lesson(1, 1, 'Xin chào', '你好', 10),
	lesson(2, 2, 'Mấy giờ bạn dậy?', '你几点起床', 12),
	lesson(3, 3, 'Kỳ thi sắp đến', '考试就要到了', 13),
	lesson(4, 4, 'Bốn', '四', 15),
	lesson(5, 5, 'Năm', '五', 15)
];
const row = (v: ReturnType<typeof resultView>, i: number) => v.rows[i];

describe('resultView', () => {
	it('0 cleared starts at Bài 0 and never says the learner failed', () => {
		const v = resultView(0, LESSONS);
		expect(v).toMatchObject({
			eyebrow: 'Bạn sẽ bắt đầu từ',
			title: 'Bài 0 · Nhập môn 拼音',
			cta: 'Bắt đầu Bài 0',
			href: '/today',
			confetti: 'none'
		});
		expect(v.lead).toMatch(/^Làm quen với pinyin trước/);
		expect(v.rows).toEqual([
			{ label: 'Tiếp theo', value: 'Cấp đầu tiên · 1 bài', sub: 'Bắt đầu từ Bài 1 · Xin chào' }
		]);
		expect(JSON.stringify(v)).not.toMatch(/trượt|chưa đạt|tiếc/i);
	});

	it('1 cleared starts at HSK 2 with no confetti', () => {
		const v = resultView(1, LESSONS);
		expect(v).toMatchObject({
			title: 'HSK 2 · Bài 2',
			lead: 'Mấy giờ bạn dậy? 你几点起床',
			cta: 'Bắt đầu Bài 2',
			href: '/today',
			confetti: 'none'
		});
		expect(row(v, 0).value).toBe('HSK 1 · Bài 0–1');
		expect(row(v, 1).value).toBe('+10 từ đang chờ ôn');
	});

	it('2 cleared opens HSK 1–2 with a normal burst', () => {
		const v = resultView(2, LESSONS);
		expect(v).toMatchObject({
			title: 'HSK 3 · Bài 3',
			lead: 'Kỳ thi sắp đến 考试就要到了',
			cta: 'Bắt đầu Bài 3',
			confetti: 'normal'
		});
		expect(row(v, 0).value).toBe('HSK 1–2 · Bài 0–2');
		expect(row(v, 1).value).toBe('+22 từ đang chờ ôn');
		expect(row(v, 2).value).toBe('~20 từ mỗi ngày');
	});

	it('counts a word once when a review lesson repeats it', () => {
		const review = { ...lesson(2, 1, 'Ôn tập', '买', 0), words: ['w1-0', 'w1-1'] };
		const v = resultView(1, [...LESSONS.slice(0, 2), review, ...LESSONS.slice(2)]);
		expect(row(v, 1).value).toBe('+10 từ đang chờ ôn');
	});

	it('4 cleared starts at HSK 5 with a big burst', () => {
		const v = resultView(4, LESSONS);
		expect(v).toMatchObject({ title: 'HSK 5 · Bài 5', cta: 'Bắt đầu Bài 5', confetti: 'big' });
		expect(row(v, 0).value).toBe('HSK 1–4 · Bài 0–4');
		expect(row(v, 1).value).toBe('+50 từ đang chờ ôn');
	});

	it('5 cleared finishes every level and points at the Roadmap', () => {
		const v = resultView(5, LESSONS);
		expect(v).toMatchObject({
			eyebrow: 'Bạn đã qua',
			title: 'Mọi cấp HSK',
			cta: 'Xem Chuyên đề',
			href: '/roadmap',
			confetti: 'big'
		});
		expect(v.lead).toMatch(/^Bạn đã mở khoá mọi bài\./);
		expect(row(v, 0).value).toBe('HSK 1–5 · Bài 0–5');
		expect(row(v, 1).value).toBe('+65 từ đang chờ ôn');
	});
});
