<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import { onMount, untrack } from 'svelte';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import Done from '#lib/lesson/Done.svelte';
	import { DisplayPrefs, setPrefs } from '#lib/lesson/prefs.svelte.js';
	import { doneNext, sectionName } from '#lib/lesson/done.js';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import StreakPopup from '#lib/lesson/StreakPopup.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import { grammarSteps } from './grammar';

	type Props = {
		lesson: LessonContent;
		session: Session | null;
		ledger?: Promise<Ledger>;
		prefs?: DisplayPrefs;
	};
	let { lesson, session, ledger, prefs: given }: Props = $props();
	const prefs = untrack(() => {
		const uid = session?.user.id;
		return (
			given ??
			new DisplayPrefs({
				level: lesson.lesson.level,
				key: `chaiyo-prefs-${uid ?? 'local'}`,
				uid,
				client: uid ? supabase : undefined,
				storage: localStorage
			})
		);
	});
	setPrefs(prefs);
	onMount(() => void prefs.load());

	const steps = $derived(grammarSteps(lesson));
	const opened = $derived(ledger ?? (session ? learnerLedger(session) : null));
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

{#if opened === null || steps.length === 0}
	<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
{:else}
	{#await opened}
		<h1 class="mt-5 font-display text-headline">{m.screen_lesson_section()}</h1>
	{:then l}
		{#if events}
			<Done title={m.done_title({ name: sectionName('grammar') })} text={done} {next} />
			<StreakPopup {events} />
		{:else}
			<StepRunner
				{steps}
				ledger={l}
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
