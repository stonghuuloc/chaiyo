<script lang="ts">
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { modal } from './modal';
	import { dialogPop, scrimFade } from './motion';

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
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="{uid}-title"
			tabindex="-1"
			use:modal={onclose}
			transition:dialogPop={{ reduced }}
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
		align-items: center;
		justify-content: center;
		background: var(--overlay-scrim);
	}

	.dialog {
		width: min(var(--size-dialog-max), calc(100% - 40px));
		padding: var(--spacing-s5) var(--spacing-s4) var(--spacing-s4);
		border-radius: 24px;
		background: var(--color-background);
		box-shadow: var(--overlay-shadow);
		color: var(--color-text);
		text-align: center;
		outline: none;
	}

	h2 {
		font-family: var(--font-headline);
		font-size: var(--text-headline);
		font-weight: var(--text-headline--font-weight);
		line-height: var(--text-headline--line-height);
	}
</style>
