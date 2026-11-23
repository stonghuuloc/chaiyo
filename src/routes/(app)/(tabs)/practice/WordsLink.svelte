<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';

	let { view }: { view: { count: number; hanzi: string[] } } = $props();
</script>

<section data-part="mywords" class="flex flex-col gap-3">
	<h2 class="text-headline">{m.mywords_title()}</h2>
	<a
		data-part="mywords-link"
		href={resolve('/(app)/practice/words')}
		class="flex flex-col rounded-cell border border-ruled-line bg-white p-4"
	>
		<b>{m.mywords_count({ n: view.count })}</b>
		{#if view.hanzi.length}
			<span data-part="mywords-hanzi" class="text-label opacity-60">{view.hanzi.join(' ')}</span>
		{/if}
	</a>
</section>
