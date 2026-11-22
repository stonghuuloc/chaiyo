<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import Done from '#lib/lesson/Done.svelte';
	import { doneNext, sectionName } from '#lib/lesson/done.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import StreakPopup from '#lib/lesson/StreakPopup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import { grammarSteps } from './grammar';

	type Props = { lesson: LessonContent; session: Session | null };
	let { lesson, session }: Props = $props();

	const steps = $derived(grammarSteps(lesson));
	const done = $derived('kind' in lesson.lesson ? '' : (lesson.lesson.sections.grammar.done ?? ''));
	let events = $state<StudyEvent[] | null>(null);
	const next = $derived.by(() => {
		const id = lesson.lesson.id;
		const d = doneNext(id, 'grammar');
		return {
			label: d.label,
			href: d.section
				? resolve('/(app)/lesson/[id]/[section]', { id, section: d.section })
				: resolve('/(app)/lesson/[id]', { id })
		};
	});
</script>

{#if session === null || steps.length === 0}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await learnerLedger(session)}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then ledger}
		{#if events}
			<Done title={m.done_title({ name: sectionName('grammar') })} text={done} {next} />
			<StreakPopup {events} />
		{:else}
			<StepRunner
				{steps}
				{ledger}
				lesson={lesson.lesson.id}
				section="grammar"
				contentSha={lesson.contentSha}
				exit={resolve('/(app)/(tabs)/today')}
				onfinish={(e) => (events = e)}
			/>
		{/if}
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
