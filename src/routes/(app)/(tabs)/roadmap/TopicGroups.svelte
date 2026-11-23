<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import RoadMark from '#lib/ui/RoadMark.svelte';
	import { resolve } from '$app/paths';
	import type { LevelGroup, LevelRow } from './roadmap';

	let { groups }: { groups: LevelGroup[] } = $props();

	const note = (row: LevelRow) =>
		row.status === 'done'
			? row.best === undefined
				? m.chy49s1_done()
				: m.chy49s1_done_best({ score: row.best })
			: row.status === 'now'
				? m.chy49s1_now({ part: row.part ?? 1 })
				: row.status === 'locked' && row.after !== undefined
					? m.chy49s1_after({ n: row.after })
					: '';

	const rail = (rows: LevelRow[], k: number) => {
		const row = rows[k];
		const joined = row.status === 'now' && rows[k - 1]?.status === 'done';
		return [
			row.status === 'done' || joined ? 'before:bg-primary' : 'before:bg-ruled-line',
			joined ? 'before:bottom-1/2' : ''
		].join(' ');
	};
</script>

<div data-part="topic-groups" class="pt-2">
	{#each groups as group (group.kind + group.i)}
		<details data-part="topic" class="group border-b border-ruled-line" open={group.open}>
			<summary
				class="grid min-h-[54px] cursor-pointer list-none grid-cols-[1fr_auto_18px] items-center gap-2 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden"
			>
				<span data-part="topic-title">
					{group.kind === 'primer'
						? m.chy49s1_primer()
						: m.chy49s1_topic({ i: group.i, title: group.title })}
				</span>
				<span data-part="topic-count" class="text-label font-medium text-faint-pencil tabular-nums">
					{m.chy49s1_count({ passed: group.passed, total: group.total })}
				</span>
				<svg
					class="size-4 fill-current text-faint-pencil transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
					aria-hidden="true"><use href="#i-regular-caret-down" /></svg
				>
			</summary>
			<ol class="relative list-none pb-3">
				{#each group.rows as row, k (row.id)}
					<li
						data-part="level-row"
						data-id={row.id}
						data-status={row.status}
						class="relative before:absolute before:inset-y-0 before:left-[17px] before:w-0.5 first:before:top-1/2 last:before:bottom-1/2 {rail(
							group.rows,
							k
						)}"
					>
						{#if row.status === 'locked'}
							<div class="grid min-h-[60px] grid-cols-[36px_1fr_16px] items-center gap-3 py-2">
								{@render line(row)}
							</div>
						{:else}
							<a
								href={resolve('/(app)/lesson/[id]', { id: row.id })}
								class="grid min-h-[60px] grid-cols-[36px_1fr_16px] items-center gap-3 py-2"
							>
								{@render line(row)}
							</a>
						{/if}
					</li>
				{/each}
			</ol>
		</details>
	{/each}
</div>

{#snippet line(row: LevelRow)}
	<RoadMark status={row.status} size="lg" />
	<span>
		<b
			data-part="level-title"
			class="block font-serif text-title {row.status === 'now'
				? 'text-lantern-red-text'
				: row.status === 'locked'
					? 'text-graphite'
					: 'text-ink'}"
		>
			{m.chy49s1_row_n({ n: row.n })}
			<span class="font-medium {row.status === 'now' ? 'text-lantern-red-text' : 'text-muted'}"
				>{m.chy49s1_row_title({ title: row.title })}</span
			>
			{#if row.hanzi}<span lang="zh" class="text-[15px] font-normal text-graphite">{row.hanzi}</span
				>{/if}
		</b>
		{#if note(row)}
			<small data-part="level-note" class="mt-0.5 block text-label text-muted">{note(row)}</small>
		{/if}
	</span>
	<svg
		class="size-4 fill-current {row.status === 'now' ? 'text-primary' : 'text-faint-pencil'}"
		aria-hidden="true"><use href="#i-regular-caret-right" /></svg
	>
{/snippet}
