import type { LessonContent } from '#lib/catalog/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';

export const promptWord = (content: LessonContent, ref: string) =>
	content.words.find((w) => w.id === ref || w.hanzi === ref);

export const promptClip = (content: LessonContent, ref: string) =>
	content.sentences.find((s) => s.id === ref)?.audio ?? promptWord(content, ref)?.audio;

const refOf = (prompt: { ref: string } | object) => ('ref' in prompt ? prompt.ref : '');

export function listenSpeakSteps(content: LessonContent): LessonStep[] {
	const { lesson } = content;
	if (!('listenSpeak' in lesson.sections)) return [];

	const steps: LessonStep[] = [];
	for (const item of lesson.sections.listenSpeak.items) {
		if (item.type === 'tone') {
			const ref = refOf(item.prompt);
			const clip = promptClip(content, ref);
			if (!clip) continue;
			const word = promptWord(content, ref);
			const pinyin = word ? (word.spoken ?? word.pinyin) : ref;
			steps.push({
				kind: 'tone',
				id: item.id,
				ask: m.listen_tone_ask(),
				audio: clip,
				answer: item.answer,
				syllable: pinyin.split(/\s+/)[item.syllable] ?? pinyin
			});
		} else if (item.type === 'choice') {
			const vi = item.optionKind === 'vi';
			const audio = promptClip(content, refOf(item.prompt));
			if (item.prompt.kind === 'audio' && !audio) continue;
			steps.push({
				kind: 'choice',
				id: item.id,
				ask: vi ? m.listen_meaning_ask() : m.listen_word_ask(),
				title:
					item.prompt.kind === 'audio'
						? ''
						: 'text' in item.prompt
							? item.prompt.text
							: item.prompt.ref,
				options: item.options,
				answer: item.options[item.answer],
				script: item.optionKind === 'hanzi' ? 'hanzi' : 'text',
				audio
			});
		} else if (item.type === 'readAloud') {
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
