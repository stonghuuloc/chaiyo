<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { LevelCell } from './roadmap';

	let { cells, progress = 0 }: { cells: LevelCell[]; progress?: number } = $props();
</script>

<div
	class="sticky top-0 z-8 -mx-(--gutter) mt-4 border-b-[0.5px] border-frost-edge bg-frost-tint px-(--gutter) pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2.5 backdrop-blur-frost backdrop-saturate-175"
>
	<ol data-part="level-strip" aria-label={m.chy49s1_strip()} class="grid grid-cols-5 gap-1.5">
		{#each cells as cell (cell.level)}
			<li
				data-part="level-cell"
				aria-current={cell.current ? 'true' : undefined}
				class="grid h-[52px] content-center justify-items-center gap-1.5 rounded-cell text-muted {cell.current
					? 'border-2 border-ink bg-white'
					: 'border border-ruled-line bg-white/50'}"
			>
				<b
					class="font-serif text-[17px] leading-none font-semibold {cell.current
						? 'text-ink'
						: 'text-graphite'}">{cell.level}</b
				>
				{#if cell.locked}
					<svg class="size-3 fill-current" aria-hidden="true"
						><use href="#i-fill-lock-simple" /></svg
					>
				{:else}
					<span class="rounded-xs h-1 w-3/5 overflow-hidden bg-ruled-line">
						<i
							class="block h-full bg-primary"
							style:width="{cell.current ? Math.max(4, progress * 100) : 100}%"
						></i>
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</div>
