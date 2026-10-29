<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="chip">{@render children()}</div>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-s3);
		height: 40px;
		padding: 0 var(--spacing-s4);
		border: 0.5px solid var(--frost-edge);
		border-radius: var(--radius-pill);
		background: var(--frost-tint);
		-webkit-backdrop-filter: blur(var(--frost-blur)) saturate(var(--frost-saturate));
		backdrop-filter: blur(var(--frost-blur)) saturate(var(--frost-saturate));
		box-shadow:
			inset 0 1px 0 var(--frost-rim),
			var(--frost-shadow);
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 600;
		line-height: 1;
	}

	.chip > :global(* + *) {
		position: relative;
		padding-left: var(--spacing-s3);
	}

	.chip > :global(* + *)::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 1px;
		height: 18px;
		transform: translateY(-50%);
		background: var(--frost-divider);
	}
</style>
