<script lang="ts">
	import { createPlayer, precache } from '#lib/audio/index.js';
	import { AUDIO_BASE } from '#lib/audio/base.js';
	import { clips } from './clips';
	import SyllableGrid from './SyllableGrid.svelte';

	let { data } = $props();

	let element: HTMLAudioElement | undefined;
	const player = createPlayer({ createAudio: () => (element = new Audio()) });

	let readout = $state('tap a clip');
	let cached = $state('not cached yet');
	let online = $state(typeof navigator === 'undefined' || navigator.onLine);

	async function tap(key: string) {
		const ok = await player.play(key);
		readout = `${key.slice(0, 8)} ok=${ok} rate=${element?.playbackRate} pitch=${element?.preservesPitch}`;
	}

	async function cacheLesson() {
		const { ok, failed } = await precache(clips.map((c) => c.key));
		cached = `cached ${ok}, failed ${failed}`;
	}
</script>

<svelte:window ononline={() => (online = true)} onoffline={() => (online = false)} />

<main class="max-w-xl mx-auto p-4 font-body">
	<h1 class="text-xl">/dev/audio</h1>
	<p>base {AUDIO_BASE} · {online ? 'online' : 'offline'}</p>
	<button class="rounded my-2 border px-3 py-2" onclick={cacheLesson}>Cache this lesson</button>
	<p data-testid="cached">{cached}</p>
	<p data-testid="readout">{readout}</p>
	<ul>
		{#each clips as clip (clip.key)}
			<li class="flex items-center gap-3 py-1">
				<button
					class="rounded border px-3 py-2"
					aria-label={`Play ${clip.hanzi} (${clip.voice})`}
					onclick={() => tap(clip.key)}>▶</button
				>
				<span>{clip.hanzi}</span>
				<span class="text-sm opacity-60">{clip.voice}</span>
			</li>
		{/each}
	</ul>
	<SyllableGrid cells={data.cells} chips={data.chips} />
</main>
