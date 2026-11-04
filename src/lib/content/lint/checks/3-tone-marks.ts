import { badPinyin, issue, pathOf } from '../util';
import type { ContentSet, LintError } from '../types';
import type { Sentence } from '../../schemas';

export const toneMarks = (set: ContentSet): LintError[] => {
	const errors: LintError[] = [];
	const scan = (file: string, path: (string | number)[], value: string | undefined) => {
		const problem = value === undefined ? null : badPinyin(value);
		if (problem)
			errors.push(
				issue(
					3,
					file,
					pathOf(path),
					`Pinyin "${value}" has ${problem === 'digit' ? 'a tone digit' : 'no tone mark'}`
				)
			);
	};
	const scanSentence = (file: string, prefix: (string | number)[], s: Sentence) => {
		scan(file, [...prefix, 'pinyin'], s.pinyin);
		scan(file, [...prefix, 'spoken'], s.spoken);
		s.unknown?.forEach((u, i) => scan(file, [...prefix, 'unknown', i, 'pinyin'], u.pinyin));
	};
	for (const { file, value } of set.words) {
		scan(file, ['pinyin'], value.pinyin);
		scan(file, ['spoken'], value.spoken);
		value.parts?.forEach((p, i) => scan(file, ['parts', i, 'pinyin'], p.pinyin));
		value.collocations?.forEach((c, i) => scan(file, ['collocations', i, 'pinyin'], c.pinyin));
	}
	for (const { file, value } of set.chars)
		value.readings.forEach((r, i) => scan(file, ['readings', i, 'pinyin'], r.pinyin));
	for (const { file, value } of set.lessons)
		if (!('kind' in value))
			value.sentences.forEach((s, i) => scanSentence(file, ['sentences', i], s));
	for (const { file, value } of set.sentences) value.forEach((s, i) => scanSentence(file, [i], s));
	return errors;
};
