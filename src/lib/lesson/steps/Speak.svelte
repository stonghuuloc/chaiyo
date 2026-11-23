<script module lang="ts">
	export const kind = 'speak';
	export type Step = {
		kind: 'speak';
		id: string;
		ask: string;
		title: string;
		hanzi?: string;
		pinyin?: string;
		meaning?: string;
		answer?: { hanzi: string; pinyin: string; meaning: string };
		rubric?: string[];
	};
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { BARS, clock, held, push } from '../../speak/hold';
	import { openMic, type Mic } from '../../speak/mic';
	import { sampleTiles } from '../../speak/sample';
	import type { StepProps } from '../types';

	let { step, cta, next }: StepProps<Step> = $props();

	const src = $derived(step.answer ?? step);
	const sample = $derived(src.hanzi && src.pinyin ? sampleTiles(src.hanzi, src.pinyin) : null);
	const free = $derived(step.answer !== undefined || step.rubric !== undefined);

	let phase = $state<'idle' | 'opening' | 'live' | 'short' | 'blocked' | 'done'>('idle');
	let levels = $state<number[]>(Array(BARS).fill(0));
	let elapsed = $state(0);

	let session = 0;
	let mic: Mic | undefined;
	let micOnAt: number | null = null;
	let raf = 0;

	function tick() {
		if (!mic || micOnAt === null) return;
		levels = push(levels, mic.level());
		elapsed = performance.now() - micOnAt;
		raf = requestAnimationFrame(tick);
	}

	async function press() {
		if (phase !== 'idle' && phase !== 'short') return;
		const me = ++session;
		phase = 'opening';
		let opened: Mic;
		try {
			opened = await openMic();
		} catch {
			if (me === session) phase = 'blocked';
			return;
		}
		if (me !== session) {
			opened.close();
			return;
		}
		mic = opened;
		micOnAt = performance.now();
		elapsed = 0;
		levels = Array(BARS).fill(0);
		phase = 'live';
		raf = requestAnimationFrame(tick);
	}

	function release() {
		if (phase !== 'opening' && phase !== 'live') return;
		cancelAnimationFrame(raf);
		session += 1;
		phase = held(micOnAt, performance.now());
		mic?.close();
		mic = undefined;
		micOnAt = null;
	}

	$effect(() => {
		if (phase === 'done') {
			cta({
				label: m.lesson_continue(),
				caret: true,
				hint: m.speak_sample_hint(),
				onclick: () => next()
			});
			return;
		}
		if (phase === 'blocked') {
			cta({ label: m.lesson_speak_skip(), onclick: () => next() });
			return;
		}
		cta({
			label: phase === 'live' ? m.lesson_speak_release() : m.lesson_speak_hold(),
			hint: '',
			hold: { onpress: press, onrelease: release },
			onclick: () => {}
		});
	});

	$effect(() => () => {
		session += 1;
		cancelAnimationFrame(raf);
		mic?.close();
		mic = undefined;
		micOnAt = null;
	});
</script>

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{step.ask}
</p>
<h2 class="mt-1 font-display text-headline">{step.title}</h2>

{#if step.hanzi}
	<div class="mt-5 rounded-action border border-ruled-line bg-white/40 p-5 text-center">
		<p class="font-hanzi text-[40px]">{step.hanzi}</p>
		{#if step.pinyin}<p class="mt-1 text-title text-graphite">{step.pinyin}</p>{/if}
		{#if step.meaning}<p class="mt-1 text-label text-faint-pencil">{step.meaning}</p>{/if}
	</div>
{/if}

<div
	class="mt-5 min-h-24 rounded-action border border-dashed border-ruled-line p-4"
	aria-live="polite"
	data-rec
>
	{#if phase === 'opening'}
		<p class="text-center text-label text-graphite">{m.lesson_speak_opening()}</p>
	{:else if phase === 'live' || phase === 'done'}
		<div class="flex h-16 items-end justify-center gap-[3px]">
			{#each levels as l, i (i)}
				<i class="w-1 rounded-pill bg-lantern-red" data-bar style="height:{3 + l * 58}px"></i>
			{/each}
		</div>
		<p class="mt-2 text-center text-label text-graphite">
			<span data-timer>{clock(elapsed)}</span>
			{#if phase === 'live'}
				· {m.lesson_speak_listening()}{/if}
		</p>
		{#if phase === 'done'}
			{#if sample}
				<div class="mt-4 flex gap-2">
					{#each sample.tiles as t, i (i)}
						<div
							class={[
								'relative min-w-0 flex-1 rounded-action px-1 pt-2.5 pb-2 text-center',
								t.weak
									? 'border-[1.5px] border-dashed border-pencil bg-shaded-paper'
									: 'border border-ruled-line bg-white/40'
							]}
							data-tile
							data-weak={t.weak || undefined}
						>
							<span data-syl
								><span class="block font-hanzi text-[38px] leading-tight">{t.hanzi}</span>
								<b class="mt-0.5 block text-[15px] font-medium">{t.syl}</b></span
							>
							{#if !t.weak}
								<span
									class="absolute top-1.5 right-1.5 grid size-[18px] place-items-center rounded-full bg-lantern-red text-[10px] text-white"
									data-check>✓</span
								>
							{/if}
						</div>
					{/each}
				</div>
				<p class="mt-3 text-center text-label font-semibold" data-count>
					{m.speak_sample_count({ ok: sample.ok, total: sample.total })}
				</p>
			{/if}
			<p class="mt-1 text-center text-[12.5px] text-faint-pencil" data-note>
				{m.speak_sample_note()}
			</p>
		{/if}
	{:else if phase === 'short'}
		<p class="text-center text-label text-graphite">{m.lesson_speak_short()}</p>
	{:else if phase === 'blocked'}
		<p class="text-center text-label text-graphite">{m.lesson_speak_blocked()}</p>
	{:else}
		<p class="text-center text-label text-graphite">{m.lesson_speak_idle()}</p>
	{/if}
</div>

{#if free}
	{#if phase === 'done' || phase === 'blocked'}
		<div class="mt-5 border-t border-ruled-line pt-4" data-reveal>
			<h3 class="text-label font-semibold tracking-wider text-graphite uppercase">
				{m.speak_reveal_title()}
			</h3>
			{#if step.answer}
				<p class="mt-2 font-hanzi text-[44px] leading-tight">{step.answer.hanzi}</p>
				<p class="mt-1 text-[18px] font-medium">
					{step.answer.pinyin} · {step.answer.meaning}
				</p>
			{:else}
				{#each step.rubric ?? [] as line, i (i)}
					<p class="mt-2 text-title">{line}</p>
				{/each}
			{/if}
		</div>
	{:else}
		<p class="mt-4 text-center text-label text-faint-pencil" data-pending>
			{m.speak_reveal_pending()}
		</p>
	{/if}
{/if}
