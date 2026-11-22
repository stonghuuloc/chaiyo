<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { DisplayPrefs, Key } from './prefs.svelte';

	let { prefs }: { prefs: DisplayPrefs } = $props();

	const PILLS: { key: Key; label: () => string }[] = [
		{ key: 'pinyin', label: m.pills_pinyin },
		{ key: 'meaning', label: m.pills_meaning }
	];
</script>

<div class="mt-4 flex gap-2" role="group" aria-label={m.pills_label()}>
	{#each PILLS as pill (pill.key)}
		<button
			type="button"
			data-part="pill"
			data-pill={pill.key}
			aria-pressed={prefs[pill.key]}
			class="inline-flex h-[34px] items-center rounded-pill border px-3 text-label font-medium {prefs[
				pill.key
			]
				? 'border-graphite bg-white/55 text-ink'
				: 'border-ruled-line text-graphite'}"
			onclick={() => void prefs.toggle(pill.key)}
		>
			{pill.label()}
		</button>
	{/each}
</div>
