<script lang="ts">
	import { resolve } from '$app/paths';
	import { MediaQuery } from 'svelte/reactivity';
	import { prefersReducedMotion } from 'svelte/motion';
	import { m } from '#lib/paraglide/messages.js';
	import { barSlide } from './motion';
	import { TABS } from './tabs';
	import type { Nav } from './template';

	let { nav }: { nav: Nav | null } = $props();
	// ADR 0008 §1 exception: below 1024px a pushed screen has no bar, so it must not move the selection
	const wide = new MediaQuery('min-width: 64rem');
	// the slide-out keeps the last selection, so the icon does not fade back to line mid-slide
	let shown = $state(0);
	const ease = 'ease-[ease] motion-reduce:duration-(--motion-fade-reduced)';
	$effect.pre(() => {
		if (nav?.active != null && (nav.mode === 'tab-bar' || wide.current)) shown = nav.active;
	});
</script>

{#if nav}
	<nav
		class="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center pb-[calc(14px+env(safe-area-inset-bottom,0px))] [--nav-mode:tab-bar] lg:pointer-events-auto lg:visible lg:inset-[0_auto_0_0] lg:w-(--sidebar) lg:[transform:none] lg:flex-col lg:justify-start lg:gap-6 lg:border-r lg:border-border lg:bg-background lg:px-4 lg:py-7 lg:transition-none lg:[--nav-mode:sidebar] {nav.mode ===
		'sidebar'
			? 'invisible [transform:translateY(100%)] [transition:transform_var(--motion-fade)_cubic-bezier(0.215,0.61,0.355,1),visibility_0s_var(--motion-fade)]'
			: 'transition-[transform] duration-(--motion-fade) ease-[cubic-bezier(0.215,0.61,0.355,1)]'} motion-reduce:duration-(--motion-fade-reduced)"
		aria-label={m.tabs_label()}
		transition:barSlide={{ reduced: prefersReducedMotion.current }}
	>
		<a
			class="hidden min-h-11 items-center gap-2.5 rounded-cell px-3 font-serif text-[20px] leading-none font-semibold lg:flex"
			href={resolve('/(app)/(tabs)/today')}
		>
			<img class="lg:rounded-[9px]" src="/brand/icon-192.png" alt="" width="32" height="32" />
			{m.login_name()}
		</a>
		<div
			class="pointer-events-auto relative isolate grid h-[66px] w-[min(402px,calc(100%-28px))] grid-cols-[repeat(4,1fr)] rounded-pill border-[0.5px] border-frost-edge bg-frost-tint p-[5px] shadow-[inset_0_1px_0_var(--color-frost-rim),inset_0_-1px_1px_var(--color-frost-inner),var(--shadow-frost)] backdrop-blur-frost backdrop-saturate-(--frost-saturate) before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:content-[''] before:[background:linear-gradient(180deg,var(--color-frost-sheen-top),var(--color-frost-sheen-clear)_42%),radial-gradient(120%_90%_at_50%_120%,var(--color-frost-sheen-glow),transparent_60%)] lg:h-auto lg:w-auto lg:auto-rows-[48px] lg:grid-cols-none lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:[box-shadow:none] lg:backdrop-filter-none lg:before:hidden"
		>
			{#each TABS as tab, i (tab.path)}
				<a
					class="group grid content-center justify-items-center gap-[3px] rounded-pill text-graphite transition-[color] duration-(--motion-fade) [-webkit-tap-highlight-color:transparent] {ease} active:text-ink aria-[current=page]:text-ink lg:flex lg:items-center lg:gap-3 lg:px-3.5 hover:lg:not-aria-[current=page]:bg-shaded-paper hover:lg:not-aria-[current=page]:text-ink lg:aria-[current=page]:bg-frost-pill lg:aria-[current=page]:inset-shadow-frost"
					href={resolve(tab.route)}
					aria-current={i === shown ? 'page' : undefined}
				>
					<span class="relative size-6" aria-hidden="true">
						<svg
							class="absolute inset-0 size-6 transition-[opacity] duration-(--motion-fade) {ease} group-aria-[current=page]:opacity-0"
							><use href="#i-regular-{tab.icon}" /></svg
						>
						<svg
							class="absolute inset-0 size-6 opacity-0 transition-[opacity] duration-(--motion-fade) {ease} group-aria-[current=page]:opacity-100 {tab.icon ===
							'brain'
								? 'text-lantern-red [--duo-c:var(--color-lantern-red)] [--duo:0.42]'
								: 'text-lantern-red-wash [--duo-c:var(--color-lantern-red)] [--duo:1]'}"
							><use href="#i-fill-{tab.icon}" /></svg
						>
					</span>
					<span class="text-[11.5px] font-semibold lg:text-[15px]">{tab.label()}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}
