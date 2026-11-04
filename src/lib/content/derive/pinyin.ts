const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' } as const;
const VOWELS = 'aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
const SYLLABLE = new RegExp(`^(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${VOWELS}]+(?:ng|n)?$`);
const ER = /^[eēéěè]r$/;
const MAX_SPLITS = 200;

export type Tone = 0 | 1 | 2 | 3 | 4;
export type Syllable = { syl: string; tone: Tone; charIndex: number; start: number; erhua?: true };

const MARK_KEYS = ['a', 'e', 'i', 'o', 'u', 'ü'] as const;
const TONES = [1, 2, 3, 4] as const;

const toneOf = (syl: string) => {
	for (const [i, c] of [...syl].entries())
		for (const v of MARK_KEYS) {
			const tone = TONES[MARKS[v].indexOf(c.toLowerCase())];
			if (tone !== undefined) return { tone, i, v };
		}
	return null;
};

export const withTone = (syl: string, tone: 1 | 2 | 3 | 4) => {
	const m = toneOf(syl);
	if (!m) return syl;
	const chars = [...syl];
	const replaced = MARKS[m.v][tone - 1];
	chars[m.i] = chars[m.i] === chars[m.i].toLowerCase() ? replaced : replaced.toUpperCase();
	return chars.join('');
};

type Piece = { start: number; end: number; erhua?: true };

const MARKED = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

const walkSplits = (run: string, allowEr: boolean): Piece[][] => {
	const out: Piece[][] = [];
	const walk = (pos: number, acc: Piece[]) => {
		if (out.length >= MAX_SPLITS) return;
		if (pos === run.length) return void out.push(acc);
		for (let end = run.length; end > pos; end--) {
			const piece = run.slice(pos, end);
			if (VOWELS.includes(piece[0]) && pos > 0) continue;
			if (!SYLLABLE.test(piece) && !(allowEr && pos === 0 && ER.test(piece))) continue;
			if ([...piece].filter((c) => MARKED.test(c)).length > 1) continue;
			walk(end, [...acc, { start: pos, end }]);
		}
	};
	walk(0, []);
	return out;
};

const splitRun = (run: string): Piece[][] => {
	const whole = walkSplits(run, true);
	if (whole.length || run.length < 2 || !run.endsWith('r')) return whole;
	const stem = run.slice(0, -1);
	return walkSplits(stem, true)
		.filter((s) => !ER.test(stem.slice(s[s.length - 1].start, s[s.length - 1].end)))
		.map((s) => [...s.slice(0, -1), { ...s[s.length - 1], end: run.length, erhua: true as const }]);
};

export function splitSyllables(
	pinyin: string,
	charCount: number
): { clauses: Syllable[][]; aligned: boolean } {
	const text = pinyin.normalize('NFC');
	const lower = text.toLowerCase();
	const clauses: { start: number; end: number }[][] = [[]];
	let runStart = -1;
	const closeRun = (at: number) => {
		if (runStart < 0) return;
		clauses[clauses.length - 1].push({ start: runStart, end: at });
		runStart = -1;
	};
	for (const [i, c] of [...text].entries()) {
		if (/\p{L}/u.test(c)) {
			if (runStart < 0) runStart = i;
			continue;
		}
		closeRun(i);
		if (!/[\s'’]/.test(c)) clauses.push([]);
	}
	closeRun(text.length);

	const units = clauses.flatMap((clause, ci) =>
		clause.map((r) => {
			const run = lower.slice(r.start, r.end);
			const options = splitRun(run);
			return {
				ci,
				base: r.start,
				options: options.length ? options : [[{ start: 0, end: run.length }]]
			};
		})
	);
	const weight = (o: Piece[]) => o.reduce((n, p) => n + (p.erhua ? 2 : 1), 0);

	const memo = new Map<string, number[] | null>();
	const pick = (u: number, left: number): number[] | null => {
		if (u === units.length) return left === 0 ? [] : null;
		const key = `${u}:${left}`;
		const cached = memo.get(key);
		if (cached !== undefined) return cached;
		let found: number[] | null = null;
		for (const [oi, o] of units[u].options.entries()) {
			const rest = pick(u + 1, left - weight(o));
			if (rest) {
				found = [oi, ...rest];
				break;
			}
		}
		memo.set(key, found);
		return found;
	};
	const chosen = pick(0, charCount);
	const aligned = chosen !== null;

	const result: Syllable[][] = clauses.map(() => []);
	let charIndex = 0;
	for (const [u, unit] of units.entries()) {
		for (const p of unit.options[chosen?.[u] ?? 0]) {
			const start = unit.base + p.start;
			const syl = text.slice(start, unit.base + p.end);
			result[unit.ci].push({
				syl,
				tone: toneOf(syl)?.tone ?? 0,
				charIndex,
				start,
				...(p.erhua && { erhua: true as const })
			});
			charIndex += p.erhua ? 2 : 1;
		}
	}
	return { clauses: result.filter((c) => c.length), aligned };
}
