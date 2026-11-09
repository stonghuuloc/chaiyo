import type { Curriculum } from '#lib/study/index.js';

const SECTIONS = ['words', 'grammar', 'dialogue', 'listenSpeak', 'writing'];
const ids = (prefix: string, from: number, to: number, level: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => {
		const id = `${prefix}${String(from + i).padStart(2, '0')}`;
		return {
			id,
			level,
			sections: SECTIONS,
			words: Array.from({ length: 10 }, (_, w) => `${id}-w${String(w + 1).padStart(2, '0')}`)
		};
	});

const [h101, ...h1rest] = ids('h1-', 1, 25, 1);

export const CURRICULUM: Curriculum = {
	lessons: [
		{
			id: 'h0-00',
			level: 1,
			sections: ['tones', 'finals', 'initials', 'spelling', 'sandhi'],
			words: [],
			testOut: true
		},
		{
			...h101,
			words: ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见']
		},
		...h1rest,
		...ids('h2-', 1, 2, 2)
	]
};
