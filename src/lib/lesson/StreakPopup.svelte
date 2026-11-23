<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StudyEvent } from '#lib/study/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Dialog from '#lib/ui/Dialog.svelte';
	import Particles from '#lib/ui/Particles.svelte';
	import { reducedMotion } from '#lib/ui/particles.js';
	import { dayCountedView } from './streak-popup';

	type Props = { events: StudyEvent[] };
	let { events }: Props = $props();

	const view = $derived(dayCountedView(events));
	let open = $state(untrack(() => dayCountedView(events) !== null));
	const motion = !reducedMotion();
</script>

<Dialog open={open && view !== null} title={view?.headline ?? ''} onclose={() => (open = false)}>
	{#if view}
		<svg
			data-part="streak-flame"
			data-motion={motion ? 'flicker' : undefined}
			class="mx-auto mt-3 size-[68px] fill-current text-primary {motion ? 'flicker' : ''}"
			aria-hidden="true"><use href="#i-fill-fire" /></svg
		>
		<p data-part="streak-body" class="mt-3 text-body text-muted">{view.body}</p>
		<ol data-part="streak-week" class="mt-5 grid grid-cols-7 gap-1.5" aria-label={m.chy46s1_week()}>
			{#each view.week as cell (cell.label)}
				<li
					class="grid justify-items-center gap-1.5 text-label {cell.today
						? 'text-text'
						: 'text-muted'}"
					data-ticked={cell.ticked ? '' : undefined}
					data-today={cell.today ? '' : undefined}
				>
					<span
						class="grid size-[30px] place-items-center rounded-full border-[1.5px] {cell.ticked
							? 'border-primary bg-primary text-white'
							: 'border-border'}"
					>
						{#if cell.ticked}
							<svg class="size-[18px] fill-current" aria-hidden="true"
								><use href="#i-bold-check" /></svg
							>
						{/if}
					</span>
					{cell.label}
				</li>
			{/each}
		</ol>
		{#if view.note}
			<p
				data-part="streak-note"
				class="mt-4 rounded-[14px] bg-white p-3 text-left text-body text-graphite"
			>
				{view.note}
			</p>
		{/if}
	{/if}
	<div class="mt-4">
		<Button onclick={() => (open = false)}>{m.done_streak_ok()}</Button>
	</div>
</Dialog>

{#if open && view && motion}
	<Particles kind="ember" />
{/if}

<style>
	@media (prefers-reduced-motion: no-preference) {
		.flicker {
			transform-origin: 50% 90%;
			animation: flick 1.4s infinite;
		}
	}
	@keyframes flick {
		0%,
		100% {
			transform: scale(1) rotate(0);
		}
		30% {
			transform: scale(1.05, 0.97) rotate(-2deg);
		}
		60% {
			transform: scale(0.97, 1.04) rotate(2deg);
		}
	}
</style>
