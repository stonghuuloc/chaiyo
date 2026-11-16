<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Ledger } from '#lib/ledger/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import ReportButton from '#lib/report/ReportButton.svelte';
	import Button from '#lib/ui/Button.svelte';
	import FocusFrame from '#lib/ui/FocusFrame.svelte';
	import { toAttempt } from './attempt';
	import { progress } from './progress';
	import { resume } from './resume';
	import { viewOf, type LessonStep } from './steps';
	import type { Answer, Cta, Mode } from './types';

	type Props = {
		steps: LessonStep[];
		mode?: Mode;
		exit: string;
		lesson: string;
		section: string;
		contentSha: string;
		ledger: Ledger;
		onfinish: () => void;
	};
	let {
		steps,
		mode = 'feedback',
		exit,
		lesson,
		section,
		contentSha,
		ledger,
		onfinish
	}: Props = $props();

	const start = untrack(() =>
		resume(ledger.state(), { lesson, section, ids: steps.map((s) => s.id) })
	);
	const run = start.run ?? crypto.randomUUID();
	const answered = new SvelteSet(
		untrack(() => Object.keys(ledger.state().runs[run]?.answers ?? {}))
	);
	let index = $state(start.index);
	let current = $state<Cta | null>(null);
	let busy = false;
	let done = false;
	// A hold's own click (pointer up, Space key up) must not press the button it just swapped in.
	let pressed = false;
	let swallow = false;

	function endHold() {
		if (!pressed) return;
		pressed = false;
		swallow = true;
		current?.hold?.onrelease();
	}

	const p = $derived(progress(answered.size, steps.length));
	const last = $derived(steps.every((s, i) => i === index || answered.has(s.id)));
	const View = $derived(viewOf(steps[index].kind).default);

	async function next(answer?: Answer) {
		if (busy || done) return;
		busy = true;
		try {
			await ledger.record(
				toAttempt(
					answer,
					steps[index].id,
					{ lesson, section, contentSha, run, of: steps.length },
					{ id: crypto.randomUUID(), at: new Date().toISOString() }
				)
			);
		} catch {
			return;
		} finally {
			busy = false;
		}
		current = null;
		answered.add(steps[index].id);
		const following = steps.findIndex((s) => !answered.has(s.id));
		if (following >= 0) {
			index = following;
			return;
		}
		done = true;
		onfinish();
	}
</script>

<svelte:window onblur={() => endHold()} />
<svelte:document onvisibilitychange={() => document.hidden && endHold()} />

<FocusFrame step={index}>
	{#snippet top()}
		<div class="grid grid-cols-[44px_1fr_auto_44px] items-center gap-3">
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
				{#each steps as { id } (id)}
					<i
						class="rounded-sm h-1 {answered.has(id) ? 'bg-lantern-red' : 'bg-ruled-line'}"
						data-on={answered.has(id)}
					></i>
				{/each}
			</div>
			<span class="text-label font-semibold text-graphite tabular-nums">{p.label}</span>
			<ReportButton
				context={{
					lesson,
					step: steps[index].id,
					word: steps[index].card?.word ?? null,
					contentSha
				}}
			/>
		</div>
	{/snippet}

	{#key index}
		<View step={steps[index]} {mode} {last} cta={(c: Cta) => (current = c)} {next} />
	{/key}

	{#snippet actions()}
		<div
			role="presentation"
			class={current?.hold ? 'touch-none select-none' : ''}
			onpointerdown={(e) => {
				swallow = false;
				if (!current?.hold) return;
				e.preventDefault();
				(e.target as Element).setPointerCapture?.(e.pointerId);
				pressed = true;
				current.hold.onpress();
			}}
			onpointerup={() => endHold()}
			onpointercancel={() => endHold()}
			onfocusout={() => endHold()}
			onkeydown={(e) => {
				if (e.key !== ' ' && e.key !== 'Enter') return;
				// A key still held after its hold ended (blocked mic) must not activate the new button.
				if (pressed) {
					e.preventDefault();
					return;
				}
				swallow = false;
				if (!current?.hold) return;
				e.preventDefault();
				if (e.repeat) return;
				pressed = true;
				current.hold.onpress();
			}}
			onkeyup={(e) => {
				if ((e.key !== ' ' && e.key !== 'Enter') || !pressed) return;
				e.preventDefault();
				endHold();
			}}
			onclickcapture={(e) => {
				if (!swallow) return;
				swallow = false;
				e.stopPropagation();
				e.preventDefault();
			}}
			oncontextmenu={(e) => {
				if (current?.hold) e.preventDefault();
			}}
		>
			<Button
				caret={current?.caret}
				disabled={!current || current.disabled}
				onclick={current?.onclick}
			>
				{current?.label ?? ''}
			</Button>
		</div>
		<p class="mt-2 min-h-5 text-center text-label text-graphite">{current?.hint ?? ''}</p>
	{/snippet}
</FocusFrame>
