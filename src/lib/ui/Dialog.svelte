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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-scrim"
		transition:scrimFade={{ reduced }}
		onclick={() => onclose()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="w-[calc(100%-40px)] max-w-dialog rounded-[24px] bg-background px-4 pt-5 pb-4 text-center text-text shadow-overlay outline-none"
			role="dialog"
			aria-modal="true"
			aria-labelledby="{uid}-title"
			tabindex="-1"
			use:modal={onclose}
			transition:dialogPop={{ reduced }}
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="{uid}-title" class="text-action leading-(--text-headline--line-height)">{title}</h2>
			{@render children()}
		</div>
	</div>
{/if}
