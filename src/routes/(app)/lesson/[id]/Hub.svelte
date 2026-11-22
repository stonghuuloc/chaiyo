<script lang="ts">
	import type { LessonContent } from '#lib/catalog/index.js';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import { hubView } from './hub';

	let { lesson, study }: { lesson: LessonContent; study: State } = $props();

	const id = $derived(lesson.lesson.id);
	const sections = $derived(CURRICULUM.lessons.find((l) => l.id === id)?.sections ?? []);
	const hub = $derived(hubView(lesson, sections, study));
	const href = (section: string) => resolve('/(app)/lesson/[id]/[section]', { id, section });
</script>

<section data-content-sha={lesson.contentSha} class="flex flex-col gap-6 pb-24">
	<header class="flex flex-col gap-2">
		{#if hub.kicker}
			<p class="text-sm text-pencil">{hub.kicker}</p>
		{/if}
		<h1 class="font-display text-headline">{hub.title} <span lang="zh">{hub.hanzi}</span></h1>
		{#if hub.meta}
			<p class="text-graphite">{hub.meta}</p>
		{/if}
		<div class="flex items-center gap-3">
			<div class="flex flex-1 gap-1" aria-hidden="true">
				{#each hub.rows as row (row.id)}
					<i class="h-1.5 flex-1 overflow-hidden rounded-full bg-ruled-line">
						<b class="block h-full bg-lantern-red" style:width="{row.pct}%"></b>
					</i>
				{/each}
			</div>
			<span class="text-sm text-graphite">{hub.progress}</span>
		</div>
	</header>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-display">{m.hub_sections()}</h2>
		<ol class="flex flex-col gap-2">
			{#each hub.rows as row (row.id)}
				<li>
					<a
						data-part="hub-row"
						data-look={row.look}
						href={href(row.id)}
						class="rounded-2xl flex items-center gap-3 border border-ruled-line bg-white p-3"
					>
						<span
							class="size-6 shrink-0 rounded-full border-2 border-lantern-red"
							style:background="conic-gradient(var(--color-lantern-red) {row.pct}%, transparent 0)"
						></span>
						<span class="flex flex-col">
							<b>{row.name}</b>
							{#if row.sub}
								<small class="text-graphite">{row.sub}</small>
							{/if}
						</span>
					</a>
				</li>
			{/each}
		</ol>
		<a
			data-part="hub-gate"
			data-look={hub.gate.locked ? 'locked' : 'todo'}
			href={hub.gate.locked ? undefined : resolve('/(app)/lesson/[id]/gate', { id })}
			aria-disabled={hub.gate.locked ? 'true' : undefined}
			class={[
				'rounded-2xl flex items-center gap-3 border border-ruled-line bg-white p-3',
				hub.gate.locked && 'cursor-default text-graphite'
			]}
		>
			{#if hub.gate.locked}
				<svg class="size-6 shrink-0 fill-current" aria-hidden="true"
					><use href="#i-fill-lock-simple" /></svg
				>
			{:else}
				<span class="size-6 shrink-0 rounded-full border-2 border-lantern-red"></span>
			{/if}
			<span class="flex flex-col">
				<b>{m.hub_gate_name()}</b>
				{#if hub.gate.sub}
					<small class="text-graphite">{hub.gate.sub}</small>
				{/if}
			</span>
		</a>
	</section>

	{#if hub.words.length > 0}
		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between">
				<h2 class="text-lg font-display">{m.hub_lesson_words_title()}</h2>
				<a
					data-part="hub-lexicon"
					href={resolve('/(app)/(tabs)/practice')}
					class="text-sm text-lantern-red">{m.hub_lesson_words_mine()}</a
				>
			</div>
			<ul class="flex flex-wrap gap-2">
				{#each hub.words as w (w.id)}
					<li
						data-part="hub-word"
						data-reached={String(w.reached)}
						class={[
							'rounded-xl flex flex-col items-center border bg-white px-3 py-2',
							w.reached ? 'border-solid border-ruled-line' : 'border-dashed border-pencil'
						]}
					>
						<span lang="zh" class="text-lg">{w.hanzi}</span>
						<span class="text-sm text-graphite">{w.pinyin}</span>
					</li>
				{/each}
			</ul>
			<p data-part="hub-legend" class="text-sm text-pencil">{m.hub_lesson_words_legend()}</p>
		</section>
	{/if}

	{#if hub.cta}
		<a
			data-part="hub-cta"
			href={href(hub.cta.section)}
			class="fixed inset-x-4 bottom-4 rounded-full bg-lantern-red p-4 text-center font-bold text-white"
		>
			{hub.cta.label}
		</a>
	{/if}
</section>
