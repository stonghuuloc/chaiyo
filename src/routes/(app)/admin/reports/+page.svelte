<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		chipName,
		inboxView,
		setReportStatus,
		type ChipKey,
		type Tab
	} from '#lib/admin/reports.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import Toast from '#lib/ui/Toast.svelte';
	import { SvelteSet } from 'svelte/reactivity';
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

	let rows = $state(data.reports);
	$effect(() => {
		rows = data.reports;
	});
	let tab = $state<Tab>('new');
	let selected = $state<ChipKey>('all');
	const pending = new SvelteSet<string>();
	let toast = $state({ open: false, message: '', undo: null as string | null, nonce: 0 });

	const view = $derived(inboxView(rows, new Date(), { tab, chip: selected }));

	async function set(id: string, status: Tab): Promise<boolean> {
		if (pending.has(id)) return false;
		pending.add(id);
		try {
			await setReportStatus(supabase, id, status);
			rows = rows.map((r) => (r.id === id ? { ...r, status } : r));
			return true;
		} catch {
			toast = { open: true, message: m.chy54s2_failed(), undo: null, nonce: toast.nonce + 1 };
			return false;
		} finally {
			pending.delete(id);
		}
	}

	async function resolveCard(id: string) {
		if (await set(id, 'resolved'))
			toast = { open: true, message: m.chy54s2_toast(), undo: id, nonce: toast.nonce + 1 };
	}

	async function reopenCard(id: string) {
		toast.open = false;
		await set(id, 'new');
	}

	function undo() {
		if (toast.undo) void set(toast.undo, 'new');
	}
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
	class="mt-2 inline-flex items-center gap-[5px] rounded-full border border-ruled-line bg-shaded-paper px-2.5 py-1 text-[12px] leading-[normal] font-semibold text-graphite"
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
	{#each [{ key: 'new', label: m.chy54s1_tab_new(), count: view.counts.new }, { key: 'resolved', label: m.chy54s1_tab_done(), count: view.counts.resolved }] as const as t (t.key)}
		<button
			type="button"
			aria-pressed={tab === t.key}
			onclick={() => (tab = t.key)}
			class="min-h-11 rounded-full text-[15px] font-semibold {tab === t.key
				? 'bg-ink text-notebook-paper'
				: 'text-pencil'}">{t.label} <small class="font-medium">{t.count}</small></button
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
			aria-pressed={chip.key === selected}
			onclick={() => (selected = chip.key)}
			class="min-h-11 flex-none rounded-full border px-4 text-[14px] font-medium whitespace-nowrap {chip.key ===
			selected
				? 'border-ink bg-ink text-notebook-paper'
				: 'border-ruled-line bg-white/60 text-graphite'}"
			>{m.chy54s1_chip({ name: chipName(chip.key), count: chip.count })}</button
		>
	{/each}
</div>

{#if view.empty}
	{@const e = view.empty}
	<div data-part="report-empty" class="mt-8 px-4 text-center text-pencil">
		<span lang="zh" class="block font-hanzi text-[56px] text-faint-pencil"
			>{e.kind === 'inbox-clear' ? '安' : e.kind === 'none-done' ? '空' : '静'}</span
		>
		<p class="mt-2">
			<b class="font-display text-[19px] font-semibold text-ink"
				>{e.kind === 'inbox-clear'
					? m.chy54s2_clear_title()
					: e.kind === 'none-done'
						? m.chy54s2_none_title()
						: m.chy54s2_quiet_title()}</b
			>
		</p>
		<p class="mt-2">
			{e.kind === 'inbox-clear'
				? m.chy54s2_clear_body()
				: e.kind === 'none-done'
					? m.chy54s2_none_body()
					: e.tab === 'new'
						? m.chy54s2_quiet_new({ name: chipName(e.chip) })
						: m.chy54s2_quiet_done({ name: chipName(e.chip) })}
		</p>
	</div>
{:else}
	<ul
		data-part="report-list"
		class="mt-4 divide-y divide-ruled-line overflow-hidden rounded-[18px] border border-ruled-line bg-white/55"
	>
		{#each view.cards as card (card.id)}
			<ReportCard
				{card}
				busy={pending.has(card.id)}
				onresolve={() => resolveCard(card.id)}
				onreopen={() => reopenCard(card.id)}
			/>
		{/each}
	</ul>
{/if}

<Toast
	open={toast.open}
	message={toast.message}
	nonce={toast.nonce}
	actionLabel={toast.undo ? m.chy54s2_undo() : undefined}
	onaction={undo}
	onclose={() => (toast.open = false)}
/>
