<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { MeLevel } from './level';
	import type { MeStats } from './me';

	let { stats, lv }: { stats: MeStats; lv: MeLevel } = $props();

	const lines = [m.chy50s2_line_1, m.chy50s2_line_2, m.chy50s2_line_3, m.chy50s2_line_4];
	const line = $derived(lines[lv.band - 1]({ cur: lv.cur ?? 0 }));
	const exam = $derived(m.chy50s2_goal_exam({ level: lv.level }));
	const goal = $derived(
		(lv.next === null
			? m.chy50s2_goal_cert({ exam, last: lv.last })
			: m.chy50s2_goal_next({ exam, last: lv.last, next: lv.next })
		).split(exam)
	);

	const rows = $derived([
		{ label: m.chy50s1_lessons(), ...stats.lessons },
		{ label: m.chy50s1_words(), ...stats.words }
	]);

	const width = (have: number, need: number) => (need ? Math.min(100, (have / need) * 100) : 0);
</script>

<div data-part="me-hero" class="mt-5 rounded-[24px] bg-white p-5">
	<div data-part="me-level" class="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4">
		<span
			class="grid size-21 place-content-center place-items-center rounded-[22px] bg-lantern-red text-white"
		>
			<small class="text-[12px] font-bold tracking-[.12em] opacity-85">{m.chy50s2_seal()}</small>
			<b class="font-display text-[40px] leading-none font-semibold">{lv.level}</b>
		</span>
		<div>
			<p
				class="text-[12.5px] leading-[18px] font-bold tracking-[.06em] text-lantern-red-text uppercase"
			>
				{m.chy50s2_kicker()}
			</p>
			<h2 class="mt-0.5 font-display text-[23px] leading-[1.2] font-semibold">
				{m.chy50s2_title({ level: lv.level, pct: lv.pct })}
			</h2>
			<p data-part="me-line" class="mt-0.5 text-[14px] leading-[18px] text-pencil">{line}</p>
		</div>
	</div>
	<div data-part="me-prog" class="mt-4 grid gap-3">
		{#each rows as r (r.label)}
			<div class="grid grid-cols-[1fr_auto] gap-y-1.5 text-[14px] leading-[18px]">
				<span class="text-graphite">{r.label}</span>
				<b class="font-semibold tabular-nums"
					>{m.chy50s1_have_need({ have: r.have, need: r.need })}</b
				>
				<span class="col-span-full h-2.5 overflow-hidden rounded-[5px] bg-shaded-paper"
					><i
						class="block h-full min-w-1.5 rounded-[5px] bg-lantern-red"
						style:width="{width(r.have, r.need)}%"
					></i></span
				>
			</div>
		{/each}
	</div>
	<p
		data-part="me-goal"
		class="mt-4 flex items-center gap-2 rounded-[14px] bg-notebook-paper p-3 text-[14px] leading-[18px] text-graphite"
	>
		<svg class="size-5 flex-none fill-current" aria-hidden="true"
			><use href="#i-fill-diploma" /></svg
		>
		<span>{goal[0]}<b class="font-semibold text-ink">{exam}</b>{goal[1]}</span>
	</p>
	<div
		data-part="me-streak"
		class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-ruled-line pt-3 text-[13.5px] leading-[18px] text-pencil"
	>
		<span class="inline-flex items-center gap-1.5">
			<svg
				class="size-[17px] fill-current text-lantern-red [--duo-c:var(--icon-duo-c)] [--duo:1]"
				aria-hidden="true"><use href="#i-fill-fire" /></svg
			>
			<b class="font-semibold text-ink">{m.chy50s1_streak_days({ n: stats.streak.count })}</b>
		</span>
		<span class="inline-flex items-center gap-1.5">
			<svg class="size-[17px] fill-current text-freeze-blue" aria-hidden="true"
				><use href="#i-fill-snowflake" /></svg
			>
			{m.chy50s1_freezes({ n: stats.streak.freezes })}
		</span>
		<span class="inline-flex items-center gap-1.5">{m.chy50s1_best({ n: stats.streak.best })}</span>
	</div>
</div>
