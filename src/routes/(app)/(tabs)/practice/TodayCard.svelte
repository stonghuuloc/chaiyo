<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Skill } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import type { TodayView } from './today';

	let { view }: { view: TodayView | null } = $props();

	const chip: Record<Skill, (o: { n: number }) => string> = {
		the: m.practice_chip_the,
		nghe: m.practice_chip_nghe,
		viet: m.practice_chip_viet
	};
</script>

{#if view}
	<section
		data-part="today"
		class="rounded-2xl flex flex-col gap-3 border border-ruled-line bg-white p-4"
	>
		<h2 data-part="today-title">{m.practice_today_title({ min: view.minutes })}</h2>
		<ul class="flex flex-wrap gap-2">
			{#each view.chips as c (c.skill)}
				<li
					data-part="today-chip"
					data-skill={c.skill}
					class="text-sm rounded-full border border-ruled-line px-3 py-1"
				>
					{chip[c.skill]({ n: c.n })}
				</li>
			{/each}
		</ul>
		<a
			data-part="today-start"
			href={resolve('/(app)/practice/session')}
			class="rounded-full bg-lantern-red p-4 text-center font-bold text-white"
		>
			{m.practice_start()}
		</a>
	</section>
{:else}
	<section data-part="today-clear" class="flex flex-col gap-2">
		<h2>{m.practice_clear_title()}</h2>
		<p>{m.practice_clear_text()}</p>
	</section>
{/if}
