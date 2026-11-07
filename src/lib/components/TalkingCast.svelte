<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import closedArt from '#lib/assets/talk/redpanda-closed.png';
	import halfArt from '#lib/assets/talk/redpanda-half.png';
	import openArt from '#lib/assets/talk/redpanda-open.png';
	import {
		bob,
		createTap,
		frameFor,
		isPlaying,
		levelAt,
		loadEnvelope,
		smoothLevel,
		type Frame,
		type TalkingCastPlayer
	} from './talking-cast';

	type Props = { clip: string; player: TalkingCastPlayer; label: string };

	let { clip, player, label }: Props = $props();

	const arts = [closedArt, halfArt, openArt];
	let frame = $state<Frame>(0);
	let picture = $state<HTMLElement>();
	const tap = $derived(createTap(player, clip));
	let attach: (() => void) | undefined;
	const onTap = () => {
		tap();
		attach?.();
	};

	$effect(() => {
		if (prefersReducedMotion.current || !picture) return;
		const pic = picture;
		let raf = 0;
		let level = 0;
		let env: number[] | null = null;
		let decoding = '';

		const rest = () => {
			level = 0;
			frame = 0;
			pic.style.transform = '';
		};

		const tick = (t: number) => {
			const el = player.element();
			const ours = isPlaying(player, clip, el);
			const live = ours && !el.paused && !el.ended;
			if (live && decoding !== el.src) {
				decoding = el.src;
				env = null;
				void loadEnvelope(el.src).then((e) => {
					if (decoding === el.src) env = e;
				});
			}
			level = smoothLevel(level, live && env ? levelAt(env, el.currentTime) : 0);
			if (!live && level < 0.01) {
				rest();
				raf = 0;
				return;
			}
			const f = frameFor(level);
			if (f !== frame) frame = f;
			const b = bob(level, t);
			pic.style.transform = `translateY(${b.y.toFixed(1)}px) rotate(${b.deg.toFixed(2)}deg)`;
			raf = requestAnimationFrame(tick);
		};

		const start = () => {
			if (!raf) raf = requestAnimationFrame(tick);
		};
		let bound: HTMLAudioElement | null = null;
		attach = () => {
			const el = player.element();
			if (el !== bound) {
				bound?.removeEventListener('play', start);
				el?.addEventListener('play', start);
				bound = el;
			}
			if (el && !el.paused) start();
		};
		attach();

		return () => {
			attach = undefined;
			bound?.removeEventListener('play', start);
			cancelAnimationFrame(raf);
			rest();
		};
	});
</script>

<div class="relative mx-auto aspect-[600/420] w-full max-w-[300px]">
	<div class="relative size-full overflow-hidden rounded-[22px]">
		<button
			bind:this={picture}
			type="button"
			tabindex="-1"
			aria-hidden="true"
			class="absolute inset-0 block size-full cursor-pointer border-0 bg-transparent p-0"
			onclick={onTap}
		>
			{#each arts as art, i (i)}
				<img
					src={art}
					alt=""
					draggable="false"
					class="absolute top-[-14.2857%] left-0 w-full {i === frame ? 'on' : 'invisible'}"
				/>
			{/each}
		</button>
	</div>
	<button
		type="button"
		aria-label={label}
		class="absolute right-2 bottom-2 grid size-11 cursor-pointer place-items-center rounded-full bg-lantern-red text-white shadow-lift"
		onclick={onTap}
	>
		<svg class="size-6 fill-current" aria-hidden="true"><use href="#i-fill-speaker-high" /></svg>
	</button>
</div>
