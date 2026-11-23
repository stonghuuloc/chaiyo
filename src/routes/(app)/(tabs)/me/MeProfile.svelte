<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { initials } from '#lib/welcome/welcome.js';

	let {
		name,
		photo,
		month,
		year
	}: { name: string; photo: string | null; month: number; year: number } = $props();
</script>

<div data-part="me-profile" class="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3">
	{#if photo}
		<img
			src={photo}
			alt=""
			referrerpolicy="no-referrer"
			class="size-14 rounded-full object-cover"
		/>
	{:else}
		<span
			aria-hidden="true"
			class="grid size-14 place-items-center rounded-full bg-lantern-red-wash font-display text-[21px] font-semibold text-lantern-red-text"
			>{initials(name)}</span
		>
	{/if}
	<div>
		<h1 class="font-display text-[22px] leading-[1.15] font-semibold">{name}</h1>
		<p class="mt-0.5 text-[14px] text-pencil">{m.chy50s2_joined({ month, year })}</p>
	</div>
	<a
		href={resolve('/(app)/settings')}
		aria-label={m.chy50s2_edit()}
		class="grid size-11 place-items-center rounded-full border border-ruled-line text-graphite"
	>
		<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-fill-pen-edit" /></svg>
	</a>
</div>
