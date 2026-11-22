export type Category = 'meaning' | 'pinyin' | 'hanviet' | 'audio' | 'other';

export type ReportContext = {
	lesson: string | null;
	step: string | null;
	word: string | null;
	contentSha: string;
};

export type Report = ReportContext & {
	id: string;
	category: Category;
	note: string | null;
	at: string;
};
