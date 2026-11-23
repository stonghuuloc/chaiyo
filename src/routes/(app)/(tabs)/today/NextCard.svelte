<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import { asset, resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { Cta, Scene } from './today';

	let {
		view,
		chip,
		children
	}: { view: { cta: Cta; scene: Scene } | null; chip?: Snippet; children?: Snippet } = $props();

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
</script>

<header
	data-part="hero"
	class="span -mx-(--gutter) mt-[calc(-1*(env(safe-area-inset-top,0px)+54px))] grid md:mx-0 md:mt-[calc(-1*(env(safe-area-inset-top,0px)+30px))] lg:-mt-4 xl:mt-0 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center xl:gap-x-12"
>
	<div
		class="relative col-start-1 row-start-1 h-[400px] overflow-hidden bg-shaded-paper before:absolute before:inset-x-0 before:top-0 before:z-1 before:h-[150px] before:bg-linear-to-b before:from-ink/50 before:to-ink/0 after:absolute after:inset-x-0 after:bottom-0 after:z-1 after:h-[120px] after:bg-linear-to-b after:from-notebook-paper/0 after:to-notebook-paper after:to-92% md:h-[clamp(280px,42svh,380px)] md:rounded-action md:after:hidden xl:col-start-2 xl:aspect-3/2 xl:h-auto xl:before:hidden"
	>
		{#if view}
			<img
				data-part="scene"
				data-scene={view.scene}
				src={src[view.scene]}
				alt={alt[view.scene]()}
				class="absolute inset-0 size-full object-cover object-[50%_40%]"
				width="860"
				height="573"
			/>
		{/if}
		{#if chip}
			<div
				class="absolute top-[calc(env(safe-area-inset-top,0px)+50px)] right-(--gutter) z-3 md:top-[22px] md:right-[22px] xl:top-4 xl:right-4"
			>
				{@render chip()}
			</div>
		{/if}
	</div>
	<div class="contents xl:col-start-1 xl:row-start-1 xl:block">
		<h1
			class="z-2 col-start-1 row-start-1 self-start px-(--gutter) pt-[calc(env(safe-area-inset-top,0px)+54px)] text-display text-white text-shadow-[0_1px_12px_color-mix(in_srgb,var(--color-ink)_35%,transparent)] md:px-7 md:pt-7 xl:p-0 xl:text-[44px] xl:text-ink xl:text-shadow-none"
		>
			{m.tab_today()}
		</h1>
		<div
			data-part="next"
			class="z-3 mx-(--gutter) -mt-14 md:mx-7 md:-mt-10 xl:mx-0 xl:mt-6 xl:max-w-(--container-form)"
		>
			{#if view?.cta.kind === 'reviews'}
				<div data-part="next-cta" data-kind="reviews">
					<Button href={resolve('/(app)/practice/session')} icon="regular-play" caret>
						{m.chy45s1_cta_reviews()}
					</Button>
				</div>
			{:else if view?.cta.kind === 'lesson'}
				<div data-part="next-cta" data-kind="lesson">
					<Button
						href={resolve('/(app)/lesson/[id]', { id: view.cta.id })}
						icon="regular-play"
						caret
					>
						{m.chy45s1_cta_lesson({ n: view.cta.n })}
					</Button>
				</div>
			{:else if view?.cta.kind === 'thi'}
				<div data-part="next-cta" data-kind="thi">
					<Button
						href={resolve('/(app)/practice/skill') + '?k=thi&lv=' + view.cta.level}
						icon="regular-play"
						caret
					>
						{m.chy45s1_cta_thi({ level: view.cta.level })}
					</Button>
				</div>
			{:else if view}
				<p
					data-part="next-done"
					class="flex h-[62px] items-center justify-center text-title text-ink xl:justify-start"
				>
					{m.chy45s1_cta_done()}
				</p>
			{/if}
			{@render children?.()}
		</div>
	</div>
</header>
