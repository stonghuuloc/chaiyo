export const REFERENCE_NOW = new Date('2026-11-24T10:00:00Z');

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const row = (
	n: number,
	category: string,
	word_id: string | null,
	lesson_id: string | null,
	step_id: string | null,
	note: string | null,
	reporter: string | null,
	before: number
) => ({
	id: `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
	lesson_id,
	step_id,
	word_id,
	category,
	note,
	status: 'new',
	created_at: new Date(REFERENCE_NOW.getTime() - before).toISOString(),
	resolved_at: null,
	reporter
});

export const REFERENCE_ROWS = [
	row(
		1,
		'pinyin',
		'你好',
		'h1-01',
		'w03',
		'Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.',
		'Lan',
		12 * MIN
	),
	row(2, 'audio', '谢谢', null, null, null, null, HOUR),
	row(3, 'meaning', '您', 'h1-01', 'w05', 'Nghĩa hơi dài.', 'Lan', 3 * HOUR),
	row(4, 'other', null, 'h1-01', 'd02', 'Câu thứ 3 bị lặp.', 'Lan', 5 * HOUR),
	row(5, 'pinyin', '没关系', null, null, null, null, 26 * HOUR),
	row(6, 'audio', '不客气', null, null, 'Audio bị cụt chữ cuối.', 'Lan', 30 * HOUR),
	row(7, 'meaning', '你们', null, null, null, null, 2 * DAY),
	row(8, 'hanviet', null, 'h1-01', 'q4', 'Hai đáp án giống hệt nhau.', 'Lan', 3 * DAY),
	row(9, 'meaning', '再见', null, null, null, null, 4 * DAY),
	row(10, 'audio', '对不起', null, null, 'Giọng nhỏ hơn.', 'Lan', 5 * DAY)
];
