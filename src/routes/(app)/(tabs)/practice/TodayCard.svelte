<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Skill } from '#lib/study/index.js';
	import Button from '#lib/ui/Button.svelte';
	import { resolve } from '$app/paths';
	import type { TodayView } from './today';

	let { view }: { view: TodayView | null } = $props();

	const chip: Record<Skill, (o: { n: number }) => string> = {
		the: m.practice_chip_the,
		nghe: m.practice_chip_nghe,
		viet: m.practice_chip_viet
	};

	const icon: Record<Skill, string> = {
		the: 'fill-cards',
		nghe: 'fill-headphones',
		viet: 'fill-pen'
	};
</script>

{#if view}
	<section data-part="today" class="mt-5 rounded-[22px] bg-white p-5">
		<h2 data-part="today-title" class="text-headline">
			{m.practice_today_title({ min: view.minutes })}
		</h2>
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each view.chips as c (c.skill)}
				<li
					data-part="today-chip"
					data-skill={c.skill}
					class="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-notebook-paper px-2.5 text-label font-semibold text-graphite"
				>
					<svg class="size-4 flex-none fill-current text-pencil" aria-hidden="true"
						><use href="#i-{icon[c.skill]}" /></svg
					>
					{chip[c.skill]({ n: c.n })}
				</li>
			{/each}
		</ul>
		<div data-part="today-start" class="mt-4">
			<Button href={resolve('/(app)/practice/session')} caret>{m.practice_start()}</Button>
		</div>
	</section>
{:else}
	<section data-part="today-clear" class="mt-5 rounded-[22px] border border-ruled-line p-5">
		<h2 class="text-headline">{m.practice_clear_title()}</h2>
		<p class="mt-3 text-[14px] text-pencil">{m.practice_clear_text()}</p>
	</section>
{/if}
