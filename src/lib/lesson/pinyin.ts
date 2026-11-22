const TONE = ['', '̄', '́', '̌', '̀'] as const;
const VOWEL = /[aeiouü]/;

const SYLLABLE = /(?:zh|ch|sh|[bpmfdtnlgkhjqxzcsryw])?[aeiouü]+(?:ng|n|r)?/g;

const lower = (s: string) => s.normalize('NFC').toLowerCase().replace(/u:|v/g, 'ü');
const unspaced = (s: string) => s.replace(/[\s']/g, '');

export const norm = (s: string) => unspaced(lower(s));

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

// A digit marks only the last syllable of the letters before it.
const toneLast = (run: string, tone: number) => {
	const at = [...run.matchAll(SYLLABLE)].at(-1)?.index ?? 0;
	return run.slice(0, at) + addTone(run.slice(at), tone);
};

export const toMarks = (s: string) =>
	s.replace(/([a-zü]+)([1-5])/g, (_, run: string, t: string) => toneLast(run, Number(t)));

export const marked = (input: string) => unspaced(toMarks(lower(input)));

export const gradePinyin = (input: string, answer: string) => marked(input) === norm(answer);
