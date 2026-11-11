import type { Curriculum } from '#lib/study/index.js';

export const DEV_CURRICULUM: Curriculum = {
	lessons: [
		{
			id: 'h0-00',
			level: 1,
			sections: ['tones', 'finals', 'initials', 'spelling', 'sandhi'],
			words: [],
			testOut: true
		},
		{
			id: 'h1-01',
			level: 1,
			sections: ['words', 'grammar', 'dialogue', 'listenSpeak', 'writing'],
			words: ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见']
		}
	]
};
