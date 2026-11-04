import { issue, pathOf } from '../util';
import type { ContentSet } from '../types';

export const hanviet = (set: ContentSet) =>
	set.chars.flatMap(({ file, value }) =>
		value.readings.flatMap((r, i) =>
			r.hanviet.trim() === '' || r.hanviet.trim() === '—'
				? [
						issue(
							1,
							file,
							pathOf(['readings', i, 'hanviet']),
							`Char ${value.hanzi} reading ${r.pinyin} has no Hán Việt`
						)
					]
				: []
		)
	);
