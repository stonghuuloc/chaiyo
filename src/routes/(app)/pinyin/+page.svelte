<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import chart from './chart.json';
	import { arrivedInApp, backTarget, type ChartCell } from './chart';
	import PinyinChart from './PinyinChart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let hasPrevious = false;
	afterNavigate(({ from, type }) => {
		hasPrevious ||= arrivedInApp(from, type);
	});

	snapshot({
		capture: () => hasPrevious,
		restore: (value) => {
			hasPrevious = value;
		}
	});

	function back() {
		if (backTarget(hasPrevious) === 'back') history.back();
		else location.assign(`${resolve('/')}lesson/h0-00`);
	}
</script>

<div class="flex h-dvh flex-col">
	<div class="grid grid-cols-[44px_1fr_44px] items-center py-2">
		<button
			type="button"
			class="grid size-11 place-items-center rounded-full"
			aria-label={m.pinyin_back()}
			onclick={back}
		>
			<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-regular-x" /></svg>
		</button>
		<h1 class="text-center font-display text-title">{m.pinyin_title()}</h1>
		<span></span>
	</div>
	<PinyinChart cells={chart as ChartCell[]} open={data.open} />
</div>
