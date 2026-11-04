import type { Char, Word } from '../schemas';
import { splitSyllables } from './pinyin';

const strip = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

export function deriveHanViet(
	word: Pick<Word, 'hanzi' | 'pinyin' | 'hanviet'>,
	chars: Record<string, Char>
): { hanviet: string } | { missing: string[] } {
	if (word.hanviet !== undefined) return { hanviet: word.hanviet };
	const hanzi = [...word.hanzi];
	const { clauses, aligned } = splitSyllables(word.pinyin, hanzi.length);
	if (!aligned) return { missing: hanzi };
	const slots: { char: string; syl: string; tone: number }[] = [];
	for (const s of clauses.flat()) {
		if (s.erhua) {
			slots.push({ char: hanzi[s.charIndex], syl: s.syl.slice(0, -1), tone: -1 });
			slots.push({ char: hanzi[s.charIndex + 1], syl: 'ér', tone: -1 });
			continue;
		}
		slots.push({ char: hanzi[s.charIndex], syl: s.syl, tone: s.tone });
	}
	const missing: string[] = [];
	const out: string[] = [];
	for (const { char, syl, tone } of slots) {
		const readings = chars[char]?.readings ?? [];
		const exact = syl.normalize('NFC').toLowerCase();
		const hit =
			tone === 0
				? readings.find((r) => !r.rare && strip(r.pinyin) === strip(syl))
				: readings.find((r) => r.pinyin.normalize('NFC').toLowerCase() === exact);
		if (hit) out.push(hit.hanviet);
		else missing.push(char);
	}
	return missing.length ? { missing } : { hanviet: out.join(' ') };
}
