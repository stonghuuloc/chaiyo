import { ideographs, issue, pathOf } from '../util';
import type { ContentSet, LintError } from '../types';

export const knownChars = (set: ContentSet): LintError[] => {
	const hanziOf = new Map(set.words.map((w) => [w.value.id, w.value.hanzi]));
	const lessons = set.lessons.flatMap(({ file, value }) =>
		'kind' in value ? [] : [{ file, value }]
	);
	const errors: LintError[] = [];
	for (const { file, value } of lessons) {
		const known = new Set<string>();
		for (const other of lessons) {
			const before =
				other.value.level < value.level ||
				(other.value.level === value.level && other.value.order < value.order);
			if (!before && other.value !== value) continue;
			for (const id of other.value.sections.words.ids)
				for (const c of ideographs(hanziOf.get(id) ?? '')) known.add(c);
		}
		value.sentences.forEach((s, i) => {
			const allowed = new Set(s.unknown?.flatMap((u) => ideographs(u.hanzi)));
			const missing = [...new Set(ideographs(s.hanzi))].filter(
				(c) => !known.has(c) && !allowed.has(c)
			);
			if (missing.length)
				errors.push(
					issue(
						5,
						file,
						pathOf(['sentences', i, 'hanzi']),
						`${missing.join(', ')} not among the known characters of ${value.id}`
					)
				);
		});
	}
	return errors;
};
