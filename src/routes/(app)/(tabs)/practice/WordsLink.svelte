<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';

	let { view }: { view: { count: number; hanzi: string[] } } = $props();
</script>

<section data-part="mywords" class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="text-[19px] leading-[1.2] font-semibold">{m.mywords_title()}</h2>
	<a
		data-part="mywords-link"
		href={resolve('/(app)/practice/words')}
		class="mt-2 grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-action border border-ruled-line bg-white/55 px-4 py-3 active:bg-shaded-paper"
	>
		<span>
			<b class="block font-semibold">{m.mywords_count({ n: view.count })}</b>
			{#if view.hanzi.length}
				<span
					data-part="mywords-hanzi"
					class="mt-0.5 block truncate font-hanzi text-[20px] tracking-[.06em] text-graphite"
					>{view.hanzi.join(' ')}</span
				>
			{/if}
		</span>
		<svg class="size-4 flex-none fill-current text-faint-pencil" aria-hidden="true"
			><use href="#i-regular-caret-right" /></svg
		>
	</a>
</section>
