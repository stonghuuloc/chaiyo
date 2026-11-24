<script lang="ts">
	import { chipName, type InboxCard } from '#lib/admin/reports.js';
	import { m } from '#lib/paraglide/messages.js';

	let { card }: { card: InboxCard } = $props();

	const title = $derived(
		card.head.kind === 'lesson'
			? m.chy54s1_lesson({ n: card.head.n, title: card.head.title })
			: card.head.lesson === null
				? m.chy54s1_word()
				: m.chy54s1_word_lesson({ n: card.head.lesson })
	);
</script>

<li data-part="report-card" data-id={card.id} class="p-4">
	<div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
		{#if card.head.kind === 'word'}
			<span
				data-part="card-hanzi"
				class="min-w-10 text-center font-hanzi leading-[1.1] whitespace-nowrap {card.head.long
					? 'text-[22px]'
					: 'text-[30px]'}">{card.head.hanzi}</span
			>
		{:else}
			<span
				data-part="card-icon"
				class="grid size-10 place-items-center rounded-cell bg-shaded-paper text-ink"
			>
				<svg class="size-[22px] fill-current" aria-hidden="true"
					><use href="#i-fill-book-open-text" /></svg
				>
			</span>
		{/if}
		<b class="block text-[15px] font-semibold">{title}</b>
	</div>
	<div class="mt-3 flex flex-wrap items-center gap-2">
		<span
			data-part="card-tag"
			class="rounded-full bg-shaded-paper px-2.5 py-[3px] text-[12.5px] font-semibold text-graphite"
			>{chipName(card.chip)}</span
		>
		<span data-part="card-who" class="text-[13px] text-pencil"
			>{m.chy54s1_who({ name: card.who, ago: card.ago })}</span
		>
	</div>
	<p
		data-part="card-note"
		class="mt-2 text-[15px] leading-[1.45] {card.note ? 'text-ink' : 'text-faint-pencil'}"
	>
		{card.note ?? m.chy54s1_no_note()}
	</p>
</li>
