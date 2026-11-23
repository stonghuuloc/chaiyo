<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import Dialog from '#lib/ui/Dialog.svelte';
	import Particles from '#lib/ui/Particles.svelte';
	import { reducedMotion } from '#lib/ui/particles.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { FreezeUsedView } from './freeze-popup';

	type Props = { view: FreezeUsedView };
	let { view }: Props = $props();

	let open = $state(true);
	const motion = !reducedMotion();
</script>

<Dialog {open} title={view.headline} onclose={() => (open = false)}>
	<svg
		data-part="freeze-icon"
		data-motion={motion ? 'spin' : undefined}
		class="mx-auto mt-3 size-[68px] fill-current text-freeze-blue {motion ? 'spin' : ''}"
		aria-hidden="true"><use href="#i-fill-snowflake" /></svg
	>
	<p data-part="freeze-body" class="mt-3 text-body text-muted">{view.body}</p>
	<p
		data-part="freeze-note"
		class="mt-4 rounded-[14px] bg-white p-3 text-left text-body text-graphite"
	>
		{view.note}
	</p>
	<div class="mt-4">
		<Button onclick={() => (open = false)}>{m.chy46s2_ok()}</Button>
	</div>
</Dialog>

{#if open && motion}
	<Particles kind="snow" />
{/if}

<style>
	@media (prefers-reduced-motion: no-preference) {
		.spin {
			animation: spin 6s linear infinite;
		}
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
