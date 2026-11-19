<script lang="ts">
	import { play } from '#lib/audio/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import Sheet from '#lib/ui/Sheet.svelte';
	import {
		CONTOUR,
		FINALS,
		INITIALS,
		cellAt,
		findCell,
		playTone,
		type ChartCell,
		type Player
	} from './chart';

	type Props = { cells: ChartCell[]; open: string | null; player?: Player };
	let { cells, open, player = play }: Props = $props();

	// svelte-ignore state_referenced_locally
	let shown = $state(findCell(cells, open));
	// svelte-ignore state_referenced_locally
	let isOpen = $state(shown !== null);
	let table: HTMLTableElement | undefined = $state();

	function close() {
		isOpen = false;
		table?.querySelector<HTMLElement>(`[data-s="${shown?.syllable}"]`)?.focus();
	}
</script>

<div class="min-h-0 flex-1 overflow-auto overscroll-contain border-t border-ruled-line">
	<table
		bind:this={table}
		aria-label={m.pinyin_grid_label()}
		class="border-separate border-spacing-0"
	>
		<thead>
			<tr>
				<th
					class="sticky top-0 left-0 z-30 min-w-[52px] border-r-2 border-b border-lantern-red bg-lantern-red px-0.5 text-[10px] leading-tight font-semibold text-notebook-paper"
				>
					{m.pinyin_corner()}
				</th>
				{#each FINALS as final (final)}
					<th
						scope="col"
						class="sticky top-0 z-20 h-10 min-w-14 border-r border-b border-graphite bg-ink font-pinyin text-[15px] font-bold text-notebook-paper"
					>
						{final}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each INITIALS as initial (initial)}
				<tr>
					<th
						scope="row"
						class="sticky left-0 z-10 w-[52px] min-w-[52px] border-r-2 border-b border-lantern-red bg-lantern-red-wash font-pinyin font-bold text-lantern-red-text"
					>
						{initial || '∅'}
					</th>
					{#each FINALS as final (final)}
						{@const cell = cellAt(cells, initial, final)}
						{#if cell}
							<td class="border-r border-b border-ruled-line bg-white p-0 text-center">
								<button
									type="button"
									data-s={cell.syllable}
									class="block min-h-11 w-full font-pinyin font-semibold text-ink active:bg-shaded-paper"
									onclick={() => {
										shown = cell;
										isOpen = true;
									}}
								>
									{cell.syllable}
								</button>
							</td>
						{:else}
							<td
								class="none border-r border-b border-ruled-line bg-shaded-paper bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_srgb,var(--color-faint-pencil)_35%,transparent)_6px_7px)]"
							></td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Sheet open={isOpen} title={shown?.syllable ?? ''} onclose={close}>
	<div class="flex items-baseline justify-between gap-3">
		<p class="text-label text-muted">{m.pinyin_hint()}</p>
		<button type="button" class="min-h-11 shrink-0 pl-3 text-chip text-graphite" onclick={close}>
			{m.pinyin_close()}
		</button>
	</div>
	<div class="mt-4 grid grid-cols-4 gap-2">
		{#each shown?.tones ?? [] as tone, i (i)}
			{@const t = (i + 1) as 1 | 2 | 3 | 4}
			<button
				type="button"
				disabled={tone.key === null}
				aria-label={tone.key
					? m.pinyin_tone_label({ tone: t, pinyin: tone.text })
					: m.pinyin_tone_none({ tone: t })}
				class="flex min-h-26 flex-col items-center justify-center gap-1 rounded-[14px] border border-ruled-line bg-white/40 px-0.5 py-3 active:bg-shaded-paper disabled:border-dashed disabled:bg-transparent disabled:text-faint-pencil"
				onclick={() => playTone(tone, player)}
			>
				<span class="font-pinyin text-[22px] leading-tight font-medium"
					>{tone.key ? tone.text : '–'}</span
				>
				<svg class="h-5 w-9 text-pencil" viewBox="0 0 44 24" aria-hidden="true">
					<path
						d={CONTOUR[t]}
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="font-hanzi text-[24px] leading-tight text-graphite" lang="zh"
					>{tone.hanzi ?? ''}</span
				>
			</button>
		{/each}
	</div>
</Sheet>
