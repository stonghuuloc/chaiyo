<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { currentLevel, type State } from '#lib/study/index.js';
	import SkillEntry from './SkillEntry.svelte';

	let { data } = $props();

	let study = $state<State | null>(null);

	$effect(() => {
		const session = data.session;
		study = null;
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

<SkillEntry k={data.k} level={study ? currentLevel(study) : undefined} />
