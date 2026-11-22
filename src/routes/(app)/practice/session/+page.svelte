<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { SessionCard } from '#lib/study/index.js';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { sessionCards } from './cards';

	let { data }: PageProps = $props();

	let cards = $state.raw<SessionCard[] | null>(null);

	$effect(() => {
		const session = data.session;
		const skill = untrack(() => data.skill);
		cards = null;
		if (!session) return;
		let live = true;
		learnerLedger(session)
			.then((ledger) => {
				if (live) cards = sessionCards(ledger.state(), new Date(), skill);
			})
			.catch(() => {});
		return () => {
			live = false;
		};
	});
</script>

<h1>{m.screen_practice_session()}</h1>
{#if cards?.length}
	<ol data-part="session-list">
		{#each cards as c, i (i)}
			<li data-part="session-card" data-skill={c.skill}>{c.word}</li>
		{/each}
	</ol>
{:else if cards}
	<p data-part="session-empty">{m.practice_clear_title()}</p>
{/if}
