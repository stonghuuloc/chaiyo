<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<section class="mt-5 border-t border-ruled-line pt-6 first:mt-0 first:border-t-0">
	{@render children()}
</section>
