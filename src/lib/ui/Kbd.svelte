<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<kbd aria-hidden="true">{@render children()}</kbd>

<style>
	kbd {
		display: none;
		height: 22px;
		min-width: 22px;
		place-items: center;
		padding: 0 6px;
		border: 1px solid var(--color-ruled-line);
		border-bottom-width: 2px;
		border-radius: 6px;
		background: var(--color-shaded-paper);
		color: var(--color-pencil);
		font: 600 12px/1 var(--font-sans);
	}

	@media (hover: hover) and (pointer: fine) {
		kbd {
			display: inline-grid;
		}
	}
</style>
