<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { WeekView } from './week';

	let { view }: { view: WeekView } = $props();
</script>

<div
	data-part="streak-chip"
	role="img"
	aria-label={m.chy45s2_chip_label({ n: view.count, f: view.freezes })}
	class="text-caption flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-text"
>
	<svg class="size-[18px] fill-current text-primary" aria-hidden="true"
		><use href="#i-fill-fire" /></svg
	>
	<span>{m.chy45s2_chip_days({ n: view.count })}</span>
	<span class="text-muted" aria-hidden="true">·</span>
	<svg class="size-[18px] fill-current text-muted" aria-hidden="true"
		><use href="#i-regular-snowflake" /></svg
	>
	<span>{view.freezes}</span>
</div>
