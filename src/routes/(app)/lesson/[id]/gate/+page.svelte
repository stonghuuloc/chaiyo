<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import GateRun from './GateRun.svelte';
	import { gateSteps } from './gate';

	let { data }: PageProps = $props();
	const steps = $derived(gateSteps(data.lesson));
</script>

<svelte:head><title>{m.gate_title()}</title></svelte:head>

{#if data.session === null || steps.length === 0}
	<h1>{m.screen_gate()}</h1>
{:else}
	{#await learnerLedger(data.session)}
		<h1>{m.screen_gate()}</h1>
	{:then ledger}
		<GateRun lesson={data.lesson.lesson.id} contentSha={data.lesson.contentSha} {steps} {ledger} />
	{:catch}
		<h1>{m.screen_gate()}</h1>
	{/await}
{/if}
