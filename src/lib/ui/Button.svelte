<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		variant?: 'primary' | 'ink' | 'outline';
		href?: string;
		disabled?: boolean;
		icon?: string;
		caret?: boolean;
		type?: 'button' | 'submit';
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	};

	let {
		variant = 'primary',
		href,
		disabled = false,
		icon,
		caret = false,
		type = 'button',
		onclick,
		children
	}: Props = $props();
</script>

{#snippet content()}
	{#if icon}<svg class="ic" aria-hidden="true"><use href="#i-{icon}" /></svg>{/if}
	{@render children()}
	{#if caret}<svg class="ic go" aria-hidden="true"><use href="#i-regular-caret-right" /></svg>{/if}
{/snippet}

{#if href && !disabled}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolve()d paths -->
	<a class="btn {variant}" {href} {onclick}>{@render content()}</a>
{:else}
	<button class="btn {variant}" {type} {disabled} {onclick}>{@render content()}</button>
{/if}

<style>
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-s3);
		width: 100%;
		height: 62px;
		border: 0;
		border-radius: var(--radius-action);
		font-family: var(--font-display);
		font-size: var(--text-action);
		font-weight: var(--text-action--font-weight);
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition:
			transform var(--motion-press),
			background-color var(--motion-press),
			opacity var(--motion-press);
	}

	.primary {
		background: var(--color-lantern-red);
		color: var(--color-white);
		box-shadow:
			var(--lift-shadow),
			inset 0 1px 0 var(--lift-rim);
	}

	.primary:active:not(:disabled) {
		background: var(--color-lantern-red-press);
	}

	.ink {
		background: var(--color-ink);
		color: var(--color-notebook-paper);
	}

	.ink:active:not(:disabled) {
		background: var(--color-graphite);
	}

	.outline {
		height: 56px;
		border: 1px solid var(--color-ruled-line);
		background: color-mix(in srgb, var(--color-white) 50%, transparent);
		color: var(--color-ink);
		font-size: var(--text-title);
	}

	.outline:active:not(:disabled) {
		background: var(--color-shaded-paper);
	}

	.btn:active:not(:disabled) {
		transform: scale(0.985);
	}

	.btn:disabled {
		background: var(--color-shaded-paper);
		color: var(--color-pencil);
		box-shadow: none;
		cursor: default;
	}

	.outline:disabled {
		color: var(--color-faint-pencil);
	}

	.btn:focus-visible {
		outline: 2.5px solid var(--color-primary);
		outline-offset: 3px;
	}

	.ic {
		width: 1em;
		height: 1em;
		flex: none;
		fill: currentColor;
		font-size: 22px;
	}

	.go {
		font-size: 18px;
		opacity: 0.85;
	}

	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition-property: background-color, opacity;
			transition-duration: var(--motion-fade-reduced);
		}

		.btn:active:not(:disabled) {
			transform: none;
		}
	}
</style>
