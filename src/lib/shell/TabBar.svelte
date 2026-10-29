<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { prefersReducedMotion } from 'svelte/motion';
	import { m } from '#lib/paraglide/messages.js';
	import { barSlide } from './motion';
	import { TABS, tabFor } from './tabs';

	const active = $derived(tabFor(page.url.pathname));
	// the slide-out keeps the last selection, so the icon does not fade back to line mid-slide
	let shown = $state(tabFor(page.url.pathname) ?? 0);
	$effect.pre(() => {
		if (active !== null) shown = active;
	});
</script>

{#if active !== null}
	<nav
		class="bar"
		aria-label={m.tabs_label()}
		transition:barSlide={{ reduced: prefersReducedMotion.current }}
	>
		<div class="pill">
			{#each TABS as tab, i (tab.path)}
				<a class="tab" href={resolve(tab.route)} aria-current={i === shown ? 'page' : undefined}>
					<span class="icw" aria-hidden="true">
						<svg class="ic l"><use href="#i-regular-{tab.icon}" /></svg>
						<svg class="ic f n-{tab.icon}"><use href="#i-fill-{tab.icon}" /></svg>
					</span>
					<span class="label">{tab.label()}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}

<style>
	.bar {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 10;
		display: flex;
		justify-content: center;
		padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
		pointer-events: none;
	}

	.pill {
		pointer-events: auto;
		position: relative;
		isolation: isolate;
		width: min(402px, calc(100% - 28px));
		height: 66px;
		padding: 5px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-radius: var(--radius-pill);
		background: var(--frost-tint);
		-webkit-backdrop-filter: blur(var(--frost-blur)) saturate(var(--frost-saturate));
		backdrop-filter: blur(var(--frost-blur)) saturate(var(--frost-saturate));
		border: 0.5px solid var(--frost-edge);
		box-shadow:
			inset 0 1px 0 var(--frost-rim),
			inset 0 -1px 1px rgb(40 20 10 / 0.08),
			var(--frost-shadow);
	}

	.pill::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		pointer-events: none;
		background:
			linear-gradient(180deg, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0) 42%),
			radial-gradient(120% 90% at 50% 120%, rgb(255 255 255 / 0.25), transparent 60%);
	}

	.tab {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 3px;
		border-radius: var(--radius-pill);
		color: var(--color-graphite);
		-webkit-tap-highlight-color: transparent;
		transition: color var(--motion-fade) ease;
	}

	.label {
		font-size: 11.5px;
		font-weight: 600;
	}

	.tab[aria-current='page'],
	.tab:active {
		color: var(--color-ink);
	}

	.icw {
		position: relative;
		width: 24px;
		height: 24px;
	}

	.ic {
		position: absolute;
		inset: 0;
		width: 24px;
		height: 24px;
		transition: opacity var(--motion-fade) ease;
	}

	.f {
		color: var(--color-lantern-red-wash);
		--duo: 1;
		--duo-c: var(--color-lantern-red);
		opacity: 0;
	}

	.f.n-brain {
		color: var(--color-lantern-red);
		--duo: 0.42;
	}

	.tab[aria-current='page'] .f {
		opacity: 1;
	}

	.tab[aria-current='page'] .l {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.tab,
		.ic {
			transition-duration: var(--motion-fade-reduced);
		}
	}
</style>
