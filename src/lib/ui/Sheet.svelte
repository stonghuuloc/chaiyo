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
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-scrim"
		transition:scrimFade={{ reduced }}
		onclick={() => onclose()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="w-full max-w-column rounded-t-action border-t border-ruled-line bg-background px-5 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+--spacing(5))] text-text outline-none"
			role="dialog"
			aria-modal="true"
			aria-labelledby="{uid}-title"
			tabindex="-1"
			use:modal={onclose}
			transition:sheetSlide={{ reduced }}
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="{uid}-title" class="text-headline">{title}</h2>
			{@render children()}
		</div>
	</div>
{/if}
