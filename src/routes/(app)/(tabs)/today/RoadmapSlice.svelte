<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import RoadMark from '#lib/ui/RoadMark.svelte';
	import { resolve } from '$app/paths';
	import type { RoadRow } from './roadmap';

	let { rows }: { rows: RoadRow[] } = $props();

	const note = (row: RoadRow) =>
		row.status === 'done'
			? m.chy45s3_done()
			: row.status === 'now'
				? m.chy45s3_now()
				: row.status === 'locked' && row.after !== undefined
					? m.chy45s3_after({ n: row.after })
					: '';

	const rail = (k: number) => {
		const joined = rows[k].status === 'now' && rows[k - 1]?.status === 'done';
		return [
			rows[k].status === 'done' || joined ? 'before:bg-lantern-red' : 'before:bg-ruled-line',
			joined ? 'before:bottom-1/2' : ''
		].join(' ');
	};
</script>

<section data-part="roadmap" class="mt-5 border-t border-ruled-line pt-6">
	<div class="mb-3 flex items-baseline justify-between">
		<h2 class="font-headline text-headline text-ink">{m.chy45s3_roadmap()}</h2>
		<a
			data-part="roadmap-all"
			href={resolve('/(app)/(tabs)/roadmap')}
			class="inline-flex items-center gap-0.5 text-[14px] font-medium text-lantern-red-text hover:underline hover:underline-offset-3"
		>
			{m.chy45s3_all()}
			<svg class="size-[13px] fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			>
		</a>
	</div>
	<ol class="relative list-none">
		{#each rows as row, k (row.id)}
			<li
				data-part="road-row"
				data-status={row.status}
				class="relative before:absolute before:inset-y-0 before:left-[17px] before:w-0.5 first:before:top-1/2 last:before:bottom-1/2 {rail(
					k
				)}"
			>
				{#if row.status === 'locked'}
					<div class="grid min-h-[60px] grid-cols-[36px_1fr_16px] items-center gap-3 py-2">
						{@render body(row)}
					</div>
				{:else}
					<a
						href={resolve('/(app)/lesson/[id]', { id: row.id })}
						class="grid min-h-[60px] grid-cols-[36px_1fr_16px] items-center gap-3 py-2"
					>
						{@render body(row)}
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</section>

{#snippet body(row: RoadRow)}
	<RoadMark status={row.status} size="lg" />
	<span>
		<b
			data-part="road-title"
			class="block font-title text-title {row.status === 'now'
				? 'text-lantern-red-text'
				: row.status === 'locked'
					? 'text-graphite'
					: 'text-ink'}"
		>
			{m.chy49s1_row_n({ n: row.n })}
			<span class="font-medium {row.status === 'now' ? 'text-lantern-red-text' : 'text-pencil'}"
				>{m.chy49s1_row_title({ title: row.title })}</span
			>
			{#if row.hanzi}<span lang="zh" class="text-[15px] font-normal text-graphite">{row.hanzi}</span
				>{/if}
		</b>
		{#if note(row)}
			<small data-part="road-note" class="mt-0.5 block text-label text-pencil">{note(row)}</small>
		{/if}
	</span>
	{#if row.status !== 'locked'}
		<svg
			class="size-4 fill-current {row.status === 'now' ? 'text-lantern-red' : 'text-faint-pencil'}"
			aria-hidden="true"><use href="#i-regular-caret-right" /></svg
		>
	{/if}
{/snippet}
