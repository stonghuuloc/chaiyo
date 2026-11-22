<script lang="ts">
	import Flashcard, { type Card } from '#lib/practice/Flashcard.svelte';
	import { m } from '#lib/paraglide/messages.js';

	const cards: Card[] = [
		{
			hanzi: '学生',
			pinyin: 'xuéshēng',
			hanviet: 'học sinh',
			meaning: 'học sinh',
			audio: 'word/学生',
			example: { hanzi: '他是学生。', pinyin: 'Tā shì xuéshēng.', vi: 'Anh ấy là học sinh.' }
		},
		{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' },
		{ hanzi: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn' }
	];

	let index = $state(0);
	let log = $state<string[]>([]);

	const reset = () => {
		index = 0;
		log = [];
	};
</script>

<main class="mx-auto flex w-full max-w-[390px] flex-col gap-4 overflow-x-clip p-4">
	{#if index < cards.length}
		{#key index}
			<Flashcard
				card={cards[index]}
				ondecide={({ remembered, ms }) => {
					const label = remembered ? m.practice_card_remember() : m.practice_card_forget();
					log.push(`${cards[index].hanzi} · ${label} · ${ms} ms`);
					index += 1;
				}}
			/>
		{/key}
	{:else}
		<p data-part="end" class="text-title">Hết thẻ</p>
		<button
			type="button"
			data-part="reset"
			class="min-h-11 rounded-action border border-ruled-line px-4 py-2"
			onclick={reset}>Chơi lại</button
		>
	{/if}
	<ul data-part="log" class="text-caption text-graphite">
		{#each log as line, i (i)}
			<li>{line}</li>
		{/each}
	</ul>
</main>
