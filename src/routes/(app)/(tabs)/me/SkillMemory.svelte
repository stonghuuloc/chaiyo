<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Skill } from '#lib/study/index.js';
	import { resolve } from '$app/paths';
	import type { SkillMem } from './me';

	let { skills }: { skills: SkillMem[] } = $props();

	const label: Record<Skill, () => string> = {
		the: m.chy41s2_tile_the,
		nghe: m.chy41s2_tile_nghe,
		viet: m.chy41s2_tile_viet
	};

	const icon: Record<Skill, string> = {
		the: 'fill-cards',
		nghe: 'fill-headphones',
		viet: 'fill-pen'
	};

	const pct = (n: number, size: number) => (size ? (n / size) * 100 : 0);
</script>

<section data-part="me-memory" class="mt-6 border-t border-ruled-line pt-5">
	<div class="flex items-baseline justify-between">
		<h2 class="font-display text-[19px] leading-[1.2] font-semibold">{m.chy50s1_mem_title()}</h2>
		<a
			href={resolve('/(app)/practice/words')}
			class="inline-flex min-h-10 items-center gap-0.5 text-[14px] font-semibold text-pencil"
			>{m.mywords_title()}<svg class="size-3.5 fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			></a
		>
	</div>
	<p class="mt-0.5 text-[14px] leading-[18px] text-pencil">{m.chy50s1_mem_sub()}</p>
	<ul class="mt-4 grid gap-3">
		{#each skills as s (s.skill)}
			{@const counts = { firm: s.firm, shaky: s.shaky, unseen: s.unseen }}
			<li class="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
				<span class="flex items-center gap-1.5 text-[14.5px] leading-[19px] font-semibold">
					<svg class="size-[17px] fill-current text-pencil" aria-hidden="true"
						><use href="#i-{icon[s.skill]}" /></svg
					>{label[s.skill]()}
				</span>
				<span
					role="img"
					aria-label={m.chy50s1_mem_label({ skill: label[s.skill](), ...counts })}
					class="flex h-3 overflow-hidden rounded-[6px] bg-shaded-paper"
				>
					<i class="block h-full bg-lantern-red" style:width="{pct(s.firm, s.size)}%"></i>
					<i
						class="block h-full bg-[color-mix(in_srgb,var(--color-lantern-red)_45%,var(--color-white))]"
						style:width="{pct(s.shaky, s.size)}%"
					></i>
				</span>
				<small class="col-start-2 -mt-1.5 text-[12.5px] leading-4 text-pencil"
					>{m.chy50s1_mem_counts(counts)}</small
				>
			</li>
		{/each}
	</ul>
</section>
