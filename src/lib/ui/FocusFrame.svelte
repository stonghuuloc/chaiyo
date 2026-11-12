<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	// Focus-flow template (ADR 0008 §4): sticky top bar, one centred column, sticky action bar.
	type Props = {
		step?: unknown;
		narrow?: boolean;
		wide?: boolean;
		top?: Snippet;
		actions?: Snippet;
		children: Snippet;
	};
	let { step, narrow = false, wide = false, top, actions, children }: Props = $props();
	let column: HTMLElement | undefined = $state();
	let first = true;

	$effect(() => {
		void step;
		if (first) {
			first = false;
			return;
		}
		void tick().then(() => {
			const heading = column?.querySelector<HTMLElement>('[data-step-heading], h1, h2');
			if (!heading) return;
			heading.tabIndex = -1;
			heading.focus({ preventScroll: true });
		});
	});
</script>

<div
	class="frame {wide ? 'lg:[--col:calc(var(--container-narrow)+var(--container-form)+80px)]!' : ''}"
	class:narrow
>
	{#if top}
		<header class="top"><div class="in">{@render top()}</div></header>
	{/if}
	<div class="col">
		<div class="body" bind:this={column}>{@render children()}</div>
		{#if actions}<div class="actions">{@render actions()}</div>{/if}
	</div>
</div>

<style>
	/* a focus flow brings its own gutters; the shell's page column must not pad it twice */
	:global(.page-col:has(.frame)) {
		max-width: none;
		padding-inline: 0;
	}

	.frame {
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		--gutter: 20px;
		--col: var(--container-column);
	}

	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-background);
	}

	.in,
	.col {
		width: 100%;
		max-width: calc(var(--col) + 2 * var(--gutter));
		margin-inline: auto;
	}

	.in {
		padding: calc(env(safe-area-inset-top, 0px) + 8px) var(--gutter) 8px calc(var(--gutter) - 8px);
	}

	.col {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 8px var(--gutter) 0;
	}

	.body {
		flex: 1;
	}

	.actions {
		position: sticky;
		bottom: 0;
		z-index: 9;
		padding: 16px 0 calc(env(safe-area-inset-bottom, 0px) + 16px);
		background: linear-gradient(transparent, var(--color-background) 22%);
	}

	@media (min-width: 48rem) {
		.frame {
			--gutter: 32px;
			--col: var(--container-medium);
		}

		.frame.narrow {
			--col: var(--container-narrow);
		}
	}

	@media (min-width: 64rem) {
		.frame {
			--gutter: 40px;
			--col: var(--container-main);
		}

		.frame.narrow {
			--col: var(--container-narrow);
		}

		.in {
			padding-top: 20px;
		}

		.frame {
			min-height: 0;
		}

		.col {
			flex: 0 0 auto;
		}

		.body {
			flex: 0 0 auto;
		}

		.actions {
			padding-top: 24px;
		}
	}
</style>
