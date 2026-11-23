<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { WeekView } from './week';

	let { view }: { view: WeekView } = $props();

	const names = {
		tick: () => m.chy45s2_mark_tick(),
		freeze: () => m.chy45s2_mark_freeze(),
		today: () => m.chy45s2_mark_today()
	};
</script>

<section data-part="week" class="mt-5">
	<h2 class="text-body text-text">{m.chy46s1_week()}</h2>
	<ol data-part="week-strip" class="mt-3 grid grid-cols-7 gap-1.5">
		{#each view.cells as cell (cell.day)}
			<li
				class="text-caption grid justify-items-center gap-1.5 {cell.today
					? 'text-text'
					: 'text-muted'}"
				data-mark={cell.mark}
				data-today={cell.today ? '' : undefined}
			>
				<span
					class="grid size-[30px] place-items-center rounded-full border-[1.5px] {cell.mark ===
					'tick'
						? 'border-primary bg-primary text-white'
						: cell.mark === 'freeze'
							? 'border-primary text-primary'
							: 'border-border'}"
				>
					{#if cell.mark === 'tick'}
						<svg class="size-[18px] fill-current" aria-hidden="true"
							><use href="#i-bold-check" /></svg
						>
					{:else if cell.mark === 'freeze'}
						<svg class="size-[18px] fill-current" aria-hidden="true"
							><use href="#i-regular-snowflake" /></svg
						>
					{/if}
				</span>
				{cell.label}
				{#if cell.mark === 'tick' || cell.mark === 'freeze' || cell.mark === 'today'}
					<span class="sr-only">{names[cell.mark]()}</span>
				{/if}
			</li>
		{/each}
	</ol>
	<p
		data-part="streak-line"
		class="mt-4 rounded-[14px] bg-white p-3 text-left text-body text-graphite"
	>
		{view.line}
	</p>
</section>
