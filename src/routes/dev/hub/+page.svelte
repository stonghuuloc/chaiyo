<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { catalog } from '#lib/catalog/app.js';
	import type { LessonContent } from '#lib/catalog/index.js';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { openLedger, memoryStore, type Ledger } from '#lib/ledger/index.js';
	import { initialState, type State } from '#lib/study/index.js';
	import Hub from '../../(app)/lesson/[id]/Hub.svelte';
	import { seedWords } from './seed';

	const db = 'chaiyo-dev-hub';

	let lesson = $state<LessonContent>();
	let ledger = $state<Ledger>();
	let study = $state<State>(initialState({ curriculum: CURRICULUM }));
	let failure = $state<string>();
	let resetBlocked = $state(false);

	const erase = (name: string, onBlocked: () => void) => {
		const { promise, resolve, reject } = Promise.withResolvers<void>();
		const req = indexedDB.deleteDatabase(name);
		req.onsuccess = () => resolve();
		req.onblocked = onBlocked;
		req.onerror = () => reject(req.error ?? new Error('delete failed'));
		return promise;
	};

	onMount(() => {
		let off = () => {};
		void (async () => {
			try {
				if (page.url.searchParams.has('reset')) {
					await erase(db, () => (resetBlocked = true));
					location.replace(location.pathname);
					return;
				}
				lesson = await catalog.lesson('h1-01');
				const l = await openLedger({
					initial: initialState({ curriculum: CURRICULUM }),
					store: memoryStore(),
					db
				});
				ledger = l;
				study = l.state();
				off = l.subscribe((next) => (study = next));
			} catch (e) {
				failure = e instanceof Error ? e.message : String(e);
			}
		})();
		return () => off();
	});

	async function seed() {
		if (!ledger || !lesson) return;
		const words = lesson.words.map((w) => w.id);
		for (const a of seedWords(words, new Date(), () => crypto.randomUUID())) await ledger.record(a);
	}
</script>

<div class="m-4 flex gap-4">
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- dev-only reset needs a full reload; resolve() drops the query -->
	<a href="?reset" data-sveltekit-reload class="text-label text-graphite underline">reset</a>
	<button class="rounded border px-3 py-1" onclick={seed} disabled={!ledger || !lesson}
		>seed: 4 words answered</button
	>
</div>

{#if resetBlocked && !failure}
	<p class="p-6" role="status">reset waiting: close other tabs on this page</p>
{/if}
{#if failure}
	<p class="p-6" role="alert">{failure}</p>
{:else if lesson}
	<Hub {lesson} {study} />
{/if}
