<script lang="ts">
	import { cardHref, chipName, type InboxCard } from '#lib/admin/reports.js';
	import { m } from '#lib/paraglide/messages.js';

	let {
		card,
		busy,
		onresolve,
		onreopen
	}: { card: InboxCard; busy: boolean; onresolve: () => void; onreopen: () => void } = $props();

	const href = $derived(cardHref(card.head));

	const title = $derived(
		card.head.kind === 'lesson'
			? card.head.step
				? m.chy54s1_lesson_step({ n: card.head.n, title: card.head.title, step: card.head.step })
				: m.chy54s1_lesson({ n: card.head.n, title: card.head.title })
			: card.head.lesson === null
				? m.chy54s1_word()
				: m.chy54s1_word_lesson({ n: card.head.lesson })
	);
	const hint = $derived(
		card.head.kind === 'word'
			? m.chy54s2_hint_word({ hanzi: card.head.hanzi })
			: m.chy54s2_hint_lesson()
	);
</script>

<li data-part="report-card" data-id={card.id} class="p-4">
	{#if href}
		<a
			data-part="card-link"
			{href}
			class="grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-inherit"
		>
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
			<span class="min-w-0">
				<b class="block text-[15px] leading-[normal] font-semibold">{title}</b>
				{#if href}
					<small
						data-part="card-hint"
						class="block truncate text-[13px] leading-[normal] text-pencil">{hint}</small
					>
				{/if}
			</span>
		</a>
	{:else}
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
			<span class="min-w-0">
				<b class="block text-[15px] leading-[normal] font-semibold">{title}</b>
				{#if href}
					<small
						data-part="card-hint"
						class="block truncate text-[13px] leading-[normal] text-pencil">{hint}</small
					>
				{/if}
			</span>
		</div>
	{/if}
	<div class="mt-3 flex flex-wrap items-center gap-2">
		<span
			data-part="card-tag"
			class="rounded-full bg-shaded-paper px-2.5 py-[3px] text-[12.5px] leading-[normal] font-semibold text-graphite"
			>{chipName(card.chip)}</span
		>
		<span data-part="card-who" class="text-[13px] leading-[normal] text-pencil"
			>{m.chy54s1_who({ name: card.who, ago: card.ago })}</span
		>
	</div>
	<p
		data-part="card-note"
		class="mt-2 text-[15px] leading-[1.45] {card.note ? 'text-ink' : 'text-faint-pencil'}"
	>
		{card.note ?? m.chy54s1_no_note()}
	</p>
	<div data-part="card-actions" class="mt-3 flex">
		{#if card.status === 'new'}
			<button
				type="button"
				data-part="resolve"
				disabled={busy}
				onclick={onresolve}
				class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink px-4 text-[14px] font-semibold text-ink active:bg-shaded-paper"
			>
				<svg class="size-[18px] fill-current" aria-hidden="true"><use href="#i-bold-check" /></svg>
				{m.chy54s2_resolve()}
			</button>
		{:else}
			<span
				data-part="resolved"
				class="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-pencil"
			>
				<svg class="size-[18px] fill-current" aria-hidden="true"><use href="#i-fill-check" /></svg>
				{m.chy54s2_resolved()}
			</span>
			<button
				type="button"
				data-part="reopen"
				disabled={busy}
				onclick={onreopen}
				class="ms-auto min-h-11 px-2 text-[14px] font-semibold text-graphite underline underline-offset-3"
			>
				{m.chy54s2_reopen()}
			</button>
		{/if}
	</div>
</li>
