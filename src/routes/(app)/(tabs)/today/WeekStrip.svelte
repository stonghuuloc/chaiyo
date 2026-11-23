<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { WeekView } from './week';

	let { view, onrules }: { view: WeekView; onrules: () => void } = $props();

	const names = {
		tick: () => m.chy45s2_mark_tick(),
		freeze: () => m.chy45s2_mark_freeze(),
		today: () => m.chy45s2_mark_today()
	};
</script>

<section
	data-part="week"
	class="mt-5 border-t border-ruled-line pt-6 xl:mt-0 xl:border-t-0 xl:pt-0"
>
	<div class="mb-3 flex items-baseline justify-between">
		<h2 class="font-headline text-headline text-ink">{m.chy46s1_week()}</h2>
		<button
			type="button"
			data-part="freeze-rules-link"
			class="inline-flex cursor-pointer items-center gap-0.5 text-[14px] font-medium text-lantern-red-text hover:underline hover:underline-offset-3"
			onclick={onrules}
			>{m.chy46s3_link()}<svg class="size-[13px] fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			></button
		>
	</div>
	<div class="relative">
		<ol data-part="week-strip" class="grid grid-cols-7 gap-1.5">
			{#each view.cells as cell (cell.day)}
				<li
					class="grid justify-items-center gap-2 rounded-cell border pt-2 pb-2.5 text-[12.5px] {cell.today
						? 'border-lantern-red bg-lantern-red-wash font-bold text-ink'
						: 'border-ruled-line bg-white/35 font-medium text-pencil'}"
					data-mark={cell.mark}
					data-today={cell.today ? '' : undefined}
				>
					{cell.label}
					<span
						class="grid size-[26px] place-items-center rounded-full {cell.mark === 'tick'
							? 'bg-lantern-red text-white'
							: cell.mark === 'freeze'
								? 'text-freeze-blue'
								: cell.mark === 'today'
									? 'border-2 border-lantern-red'
									: cell.mark === 'later'
										? 'border-[1.5px] border-faint-pencil'
										: ''}"
					>
						{#if cell.mark === 'tick'}
							<svg class="size-3.5 fill-current" aria-hidden="true"
								><use href="#i-bold-check" /></svg
							>
						{:else if cell.mark === 'freeze'}
							<svg class="size-[21px] fill-current" aria-hidden="true"
								><use href="#i-regular-snowflake" /></svg
							>
						{/if}
					</span>
					{#if cell.mark === 'tick' || cell.mark === 'freeze' || cell.mark === 'today'}
						<span class="sr-only">{names[cell.mark]()}</span>
					{/if}
				</li>
			{/each}
		</ol>
		<button
			type="button"
			data-part="week-info"
			aria-label={m.chy46s3_week_label()}
			class="absolute inset-0 cursor-pointer rounded-cell"
			onclick={onrules}
		></button>
	</div>
	<p data-part="streak-line" class="mt-3 text-label text-pencil">
		{view.line}
	</p>
</section>
