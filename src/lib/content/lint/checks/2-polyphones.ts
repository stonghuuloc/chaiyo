import { issue } from '../util';
import type { ContentSet, LintRefs } from '../types';

export const polyphones = (set: ContentSet, refs: LintRefs) =>
	set.chars.flatMap(({ file, value }) => {
		const expected = refs.polyphones.get(value.hanzi);
		if (!expected) return [];
		const have = new Set(value.readings.map((r) => r.pinyin.normalize('NFC')));
		const missing = expected.filter((p) => !have.has(p.normalize('NFC')));
		return missing.length
			? [issue(2, file, 'readings', `Char ${value.hanzi} lacks reading(s): ${missing.join(', ')}`)]
			: [];
	});
