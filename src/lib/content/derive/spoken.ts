import { splitSyllables, withTone } from './pinyin';

const CJK = /[\u3400-\u9fff]/;

export function deriveSpoken(pinyin: string, hanzi: string): string {
	const chars = [...hanzi].filter((c) => CJK.test(c));
	const { clauses, aligned } = splitSyllables(pinyin, chars.length);
	const text = pinyin.normalize('NFC');
	const edits: { start: number; end: number; to: string }[] = [];
	for (const clause of clauses) {
		for (const [k, s] of clause.entries()) {
			const next = clause[k + 1]?.tone;
			const lower = s.syl.toLowerCase();
			const hanziAt = aligned ? chars[s.charIndex] : undefined;
			let tone: 2 | 4 | undefined;
			if (s.tone === 3 && next === 3) tone = 2;
			else if (hanziAt === '不' && lower === 'bù' && next === 4) tone = 2;
			else if (hanziAt === '一' && lower === 'yī' && next) tone = next === 4 ? 2 : 4;
			if (tone)
				edits.push({ start: s.start, end: s.start + s.syl.length, to: withTone(s.syl, tone) });
		}
	}
	if (!edits.length) return pinyin;
	return edits.reduceRight((acc, e) => acc.slice(0, e.start) + e.to + acc.slice(e.end), text);
}

export const resolveSpoken = (x: { hanzi: string; pinyin: string; spoken?: string }) =>
	x.spoken ?? deriveSpoken(x.pinyin, x.hanzi);
