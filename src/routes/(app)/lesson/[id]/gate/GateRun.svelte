<script lang="ts">
	import type { Ledger } from '#lib/ledger/index.js';
	import Done from '#lib/lesson/Done.svelte';
	import StepRunner from '#lib/lesson/StepRunner.svelte';
	import type { LessonStep } from '#lib/lesson/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';

	type Props = { lesson: string; contentSha: string; steps: LessonStep[]; ledger: Ledger };
	let { lesson, contentSha, steps, ledger }: Props = $props();

	let submitted = $state(false);
	const hub = $derived(resolve('/(app)/lesson/[id]', { id: lesson }));
</script>

{#if submitted}
	<Done title={m.gate_submitted()} next={{ label: m.gate_back(), href: hub }} />
{:else}
	<StepRunner
		{steps}
		{ledger}
		{lesson}
		{contentSha}
		mode="test"
		section="gate"
		fresh
		note={m.gate_hint()}
		confirmExit={{
			label: m.gate_exit_label(),
			title: m.gate_exit_title(),
			body: m.gate_exit_body(),
			leave: m.gate_exit_leave(),
			keep: m.gate_exit_keep()
		}}
		exit={hub}
		onfinish={() => (submitted = true)}
	/>
{/if}
