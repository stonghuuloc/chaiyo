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

	const base =
		'flex w-full items-center justify-center gap-3 rounded-action font-display leading-none no-underline cursor-pointer transition-[scale,background-color,opacity] duration-(--motion-press) disabled:cursor-default disabled:bg-shaded-paper disabled:shadow-none disabled:inset-shadow-none motion-reduce:transition-[background-color,opacity] motion-reduce:duration-(--motion-fade-reduced)';
	const variants = {
		primary:
			'h-[62px] bg-lantern-red text-action text-white shadow-lift inset-shadow-lift active:not-disabled:bg-lantern-red-press motion-safe:active:not-disabled:scale-[.985] disabled:text-pencil',
		ink: 'h-[62px] bg-ink text-action text-notebook-paper active:not-disabled:bg-graphite motion-safe:active:not-disabled:scale-[.985] disabled:text-pencil',
		outline:
			'h-[56px] border border-ruled-line bg-white/50 text-title text-ink active:not-disabled:bg-shaded-paper disabled:text-faint-pencil'
	};
	const cls = $derived(`${base} ${variants[variant]}`);
</script>

{#snippet content()}
	{#if icon}<svg class="size-[22px] flex-none fill-current" aria-hidden="true"
			><use href="#i-{icon}" /></svg
		>{/if}
	{@render children()}
	{#if caret}<svg class="size-[18px] flex-none fill-current opacity-85" aria-hidden="true"
			><use href="#i-regular-caret-right" /></svg
		>{/if}
{/snippet}

{#if href && !disabled}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolve()d paths -->
	<a class={cls} {href} {onclick}>{@render content()}</a>
{:else}
	<button class={cls} {type} {disabled} {onclick}>{@render content()}</button>
{/if}
