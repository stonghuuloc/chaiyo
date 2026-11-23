<script lang="ts">
	import { untrack } from 'svelte';
	import type { CharacterJson, default as HanziWriter } from 'hanzi-writer';
	import { m } from '#lib/paraglide/messages.js';
	import {
		dimensions,
		loadStrokes,
		withDocumentListeners,
		writerOptions,
		type StrokeMode,
		type StrokeProgress
	} from './hanzi-strokes';

	type Props = {
		char: string;
		mode: StrokeMode;
		outline?: boolean;
		load?: (char: string) => Promise<CharacterJson>;
		onprogress?: (p: StrokeProgress) => void;
		oncomplete?: (p: { mistakes: number }) => void;
		onerror?: () => void;
		onpeek?: () => void;
	};

	let {
		char,
		mode,
		outline = true,
		load = loadStrokes,
		onprogress,
		oncomplete,
		onerror,
		onpeek
	}: Props = $props();

	let pad = $state<HTMLElement>();
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let done = $state(0);
	let total = $state(0);
	let mistakes = $state(0);
	let finished = $state(false);
	let busy = $state(false);

	let writer: HanziWriter | undefined;
	let gen = 0;
	let appliedOutline = true;
	let errored = false;

	const emit = () => onprogress?.({ done, total, mistakes });

	function startQuiz() {
		void writer?.quiz({
			onCorrectStroke: (d) => {
				done = d.strokeNum + 1;
				mistakes = d.totalMistakes;
				emit();
			},
			onMistake: (d) => {
				mistakes = d.totalMistakes;
				emit();
			},
			onComplete: (d) => {
				finished = true;
				done = total;
				mistakes = d.totalMistakes;
				emit();
				oncomplete?.({ mistakes });
			}
		});
	}

	function restart() {
		finished = false;
		done = 0;
		mistakes = 0;
		startQuiz();
		emit();
	}

	function fail() {
		status = 'error';
		if (errored) return;
		errored = true;
		onerror?.();
	}

	$effect(() => {
		const target = pad;
		const c = char;
		const quiz = mode === 'quiz';
		if (!target) return;
		const me = ++gen;
		status = 'loading';
		done = 0;
		total = 0;
		mistakes = 0;
		finished = false;
		busy = false;
		errored = false;
		appliedOutline = untrack(() => outline);
		let release = () => {};
		let width = target.clientWidth;
		const resize = new ResizeObserver(() => {
			if (target.clientWidth === width) return;
			width = target.clientWidth;
			writer?.updateDimensions(dimensions(width));
		});
		resize.observe(target);

		void import('hanzi-writer').then(
			({ default: HanziWriter }) => {
				if (me !== gen) return;
				const made = withDocumentListeners(() =>
					HanziWriter.create(target, c, {
						...writerOptions(appliedOutline, target.clientWidth, load),
						onLoadCharDataSuccess: (data) => {
							if (me !== gen) return;
							total = data.strokes.length;
							status = 'ready';
							const wanted = untrack(() => outline);
							if (wanted !== appliedOutline) {
								appliedOutline = wanted;
								if (wanted) void writer?.showOutline();
								else void writer?.hideOutline();
							}
							if (quiz) startQuiz();
							emit();
						},
						onLoadCharDataError: () => {
							if (me === gen) fail();
						}
					})
				);
				writer = made.value;
				release = made.release;
			},
			() => {
				if (me === gen) fail();
			}
		);

		return () => {
			gen++;
			resize.disconnect();
			writer?.cancelQuiz();
			release();
			writer = undefined;
			target.querySelector('svg')?.remove();
		};
	});

	$effect(() => {
		const on = outline;
		untrack(() => {
			if (status !== 'ready' || !writer || on === appliedOutline) return;
			appliedOutline = on;
			if (on) void writer.showOutline();
			else void writer.hideOutline();
			if (mode === 'quiz' && !busy) restart();
		});
	});

	export async function play() {
		const w = writer;
		if (!w || status !== 'ready') return;
		const me = gen;
		busy = true;
		void w.hideCharacter();
		await w.animateCharacter();
		if (me !== gen) return;
		busy = false;
		if (mode === 'quiz') restart();
	}

	const tool =
		'inline-flex items-center gap-1.5 rounded-full border border-ruled-line px-3 py-2 text-label text-ink disabled:opacity-40';
</script>

<div class="w-full">
	{#if mode === 'quiz'}
		<p class="mb-2 text-label text-ink" aria-live="polite">
			{m.strokes_count({ done, total: status === 'ready' ? total : '–' })}
		</p>
	{/if}
	<div class="relative aspect-square w-full">
		<svg
			class="absolute inset-0 size-full fill-none stroke-ruled-line"
			viewBox="0 0 100 100"
			aria-hidden="true"
		>
			<rect x="0.5" y="0.5" width="99" height="99" />
			<path d="M0 0L100 100M100 0L0 100M50 0V100M0 50H100" stroke-dasharray="3 3" />
		</svg>
		<div
			bind:this={pad}
			class="absolute inset-0 touch-none {busy ? 'pointer-events-none' : ''} {status === 'error'
				? 'invisible'
				: ''}"
		></div>
		{#if status === 'error'}
			<p class="absolute inset-0 grid place-items-center p-6 text-center text-ink">
				{m.strokes_load_error()}
			</p>
		{/if}
	</div>
	{#if mode === 'quiz'}
		<div class="mt-3 flex flex-wrap gap-2">
			<button
				type="button"
				class={tool}
				disabled={busy || status !== 'ready'}
				onclick={() => {
					onpeek?.();
					void play();
				}}
			>
				<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-regular-play" /></svg>
				{m.strokes_demo()}
			</button>
			<button
				type="button"
				class={tool}
				disabled={finished || busy || status !== 'ready'}
				onclick={() => {
					onpeek?.();
					void writer?.highlightStroke(done);
				}}
			>
				<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-regular-lightbulb" /></svg
				>
				{m.strokes_hint()}
			</button>
			<button
				type="button"
				class={tool}
				disabled={busy || status !== 'ready'}
				onclick={() => {
					onpeek?.();
					restart();
				}}
			>
				<svg class="size-5 fill-current" aria-hidden="true">
					<use href="#i-regular-arrow-counter-clockwise" />
				</svg>
				{m.strokes_redo()}
			</button>
		</div>
	{/if}
</div>
