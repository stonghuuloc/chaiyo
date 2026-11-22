const TONE = ['', '̄', '́', '̌', '̀'] as const;
const VOWEL = /[aeiouü]/;

export const norm = (s: string) =>
	s.normalize('NFC').toLowerCase().replace(/[\s']/g, '').replace(/u:|v/g, 'ü');

// a/e take the mark, then the o of ou, else the last vowel.
const markAt = (syl: string) => {
	const ae = syl.search(/[ae]/);
	if (ae >= 0) return ae;
	const ou = syl.indexOf('ou');
	if (ou >= 0) return ou;
	return [...syl].findLastIndex((c) => VOWEL.test(c));
};

const addTone = (syl: string, tone: number) => {
	const at = markAt(syl);
	if (tone === 5 || at < 0) return syl;
	return (syl.slice(0, at + 1) + TONE[tone] + syl.slice(at + 1)).normalize('NFC');
};

export const toMarks = (s: string) =>
	s.replace(/([a-zü]+)([1-5])/g, (_, syl: string, t: string) => addTone(syl, Number(t)));

export const gradePinyin = (input: string, answer: string) => toMarks(norm(input)) === norm(answer);
