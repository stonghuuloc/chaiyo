<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { WordView } from './word-view';

	let { view }: { view: WordView } = $props();
	let open = $state(false);

	const labels: Record<WordView['groups'][number]['pos'], () => string> = {
		n: () => m.word_pos_n(),
		v: () => m.word_pos_v(),
		adj: () => m.word_pos_adj(),
		adv: () => m.word_pos_adv(),
		pron: () => m.word_pos_pron(),
		num: () => m.word_pos_num(),
		mw: () => m.word_pos_mw(),
		prep: () => m.word_pos_prep(),
		conj: () => m.word_pos_conj(),
		part: () => m.word_pos_part(),
		interj: () => m.word_pos_interj(),
		phrase: () => m.word_pos_phrase(),
		comp: () => m.word_pos_comp()
	};

	const groups = $derived(
		view.groups
			.map((g) => ({ ...g, senses: g.senses.filter((s) => open || !s.rare) }))
			.filter((g) => g.senses.length > 0)
	);
	const disclaimer = $derived(
		groups.some((g) => g.senses.some((s) => s.example?.source?.kind === 'ai'))
	);
</script>

<header>
	<h2 lang="zh-Hans">{view.hanzi}</h2>
	<p class="reading">
		{view.pinyin}{#if view.hanviet}<span> · {view.hanviet}</span>{/if}
	</p>
</header>
<div class="report-slot"></div>

{#each groups as group (group.pos)}
	<section>
		<h3>{labels[group.pos]()}</h3>
		<ol>
			{#each group.senses as sense, i (i)}
				<li>
					<p class="vi">{sense.vi}</p>
					{#if sense.example}
						<p class="hanzi" lang="zh-Hans">{sense.example.hanzi}</p>
						<p class="gloss">{sense.example.pinyin} — {sense.example.vi}</p>
						{#if sense.example.source?.kind === 'tatoeba'}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- absolute Tatoeba URL -->
							<a href={sense.example.source.url} target="_blank" rel="noopener">
								{m.word_source_tatoeba()}
							</a>
						{/if}
					{/if}
				</li>
			{/each}
		</ol>
	</section>
{/each}

{#if view.rare > 0}
	<button type="button" aria-expanded={open} onclick={() => (open = !open)}>
		{open ? m.word_rare_less() : m.word_rare_more({ count: view.rare })}
	</button>
{/if}

{#if disclaimer}
	<p class="disclaimer">{m.word_ai_disclaimer()}</p>
{/if}
