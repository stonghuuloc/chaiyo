<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import FocusFrame from '#lib/ui/FocusFrame.svelte';
	import { progress } from './progress';
	import { viewOf, type LessonStep } from './steps';
	import type { Cta, Mode } from './types';

	type Props = {
		steps: LessonStep[];
		mode?: Mode;
		exit: string;
		lesson: string;
		section: string;
		contentSha: string;
		onfinish: () => void;
	};
	// eslint-disable-next-line svelte/no-unused-props -- lesson, section, contentSha are read by CHY-30.S2
	let { steps, mode = 'feedback', exit, onfinish }: Props = $props();

	let index = $state(0);
	let current = $state<Cta | null>(null);
	let finished = false;

	const p = $derived(progress(index, steps.length));
	const View = $derived(viewOf(steps[index].kind).default);

	function next() {
		current = null;
		if (index < steps.length - 1) {
			index += 1;
			return;
		}
		if (finished) return;
		finished = true;
		onfinish();
	}
</script>

<FocusFrame step={index}>
	{#snippet top()}
		<div class="grid grid-cols-[44px_1fr_auto] items-center gap-3">
			<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass resolve()d paths -->
			<a
				href={exit}
				class="grid size-11 place-items-center rounded-full"
				aria-label={m.lesson_exit_label()}
			>
				<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-regular-x" /></svg>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<div
				data-seg
				class="grid grid-cols-[repeat(var(--n),1fr)] gap-[3px]"
				style="--n:{steps.length}"
			>
				{#each steps as { id }, i (id)}
					<i
						class="rounded-sm h-1 {i < p.on ? 'bg-lantern-red' : 'bg-ruled-line'}"
						data-on={i < p.on}
					></i>
				{/each}
			</div>
			<span class="text-label font-semibold text-graphite tabular-nums">{p.label}</span>
		</div>
	{/snippet}

	{#key index}
		<View
			step={steps[index]}
			{mode}
			last={index === steps.length - 1}
			cta={(c: Cta) => (current = c)}
			{next}
		/>
	{/key}

	{#snippet actions()}
		<Button
			caret={current?.caret}
			disabled={!current || current.disabled}
			onclick={current?.onclick}
		>
			{current?.label ?? ''}
		</Button>
		<p class="mt-2 min-h-5 text-center text-label text-graphite">{current?.hint ?? ''}</p>
	{/snippet}
</FocusFrame>
