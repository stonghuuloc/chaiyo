<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { asset, resolve } from '$app/paths';
	import type { Cta, Scene } from './today';

	let { view }: { view: { cta: Cta; scene: Scene } } = $props();

	const alt: Record<Scene, () => string> = {
		'reviews-due': m.chy45s1_alt_reviews_due,
		'lesson-next': m.chy45s1_alt_lesson_next,
		'day-done': m.chy45s1_alt_day_done,
		'streak-at-risk': m.chy45s1_alt_streak_at_risk,
		'freeze-used': m.chy45s1_alt_freeze_used
	};

	const src = {
		'reviews-due': asset('home/reviews-due.webp'),
		'lesson-next': asset('home/lesson-next.webp'),
		'day-done': asset('home/day-done.webp'),
		'streak-at-risk': asset('home/streak-at-risk.webp'),
		'freeze-used': asset('home/freeze-used.webp')
	} satisfies Record<Scene, string>;

	const anchor = 'rounded-full bg-lantern-red p-4 text-center font-bold text-white';
</script>

<img
	data-part="scene"
	data-scene={view.scene}
	src={src[view.scene]}
	alt={alt[view.scene]()}
	class="block w-full rounded-cell"
	width="860"
	height="573"
/>
<div data-part="next" class="flex flex-col">
	{#if view.cta.kind === 'reviews'}
		<a
			data-part="next-cta"
			data-kind="reviews"
			href={resolve('/(app)/practice/session')}
			class={anchor}
		>
			{m.chy45s1_cta_reviews()}
		</a>
	{:else if view.cta.kind === 'lesson'}
		<a
			data-part="next-cta"
			data-kind="lesson"
			href={resolve('/(app)/lesson/[id]', { id: view.cta.id })}
			class={anchor}
		>
			{m.chy45s1_cta_lesson({ n: view.cta.n })}
		</a>
	{:else if view.cta.kind === 'thi'}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve()d path plus a query -->
		<a
			data-part="next-cta"
			data-kind="thi"
			href={resolve('/(app)/practice/skill') + '?k=thi&lv=' + view.cta.level}
			class={anchor}
		>
			{m.chy45s1_cta_thi({ level: view.cta.level })}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<p data-part="next-done">{m.chy45s1_cta_done()}</p>
	{/if}
</div>
