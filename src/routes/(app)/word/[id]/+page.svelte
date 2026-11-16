<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import WordEntry from './WordEntry.svelte';

	let { data }: PageProps = $props();
</script>

<h1>{m.screen_word()}</h1>

{#if 'notFound' in data.word}
	<p>{m.word_not_found()}</p>
{:else}
	{#key data.word.hanzi}
		<WordEntry view={data.word} />
	{/key}
{/if}
