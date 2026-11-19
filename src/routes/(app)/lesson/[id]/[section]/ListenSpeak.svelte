<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { speakSteps } from './listen-speak';

	type Props = { lesson: LessonContent; session: Session | null };
	let { lesson, session }: Props = $props();

	const steps = $derived(speakSteps(lesson));
	let finished = $state(false);
</script>

{#if session === null || steps.length === 0 || finished}
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
			onfinish={() => (finished = true)}
		/>
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
