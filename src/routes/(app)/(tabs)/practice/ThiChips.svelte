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

<section data-part="thi" class="flex flex-col gap-3">
	<h2>{m.skill_thi_label()}</h2>
	<div role="tablist" class="flex flex-wrap gap-2">
		{#each view.chips as c (c.level)}
			<button
				type="button"
				role="tab"
				data-part="thi-chip"
				data-level={c.level}
				aria-selected={c.level === picked}
				class="flex items-center gap-1 rounded-full border border-ruled-line bg-white px-3 py-1"
				onclick={() => (tap = c.level)}
			>
				{#if c.lock}
					<svg data-part="thi-lock" class="size-4 shrink-0 fill-current" aria-hidden="true"
						><use href="#i-fill-lock-simple" /></svg
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
		class="rounded-2xl flex flex-col border border-ruled-line bg-white p-4"
	>
		<b>{m.chy41s3_mock_title({ level: chip.level })}</b>
		<small class="text-sm opacity-60">{line(chip)}</small>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</section>
