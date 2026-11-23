<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Skill } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import type { TodayView } from '../practice/today';

	let { view }: { view: TodayView | null } = $props();

	const kind: Record<Skill, (o: { n: number }) => string> = {
		the: m.chy45s3_kind_the,
		nghe: m.chy45s3_kind_nghe,
		viet: m.chy45s3_kind_viet
	};
</script>

{#if view}
	<a
		data-part="practice-row"
		href={resolve('/(app)/practice/session')}
		class="mt-4 grid min-h-16 grid-cols-[44px_1fr_auto] items-center gap-3 rounded-action bg-white px-4 py-3 text-left text-ink shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_4%,transparent),0_6px_18px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]"
	>
		<span class="grid size-11 place-items-center rounded-cell bg-shaded-paper">
			<svg class="size-6 fill-current" aria-hidden="true"><use href="#i-fill-brain" /></svg>
		</span>
		<span>
			<b data-part="practice-title" class="block font-semibold">
				{m.practice_today_title({ min: view.minutes })}
			</b>
			<small data-part="practice-kinds" class="block text-[13px] text-pencil">
				{view.chips.map((c) => kind[c.skill]({ n: c.n })).join(' · ')}
			</small>
		</span>
		<svg class="size-4 fill-current text-faint-pencil" aria-hidden="true"
			><use href="#i-regular-caret-right" /></svg
		>
	</a>
{/if}
