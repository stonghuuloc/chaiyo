<script lang="ts">
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { modal } from './modal';
	import { scrimFade, sheetSlide } from './motion';

	type Props = { open: boolean; title: string; onclose?: () => void; children: Snippet };
	let { open, title, onclose = () => {}, children }: Props = $props();
	const uid = $props.id();
	const reduced = $derived(prefersReducedMotion.current);
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="scrim" transition:scrimFade={{ reduced }} onclick={() => onclose()}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-labelledby="{uid}-title"
			tabindex="-1"
			use:modal={onclose}
			transition:sheetSlide={{ reduced }}
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="{uid}-title">{title}</h2>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background: var(--overlay-scrim);
	}

	.sheet {
		width: min(var(--size-column), 100%);
		padding: var(--spacing-s6) var(--spacing-s5)
			calc(env(safe-area-inset-bottom, 0px) + var(--spacing-s5));
		border-top: 1px solid var(--color-ruled-line);
		border-radius: var(--radius-action) var(--radius-action) 0 0;
		background: var(--color-background);
		color: var(--color-text);
		outline: none;
	}

	h2 {
		font-family: var(--font-headline);
		font-size: var(--text-headline);
		font-weight: var(--text-headline--font-weight);
		line-height: var(--text-headline--line-height);
	}
</style>
