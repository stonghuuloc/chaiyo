<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import MeHero from './MeHero.svelte';
	import SkillMemory from './SkillMemory.svelte';
	import { meStats } from './me';

	let { data }: PageProps = $props();

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

<h1 class="sr-only">{m.tab_me()}</h1>
{#if study}
	{@const s = meStats(study, new Date())}
	<MeHero stats={s} />
	<SkillMemory skills={s.skills} />
{/if}
