import type { Component } from 'svelte';
import type { Session } from '@supabase/supabase-js';
import type { LessonContent } from '#lib/catalog/index.js';
import GrammarSection from './GrammarSection.svelte';

// One line per section id; an id with no entry keeps the placeholder.
export const sections: Record<
	string,
	Component<{ lesson: LessonContent; session: Session | null }>
> = {
	grammar: GrammarSection
};
