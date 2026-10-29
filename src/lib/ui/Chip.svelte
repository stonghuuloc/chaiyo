<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="divide-frost inline-flex h-10 items-center gap-3 rounded-pill border-[0.5px] border-frost-edge bg-frost-tint px-4 font-sans text-chip text-ink shadow-frost inset-shadow-frost backdrop-blur-frost backdrop-saturate-(--frost-saturate)"
>
	{@render children()}
</div>
