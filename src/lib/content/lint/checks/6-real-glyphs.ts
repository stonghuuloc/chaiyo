import { issue, pathOf } from '../util';
import type { ContentSet, LintError } from '../types';

const KANGXI = /[\u2E80-\u2FDF]/g;

export const realGlyphs = (set: ContentSet): LintError[] => {
	const errors: LintError[] = [];
	const walk = (file: string, path: (string | number)[], value: unknown) => {
		if (typeof value === 'string') {
			const found = [...new Set(value.match(KANGXI))];
			if (found.length)
				errors.push(
					issue(
						6,
						file,
						pathOf(path),
						`contains radical code point ${found.map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase()).join(', ')}; use the real character`
					)
				);
		} else if (Array.isArray(value)) value.forEach((v, i) => walk(file, [...path, i], v));
		else if (value && typeof value === 'object')
			for (const [k, v] of Object.entries(value)) walk(file, [...path, k], v);
	};
	for (const { file, value } of [
		...set.lessons.filter(({ value }) => !('kind' in value)),
		...set.words,
		...set.chars,
		...set.grammar,
		...set.sentences
	])
		walk(file, [], value);
	return errors;
};
