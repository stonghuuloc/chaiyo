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

	const sub = (t: Tile): string => {
		if (t.key === 'noi') return m.chy41s2_tile_noi_sub();
		if (t.key === 'doan') return t.open ? m.chy41s2_tile_doan_open() : m.chy41s2_tile_doan_locked();
		return t.count ? m.chy41s2_due_count({ n: t.count }) : m.chy41s2_none_due();
	};
</script>

<section data-part="skill-tiles" class="flex flex-col gap-3">
	<h2>{m.chy41s2_tiles_title()}</h2>
	<ul class="flex flex-col gap-2">
		{#each tiles as t (t.key)}
			<li>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve()d path plus a query -->
				<a
					data-part="skill-tile"
					data-key={t.key}
					href={resolve(t.route) + '?' + t.query}
					class="rounded-2xl flex flex-col border border-ruled-line bg-white p-4"
				>
					<b>{label[t.key]()}</b>
					<small class="text-sm opacity-60">{sub(t)}</small>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ul>
</section>
