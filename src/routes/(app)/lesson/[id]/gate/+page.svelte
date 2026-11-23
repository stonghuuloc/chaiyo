<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import GateRun from './GateRun.svelte';
	import { gateSteps } from './gate';
	import { writeGateResult, type GateHandoff } from './handoff';

	let { data }: PageProps = $props();
	const steps = $derived(gateSteps(data.lesson));

	function ondone(h: GateHandoff) {
		writeGateResult(sessionStorage, h);
		void goto(resolve('/(app)/lesson/[id]/gate/result', { id: h.lesson }), { replace: true });
	}
</script>

<svelte:head><title>{m.gate_title()}</title></svelte:head>

{#if data.session === null || steps.length === 0}
	<h1 class="text-title">{m.screen_gate()}</h1>
{:else}
	{#await learnerLedger(data.session)}
		<h1 class="text-title">{m.screen_gate()}</h1>
	{:then ledger}
		<GateRun
			lesson={data.lesson.lesson.id}
			contentSha={data.lesson.contentSha}
			{steps}
			{ledger}
			{ondone}
		/>
	{:catch}
		<h1 class="text-title">{m.screen_gate()}</h1>
	{/await}
{/if}
