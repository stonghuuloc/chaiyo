<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { LookupHit } from '#lib/catalog/index.js';
	import { catalog } from '#lib/catalog/app.js';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { openLedger, memoryStore, type Ledger } from '#lib/ledger/index.js';
	import LookupSheet from '#lib/lookup/LookupSheet.svelte';
	import { tapLookup } from '#lib/lookup/tap-lookup.js';
	import { initialState } from '#lib/study/index.js';

	const IDS = ['s-w-374825', 's-h1-01-01', 's-w-338827'];
	const db = 'chaiyo-dev-lookup';

	let sentences = $state<{ id: string; hanzi: string }[]>([]);
	let ledger = $state<Ledger>();
	let hit = $state<LookupHit | null>(null);
	let miss = $state('');

	const erase = (name: string) => {
		const { promise, resolve } = Promise.withResolvers<void>();
		const req = indexedDB.deleteDatabase(name);
		req.onsuccess = () => resolve();
		req.onblocked = () => resolve();
		req.onerror = () => resolve();
		return promise;
	};

	onMount(async () => {
		if (page.url.searchParams.has('reset')) {
			await erase(db);
			location.replace(location.pathname);
			return;
		}
		const lesson = await catalog.lesson('h1-01');
		sentences = IDS.flatMap((id) => lesson.sentences.filter((s) => s.id === id));
		ledger = await openLedger({
			initial: initialState({ curriculum: CURRICULUM }),
			store: memoryStore(),
			db
		});
	});
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- dev-only reset needs a full reload; resolve() drops the query -->
<a href="?reset" data-sveltekit-reload class="m-4 inline-block text-label text-graphite underline"
	>reset</a
>

<div class="flex flex-col gap-4 p-6">
	{#each sentences as s (s.id)}
		<p
			class="text-headline"
			lang="zh-Hans"
			data-part="dev-sentence"
			data-id={s.id}
			use:tapLookup={{
				sentenceId: s.id,
				onhit: (h) => ((miss = ''), (hit = h)),
				onmiss: (e) => (miss = String(e))
			}}
		>
			{#each [...s.hanzi] as c, i (i)}<span data-i={i} class="cursor-pointer">{c}</span>{/each}
		</p>
	{/each}
	{#if miss}<p class="text-label text-graphite">{miss}</p>{/if}
</div>

{#if ledger}
	<LookupSheet {hit} {ledger} onclose={() => (hit = null)} />
{/if}
