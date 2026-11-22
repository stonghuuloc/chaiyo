<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import { celebrate } from '#lib/ui/celebrate.js';
	import FocusFrame from '#lib/ui/FocusFrame.svelte';
	import type { ResultView, ReviewRow } from './result';

	type Props = {
		view: ResultView;
		rows: ReviewRow[];
		lesson: string;
		onretry: () => void;
		onleave: () => void;
	};
	let { view, rows, lesson, onretry, onleave }: Props = $props();

	const hub = $derived(resolve('/(app)/lesson/[id]', { id: lesson }));

	$effect(() => {
		if (!view.pass) return;
		let stop = () => {};
		const timer = setTimeout(() => (stop = celebrate()), 250);
		return () => {
			clearTimeout(timer);
			stop();
		};
	});
</script>

<FocusFrame step={view.pass}>
	{#snippet top()}
		<div class="grid grid-cols-[44px_1fr_44px] items-center">
			<a
				href={hub}
				class="grid size-11 place-items-center rounded-full"
				aria-label={m.gate_back()}
				onclick={onleave}
			>
				<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-regular-x" /></svg>
			</a>
			<h1 class="text-center font-display text-title">{m.gate_result_title({ n: view.n })}</h1>
			<span></span>
		</div>
	{/snippet}

	<div class="aspect-3/2 overflow-hidden rounded-[24px] bg-shaded-paper">
		<img
			data-part="art"
			class="block size-full object-cover"
			src="/gate/{view.art}.webp"
			alt=""
			width="860"
			height="573"
		/>
	</div>

	<div class="mt-5 flex flex-wrap items-baseline gap-3">
		<b data-part="pct" class="font-display text-[56px] leading-none font-bold">{view.pct}%</b>
		<span data-part="score" class="text-graphite"
			>{m.gate_result_score({ right: view.right, of: view.of })}</span
		>
	</div>
	<div data-part="meter" class="rounded relative mt-5 h-2 bg-ruled-line" aria-hidden="true">
		<i
			class="rounded absolute inset-y-0 left-0 {view.pass ? 'bg-lantern-red' : 'bg-pencil'}"
			style="width: {view.pct}%"
		></i>
		<u class="absolute -inset-y-[5px] left-[80%] w-0.5 bg-ink"></u>
	</div>
	<div class="relative mt-2 h-5 text-label text-pencil" aria-hidden="true">
		<span class="absolute left-[80%] -translate-x-1/2">80%</span>
	</div>

	{#if view.primer && view.pass}
		<p data-part="cheer" class="mt-3 font-display text-title font-bold">{m.primer_gate_cheer()}</p>
	{/if}
	{#if view.line}
		<p
			data-part="line"
			class="mt-3 {view.pass
				? 'font-semibold text-lantern-red-text'
				: 'font-display text-title font-semibold'}"
		>
			{view.line}
		</p>
	{/if}
	<p data-part="best" class="mt-2 text-label text-pencil">
		{m.gate_result_best({ pct: view.best })}
	</p>

	<section class="mt-6">
		<h2 data-part="wrong-title" class="font-display text-title">
			{rows.length ? m.gate_result_wrong({ n: rows.length }) : m.gate_result_wrong_none()}
		</h2>
		{#if rows.length}
			<ul>
				{#each rows as row (row.id)}
					<li data-part="row" class="border-ruled-line py-3 not-first:border-t">
						<p class="text-label text-pencil">{row.prompt}</p>
						<p class="mt-0.5 [overflow-wrap:anywhere] text-pencil">
							{m.gate_result_you()}
							<s class="text-graphite"><span data-part="pick">{row.pick}</span></s>
						</p>
						<p class="mt-0.5 font-semibold [overflow-wrap:anywhere]">
							<span data-part="right">{row.right}</span>
							{#if row.pinyin}
								<small data-part="pinyin" class="text-label font-normal text-pencil"
									>{#each row.pinyin as seg, i (i)}{i > 0 ? ' ' : ''}{#if seg.bold}<b>{seg.text}</b
											>{:else}{seg.text}{/if}{/each}</small
								>
							{/if}
						</p>
					</li>
				{/each}
			</ul>
		{:else}
			<p data-part="clean" class="mt-2 text-graphite">{m.gate_result_clean()}</p>
		{/if}
	</section>

	{#snippet actions()}
		<div data-part="cta">
			{#if view.primer && view.pass && view.next}
				<Button href={resolve('/(app)/lesson/[id]', { id: view.next.id })} onclick={onleave}>
					{m.primer_gate_next({ n: view.next.n })}
				</Button>
			{:else if view.pass}
				<Button href={resolve('/(app)/(tabs)/today')} onclick={onleave}>
					{m.gate_result_home()}
				</Button>
			{:else}
				<Button onclick={onretry}>{m.gate_result_retry()}</Button>
			{/if}
		</div>
		<a
			data-part="back"
			href={hub}
			class="mt-3 block py-2 text-center font-semibold text-lantern-red-text"
			onclick={onleave}
		>
			{view.primer && !view.pass ? m.primer_gate_review() : m.gate_back()}
		</a>
	{/snippet}
</FocusFrame>
