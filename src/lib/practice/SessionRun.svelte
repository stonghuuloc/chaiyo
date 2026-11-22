<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { catalog as appCatalog } from '#lib/catalog/app.js';
	import type { Catalog } from '#lib/catalog/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import StreakPopup from '#lib/lesson/StreakPopup.svelte';
	import { viewOf } from '#lib/lesson/steps.js';
	import type { Answer, Cta } from '#lib/lesson/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { SessionCard, Skill, StudyEvent } from '#lib/study/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Flashcard from './Flashcard.svelte';
	import { answer, current, finished, startQueue, type QueueItem } from './queue';
	import { fromCard, itemOf, summary, toPracticeAttempt, wordInfo, type WordInfo } from './run';

	type Props = {
		cards: SessionCard[];
		ledger: Ledger;
		back: string;
		catalog?: Pick<Catalog, 'find' | 'thin' | 'lesson'>;
	};
	let { cards, ledger, back, catalog = appCatalog }: Props = $props();

	const snapshot = untrack(() => cards);
	const run = crypto.randomUUID();
	const of = snapshot.length;
	const words = [...new Set(snapshot.map((c) => c.word))];

	const blank: WordInfo = { pinyin: '', hanviet: '', nghia: '', audio: '', contentSha: '' };

	let queue = $state.raw(startQueue(snapshot));
	let infos = $state.raw<Map<string, WordInfo> | null>(null);
	let results = $state.raw<{ item: QueueItem; correct: boolean | null }[]>([]);
	let events = $state.raw<StudyEvent[]>([]);
	let cta = $state<Cta>();
	let busy = false;

	const headlines = {
		great: m.practice_run_great,
		ok: m.practice_run_ok,
		hard: m.practice_run_hard
	};
	const scores: Record<Skill, (p: { right: number; total: number }) => string> = {
		the: m.practice_run_score_the,
		nghe: m.practice_run_score_nghe,
		viet: m.practice_run_score_viet
	};

	onMount(() => {
		void Promise.all(words.map((w) => wordInfo(catalog, w))).then((all) => {
			infos = new Map(words.map((w, i) => [w, all[i]]));
		});
	});

	async function submit(item: QueueItem, given?: Answer) {
		if (busy) return;
		busy = true;
		let recorded: StudyEvent[];
		try {
			recorded = await ledger.record(
				toPracticeAttempt(
					given,
					item,
					{ run, of, contentSha: infos?.get(item.word)?.contentSha ?? '' },
					{ id: crypto.randomUUID(), at: new Date().toISOString() }
				)
			);
		} catch {
			return;
		} finally {
			busy = false;
		}
		events = [...events, ...recorded];
		results = [...results, { item, correct: given?.correct ?? null }];
		cta = undefined;
		queue = answer(queue, given?.correct ?? null);
	}
</script>

<section data-part="session-run" data-of={of} class="max-w-sm mx-auto w-full">
	{#if infos === null}
		<span class="sr-only" aria-busy="true"></span>
	{:else if finished(queue)}
		{@const done = summary(results)}
		<div data-part="done" class="mt-6 flex flex-col gap-4">
			{#if done.headline}
				<h2 data-part="headline" class="font-display text-headline">
					{headlines[done.headline]()}
				</h2>
				<ul data-part="scores" class="text-graphite">
					{#each done.skills as line (line.skill)}
						<li>{scores[line.skill]({ right: line.right, total: line.total })}</li>
					{/each}
				</ul>
				<ul data-part="rows" class="grid gap-2">
					{#each done.rows as row (`${row.skill}:${row.word}`)}
						<li
							data-part="row"
							data-missed={row.missed}
							class="flex items-center justify-between gap-3 rounded-action border border-ruled-line px-4 py-3"
						>
							<span class="font-hanzi text-[28px]">{row.word}</span>
							<span data-part="chip" class="text-label font-semibold">
								{row.missed ? m.practice_run_again() : m.practice_run_known()}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
			<Button href={back} caret>{m.practice_run_back()}</Button>
		</div>
		<StreakPopup {events} />
	{:else}
		{@const item = current(queue)}
		{@const view = itemOf(item, infos.get(item.word) ?? blank, words)}
		{#key item.id}
			<div data-part="item" data-kind={item.skill} data-id={item.id}>
				{#if view.kind === 'flashcard'}
					{#if view.again}
						<p data-part="again" class="mt-5 text-label text-graphite">· {m.practice_again()}</p>
					{/if}
					<Flashcard
						card={view.card}
						ondecide={(result) => void submit(item, fromCard(item, result))}
					/>
				{:else}
					{@const View = viewOf(view.kind).default}
					<View
						step={view}
						mode="feedback"
						last={queue.at === queue.items.length - 1}
						cta={(c: Cta) => (cta = c)}
						next={(a?: Answer) => void submit(item, a)}
					/>
				{/if}
			</div>
		{/key}
		{#if cta}
			<div data-part="cta" class="mt-4">
				<Button caret={cta.caret} disabled={cta.disabled} onclick={cta.onclick}>
					{cta.label}
				</Button>
			</div>
			{#if cta.hint}<p class="mt-2 text-center text-label text-graphite">{cta.hint}</p>{/if}
		{/if}
	{/if}
</section>
