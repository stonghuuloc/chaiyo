import { CURRICULUM } from '#lib/curriculum/index.js';
import { m } from '#lib/paraglide/messages.js';
import type { StudyEvent } from '#lib/study/index.js';

const names: Record<string, () => string> = {
	words: m.done_section_words,
	grammar: m.done_section_grammar,
	dialogue: m.done_section_dialogue,
	listenSpeak: m.done_section_listenSpeak,
	writing: m.done_section_writing
};

export function dayCounted(events: StudyEvent[]): number | null {
	const e = events.find((x) => x.type === 'DayCounted');
	return e ? e.streak : null;
}

export function nextSection(lessonId: string, sectionId: string): string | null {
	const sections = CURRICULUM.lessons.find((l) => l.id === lessonId)?.sections ?? [];
	const i = sections.indexOf(sectionId);
	return i >= 0 && i < sections.length - 1 ? sections[i + 1] : null;
}

export function sectionName(sectionId: string): string {
	return names[sectionId]?.() ?? sectionId;
}

export function doneNext(
	lessonId: string,
	sectionId: string
): { label: string; section: string | null } {
	const section = nextSection(lessonId, sectionId);
	return { label: section ? m.done_next() : m.done_back(), section };
}
