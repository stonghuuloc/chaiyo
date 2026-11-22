<script lang="ts">
	import { untrack } from 'svelte';
	import { snapshot } from '$app/navigation';
	import { SvelteSet } from 'svelte/reactivity';
	import { catalog } from '#lib/catalog/app.js';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { initialState, myWords, type State, type WordMeta } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import { loadMeta } from './meta';
	import WordsList from './WordsList.svelte';

	let { data }: PageProps = $props();

	let study = $state<State>(initialState({ curriculum: CURRICULUM }));
	let query = $state('');
	let ready = $state(false);
	snapshot({
		capture: () => query,
		restore: (value) => {
			query = value;
		}
	});
	let metas = $state.raw(new Map<string, WordMeta>());
	const requested = new SvelteSet<string>();

	$effect(() => {
		const session = data.session;
		study = initialState({ curriculum: CURRICULUM });
		ready = false;
		if (!session) {
			ready = true;
			return;
		}
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				study = ledger.state();
				ready = true;
				off = ledger.subscribe((next) => (study = next));
			})
			.catch(() => {
				ready = true;
			});
		return () => {
			live = false;
			off();
		};
	});

	$effect(() => {
		const missing = Object.keys(study.lexicon).filter((h) => !untrack(() => requested.has(h)));
		if (!missing.length) return;
		for (const h of missing) requested.add(h);
		const retry = (hs: string[]) => {
			for (const h of hs) if (!untrack(() => metas.has(h))) requested.delete(h);
		};
		loadMeta(
			catalog,
			missing,
			untrack(() => metas)
		)
			.then((found) => {
				metas = new Map([...metas, ...found]);
				retry(missing);
			})
			.catch(() => retry(missing));
	});

	const rows = $derived(myWords(study, (h) => metas.get(h), new Date()));
</script>

<h1>{m.mywords_title()}</h1>
{#if ready}
	<WordsList {rows} bind:query />
{/if}
