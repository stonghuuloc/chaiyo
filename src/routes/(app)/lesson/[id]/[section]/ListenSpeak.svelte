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
	import { listenSpeakSteps } from './listen-speak';

	type Props = { lesson: LessonContent; session: Session | null };
	let { lesson, session }: Props = $props();

	const steps = $derived(listenSpeakSteps(lesson));
	let events = $state<StudyEvent[] | null>(null);
	const next = $derived.by(() => {
		const id = lesson.lesson.id;
		const d = doneNext(id, 'listenSpeak');
		return {
			label: d.label,
			href: d.section
				? resolve('/(app)/lesson/[id]/[section]', { id, section: d.section })
				: resolve('/(app)/lesson/[id]', { id })
		};
	});
</script>

{#if events}
	<Done title={m.done_title({ name: sectionName('listenSpeak') })} {next} />
	<StreakPopup {events} />
{:else if session === null || steps.length === 0}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await learnerLedger(session)}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then ledger}
		<StepRunner
			{steps}
			{ledger}
			lesson={lesson.lesson.id}
			section="listenSpeak"
			contentSha={lesson.contentSha}
			exit={resolve('/(app)/(tabs)/today')}
			onfinish={(e) => (events = e)}
		/>
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
