<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { doneNext } from '#lib/lesson/done.js';
	import WritingRun from '#lib/lesson/WritingRun.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';

	type Props = { lesson: LessonContent; session: Session | null };
	let { lesson, session }: Props = $props();

	const chars = $derived(
		'writing' in lesson.lesson.sections ? lesson.lesson.sections.writing.chars : []
	);
	const next = $derived.by(() => {
		const id = lesson.lesson.id;
		const d = doneNext(id, 'writing');
		return {
			label: d.label,
			href: d.section
				? resolve('/(app)/lesson/[id]/[section]', { id, section: d.section })
				: resolve('/(app)/lesson/[id]', { id })
		};
	});
</script>

{#if session === null || chars.length === 0}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await learnerLedger(session)}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then ledger}
		<WritingRun
			{chars}
			{ledger}
			{next}
			lesson={lesson.lesson.id}
			contentSha={lesson.contentSha}
			exit={resolve('/(app)/(tabs)/today')}
		/>
	{:catch}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{/await}
{/if}
