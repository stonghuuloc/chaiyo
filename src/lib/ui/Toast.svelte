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
		// new message → full duration again
		void [message, actionLabel];
		const timer = setTimeout(() => onclose?.(), duration);
		return () => clearTimeout(timer);
	});

	function act() {
		onaction?.();
		onclose?.();
	}
</script>

{#if open}
	<div
		class="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+--spacing(5))] z-60 flex justify-center"
	>
		<div
			class="pointer-events-auto flex max-w-[calc(100%-40px)] items-center gap-3 rounded-pill bg-ink py-1 pr-1.5 pl-4 font-sans text-toast text-notebook-paper"
			role="status"
			transition:toastRise={{ reduced }}
		>
			<span>{message}</span>
			{#if actionLabel}
				<button
					type="button"
					class="min-h-11 rounded-pill px-3 text-toast font-bold text-white underline underline-offset-3"
					onclick={act}
				>
					{actionLabel}
				</button>
			{/if}
		</div>
	</div>
{/if}
