<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { searchWords, type MyWordRow } from '#lib/study/index.js';

	let { rows, query = $bindable('') }: { rows: MyWordRow[]; query?: string } = $props();
	const shown = $derived(searchWords(rows, query));
</script>

<section class="flex flex-col gap-4 pb-24">
	<p class="text-graphite">{m.mywords_count({ n: rows.length })}</p>
	<input
		type="search"
		bind:value={query}
		placeholder={m.chy43s2_search()}
		aria-label={m.chy43s2_search()}
		autocomplete="off"
		spellcheck="false"
		class="rounded-2xl border border-ruled-line bg-white p-3"
	/>
	{#if shown.length === 0 && query.trim()}
		<p data-part="no-match" class="text-graphite">{m.chy43s2_no_match({ q: query.trim() })}</p>
	{/if}
	<ul class="flex flex-col gap-2">
		{#each shown as row (row.hanzi)}
			<li
				data-part="my-word"
				class="rounded-2xl flex items-center gap-3 border border-ruled-line bg-white p-3"
			>
				<span lang="zh" class="font-display text-headline">{row.hanzi}</span>
				<span class="flex flex-1 flex-col">
					{#if row.pinyin}
						<span data-part="py">{row.pinyin}</span>
					{/if}
					{#if row.hanViet}
						<small data-part="hv" class="text-graphite">{row.hanViet}</small>
					{/if}
					{#if row.nghia}
						<small data-part="nghia" class="text-graphite">{row.nghia}</small>
					{/if}
					{#if row.dueNote}
						<small data-part="note" class="text-lantern-red">
							{row.dueNote === 'due' ? m.mywords_note_due() : m.mywords_note_never()}
						</small>
					{/if}
					{#if row.source === 'self'}
						<small data-part="source" class="text-pencil">{m.mywords_source_self()}</small>
					{/if}
				</span>
				<span
					role="img"
					aria-label={m.mywords_bars({ bars: row.bars })}
					class="flex items-end gap-0.5"
				>
					{#each [1, 2, 3] as level (level)}
						<i
							data-filled={level <= row.bars}
							class="w-1.5 rounded-full {level <= row.bars ? 'bg-lantern-red' : 'bg-ruled-line'}"
							style:height="{level * 6 + 6}px"
						></i>
					{/each}
				</span>
			</li>
		{/each}
	</ul>
	<p class="text-sm text-graphite">{m.mywords_legend()}</p>
</section>
