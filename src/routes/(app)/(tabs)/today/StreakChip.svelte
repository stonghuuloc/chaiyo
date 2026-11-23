<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { WeekView } from './week';

	let { view, onrules }: { view: WeekView; onrules: () => void } = $props();
</script>

<button
	type="button"
	data-part="streak-chip"
	aria-label={m.chy45s2_chip_label({ n: view.count, f: view.freezes })}
	onclick={onrules}
	class="flex h-10 cursor-pointer items-center gap-2 rounded-pill border-[0.5px] border-frost-edge bg-frost-tint px-4 text-chip text-ink shadow-frost inset-shadow-frost backdrop-blur-frost backdrop-saturate-(--frost-saturate)"
>
	<svg class="size-[19px] fill-current text-lantern-red" aria-hidden="true"
		><use href="#i-fill-fire" /></svg
	>
	<span>{m.chy45s2_chip_days({ n: view.count })}</span>
	<span class="h-[18px] w-px bg-frost-divider" aria-hidden="true"></span>
	<svg class="size-[18px] fill-current text-freeze-blue" aria-hidden="true"
		><use href="#i-regular-snowflake" /></svg
	>
	<span>{view.freezes}</span>
</button>
