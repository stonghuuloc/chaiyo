<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Ledger } from '#lib/ledger/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import SessionRun from '#lib/practice/SessionRun.svelte';
	import type { SessionCard } from '#lib/study/index.js';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { sessionCards } from './cards';

	let { data }: PageProps = $props();

	let cards = $state.raw<SessionCard[] | null>(null);
	let opened = $state.raw<Ledger>();

	$effect(() => {
		const session = data.session;
		const skill = untrack(() => data.skill);
		cards = null;
		if (!session) return;
		let live = true;
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				opened = ledger;
				cards = sessionCards(ledger.state(), new Date(), skill);
			})
			.catch(() => {});
		return () => {
			live = false;
		};
	});
</script>

<h1>{m.screen_practice_session()}</h1>
{#if cards?.length && opened}
	<SessionRun {cards} ledger={opened} back={resolve('/(app)/(tabs)/practice')} />
{:else if cards}
	<p data-part="session-empty">{m.practice_clear_title()}</p>
{/if}
