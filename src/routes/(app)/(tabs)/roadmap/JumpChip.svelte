<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { n, show, onjump }: { n: number; show: boolean; onjump: () => void } = $props();
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+94px)] z-9 flex justify-center ps-(--nav-inset,0px)"
>
	<button
		type="button"
		data-part="jump"
		inert={!show}
		onclick={onjump}
		class="flex h-10 cursor-pointer items-center gap-1.5 rounded-pill border-[0.5px] border-frost-edge bg-frost-tint px-4 text-[14px] font-semibold text-lantern-red-text shadow-frost inset-shadow-frost backdrop-blur-frost backdrop-saturate-(--frost-saturate) transition-[opacity,transform] duration-200 motion-reduce:transition-none {show
			? 'pointer-events-auto opacity-100'
			: 'translate-y-3 opacity-0'}"
	>
		<svg class="size-[17px] fill-current" aria-hidden="true"><use href="#i-regular-target" /></svg>
		{m.chy49s3_jump({ n })}
	</button>
</div>
