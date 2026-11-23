<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import type { ThiChip } from './thi';

	let { view }: { view: { chips: ThiChip[]; selected: number } } = $props();

	let tap = $state<number | null>(null);
	const picked = $derived(tap ?? view.selected);

	const chip = $derived(view.chips.find((c) => c.level === picked) ?? view.chips[0]);

	const line = (c: ThiChip): string => {
		if (c.line === 'passed') return m.chy41s3_mock_passed();
		if (c.line === 'ready') return m.chy41s3_mock_ready();
		if (c.line === 'next') return m.chy41s3_mock_next({ n: c.lesson ?? 0 });
		return m.chy41s3_mock_after({ level: c.level - 1 });
	};
</script>

<section data-part="thi" class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="text-[19px] leading-[1.2] font-semibold">{m.skill_thi_label()}</h2>
	<div
		role="tablist"
		class="mx-[calc(-1*var(--gutter))] mt-2 flex [scrollbar-width:none] gap-2 overflow-x-auto px-(--gutter) [&::-webkit-scrollbar]:hidden"
	>
		{#each view.chips as c (c.level)}
			<button
				type="button"
				role="tab"
				data-part="thi-chip"
				data-level={c.level}
				aria-selected={c.level === picked}
				class="group inline-flex h-9 flex-none items-center gap-1 rounded-full border border-ruled-line bg-white/40 px-3 text-[14px] font-semibold text-graphite aria-selected:border-ink aria-selected:bg-ink aria-selected:text-notebook-paper"
				onclick={() => (tap = c.level)}
			>
				{#if c.lock}
					<svg
						data-part="thi-lock"
						class="size-[13px] shrink-0 fill-current text-faint-pencil group-aria-selected:text-notebook-paper/70"
						aria-hidden="true"><use href="#i-fill-lock-simple" /></svg
					>
				{/if}
				{m.chy41s3_chip({ level: c.level })}
			</button>
		{/each}
	</div>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve()d path plus a query -->
	<a
		data-part="thi-row"
		href={resolve('/(app)/practice/skill') + '?k=thi&lv=' + chip.level}
		class="mt-2 grid min-h-16 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-action border border-ruled-line bg-white/55 px-4 py-3 active:bg-shaded-paper"
	>
		<span class="grid size-11 place-items-center rounded-cell bg-shaded-paper">
			<svg class="size-6 fill-current text-graphite" aria-hidden="true"
				><use href="#i-fill-diploma" /></svg
			>
		</span>
		<span>
			<b class="block font-semibold">{m.chy41s3_mock_title({ level: chip.level })}</b>
			<small class="mt-0.5 block text-[13px] text-pencil">{line(chip)}</small>
		</span>
		<svg class="size-4 flex-none fill-current text-faint-pencil" aria-hidden="true"
			><use href="#i-{chip.line === 'passed' ? 'regular-caret-right' : 'fill-lock-simple'}" /></svg
		>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</section>
