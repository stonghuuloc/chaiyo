<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import RoadMark from '#lib/ui/RoadMark.svelte';
	import type { TrackItem } from './tracks';

	let { items, onlocked }: { items: TrackItem[]; onlocked: (item: TrackItem) => void } = $props();
</script>

<div data-part="tracks" class="pt-4">
	{#each items as item (item.id)}
		<details
			data-part="track"
			class="group mb-3 rounded-[16px] border border-ruled-line bg-white/45"
		>
			<summary
				class="grid cursor-pointer list-none grid-cols-[44px_1fr_18px] items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden"
			>
				<span
					data-part="track-icon"
					class="grid size-11 place-items-center rounded-[12px] bg-shaded-paper text-graphite [--duo:.4]"
				>
					<svg class="size-[22px] fill-current" aria-hidden="true"
						><use href="#i-fill-{item.icon}" /></svg
					>
				</span>
				<span>
					<b
						data-part="track-title"
						class="block font-serif text-[17px]/[1.3] font-semibold text-ink"
						>{item.title}
						<span lang="zh" class="text-[16px] font-normal text-muted">{item.hz}</span></b
					>
					<small class="mt-0.5 block text-label text-muted">{item.note}</small>
					<small
						data-part="track-need"
						class="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-graphite"
					>
						{#if item.locked}
							<svg class="size-[11px] flex-none fill-current text-muted" aria-hidden="true"
								><use href="#i-fill-lock-simple" /></svg
							>
							{m.chy49s3_track_need_lock({ need: item.need, count: item.lessons.length })}
						{:else}
							{m.chy49s3_track_need({ need: item.need, count: item.lessons.length })}
						{/if}
					</small>
				</span>
				<svg
					class="size-4 fill-current text-faint-pencil transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
					aria-hidden="true"><use href="#i-regular-caret-down" /></svg
				>
			</summary>
			<ol class="relative list-none px-4 pb-3">
				{#each item.lessons as title, k (k)}
					<li
						data-part="track-row"
						class="relative before:absolute before:inset-y-0 before:left-[17px] before:w-0.5 before:bg-ruled-line first:before:top-1/2 last:before:bottom-1/2"
					>
						<button
							type="button"
							class="grid min-h-[60px] w-full cursor-pointer grid-cols-[36px_1fr_16px] items-center gap-3 py-2 text-left"
							onclick={() => onlocked(item)}
						>
							<RoadMark status="locked" size="lg" />
							<b data-part="level-title" class="block font-serif text-title text-graphite">
								{m.chy49s1_row_n({ n: k + 1 })}
								<span class="font-medium text-muted">{m.chy49s1_row_title({ title })}</span>
							</b>
							<svg class="size-4 fill-current text-faint-pencil" aria-hidden="true"
								><use href="#i-regular-caret-right" /></svg
							>
						</button>
					</li>
				{/each}
			</ol>
		</details>
	{/each}
</div>
