<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import type { BoardMode, RankedRow } from '#lib/social/board.js';

	let {
		rows,
		mode,
		onmode
	}: { rows: RankedRow[]; mode: BoardMode; onmode: (mode: BoardMode) => void } = $props();

	const others = $derived(rows.filter((r) => !r.row.me).length);
	const MODES: [BoardMode, () => string][] = [
		['streak', m.chy52s2_streak],
		['week', m.chy52s2_week]
	];
	const MEDAL = ['text-sunflower', 'text-faint-pencil', 'text-pencil'];
	const ROW =
		'grid min-h-[68px] grid-cols-[28px_44px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2';
</script>

{#snippet cells(r: RankedRow)}
	{#if r.medal}
		<span
			data-part="rank"
			role="img"
			aria-label={m.chy52s2_rank({ n: r.rank })}
			class="grid place-items-center {MEDAL[r.rank - 1]}"
		>
			<svg class="size-6 fill-current" aria-hidden="true"><use href="#i-fill-medal" /></svg>
		</span>
	{:else}
		<span
			data-part="rank"
			class="grid place-items-center font-display text-[15px] font-semibold text-pencil tabular-nums"
			>{r.rank}</span
		>
	{/if}
	{#if r.row.photo}
		<img data-part="avatar" src={r.row.photo} alt="" class="size-11 rounded-full object-cover" />
	{:else}
		<span
			data-part="avatar"
			class="grid size-11 place-items-center rounded-full bg-sunflower-wash font-display text-[17px] font-semibold text-ink"
			aria-hidden="true">{r.row.name.charAt(0)}</span
		>
	{/if}
	<span class="min-w-0">
		<b class="block truncate text-[16px] font-semibold text-ink"
			>{r.row.name}{#if r.row.me}<span
					class="ml-1.5 inline-block rounded-full bg-ink px-2 py-px align-[2px] text-[11.5px] font-semibold text-notebook-paper"
					>{m.chy52s2_you()}</span
				>{/if}</b
		>
		{#if !r.row.me}
			<small class="mt-px block truncate text-[13px] text-pencil"
				>{m.chy45s3_friend_lesson({ n: r.row.lesson })}</small
			>
		{/if}
	</span>
	<span
		data-part="value"
		class="inline-flex items-center gap-[5px] text-[15px] font-semibold whitespace-nowrap text-ink tabular-nums"
	>
		{#if mode === 'streak'}
			<svg class="size-[17px] fill-current text-lantern-red" aria-hidden="true"
				><use href="#i-fill-fire" /></svg
			>
		{/if}
		{r.value}
		<small class="text-[13px] font-normal text-pencil"
			>{mode === 'streak' ? m.chy52s2_days() : m.chy52s2_words()}</small
		>
	</span>
{/snippet}

{#if others > 0}
	<p class="mt-2 text-[14px] text-pencil">{m.chy52s2_lead({ n: others })}</p>
{/if}

<div
	role="group"
	aria-label={m.chy52s2_rank_by()}
	class="mt-4 grid grid-cols-2 rounded-full bg-shaded-paper p-1"
>
	{#each MODES as [key, label] (key)}
		<button
			type="button"
			aria-pressed={mode === key}
			onclick={() => onmode(key)}
			class="min-h-11 cursor-pointer rounded-full text-[14.5px] font-semibold text-pencil aria-pressed:bg-white aria-pressed:text-ink"
			>{label()}</button
		>
	{/each}
</div>

{#if others === 0}
	<div class="mt-5 rounded-[18px] border border-dashed border-ruled-line px-4 py-5 text-center">
		<svg class="mx-auto block size-10 fill-current text-faint-pencil" aria-hidden="true">
			<use href="#i-fill-users" />
		</svg>
		<h2 class="mt-2 font-display text-[19px] leading-[1.25] font-semibold text-ink">
			{m.chy52s2_empty_title()}
		</h2>
		<p class="mt-1 text-[14.5px] text-pencil">{m.chy52s2_empty_body()}</p>
	</div>
{:else}
	<ul
		class="mt-4 divide-y divide-ruled-line overflow-hidden rounded-[18px] border border-ruled-line bg-white/55"
	>
		{#each rows as r (r.row.handle)}
			{#if r.row.me}
				<li class="bg-white shadow-[inset_3px_0_0_var(--color-ink)]">
					<div class={ROW}>{@render cells(r)}</div>
				</li>
			{:else}
				<li>
					<a
						href={resolve('/(app)/u/[handle]', { handle: r.row.handle })}
						class="{ROW} cursor-pointer">{@render cells(r)}</a
					>
				</li>
			{/if}
		{/each}
	</ul>
{/if}
