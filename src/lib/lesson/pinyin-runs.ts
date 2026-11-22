export type Run = { text: string; pinyin: boolean };

const WORD = /[\p{L}\p{M}]+/gu;
const PINYIN_VOWEL = /[āēīōūǖǎěǐǒǔǚǘǜ]/u;

export function pinyinRuns(text: string): Run[] {
	const runs: Run[] = [];
	const push = (chunk: string, pinyin: boolean) => {
		if (!chunk) return;
		const last = runs.at(-1);
		if (last && last.pinyin === pinyin) last.text += chunk;
		else runs.push({ text: chunk, pinyin });
	};
	let at = 0;
	for (const word of text.matchAll(WORD)) {
		push(text.slice(at, word.index), false);
		push(word[0], PINYIN_VOWEL.test(word[0]));
		at = word.index + word[0].length;
	}
	push(text.slice(at), false);
	return runs;
}
