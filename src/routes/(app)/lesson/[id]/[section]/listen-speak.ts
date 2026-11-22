import type { LessonContent } from '#lib/catalog/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';

// S2 shows the speaking items only; CHY-34.S1 adds the tone and choice ones.
export function speakSteps(content: LessonContent): LessonStep[] {
	const { lesson } = content;
	if (!('listenSpeak' in lesson.sections)) return [];

	const steps: LessonStep[] = [];
	for (const item of lesson.sections.listenSpeak.items) {
		if (item.type === 'readAloud') {
			const sentence = content.sentences.find((s) => s.id === item.sentence);
			if (!sentence) continue;
			steps.push({
				kind: 'speak',
				id: item.id,
				ask: m.lesson_speak_read_ask(),
				title: m.lesson_speak_read_title(),
				hanzi: sentence.hanzi,
				pinyin: sentence.spoken ?? sentence.pinyin,
				meaning: sentence.vi
			});
		} else if (item.type === 'freeAnswer') {
			steps.push({
				kind: 'speak',
				id: item.id,
				ask: m.lesson_speak_answer_ask(),
				title: 'text' in item.prompt ? item.prompt.text : item.prompt.ref
			});
		}
	}
	return steps;
}
