<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { chipName, inboxView } from '#lib/admin/reports.js';
	import { m } from '#lib/paraglide/messages.js';
	import ReportCard from './ReportCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let inApp = false;
	afterNavigate(({ from, type }) => {
		inApp ||= from !== null && type !== 'popstate';
	});
	snapshot({
		capture: () => inApp,
		restore: (value) => {
			inApp = value;
		}
	});

	function back(e: MouseEvent) {
		if (!inApp) return;
		e.preventDefault();
		history.back();
	}

	const view = $derived(inboxView(data.reports, new Date()));
</script>

<div
	data-part="top-bar"
	class="sticky top-0 -mx-(--gutter) grid grid-cols-[44px_1fr_44px] items-center bg-notebook-paper px-3 py-2"
>
	<a
		href={resolve('/(app)/(tabs)/me')}
		onclick={back}
		aria-label={m.chy52s1_back()}
		class="grid size-11 place-items-center rounded-full text-graphite"
	>
		<svg class="size-[22px] -scale-x-100 fill-current" aria-hidden="true">
			<use href="#i-regular-caret-right" />
		</svg>
	</a>
	<span class="text-center font-display text-title">{m.chy50s3_reports()}</span>
	<span></span>
</div>

<span
	data-part="admin-badge"
	class="mt-2 inline-flex items-center gap-[5px] rounded-full border border-ruled-line bg-shaded-paper px-2.5 py-1 text-[12px] font-semibold text-graphite"
>
	<svg class="size-3.5 fill-current" aria-hidden="true"><use href="#i-fill-shield" /></svg>
	{m.chy54s1_badge()}
</span>
<h1 class="mt-3 font-display text-headline leading-[1.25] font-bold">{m.chy54s1_h1()}</h1>

<div
	data-part="report-tabs"
	role="group"
	aria-label={m.chy54s1_tabs()}
	class="mt-4 grid grid-cols-2 rounded-full border border-ruled-line bg-shaded-paper p-[3px]"
>
	{#each [{ label: m.chy54s1_tab_new(), count: view.counts.new, on: true }, { label: m.chy54s1_tab_done(), count: view.counts.resolved, on: false }] as tab (tab.label)}
		<button
			type="button"
			aria-pressed={tab.on}
			class="min-h-11 rounded-full text-[15px] font-semibold {tab.on
				? 'bg-ink text-notebook-paper'
				: 'text-pencil'}">{tab.label} <small class="font-medium">{tab.count}</small></button
		>
	{/each}
</div>

<div
	data-part="report-chips"
	role="group"
	aria-label={m.chy54s1_chips()}
	class="-mx-(--gutter) mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-(--gutter)"
>
	{#each view.chips as chip (chip.key)}
		<button
			type="button"
			aria-pressed={chip.key === 'all'}
			class="min-h-11 flex-none rounded-full border px-4 text-[14px] font-medium whitespace-nowrap {chip.key ===
			'all'
				? 'border-ink bg-ink text-notebook-paper'
				: 'border-ruled-line bg-white/60 text-graphite'}"
			>{m.chy54s1_chip({ name: chipName(chip.key), count: chip.count })}</button
		>
	{/each}
</div>

<ul
	data-part="report-list"
	class="mt-4 divide-y divide-ruled-line overflow-hidden rounded-[18px] border border-ruled-line bg-white/55"
>
	{#each view.cards as card (card.id)}
		<ReportCard {card} />
	{/each}
</ul>
