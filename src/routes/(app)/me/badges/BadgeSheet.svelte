<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import type { EarnedBadge, LockedBadge } from '#lib/study/index.js';

	type Props = {
		badge: EarnedBadge | LockedBadge | null;
		how: string;
		onclose: () => void;
		onshare: () => void;
	};
	let { badge, how, onclose, onshare }: Props = $props();
</script>

<Sheet open={badge !== null} title={badge?.title ?? ''} {onclose}>
	{#if badge}
		<div class="text-center">
			<div class="-mt-2 -mr-2.5 flex justify-end">
				<button
					type="button"
					class="grid size-11 cursor-pointer place-items-center rounded-full text-graphite"
					aria-label={m.chy51s2_close()}
					onclick={onclose}
				>
					<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-regular-x" /></svg>
				</button>
			</div>
			<img
				src="/badges/{badge.art}.webp"
				alt=""
				class="mx-auto block size-40 rounded-full {'date' in badge
					? ''
					: 'opacity-[.55] grayscale'}"
			/>
			<p class="mt-1 text-[15px] leading-[1.45] text-graphite">{how}</p>
			{#if 'date' in badge}
				<p class="mt-3 text-[14px] font-semibold text-ink">{m.chy51s2_got({ date: badge.date })}</p>
				<div class="mt-5">
					<Button variant="outline" icon="fill-plain" onclick={onshare}>{m.chy51s2_share()}</Button>
				</div>
			{:else if badge.need !== null}
				<p class="mt-3 text-[14px] font-semibold text-graphite">
					{m.chy51s2_at({ have: badge.have, need: badge.need })}
				</p>
				<div
					class="mx-auto mt-3 grid max-w-[260px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
				>
					<span class="block h-[5px] overflow-hidden rounded-[3px] bg-shaded-paper">
						<span
							data-part="fill"
							class="block h-full rounded-[3px] bg-lantern-red"
							style:width="{badge.pct}%"
						></span>
					</span>
					<span class="text-[12.5px] leading-[normal] font-semibold text-graphite tabular-nums"
						>{badge.have}/{badge.need}</span
					>
				</div>
			{:else}
				<p class="mt-3 text-[14px] font-semibold text-graphite">{m.chy51s2_closed()}</p>
			{/if}
		</div>
	{/if}
</Sheet>
