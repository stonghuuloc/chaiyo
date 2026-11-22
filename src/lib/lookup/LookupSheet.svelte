<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogChar, CatalogWord, LookupHit } from '#lib/catalog/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import type { State } from '#lib/study/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import Sheet from '#lib/ui/Sheet.svelte';
	import { lookupView } from './lookup';

	type Props = { hit: LookupHit | null; ledger: Ledger; onclose: () => void };
	let { hit, ledger, onclose }: Props = $props();

	const find = async (hanzi: string) => (await import('#lib/catalog/app.js')).catalog.find(hanzi);

	let word = $state<CatalogWord | null>(null);
	let ready = $state(false);
	let shrunk = $state<{ hanzi: string; char: CatalogChar | null } | null>(null);
	let busy = $state(false);
	let study = $state<State | null>(null);

	$effect(() => {
		study = ledger.state();
		return ledger.subscribe((s) => (study = s));
	});

	$effect(() => {
		const h = hit;
		word = null;
		ready = false;
		shrunk = null;
		if (!h) return;
		let live = true;
		find(h.hanzi).then(
			(f) => {
				if (!live) return;
				word = f.word;
				ready = true;
			},
			() => {}
		);
		return () => {
			live = false;
		};
	});

	const view = $derived(hit && ready && study ? lookupView(hit, word, study) : null);
	const reading = $derived(
		shrunk?.char?.readings.find((r) => !r.rare) ?? shrunk?.char?.readings[0]
	);

	async function shrink(hanzi: string) {
		const from = hit;
		const char = await find(hanzi).then(
			(f) => f.char,
			() => null
		);
		if (hit === from) shrunk = { hanzi, char };
	}

	async function add() {
		if (!hit || busy) return;
		busy = true;
		try {
			await ledger.record({ kind: 'saved', word: hit.hanzi, at: new Date().toISOString() });
			study = ledger.state();
		} finally {
			busy = false;
		}
	}
</script>

<Sheet open={hit !== null} title={m.lookup_title()} {onclose}>
	{#if hit}
		{#if shrunk}
			<p class="mt-4 text-headline" data-part="lookup-hanzi" lang="zh-Hans">{shrunk.hanzi}</p>
			{#if reading}
				<p data-part="lookup-pinyin">{reading.pinyin}</p>
				<p data-part="lookup-hanviet">{reading.hanviet}</p>
			{:else}
				<p data-part="lookup-missing">{m.lookup_not_found()}</p>
			{/if}
			<button
				type="button"
				class="mt-4 underline"
				data-part="lookup-back"
				onclick={() => (shrunk = null)}>{m.lookup_back({ word: hit.hanzi })}</button
			>
		{:else}
			<p class="mt-4 text-headline" data-part="lookup-hanzi" lang="zh-Hans">{hit.hanzi}</p>
			<p data-part="lookup-pinyin">{hit.pinyin}</p>
			<p data-part="lookup-hanviet">{hit.hanviet}</p>
			<p data-part="lookup-meaning">{hit.meaning}</p>
			{#if view && view.chars.length > 0}
				<div class="mt-3 flex gap-2">
					{#each view.chars as c, i (i)}
						<button
							type="button"
							class="rounded-action border border-ruled-line px-3 py-1"
							data-part="lookup-char"
							lang="zh-Hans"
							onclick={() => shrink(c)}>{c}</button
						>
					{/each}
				</div>
			{/if}
			{#if view}
				<div class="mt-4 flex items-center gap-3">
					{#if view.mode === 'taught'}
						<a
							class="underline"
							data-part="lookup-detail"
							href={resolve('/(app)/word/[id]', { id: hit.hanzi })}>{m.lookup_detail()}</a
						>
					{/if}
					{#if view.canAdd}
						<button
							type="button"
							class="rounded-action border border-ruled-line px-4 py-2"
							data-part="lookup-add"
							disabled={busy}
							onclick={add}>{m.lookup_add()}</button
						>
					{/if}
					{#if view.selfAdded}
						<span data-part="lookup-self">{m.lookup_self_added()}</span>
					{/if}
				</div>
			{/if}
		{/if}
	{/if}
</Sheet>
