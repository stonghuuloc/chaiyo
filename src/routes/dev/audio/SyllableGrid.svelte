<script lang="ts">
	import { play, playSyllable } from '#lib/audio/index.js';
	import type { ChipClip, SyllableCell } from './syllable-cells.server';
	import { TONE_CONTOURS } from './syllable-grid';

	type Props = {
		cells: SyllableCell[];
		chips: ChipClip[];
		player?: (key: string) => Promise<boolean>;
		syllablePlayer?: (key: string) => Promise<boolean>;
	};

	let { cells, chips, player = play, syllablePlayer = playSyllable }: Props = $props();

	let selected = $state<string>();
	let readout = $state('tap a cell');
	const current = $derived(cells.find((c) => c.syllable === selected));
	const groups = $derived.by(() => {
		const byInitial: Record<string, SyllableCell[]> = {};
		for (const c of cells) (byInitial[c.initial || '∅'] ??= []).push(c);
		return Object.entries(byInitial);
	});

	function tap(label: string, key: string, say = player) {
		readout = label;
		say(key).catch(() => {});
	}
</script>

<section aria-label="Syllables">
	<h2 class="text-lg mt-4">Syllables</h2>
	<p data-testid="syllable-readout">{readout}</p>
	{#if current}
		<div class="my-2 flex gap-2" role="group" aria-label={`Tones of ${current.syllable}`}>
			{#each current.clips as clip, i (clip.label)}
				<button
					class="rounded border px-3 py-2"
					data-clip={clip.label}
					title={TONE_CONTOURS[i]}
					onclick={() => tap(clip.label, clip.key, syllablePlayer)}
				>
					{i + 1}
					<span class="text-sm opacity-60">{TONE_CONTOURS[i]}</span>
				</button>
			{/each}
		</div>
	{/if}
	{#each groups as [initial, group] (initial)}
		<h3 class="mt-2">{initial}</h3>
		<div class="flex flex-wrap gap-1">
			{#each group as cell (cell.syllable)}
				<button
					class="rounded border px-2 py-1"
					aria-pressed={selected === cell.syllable}
					onclick={() => (selected = cell.syllable)}>{cell.syllable}</button
				>
			{/each}
		</div>
	{/each}

	<h2 class="text-lg mt-4">Words</h2>
	<div class="flex flex-wrap gap-1">
		{#each chips as chip (chip.key)}
			<button
				class="rounded border px-2 py-1"
				data-clip={chip.text}
				onclick={() => tap(chip.text, chip.key)}>{chip.text}</button
			>
		{/each}
	</div>
</section>
