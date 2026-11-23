<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { mode, onmode }: { mode: 'hsk' | 'tracks'; onmode: (next: 'hsk' | 'tracks') => void } =
		$props();

	const tabs = [
		{ id: 'hsk', label: m.chy49s3_mode_hsk },
		{ id: 'tracks', label: m.chy49s3_mode_tracks }
	] as const;
</script>

<div
	role="tablist"
	aria-label={m.chy49s3_mode_label()}
	data-part="mode"
	class="mt-4 grid grid-cols-2 rounded-pill bg-shaded-paper p-[3px]"
>
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			role="tab"
			aria-selected={mode === tab.id}
			onclick={() => onmode(tab.id)}
			class="h-[38px] cursor-pointer rounded-pill text-[15px] font-semibold {mode === tab.id
				? 'bg-white text-ink shadow-[0_1px_4px_rgb(45_25_10/.12)]'
				: 'text-muted'}"
		>
			{tab.label()}
		</button>
	{/each}
</div>
