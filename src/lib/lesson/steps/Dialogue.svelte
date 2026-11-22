<script module lang="ts">
	export const kind = 'dialogue';
	export type Line = {
		id: string;
		speaker: 'redpanda' | 'takin';
		hanzi: string;
		pinyin: string;
		vi: string;
		audio?: string;
	};
	export type Step = {
		kind: 'dialogue';
		id: string;
		part: number;
		of: number;
		title: string;
		lines: Line[];
	};
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StepProps } from '../types';

	type Player = {
		playToEnd(key: string, opts?: { slow?: boolean }): Promise<boolean>;
		pause(): void;
	};

	let { step, cta, next }: StepProps<Step> = $props();

	let player: Player | undefined;
	let loaded: Promise<Player> | undefined;
	let playing = $state<number | null>(null);
	let phase = $state<'idle' | 'all' | 'paused' | 'line'>('idle');
	let played = $state(false);
	let token = 0;

	onMount(() => {
		// Lazy: the player module reads $app/env/public at load.
		loaded = import('#lib/audio/index.js').then(({ player: p }) => (player = p));
	});

	onDestroy(() => {
		token++;
		if (phase === 'all' || phase === 'line') player?.pause();
	});

	// Waits for the player, so a tap during cold load plays the clip instead of
	// counting a missing player as a finished line.
	const sound = async (line: Line, opts?: { slow?: boolean }) => {
		if (!line.audio) return true;
		const p = player ?? (await loaded);
		return opts ? p?.playToEnd(line.audio, opts) : p?.playToEnd(line.audio);
	};

	async function playAll(from: number) {
		const mine = ++token;
		phase = 'all';
		for (let i = from; i < step.lines.length; i++) {
			playing = i;
			await sound(step.lines[i], { slow: false });
			if (mine !== token) return;
		}
		playing = null;
		phase = 'idle';
		played = true;
	}

	function pause() {
		token++;
		phase = 'paused';
		player?.pause();
	}

	async function playLine(i: number) {
		const mine = ++token;
		phase = 'line';
		playing = i;
		await sound(step.lines[i]);
		if (mine !== token) return;
		playing = null;
		phase = 'idle';
	}

	$effect(() => {
		const n = (playing ?? 0) + 1;
		const of = step.lines.length;
		if (phase === 'all')
			cta({ label: m.dialogue_playing({ n, of }), hint: m.dialogue_pause_hint(), onclick: pause });
		else if (phase === 'paused')
			cta({
				label: m.dialogue_paused({ n, of }),
				hint: m.dialogue_resume_hint(),
				onclick: () => void playAll(playing ?? 0)
			});
		else if (played)
			cta({
				label: step.part === step.of ? m.dialogue_answer() : m.dialogue_next(),
				caret: true,
				onclick: () => next()
			});
		else
			cta({
				label: m.dialogue_play(),
				hint: m.dialogue_play_hint(),
				onclick: () => void playAll(0)
			});
	});
</script>

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{m.dialogue_part({ n: step.part, of: step.of })}
</p>
<h2 class="mt-1 font-display text-headline">{step.title}</h2>

<ol class="mt-5 flex flex-col gap-2">
	{#each step.lines as line, i (line.id)}
		<li class="flex {line.speaker === 'takin' ? 'justify-end' : 'justify-start'}">
			<button
				type="button"
				data-part="dialogue-line"
				data-speaker={line.speaker}
				data-playing={playing === i}
				class="max-w-[85%] rounded-action border px-4 py-2 {line.speaker === 'takin'
					? 'text-right'
					: 'text-left'} {playing === i
					? 'border-2 border-lantern-red bg-white'
					: 'border-ruled-line bg-white/40'}"
				onclick={() => void playLine(i)}
			>
				<span data-part="line-hanzi" class="block font-hanzi text-[24px]">{line.hanzi}</span>
				<span class="block text-label text-graphite">{line.pinyin}</span>
				<span class="block text-label">{line.vi}</span>
			</button>
		</li>
	{/each}
</ol>
