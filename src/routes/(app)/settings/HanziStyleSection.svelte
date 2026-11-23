<script lang="ts" module>
	import type { HanziStyle } from '#lib/shell/hanzi-style.js';

	export type HanziStyleDeps = {
		style: HanziStyle;
		save(style: HanziStyle): Promise<void>;
		apply(style: HanziStyle): void;
		notify(message: string): void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { serial } from './prefs';

	let { deps }: { deps: HanziStyleDeps } = $props();

	const run = serial();
	const tiles = [
		{
			value: 'kai',
			label: () => m.chy53s2_kai(),
			sub: () => m.chy53s2_kai_sub(),
			font: 'font-[family-name:var(--font-hanzi-kaishu)]'
		},
		{
			value: 'xing',
			label: () => m.chy53s2_xing(),
			sub: () => m.chy53s2_xing_sub(),
			font: 'font-hanzi-xingshu'
		}
	] as const;

	let saved = untrack(() => deps.style);
	let style = $state(saved);
	let inflight = 0;
	const buttons: Partial<Record<HanziStyle, HTMLButtonElement>> = {};

	const pick = async (next: HanziStyle) => {
		if (next === style) return;
		style = next;
		deps.apply(next);
		inflight++;
		try {
			await run(() => deps.save(next));
			saved = next;
		} catch {
			if (inflight === 1) {
				style = saved;
				deps.apply(saved);
			}
			deps.notify(m.welcome_save_error());
		} finally {
			inflight--;
		}
	};

	const keys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

	const arrow = (event: KeyboardEvent) => {
		if (!keys.has(event.key)) return;
		event.preventDefault();
		const next = style === 'kai' ? 'xing' : 'kai';
		buttons[next]?.focus();
		void pick(next);
	};
</script>

<section class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="font-display text-[19px] leading-[1.25] font-semibold">{m.chy53s2_hanzi()}</h2>
	<p class="mt-0.5 text-[14px] leading-[normal] text-pencil">{m.chy53s2_hanzi_sub()}</p>
	<div class="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={m.chy53s2_hanzi_group()}>
		{#each tiles as t (t.value)}
			<button
				type="button"
				role="radio"
				aria-checked={style === t.value}
				tabindex={style === t.value ? 0 : -1}
				bind:this={buttons[t.value]}
				class="grid min-h-11 justify-items-center gap-0.5 rounded-[18px] border border-ruled-line bg-white/40 px-2 py-3 text-center aria-checked:border-2 aria-checked:border-ink aria-checked:bg-white aria-checked:px-[7px] aria-checked:py-[11px]"
				onclick={() => pick(t.value)}
				onkeydown={arrow}
			>
				<span lang="zh-Hans" class="text-[54px] leading-[1.2] text-ink {t.font}">你好</span>
				<b class="text-[15px] font-semibold">{t.label()}</b>
				<small class="text-[12.5px] text-pencil">{t.sub()}</small>
			</button>
		{/each}
	</div>
	<p class="mt-2 text-[13px] leading-[1.45] text-pencil">{m.chy53s2_hanzi_hint()}</p>
</section>
