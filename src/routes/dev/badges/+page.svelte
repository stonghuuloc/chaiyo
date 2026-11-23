<script lang="ts">
	import { page } from '$app/state';
	import { CURRICULUM } from '#lib/curriculum/index.js';
	import { BADGES, badgesView, initialState, type State } from '#lib/study/index.js';
	import BadgesScreen from '../../(app)/me/badges/BadgesScreen.svelte';

	const view = $derived.by(() => {
		const base = initialState({ curriculum: CURRICULUM });
		const params = page.url.searchParams;
		let state: State = {
			...base,
			badges: { first: '2026-10-12T05:00:00Z', streak7: '2026-10-17T18:30:00Z' },
			streak: { count: 12, best: 12, freezes: 0 },
			lexicon: Object.fromEntries(
				Array.from({ length: 12 }, (_, i) => [`字${i}`, { saved: true, cards: {} }])
			)
		};
		if (params.has('none')) state = { ...base };
		if (params.has('all'))
			state = {
				...state,
				badges: Object.fromEntries(BADGES.map(([id]) => [id, '2026-10-12T05:00:00Z']))
			};
		return badgesView(state);
	});
</script>

<BadgesScreen {view} />
