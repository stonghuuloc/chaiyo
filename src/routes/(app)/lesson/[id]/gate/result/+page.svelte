<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import GateResult from '../GateResult.svelte';
	import { clearGateResult, readGateResult } from '../handoff';
	import { pinyinLookup, resultView, reviewRows, type ResultView, type ReviewRow } from '../result';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const id = $derived(data.lesson.lesson.id);
	let shown = $state<{ view: ResultView; rows: ReviewRow[] }>();

	onMount(() => {
		const h = readGateResult(sessionStorage, id);
		if (!h) {
			void goto(resolve('/(app)/lesson/[id]', { id }), { replace: true });
			return;
		}
		shown = {
			view: resultView(h),
			rows: reviewRows(h.steps, h.answers, pinyinLookup(data.lesson))
		};
	});

	const leave = () => clearGateResult(sessionStorage);

	function retry() {
		leave();
		void goto(resolve('/(app)/lesson/[id]/gate', { id }), { replace: true });
	}
</script>

<svelte:head><title>{m.gate_result_title({ n: shown?.view.n ?? '' })}</title></svelte:head>

{#if shown}
	<GateResult view={shown.view} rows={shown.rows} lesson={id} onretry={retry} onleave={leave} />
{/if}
