<script lang="ts">
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { badgesView, initialState, type State } from '#lib/study/index.js';
	import BadgesScreen from './BadgesScreen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let study = $state<State>(initialState({ curriculum: CURRICULUM }));
	let ready = $state(false);

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
</script>

<BadgesScreen view={ready && data.session ? badgesView(study) : null} />
