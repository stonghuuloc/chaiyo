<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let inApp = false;
	afterNavigate(({ from, type }) => {
		inApp ||= from !== null && type !== 'popstate';
	});
	snapshot({
		capture: () => inApp,
		restore: (value) => {
			inApp = value;
		}
	});

	function back(e: MouseEvent) {
		if (!inApp) return;
		e.preventDefault();
		history.back();
	}
</script>

<div class="sticky top-0 grid grid-cols-[44px_1fr_44px] items-center bg-notebook-paper py-2">
	<a
		href={resolve('/(app)/(tabs)/me')}
		onclick={back}
		aria-label={m.chy52s1_back()}
		class="grid size-11 place-items-center rounded-full text-graphite"
	>
		<svg class="size-[22px] -scale-x-100 fill-current" aria-hidden="true">
			<use href="#i-regular-caret-right" />
		</svg>
	</a>
	<span class="text-center font-display text-title">{m.chy52s1_title()}</span>
	<span></span>
</div>

{#if data.profile.status === 'visible'}
	<h1 class="mt-3 font-display text-headline">{data.profile.name}</h1>
{:else}
	<div class="mt-8 text-center">
		<svg class="mx-auto size-14 fill-current text-faint-pencil" aria-hidden="true">
			<use href={data.profile.status === 'hidden' ? '#i-fill-user-block' : '#i-fill-magnifer'} />
		</svg>
		<h1 class="mt-3 font-display text-headline">
			{data.profile.status === 'hidden' ? m.chy52s1_hidden_title() : m.chy52s1_missing_title()}
		</h1>
		<p class="mx-auto mt-2 max-w-[28ch] text-[15px] text-pencil">
			{data.profile.status === 'hidden' ? m.chy52s1_hidden_body() : m.chy52s1_missing_body()}
		</p>
	</div>
{/if}
