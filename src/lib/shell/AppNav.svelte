<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { prefersReducedMotion } from 'svelte/motion';
	import { m } from '#lib/paraglide/messages.js';
	import { barSlide } from './motion';
	import { TABS } from './tabs';
	import { navFor } from './template';

	const nav = $derived(navFor(page.data.shell, page.url.pathname));
	// the slide-out keeps the last selection, so the icon does not fade back to line mid-slide
	let shown = $state(0);
	$effect.pre(() => {
		if (nav?.active != null) shown = nav.active;
	});
</script>

{#if nav}
	<nav
		class="bar"
		class:side-only={nav.mode === 'sidebar'}
		aria-label={m.tabs_label()}
		transition:barSlide={{ reduced: prefersReducedMotion.current }}
	>
		<a class="brand" href={resolve('/(app)/(tabs)/today')}>
			<img src="/brand/icon-192.png" alt="" width="32" height="32" />
			{m.login_name()}
		</a>
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
		--nav-mode: tab-bar;
		position: fixed;
		inset: auto 0 0 0;
		z-index: 10;
		display: flex;
		justify-content: center;
		padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
		pointer-events: none;
	}

	.brand {
		display: none;
	}

	/* a pushed screen has no tab bar below 1024px: it slides away like the bar does when leaving a tab */
	.bar.side-only {
		transform: translateY(100%);
		visibility: hidden;
		transition:
			transform var(--motion-fade) ease,
			visibility 0s var(--motion-fade);
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
		background: var(--color-frost-tint);
		-webkit-backdrop-filter: blur(var(--blur-frost)) saturate(var(--frost-saturate));
		backdrop-filter: blur(var(--blur-frost)) saturate(var(--frost-saturate));
		border: 0.5px solid var(--color-frost-edge);
		box-shadow:
			inset 0 1px 0 var(--color-frost-rim),
			inset 0 -1px 1px var(--color-frost-inner),
			var(--shadow-frost);
	}

	.pill::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		pointer-events: none;
		background:
			linear-gradient(180deg, var(--color-frost-sheen-top), var(--color-frost-sheen-clear) 42%),
			radial-gradient(120% 90% at 50% 120%, var(--color-frost-sheen-glow), transparent 60%);
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

	/* from 1024px the same nav is a flat paper sidebar: it sits beside the page, so it is not frost */
	@media (min-width: 64rem) {
		.bar,
		.bar.side-only {
			--nav-mode: sidebar;
			inset: 0 auto 0 0;
			width: var(--sidebar);
			flex-direction: column;
			justify-content: flex-start;
			gap: 24px;
			padding: 28px 16px;
			background: var(--color-background);
			border-right: 1px solid var(--color-border);
			pointer-events: auto;
			transform: none;
			visibility: visible;
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 0 12px;
			font-family: var(--font-serif);
			font-size: 20px;
			font-weight: 600;
			line-height: 1;
			border-radius: var(--radius-cell);
		}

		.brand img {
			border-radius: 9px;
		}

		.pill {
			width: auto;
			height: auto;
			padding: 0;
			display: grid;
			grid-template-columns: none;
			grid-auto-rows: 48px;
			gap: 4px;
			border-radius: 0;
			background: none;
			border: 0;
			box-shadow: none;
			-webkit-backdrop-filter: none;
			backdrop-filter: none;
		}

		.pill::before {
			display: none;
		}

		.tab {
			display: flex;
			justify-items: start;
			align-items: center;
			gap: 12px;
			padding: 0 14px;
		}

		.label {
			font-size: 15px;
		}

		.tab[aria-current='page'] {
			background: var(--color-frost-pill);
			box-shadow: var(--inset-shadow-frost);
		}
	}

	@media (hover: hover) and (min-width: 64rem) {
		.tab:not([aria-current='page']):hover {
			background: var(--color-shaded-paper);
			color: var(--color-ink);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tab,
		.ic,
		.bar.side-only {
			transition-duration: var(--motion-fade-reduced);
		}
	}
</style>
