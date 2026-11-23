<script lang="ts">
	import type { LessonContent } from '#lib/catalog/index.js';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import Button from '#lib/ui/Button.svelte';
	import { resolve } from '$app/paths';
	import { hubView, type Look, type Row } from './hub';

	let { lesson, study }: { lesson: LessonContent; study: State } = $props();

	const id = $derived(lesson.lesson.id);
	const sections = $derived(CURRICULUM.lessons.find((l) => l.id === id)?.sections ?? []);
	const hub = $derived(hubView(lesson, sections, study));
	const href = (section: string) => resolve('/(app)/lesson/[id]/[section]', { id, section });

	const rowCls =
		'grid min-h-16 grid-cols-[36px_1fr_16px] items-center gap-3 py-2 [@media(hover:hover)]:cursor-pointer';
</script>

{#snippet mark(look: Look | 'locked', pct = 0)}
	{#if look === 'done'}
		<span class="grid size-9 place-items-center rounded-full bg-lantern-red text-white">
			<svg class="size-[17px] fill-current" aria-hidden="true"><use href="#i-bold-check" /></svg>
		</span>
	{:else if look === 'now'}
		<span
			class="grid size-9 place-items-center rounded-full"
			style:background="conic-gradient(var(--color-lantern-red) {pct}%, var(--color-ruled-line) 0)"
		>
			<span class="col-start-1 row-start-1 size-[31px] rounded-full bg-notebook-paper"></span>
			<span class="col-start-1 row-start-1 size-3 rounded-full bg-lantern-red"></span>
		</span>
	{:else if look === 'locked'}
		<span class="grid size-9 place-items-center rounded-full bg-shaded-paper text-pencil">
			<svg class="size-[15px] fill-current" aria-hidden="true"
				><use href="#i-fill-lock-simple" /></svg
			>
		</span>
	{:else}
		<span class="size-9 rounded-full border-[1.5px] border-faint-pencil"></span>
	{/if}
{/snippet}

{#snippet text(name: string, sub: string, look: Look | 'locked')}
	<span>
		<b
			class={[
				'block font-display text-title',
				look === 'now' && 'text-lantern-red-text',
				look === 'locked' && 'text-graphite'
			]}>{name}</b
		>
		{#if sub}
			<small class="mt-0.5 block text-label text-pencil">{sub}</small>
		{/if}
	</span>
{/snippet}

{#snippet caret(look: Look)}
	<svg
		class={['size-4 fill-current', look === 'now' ? 'text-lantern-red' : 'text-faint-pencil']}
		aria-hidden="true"><use href="#i-regular-caret-right" /></svg
	>
{/snippet}

{#snippet link(row: Row)}
	<a data-part="hub-row" data-look={row.look} href={href(row.id)} class={rowCls}>
		{@render mark(row.look, row.pct)}
		{@render text(row.name, row.sub, row.look)}
		{@render caret(row.look)}
	</a>
{/snippet}

<section
	data-content-sha={lesson.contentSha}
	class="relative flex min-h-dvh flex-col pt-[calc(env(safe-area-inset-top,0px)+76px)] lg:min-h-0"
>
	<a
		href={resolve('/(app)/(tabs)/roadmap')}
		aria-label={m.pinyin_close()}
		class="absolute top-[calc(env(safe-area-inset-top,0px)+14px)] left-0 z-5 grid size-10 place-items-center rounded-full bg-frost-tint text-ink shadow-frost inset-shadow-frost backdrop-blur-frost backdrop-saturate-(--frost-saturate)"
	>
		<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-regular-x" /></svg>
	</a>

	<header>
		{#if hub.kicker}
			<p class="text-label text-pencil">{hub.kicker}</p>
		{/if}
		<h1 class="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-display text-display">
			{hub.title}
			<span lang="zh" class="font-hanzi text-[32px] font-normal tracking-[.04em] text-graphite"
				>{hub.hanzi}</span
			>
		</h1>
		{#if hub.meta}
			<p class="mt-3 text-label text-pencil">{hub.meta}</p>
		{/if}
		<div class="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
			<div class="flex gap-1" aria-hidden="true">
				{#each hub.rows as row (row.id)}
					<i class="h-1 flex-1 overflow-hidden rounded-[2px] bg-ruled-line">
						<b class="block h-full bg-lantern-red" style:width="{row.pct}%"></b>
					</i>
				{/each}
			</div>
			<span class="text-label font-semibold text-graphite tabular-nums">{hub.progress}</span>
		</div>
	</header>

	<section class="mt-5 border-t border-ruled-line pt-6">
		<h2 class="mb-2 font-display text-headline">{m.hub_sections()}</h2>
		<ol class="divide-y divide-ruled-line">
			{#if hub.warmup}
				<li>{@render link(hub.warmup)}</li>
			{/if}
			{#each hub.rows as row (row.id)}
				<li>{@render link(row)}</li>
			{/each}
			{#each hub.links ?? [] as link (link.id)}
				<li>
					<a data-part="hub-link" href={resolve('/(app)/pinyin')} class={rowCls}>
						{@render mark('todo')}
						{@render text(link.label, '', 'todo')}
						{@render caret('todo')}
					</a>
				</li>
			{/each}
			<li>
				<a
					data-part="hub-gate"
					data-look={hub.gate.locked ? 'locked' : 'todo'}
					href={hub.gate.locked ? undefined : resolve('/(app)/lesson/[id]/gate', { id })}
					aria-disabled={hub.gate.locked ? 'true' : undefined}
					class={[rowCls, hub.gate.locked && 'cursor-default!']}
				>
					{@render mark(hub.gate.locked ? 'locked' : 'todo')}
					{@render text(
						hub.gate.name ?? m.hub_gate_name(),
						hub.gate.sub,
						hub.gate.locked ? 'locked' : 'todo'
					)}
					{#if hub.gate.locked}<span></span>{:else}{@render caret('todo')}{/if}
				</a>
			</li>
		</ol>
		{#if hub.testOut}
			<a
				data-part="hub-testout"
				href={resolve('/(app)/lesson/[id]/gate', { id })}
				class="mt-2 block py-3 text-center font-semibold text-lantern-red-text"
				>{hub.testOut.label}</a
			>
		{/if}
	</section>

	{#if hub.words.length > 0}
		<section class="mt-5 border-t border-ruled-line pt-6">
			<div class="mb-2 flex items-baseline justify-between">
				<h2 class="font-display text-headline">{m.hub_lesson_words_title()}</h2>
				<a
					data-part="hub-lexicon"
					href={resolve('/(app)/(tabs)/practice')}
					class="inline-flex items-center gap-0.5 text-[14px] font-medium text-lantern-red-text"
					>{m.hub_lesson_words_mine()}<svg class="size-[13px] fill-current" aria-hidden="true"
						><use href="#i-regular-caret-right" /></svg
					></a
				>
			</div>
			<ul class="mt-2 flex flex-wrap gap-1.5">
				{#each hub.words as w (w.id)}
					<li
						data-part="hub-word"
						data-reached={String(w.reached)}
						class={[
							'grid min-w-[62px] justify-items-center gap-0.5 rounded-cell border border-ruled-line px-3 pt-2.5 pb-2',
							w.reached ? 'bg-white/35' : 'border-dashed'
						]}
					>
						<span
							lang="zh"
							class={[
								'font-hanzi text-[25px] leading-[1.15]',
								w.reached ? 'text-ink' : 'text-pencil'
							]}>{w.hanzi}</span
						>
						<span class="text-[12.5px] whitespace-nowrap text-pencil">{w.pinyin}</span>
					</li>
				{/each}
			</ul>
			<p data-part="hub-legend" class="mt-3 text-label text-pencil">
				{m.hub_lesson_words_legend()}
			</p>
		</section>
	{/if}

	{#if hub.cta}
		<div
			data-part="hub-cta"
			class="sticky bottom-0 z-10 mt-auto bg-linear-to-b from-notebook-paper/0 to-notebook-paper to-34% pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
		>
			<Button href={href(hub.cta.section)} icon="regular-play" caret>{hub.cta.label}</Button>
		</div>
	{/if}
</section>
