import { SPEAKERS, VOICE_STYLES } from '../types';
import type { ContentSet, LintError } from '../types';
import { issue, pathOf } from '../util';

export const audio = (set: ContentSet): LintError[] => {
	const errors: LintError[] = [];
	const lessons = set.lessons.flatMap(({ file, value }) =>
		'kind' in value ? [] : [{ file, value }]
	);
	const byId = new Map(
		[...set.sentences.flatMap((s) => s.value), ...lessons.flatMap((l) => l.value.sentences)].map(
			(s) => [s.id, s]
		)
	);
	const inline = new Set(lessons.flatMap((l) => l.value.sentences));
	for (const { file, value } of lessons) {
		value.sentences.forEach((s, i) => {
			if (s.speaker !== undefined && !SPEAKERS.includes(s.speaker))
				errors.push(
					issue(
						9,
						file,
						pathOf(['sentences', i, 'speaker']),
						`Speaker ${s.speaker} is not a speaking voice (${SPEAKERS.join(', ')})`
					)
				);
			if (s.style === undefined) return;
			const styles = s.speaker === undefined ? undefined : VOICE_STYLES[s.speaker];
			if (!styles)
				errors.push(
					issue(9, file, pathOf(['sentences', i, 'style']), 'A style needs a speaking voice')
				);
			else if (!styles.includes(s.style))
				errors.push(
					issue(
						9,
						file,
						pathOf(['sentences', i, 'style']),
						`Style ${s.style} is not a style of ${s.speaker} (${styles.join(', ')})`
					)
				);
		});
		value.sections.dialogue.parts.forEach((part, p) => {
			const voices = new Set<string>();
			part.lines.forEach((id, l) => {
				const sentence = byId.get(id);
				if (!sentence) return;
				if (sentence.speaker === undefined)
					errors.push(
						issue(
							9,
							file,
							pathOf(['sections', 'dialogue', 'parts', p, 'lines', l]),
							`Dialogue line ${id} has no speaker`
						)
					);
				else if (SPEAKERS.includes(sentence.speaker)) voices.add(sentence.speaker);
				else if (!inline.has(sentence))
					errors.push(
						issue(
							9,
							file,
							pathOf(['sections', 'dialogue', 'parts', p, 'lines', l]),
							`Speaker ${sentence.speaker} is not a speaking voice (${SPEAKERS.join(', ')})`
						)
					);
			});
			if (voices.size < 2)
				errors.push(
					issue(
						9,
						file,
						pathOf(['sections', 'dialogue', 'parts', p]),
						`Dialogue part has ${voices.size} distinct voice(s), needs at least 2`
					)
				);
		});
	}
	return errors;
};
