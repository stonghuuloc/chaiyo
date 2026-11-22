<script lang="ts">
	import TalkingCast from '#lib/components/TalkingCast.svelte';
	import type { TalkingCastPlayer } from '#lib/components/talking-cast.js';

	let { clip, label }: { clip: string; label: string } = $props();

	let player = $state<TalkingCastPlayer>();

	$effect(() => {
		const key = clip;
		let live = true;
		// Lazy: the player module reads $app/env/public at load.
		void import('#lib/audio/index.js').then(({ player: p }) => {
			if (!live) return;
			// Autoplay stays out of the alternation: tap 1 → 1×, tap 2 → 0.5×.
			let taps = 0;
			player = { ...p, play: (k: string) => p.play(k, { slow: taps++ % 2 === 1 }) };
			p.play(key, { slow: false }).catch(() => {});
		});
		return () => {
			live = false;
		};
	});
</script>

<div data-part="cast" class="mt-5">
	{#if player}
		<TalkingCast {clip} {player} {label} />
	{/if}
</div>
