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
</script>

<section data-part="roadmap" class="mt-5">
	<div class="flex items-center justify-between">
		<h2 class="text-body text-text">{m.chy45s3_roadmap()}</h2>
		<a
			data-part="roadmap-all"
			href={resolve('/(app)/(tabs)/roadmap')}
			class="text-caption flex items-center gap-1 text-muted"
		>
			{m.chy45s3_all()}
			<svg class="size-3.5 fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			>
		</a>
	</div>
	<ol class="mt-3 flex flex-col gap-2">
		{#each rows as row (row.id)}
			<li
				data-part="road-row"
				data-status={row.status}
				class="rounded-action bg-white text-text {row.status === 'locked' ? 'text-muted' : ''}"
			>
				{#if row.status === 'locked'}
					<div class="grid grid-cols-[28px_1fr] items-center gap-3 px-4 py-3">
						<RoadMark status={row.status} />
						{@render body(row)}
					</div>
				{:else}
					<a
						href={resolve('/(app)/lesson/[id]', { id: row.id })}
						class="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-3"
					>
						<RoadMark status={row.status} />
						{@render body(row)}
						<svg class="size-4 fill-current text-muted" aria-hidden="true"
							><use href="#i-regular-caret-right" /></svg
						>
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</section>

{#snippet body(row: RoadRow)}
	<span>
		<b data-part="road-title" class="block font-semibold">
			{m.chy45s3_lesson({ n: row.n, title: row.title, hanzi: row.hanzi })}
		</b>
		{#if note(row)}
			<small data-part="road-note" class="text-caption block text-muted">{note(row)}</small>
		{/if}
	</span>
{/snippet}
