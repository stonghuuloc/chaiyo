<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import {
		FreezePopup,
		freezeUsedView,
		markFreezeSeen,
		readFreezeSeen,
		type FreezeUsedView
	} from '#lib/lesson/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import { todayView } from '../practice/today';
	import type { PageProps } from './$types';
	import FreezeRules from './FreezeRules.svelte';
	import FriendsStrip from './FriendsStrip.svelte';
	import NextCard from './NextCard.svelte';
	import PracticeRow from './PracticeRow.svelte';
	import RoadmapSlice from './RoadmapSlice.svelte';
	import { roadmapSlice } from './roadmap';
	import { freezeRules } from './rules';
	import StreakChip from './StreakChip.svelte';
	import { todayState } from './today';
	import WeekStrip from './WeekStrip.svelte';
	import { weekView } from './week';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	const now = $derived(study ? new Date() : null);
	let freeze = $state<FreezeUsedView | null>(null);
	let rules = $state(false);

	$effect(() => {
		const session = data.session;
		study = null;
		freeze = null;
		rules = false;
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				const show = (next: State) => {
					study = next;
					const view = freezeUsedView(
						next,
						new Date(),
						readFreezeSeen(localStorage, session.user.id)
					);
					if (view) {
						markFreezeSeen(localStorage, session.user.id, view.day);
						freeze = view;
					}
				};
				show(ledger.state());
				off = ledger.subscribe(show);
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});
</script>

<div class="flex items-center justify-between">
	<h1 class="text-display">{m.tab_today()}</h1>
	{#if study && now}
		<StreakChip view={weekView(study, now)} onrules={() => (rules = true)} />
	{/if}
</div>
{#if study && now}
	<NextCard view={todayState(study, now)} />
	<PracticeRow view={todayView(study, now)} />
	<RoadmapSlice rows={roadmapSlice(study)} />
	<WeekStrip view={weekView(study, now)} onrules={() => (rules = true)} />
	<FriendsStrip friends={[]} />
	{#if freeze}
		<FreezePopup view={freeze} />
	{/if}
	<FreezeRules
		open={rules}
		view={freezeRules(weekView(study, now))}
		onclose={() => (rules = false)}
	/>
{/if}
