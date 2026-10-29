<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import { toastRise } from './motion';

	type Props = {
		open: boolean;
		message: string;
		actionLabel?: string;
		onaction?: () => void;
		onclose?: () => void;
		duration?: number;
	};
	let { open, message, actionLabel, onaction, onclose, duration = 4500 }: Props = $props();
	const reduced = $derived(prefersReducedMotion.current);

	$effect(() => {
		if (!open) return;
		const timer = setTimeout(() => onclose?.(), duration);
		return () => clearTimeout(timer);
	});

	function act() {
		onaction?.();
		onclose?.();
	}
</script>

{#if open}
	<div class="dock">
		<div class="toast" role="status" transition:toastRise={{ reduced }}>
			<span>{message}</span>
			{#if actionLabel}<button type="button" onclick={act}>{actionLabel}</button>{/if}
		</div>
	</div>
{/if}

<style>
	.dock {
		position: fixed;
		inset-inline: 0;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
		z-index: 60;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--spacing-s3);
		max-width: calc(100% - 40px);
		padding: 4px 6px 4px var(--spacing-s4);
		border-radius: var(--radius-pill);
		background: var(--color-ink);
		color: var(--color-notebook-paper);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		pointer-events: auto;
	}

	button {
		min-height: 44px;
		padding: 0 var(--spacing-s3);
		border-radius: var(--radius-pill);
		color: var(--color-white);
		font-size: 14px;
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
