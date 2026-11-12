<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	// Focus-flow template (ADR 0008 §4): sticky top bar, one centred column, sticky action bar.
	let {
		step,
		narrow = false,
		wide = false,
		top,
		actions,
		children
	}: {
		step?: unknown;
		narrow?: boolean;
		wide?: boolean;
		top?: Snippet;
		actions?: Snippet;
		children: Snippet;
	} = $props();
	let column: HTMLElement | undefined = $state();
	let first = true;

	$effect(() => {
		void step;
		if (first) {
			first = false;
			return;
		}
		void tick().then(() => {
			const heading = column?.querySelector<HTMLElement>('[data-step-heading], h1, h2');
			if (!heading) return;
			heading.tabIndex = -1;
			heading.focus({ preventScroll: true });
		});
	});
</script>

<div
	data-focus-frame
	class="flex min-h-dvh flex-col [--col:var(--container-column)] [--gutter:20px] md:[--gutter:32px] lg:min-h-0 lg:[--gutter:40px] {narrow
		? 'md:[--col:var(--container-narrow)] lg:[--col:var(--container-narrow)]'
		: 'md:[--col:var(--container-medium)] lg:[--col:var(--container-main)]'} {wide
		? 'lg:[--col:calc(var(--container-narrow)+var(--container-form)+80px)]!'
		: ''}"
>
	{#if top}
		<header class="sticky top-0 z-10 bg-background">
			<div
				class="page-col pt-[calc(env(safe-area-inset-top,0px)+8px)] pr-(--gutter) pb-2 pl-[calc(var(--gutter)-8px)] lg:pt-5"
			>
				{@render top()}
			</div>
		</header>
	{/if}
	<div class="page-col flex flex-1 flex-col px-(--gutter) pt-2 lg:flex-none">
		<div class="flex-1 lg:flex-none" bind:this={column}>{@render children()}</div>
		{#if actions}
			<div
				class="sticky bottom-0 z-9 bg-[linear-gradient(transparent,var(--color-background)_22%)] pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] lg:pt-6"
			>
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
