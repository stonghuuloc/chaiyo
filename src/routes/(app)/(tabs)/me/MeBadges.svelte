<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { BadgesView } from '#lib/study/index.js';
	import { resolve } from '$app/paths';

	let { view }: { view: BadgesView } = $props();

	const how: Record<'first' | 'hsk1' | 'hsk2', () => string> = {
		first: m.chy50s3_how_first,
		hsk1: m.chy50s3_how_hsk1,
		hsk2: m.chy50s3_how_hsk2
	};

	const next = $derived(view.soon[0]);
	const counts = $derived({ have: view.earned.length, total: view.total });
	const strip = $derived([
		...view.earned.map((b) => ({ ...b, locked: false as const })),
		...[...view.soon, ...view.rest].map((b) => ({ ...b, locked: true as const }))
	]);
</script>

<section data-part="me-badges" class="mt-6 border-t border-ruled-line pt-5">
	<div class="flex items-baseline justify-between">
		<h2 class="font-display text-[19px] leading-[1.2] font-semibold">{m.chy51s1_title()}</h2>
		<a
			href={resolve('/(app)/me/badges')}
			class="inline-flex min-h-10 items-center gap-0.5 text-[14px] font-semibold text-pencil"
			>{m.chy50s3_all()}<svg class="size-3.5 fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			></a
		>
	</div>
	<p class="mt-0.5 text-[14px] leading-[18px] text-pencil">
		{next ? m.chy50s3_sub_next({ ...counts, next: next.title }) : m.chy50s3_sub_all(counts)}
	</p>
	<ul class="-mx-5 mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5">
		{#each strip as b (b.id)}
			<li class="flex flex-none">
				<a
					href={resolve('/(app)/me/badges')}
					data-id={b.id}
					class="block w-[116px] rounded-[18px] px-2 py-3 text-center {b.locked
						? 'border border-dashed border-ruled-line'
						: 'bg-white'}"
				>
					<img
						src="/badges/{b.art}.webp"
						alt=""
						loading="lazy"
						class="mx-auto size-21 rounded-full {b.locked ? 'opacity-45 grayscale' : ''}"
					/>
					<b class="mt-2 block text-[13.5px] leading-[1.25] font-semibold">{b.title}</b>
					<small class="mt-0.5 block text-[12px] leading-[normal] text-pencil">
						{#if !b.locked}
							{m.chy51s1_earned()}
						{:else if b.need !== null}
							{b.have}/{b.need}
							<span
								data-part="bd-bar"
								class="mx-2 mt-1.5 block h-1 overflow-hidden rounded-[2px] bg-shaded-paper"
								><i class="block h-full bg-pencil" style:width="{b.pct}%"></i></span
							>
						{:else}
							{how[b.id as keyof typeof how]()}
						{/if}
					</small>
				</a>
			</li>
		{/each}
	</ul>
</section>
