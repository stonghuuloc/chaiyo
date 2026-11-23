<script lang="ts">
	import type { RoadStatus } from '#lib/study/index.js';

	let { status, size = 'sm' }: { status: RoadStatus; size?: 'sm' | 'lg' } = $props();

	const lg = $derived(size === 'lg');
	const look = $derived(
		status === 'done'
			? 'bg-primary text-white'
			: status === 'locked'
				? 'bg-shaded-paper text-muted'
				: lg
					? 'border-[2.5px] border-primary bg-background text-primary'
					: 'border-[1.5px] border-primary text-primary'
	);
	const icon = $derived(lg ? (status === 'done' ? 'size-[17px]' : 'size-[15px]') : 'size-4');
</script>

<span
	data-part="road-mark"
	data-status={status}
	class="grid place-items-center rounded-full {lg ? 'relative z-1 size-9' : 'size-7'} {look}"
>
	{#if status === 'locked'}
		<svg class="{icon} fill-current" aria-hidden="true"><use href="#i-fill-lock-simple" /></svg>
	{:else if status === 'done'}
		<svg class="{icon} fill-current" aria-hidden="true"><use href="#i-bold-check" /></svg>
	{:else}
		<i class="{lg ? 'size-3.5' : 'size-2'} rounded-full bg-primary"></i>
	{/if}
</span>
