import { deriveSpoken } from '../../derive/spoken';
import { issue, pathOf } from '../util';
import type { ContentSet, LintError } from '../types';
import type { Sentence } from '../../schemas';

export const sandhi = (set: ContentSet): LintError[] => {
	const errors: LintError[] = [];
	const scan = (file: string, prefix: (string | number)[], list: Sentence[]) =>
		list.forEach((s, i) => {
			if (!s.spoken || !/[一不]/.test(s.hanzi)) return;
			const expected = deriveSpoken(s.pinyin, s.hanzi);
			if (s.spoken.normalize('NFC') !== expected.normalize('NFC'))
				errors.push(
					issue(
						4,
						file,
						pathOf([...prefix, i, 'spoken']),
						`spoken "${s.spoken}" differs from the derived sandhi "${expected}" for ${s.hanzi}`
					)
				);
		});
	for (const { file, value } of set.lessons)
		if (!('kind' in value)) scan(file, ['sentences'], value.sentences);
	for (const { file, value } of set.sentences) scan(file, [], value);
	return errors;
};
