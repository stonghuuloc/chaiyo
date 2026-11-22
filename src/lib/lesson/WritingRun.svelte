<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Ledger } from '#lib/ledger/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import Done from './Done.svelte';
	import { sectionName } from './done';
	import { resume } from './resume';
	import StepRunner from './StepRunner.svelte';
	import StreakPopup from './StreakPopup.svelte';
	import { joinChars, practised, skippedFrom, writingSteps } from './writing';

	type Props = {
		chars: string[];
		lesson: string;
		contentSha: string;
		ledger: Ledger;
		exit: string;
		next: { label: string; href: string };
	};
	let { chars, lesson, contentSha, ledger, exit, next }: Props = $props();

	const skipped = untrack(() => {
		const state = ledger.state();
		const ids = writingSteps(chars, new Set()).map((s) => s.id);
		const open = resume(state, { lesson, section: 'writing', ids });
		return new SvelteSet(skippedFrom(open.run ? state.runs[open.run].answers : {}, chars));
	});
	const steps = untrack(() => writingSteps(chars, skipped));
	const list = $derived(practised(chars, skipped));
	let events = $state<StudyEvent[] | null>(null);
</script>

{#if events}
	<Done
		title={m.done_title({ name: sectionName('writing') })}
		text={list.length > 0
			? m.writing_done_text({ n: list.length, chars: joinChars(list) })
			: undefined}
		{next}
	/>
	<StreakPopup {events} />
{:else}
	<StepRunner
		{steps}
		{ledger}
		{lesson}
		section="writing"
		{contentSha}
		{exit}
		onfinish={(e) => (events = e)}
	/>
{/if}
