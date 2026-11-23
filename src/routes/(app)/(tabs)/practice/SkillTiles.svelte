<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import type { Tile } from './tiles';

	let { tiles }: { tiles: Tile[] } = $props();

	const label: Record<Tile['key'], () => string> = {
		the: m.chy41s2_tile_the,
		nghe: m.chy41s2_tile_nghe,
		viet: m.chy41s2_tile_viet,
		noi: m.skill_noi_label,
		doan: m.skill_doan_label
	};

	const icon: Record<Tile['key'], string> = {
		the: 'fill-cards',
		nghe: 'fill-headphones',
		viet: 'fill-pen',
		noi: 'fill-microphone',
		doan: 'fill-notebook'
	};

	const sub = (t: Tile): string => {
		if (t.key === 'noi') return m.chy41s2_tile_noi_sub();
		if (t.key === 'doan') return t.open ? m.chy41s2_tile_doan_open() : m.chy41s2_tile_doan_locked();
		return t.count ? m.chy41s2_due_count({ n: t.count }) : m.chy41s2_none_due();
	};

	const soon = (t: Tile): boolean => t.key === 'noi' || t.key === 'doan';
</script>

<section data-part="skill-tiles" class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="text-[19px] leading-[1.2] font-semibold">{m.chy41s2_tiles_title()}</h2>
	<ul class="mt-3 grid grid-cols-2 gap-2">
		{#each tiles as t (t.key)}
			<li>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve()d path plus a query -->
				<a
					data-part="skill-tile"
					data-key={t.key}
					href={resolve(t.route) + '?' + t.query}
					class={[
						'flex h-full min-h-[104px] flex-col justify-between rounded-action border border-ruled-line p-4 active:bg-shaded-paper',
						soon(t) ? 'border-dashed bg-transparent' : 'bg-white/55'
					]}
				>
					<svg
						class={['size-[26px] fill-current', soon(t) ? 'text-faint-pencil' : 'text-ink']}
						aria-hidden="true"><use href="#i-{icon[t.key]}" /></svg
					>
					<span>
						<b class="mt-3 block text-body font-semibold">{label[t.key]()}</b>
						<small
							class={[
								'mt-0.5 block text-[13px]',
								t.count ? 'font-semibold text-lantern-red-text' : 'text-pencil'
							]}>{sub(t)}</small
						>
					</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ul>
</section>
