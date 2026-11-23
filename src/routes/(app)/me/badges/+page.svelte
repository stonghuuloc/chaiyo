<script lang="ts">
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { learnerLedger } from '#lib/learner/index.js';
	import { ownHandle } from '#lib/social/badge-link.js';
	import { badgesView, initialState, type State } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase.js';
	import BadgesScreen from './BadgesScreen.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let study = $state<State>(initialState({ curriculum: CURRICULUM }));
	let ready = $state(false);
	let handle = $state<string | null>(null);
	let reload = () => {};

	$effect(() => {
		const session = data.session;
		study = initialState({ curriculum: CURRICULUM });
		ready = false;
		handle = null;
		reload = () => {};
		if (!session) {
			ready = true;
			return;
		}
		let live = true;
		let off = () => {};
		reload = () =>
			void ownHandle(supabase, session.user.id)
				.then((h) => {
					if (live) handle = h;
				})
				.catch(() => undefined);
		reload();
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

<BadgesScreen
	view={ready && data.session ? badgesView(study) : null}
	{handle}
	onmissinghandle={() => reload()}
/>
