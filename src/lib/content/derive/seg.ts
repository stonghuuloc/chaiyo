import type { Sentence } from '../schemas';
import type { ThinEntry } from './dictionary';

export function segment(
	text: string,
	lessonWords: ReadonlySet<string>,
	dict: ReadonlyMap<string, ThinEntry>
): string[] {
	const cps = [...text];
	const max = Math.max(
		1,
		...[...lessonWords].map((w) => [...w].length),
		...[...dict.keys()].map((w) => [...w].length)
	);
	const tokens = new Array<number>(cps.length + 1).fill(0);
	const covered = new Array<number>(cps.length + 1).fill(0);
	const take = new Array<number>(cps.length + 1).fill(1);
	for (let i = cps.length - 1; i >= 0; i--) {
		let bestTokens = Infinity;
		let bestCovered = -1;
		for (let n = Math.min(max, cps.length - i); n >= 1; n--) {
			const word = cps.slice(i, i + n).join('');
			const isLesson = lessonWords.has(word);
			if (n > 1 && !isLesson && !dict.has(word)) continue;
			const t = tokens[i + n] + 1;
			const c = covered[i + n] + (isLesson ? n : 0);
			if (t < bestTokens || (t === bestTokens && c > bestCovered)) {
				bestTokens = t;
				bestCovered = c;
				take[i] = n;
			}
		}
		tokens[i] = bestTokens;
		covered[i] = bestCovered;
	}
	const out: string[] = [];
	for (let i = 0; i < cps.length; i += take[i]) out.push(cps.slice(i, i + take[i]).join(''));
	return out;
}

export const deriveSeg = (
	sentence: Pick<Sentence, 'hanzi' | 'seg'>,
	lessonWords: ReadonlySet<string>,
	dict: ReadonlyMap<string, ThinEntry>
): string[] => sentence.seg ?? segment(sentence.hanzi, lessonWords, dict);
