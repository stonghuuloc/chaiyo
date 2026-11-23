<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { currentLevel, type State } from '#lib/study/index.js';
	import Toast from '#lib/ui/Toast.svelte';
	import { tick } from 'svelte';
	import type { PageProps } from './$types';
	import ExamGroup from './ExamGroup.svelte';
	import JumpChip from './JumpChip.svelte';
	import LevelStrip from './LevelStrip.svelte';
	import ModeSwitch from './ModeSwitch.svelte';
	import NowCard from './NowCard.svelte';
	import { examToast, jumpTarget, lockToast, roadmapLevel } from './roadmap';
	import TopicGroups from './TopicGroups.svelte';
	import TrackList from './TrackList.svelte';
	import { trackToast, trackView } from './tracks';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	let mode = $state<'hsk' | 'tracks'>('hsk');
	let hashLevel = $state<number | null>(null);
	const top = $derived(study ? currentLevel(study) : 1);
	const view = $derived(study ? roadmapLevel(study, hashLevel ?? top) : null);
	const toHash = (hash: string) => replaceState(resolve(`/(app)/(tabs)/roadmap#${hash}`), {});
	const onpick = (level: number) => {
		if (level === view?.level) return;
		hashLevel = level;
		toHash(`lv${level}`);
	};

	const tracks = $derived(study && mode === 'tracks' ? trackView(study) : null);
	const onmode = (next: 'hsk' | 'tracks') => {
		if (next === mode) return;
		mode = next;
		toHash(next === 'tracks' ? 'tracks' : `lv${view?.level ?? top}`);
		scrollTo({ top: 0 });
	};

	const target = $derived(study ? jumpTarget(study) : undefined);
	let offscreen = $state(false);
	const show = $derived(
		!!target && (mode === 'tracks' || view?.level !== target.level || offscreen)
	);
	const rowOf = (id: string) =>
		document.querySelector<HTMLElement>(`[data-part=level-row][data-id="${id}"]`);

	$effect(() => {
		offscreen = false;
		if (typeof IntersectionObserver === 'undefined' || !target || mode !== 'hsk') return;
		if (view?.level !== target.level) return;
		const els = [document.querySelector('[data-part=now-card]'), rowOf(target.id)].filter(
			(el) => el !== null
		);
		let seen: Element[] = [];
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) {
				seen = seen.filter((el) => el !== e.target);
				if (e.isIntersecting) seen.push(e.target);
			}
			offscreen = seen.length === 0;
		});
		for (const el of els) io.observe(el);
		return () => io.disconnect();
	});

	const onjump = async () => {
		if (!target) return;
		mode = 'hsk';
		hashLevel = target.level;
		toHash(`lv${target.level}`);
		await tick();
		const row = rowOf(target.id);
		if (!row) return;
		const group = row.closest('details');
		if (group) group.open = true;
		row.scrollIntoView({
			block: 'center',
			behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	};

	const readHash = () => {
		const hash = location.hash;
		if (hash === '#tracks') {
			mode = 'tracks';
			return;
		}
		const lv = /^#lv([1-5])$/.exec(hash);
		mode = 'hsk';
		hashLevel = lv ? Number(lv[1]) : null;
	};

	$effect(readHash);

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

<svelte:window onhashchange={readHash} />

<h1 class="pt-[calc(env(safe-area-inset-top,0px)+54px)] text-display">{m.tab_roadmap()}</h1>
{#if view}
	<ModeSwitch {mode} {onmode} />
	<p data-part="roadmap-sum" class="mt-3 text-label text-muted">
		{tracks
			? m.chy49s3_tracks_sum({ total: tracks.total, open: tracks.open })
			: view.header
				? m.chy49s1_header({ level: view.level, ...view.header })
				: m.chy49s1_header_bare({ level: view.level })}
	</p>
	{#if tracks}
		<TrackList items={tracks.items} onlocked={(item) => onlocked(trackToast(item))} />
	{:else}
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
{/if}
{#if target}
	<JumpChip n={target.n} {show} {onjump} />
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
