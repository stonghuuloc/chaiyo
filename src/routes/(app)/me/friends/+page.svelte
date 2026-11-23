<script lang="ts">
	import { afterNavigate, invalidateAll, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { rankBoard, withMe, type BoardMode } from '#lib/social/board.js';
	import { publicStats, type PublicStats } from '#lib/social/stats.js';
	import FriendSearch from './FriendSearch.svelte';
	import FriendsBoard from './FriendsBoard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let inApp = false;
	afterNavigate(({ from, type }) => {
		inApp ||= from !== null && type !== 'popstate';
	});
	snapshot({
		capture: () => inApp,
		restore: (value) => {
			inApp = value;
		}
	});

	function back(e: MouseEvent) {
		if (!inApp) return;
		e.preventDefault();
		history.back();
	}

	let mode = $state<BoardMode>('streak');
	let stats = $state<PublicStats | null>(null);

	$effect(() => {
		const session = data.session;
		stats = null;
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				stats = publicStats(ledger.state(), new Date());
				off = ledger.subscribe((next) => (stats = publicStats(next, new Date())));
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});

	const rows = $derived(rankBoard(stats ? withMe(data.board, stats) : data.board, mode));
</script>

<div
	class="sticky top-0 -mx-(--gutter) grid grid-cols-[44px_1fr_44px] items-center bg-notebook-paper px-3 py-2"
>
	<a
		href={resolve('/(app)/(tabs)/me')}
		onclick={back}
		aria-label={m.chy52s1_back()}
		class="grid size-11 place-items-center rounded-full text-graphite"
	>
		<svg class="size-[22px] -scale-x-100 fill-current" aria-hidden="true">
			<use href="#i-regular-caret-right" />
		</svg>
	</a>
	<span class="text-center font-display text-title">{m.chy52s2_title()}</span>
	<span></span>
</div>

<FriendsBoard {rows} {mode} onmode={(next) => (mode = next)} />
<FriendSearch onchange={invalidateAll} />
