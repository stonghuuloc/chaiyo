<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { catalog } from '#lib/catalog/app.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import Done from '#lib/lesson/Done.svelte';
	import { doneNext, sectionName } from '#lib/lesson/done.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import StreakPopup from '#lib/lesson/StreakPopup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import { previousLessonId, warmupScore, warmupSteps, warmupWords } from './warmup';

	type Props = { lesson: LessonContent; session: Session | null };
	let { lesson, session }: Props = $props();

	const id = $derived(lesson.lesson.id);
	let events = $state<StudyEvent[] | null>(null);
	let right = $state(0);

	const load = async (s: Session, lessonId: string) => {
		const ledger = await learnerLedger(s);
		const state = ledger.state();
		const prevId = previousLessonId(state.curriculum, lessonId);
		if (!prevId) return null;
		const prev = await catalog.lesson(prevId);
		const steps = warmupSteps(prev, warmupWords(state, lessonId, new Date(), state.tz));
		if (steps.length === 0) return null;
		const before = new Set(
			Object.entries(state.runs)
				.filter(([, r]) => r.closed)
				.map(([run]) => run)
		);
		return { ledger, steps, before, contentSha: prev.contentSha };
	};

	const next = $derived.by(() => {
		const d = doneNext(id, 'warmup');
		return {
			label: d.label,
			href: d.section
				? resolve('/(app)/lesson/[id]/[section]', { id, section: d.section })
				: resolve('/(app)/lesson/[id]', { id })
		};
	});
</script>

{#if events}
	<Done
		title={m.done_title({ name: sectionName('warmup') })}
		text={right < 6
			? m.warmup_done_miss({ k: right, total: 6 })
			: m.warmup_done_all({ k: right, total: 6 })}
		{next}
	/>
	<StreakPopup {events} />
{:else if session === null}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await load(session, id)}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then ready}
		{#if ready}
			<StepRunner
				steps={ready.steps}
				ledger={ready.ledger}
				lesson={id}
				section="warmup"
				contentSha={ready.contentSha}
				exit={resolve('/(app)/(tabs)/today')}
				onfinish={(e) => {
					right = warmupScore(ready.before, ready.ledger.state(), id);
					events = e;
				}}
			/>
		{:else}
			<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
		{/if}
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
