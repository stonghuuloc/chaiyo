<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<kbd
	class="hidden h-[22px] min-w-[22px] place-items-center rounded-[6px] border border-b-2 border-ruled-line bg-shaded-paper px-1.5 font-sans text-[12px] leading-none font-semibold text-pencil [@media(hover:hover)_and_(pointer:fine)]:inline-grid"
	aria-hidden="true"
>
	{@render children()}
</kbd>
