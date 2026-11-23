<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { currentLevel, type State } from '#lib/study/index.js';
	import Toast from '#lib/ui/Toast.svelte';
	import type { PageProps } from './$types';
	import ExamGroup from './ExamGroup.svelte';
	import LevelStrip from './LevelStrip.svelte';
	import NowCard from './NowCard.svelte';
	import { examToast, lockToast, roadmapLevel } from './roadmap';
	import TopicGroups from './TopicGroups.svelte';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	let picked = $state<number | null>(null);
	const top = $derived(study ? currentLevel(study) : 1);
	const view = $derived(study ? roadmapLevel(study, picked ?? top) : null);
	const onpick = (level: number) => {
		if (level !== view?.level) picked = level;
	};

	let open = $state(false);
	let message = $state('');
	let taps = $state(0);
	const onlocked = (text: string) => {
		message = text;
		open = true;
		taps += 1;
	};

	$effect(() => {
		const session = data.session;
		study = null;
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				const show = (next: State) => {
					study = next;
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

<h1 class="pt-[calc(env(safe-area-inset-top,0px)+54px)] text-display">{m.tab_roadmap()}</h1>
{#if view}
	<p data-part="roadmap-sum" class="mt-3 text-label text-muted">
		{view.header
			? m.chy49s1_header({ level: view.level, ...view.header })
			: m.chy49s1_header_bare({ level: view.level })}
	</p>
	<LevelStrip cells={view.strip} {onpick} />
	{#if view.empty}
		<p
			data-part="drafting"
			class="mt-5 rounded-cell bg-shaded-paper px-4 py-3 text-toast text-graphite"
		>
			{m.chy49s1_drafting({ level: view.level })}
		</p>
	{:else}
		{#if view.level > top}
			<p
				data-part="lock-note"
				class="mt-4 flex items-center gap-2 rounded-cell bg-shaded-paper px-4 py-3 text-toast leading-[normal] text-graphite"
			>
				<svg class="size-[15px] flex-none fill-current text-muted" aria-hidden="true"
					><use href="#i-fill-lock-simple" /></svg
				>
				{m.chy49s2_browse_note({ prev: view.level - 1 })}
			</p>
		{/if}
		{#if view.card}
			<NowCard card={view.card} />
		{/if}
		<TopicGroups
			groups={view.groups}
			level={view.level}
			onlocked={(row) => onlocked(lockToast(view, row))}
		/>
		{#if view.exams}
			<ExamGroup exams={view.exams} ontap={(row) => onlocked(examToast(row))} />
		{/if}
	{/if}
{/if}
<Toast
	placement="top"
	icon="fill-lock-simple"
	duration={2200}
	{open}
	{message}
	nonce={taps}
	onclose={() => (open = false)}
/>
