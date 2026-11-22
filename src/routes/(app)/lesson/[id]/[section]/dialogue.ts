import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedSentence } from '#lib/content/import/sink.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { promptClip } from './listen-speak';

const findSentence = (sentences: ImportedSentence[], id: string): ImportedSentence => {
	const s = sentences.find((x) => x.id === id);
	if (!s) throw new Error(`no sentence ${id}`);
	return s;
};

export function dialogueSteps(c: LessonContent): LessonStep[] {
	if ('kind' in c.lesson) return [];
	const { id, sections } = c.lesson;
	const { parts, questions } = sections.dialogue;

	const steps: LessonStep[] = parts.map((p, i) => ({
		kind: 'dialogue',
		id: `dlg-${id}-${i + 1}`,
		part: i + 1,
		of: parts.length,
		title: p.title ?? '',
		lines: p.lines.map((ref) => {
			const s = findSentence(c.sentences, ref);
			return {
				id: s.id,
				speaker: s.speaker === 'takin' ? 'takin' : 'redpanda',
				hanzi: s.hanzi,
				pinyin: s.pinyin,
				vi: s.vi,
				...(s.audio ? { audio: s.audio } : {})
			};
		})
	}));

	for (const q of questions) {
		if (q.type !== 'choice') continue;
		const answer = q.options[q.answer];
		const said = c.sentences.find((s) => s.hanzi === answer);
		const audio = q.prompt.kind === 'audio' ? promptClip(c, q.prompt.ref) : undefined;
		steps.push({
			kind: 'choice',
			id: q.id,
			ask: m.dialogue_ask(),
			title: q.ask ?? ('text' in q.prompt ? q.prompt.text : ''),
			options: q.options,
			answer,
			script: q.optionKind === 'hanzi' ? 'hanzi' : 'text',
			...(said ? { explain: `${said.pinyin} · ${said.vi}` } : {}),
			...(audio ? { audio } : {})
		});
	}
	return steps;
}
