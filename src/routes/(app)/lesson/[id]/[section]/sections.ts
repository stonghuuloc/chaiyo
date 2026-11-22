import type { Component } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import type { LessonContent } from '#lib/catalog/index.js';
import DialogueSection from './DialogueSection.svelte';
import GrammarSection from './GrammarSection.svelte';
import ListenSpeak from './ListenSpeak.svelte';
import PrimerSection from './PrimerSection.svelte';
import WordsSection from './WordsSection.svelte';
import WarmupSection from './WarmupSection.svelte';
import WritingSection from './WritingSection.svelte';

// One line per section id; an id with no entry keeps the placeholder.
export const sections: Record<
	string,
	Component<{ lesson: LessonContent; session: Session | null }>
> = {
	words: WordsSection,
	grammar: GrammarSection,
	dialogue: DialogueSection,
	listenSpeak: ListenSpeak,
	writing: WritingSection,
	warmup: WarmupSection,
	tones: PrimerSection,
	finals: PrimerSection,
	initials: PrimerSection,
	spelling: PrimerSection,
	sandhi: PrimerSection
};
