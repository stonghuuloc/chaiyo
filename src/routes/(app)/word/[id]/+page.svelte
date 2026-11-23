<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import ReportButton from '#lib/report/ReportButton.svelte';
	import type { PageProps } from './$types';
	import WordEntry from './WordEntry.svelte';

	let { data }: PageProps = $props();
	let inApp = false;
	afterNavigate(({ from, type }) => {
		inApp ||= from !== null && type !== 'popstate';
	});
	snapshot({
		capture: () => inApp,
		restore: (value) => {
			inApp = value;
		}
	});

	function back(e: MouseEvent) {
		if (!inApp) return;
		e.preventDefault();
		history.back();
	}
</script>

<a href={resolve('/(app)/practice/words')} onclick={back}>{m.chy43s2_back()}</a>
<h1 class="text-title">{m.screen_word()}</h1>

{#if 'notFound' in data.word}
	<p>{m.word_not_found()}</p>
{:else}
	{#key data.id}
		<WordEntry view={data.word} />
	{/key}
	{#if data.report}
		<ReportButton context={data.report} />
	{/if}
{/if}
