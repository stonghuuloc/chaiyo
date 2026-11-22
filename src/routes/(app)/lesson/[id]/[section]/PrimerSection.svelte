<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import Done from '#lib/lesson/Done.svelte';
	import { doneNext, sectionName } from '#lib/lesson/done.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import StreakPopup from '#lib/lesson/StreakPopup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { closedRuns, primerScore, primerSteps } from './primer';

	type Props = { lesson: LessonContent; session: Session | null; ledger?: Promise<Ledger> };
	let { lesson, session, ledger }: Props = $props();

	const id = $derived(lesson.lesson.id);
	const section = $derived(page.params.section ?? '');
	const steps = $derived(primerSteps(lesson, section));
	const opened = $derived(ledger ?? (session ? learnerLedger(session) : null));
	let events = $state<StudyEvent[] | null>(null);
	let score = $state<{ n: number; total: number } | null>(null);
	const next = $derived.by(() => {
		const d = doneNext(id, section);
		return {
			label: d.label,
			href: d.section
				? resolve('/(app)/lesson/[id]/[section]', { id, section: d.section })
				: resolve('/(app)/lesson/[id]', { id })
		};
	});

	const finish = (l: Ledger, before: Set<string>, e: StudyEvent[]) => {
		const drills = steps.filter((s) => s.kind === 'choice').map((s) => s.id);
		score = primerScore(l.state(), before, id, section, drills);
		events = e;
	};
</script>

{#if opened === null || steps.length === 0}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await opened}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then l}
		{@const before = closedRuns(l.state(), id, section)}
		{#if events}
			<Done
				title={m.done_title({ name: sectionName(section) })}
				text={score ? m.primer_done_score(score) : undefined}
				{next}
			/>
			<StreakPopup {events} />
		{:else}
			<StepRunner
				{steps}
				ledger={l}
				lesson={id}
				{section}
				contentSha={lesson.contentSha}
				exit={resolve('/(app)/(tabs)/today')}
				onfinish={(e) => finish(l, before, e)}
			/>
		{/if}
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
