<script lang="ts">
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { initialState, type State } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import Hub from './Hub.svelte';

	let { data }: PageProps = $props();

	let study = $state<State>(initialState({ curriculum: CURRICULUM }));

	$effect(() => {
		const session = data.session;
		study = initialState({ curriculum: CURRICULUM });
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				study = ledger.state();
				off = ledger.subscribe((next) => (study = next));
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});
</script>

<Hub lesson={data.lesson} {study} />
