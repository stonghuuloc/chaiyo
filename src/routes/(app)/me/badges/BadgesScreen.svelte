<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { badgeLink } from '#lib/social/badge-link.js';
	import { copyText } from '#lib/ui/clipboard.js';
	import Section from '#lib/ui/Section.svelte';
	import Toast from '#lib/ui/Toast.svelte';
	import type { BadgeId, BadgesView, LockedBadge } from '#lib/study/index.js';
	import BadgeSheet from './BadgeSheet.svelte';

	type Props = {
		view: BadgesView | null;
		handle: string | null;
		onmissinghandle: () => void;
	};
	let { view, handle, onmissinghandle }: Props = $props();

	let openId = $state<BadgeId | null>(null);
	const open = $derived(
		view && openId
			? ([...view.earned, ...view.soon, ...view.rest].find((b) => b.id === openId) ?? null)
			: null
	);
	let toast = $state({ open: false, message: '', nonce: 0 });
	const say = (message: string) => (toast = { open: true, message, nonce: toast.nonce + 1 });

	async function share() {
		if (!openId) return;
		if (!handle) {
			onmissinghandle();
			say(m.chy51s2_copy_failed());
			return;
		}
		const ok = await copyText(badgeLink(location.origin, handle, openId));
		say(ok ? m.chy51s2_copied() : m.chy51s2_copy_failed());
	}

	const how: Record<BadgeId, () => string> = {
		first: m.chy51s1_how_first,
		streak7: m.chy51s1_how_streak7,
		streak30: m.chy51s1_how_streak30,
		streak100: m.chy51s1_how_streak100,
		words100: m.chy51s1_how_words100,
		words300: m.chy51s1_how_words300,
		write50: m.chy51s1_how_write50,
		hsk1: m.chy51s1_how_hsk1,
		hsk2: m.chy51s1_how_hsk2
	};
	const line = $derived(
		!view
			? ''
			: view.kind === 'none'
				? m.chy51s1_line_none()
				: view.kind === 'all'
					? m.chy51s1_line_all()
					: m.chy51s1_line_some({ left: view.total - view.earned.length })
	);
</script>

{#snippet lockedList(rows: LockedBadge[])}
	<ul class="mt-4 divide-y divide-ruled-line overflow-hidden rounded-action bg-white">
		{#each rows as b (b.id)}
			<li data-id={b.id}>
				<button
					type="button"
					class="grid min-h-[76px] w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-center gap-3 py-3 pr-4 pl-3 text-left active:bg-notebook-paper"
					onclick={() => (openId = b.id)}
				>
					<img
						src="/badges/{b.art}.webp"
						alt=""
						loading="lazy"
						class="size-14 rounded-full opacity-[.55] grayscale"
					/>
					<span class="block">
						<span class="block text-[15.5px] leading-[normal] font-semibold">{b.title}</span>
						<span class="mt-0.5 block text-[13px] leading-[1.35] text-pencil">{how[b.id]()}</span>
						{#if b.need !== null}
							<span class="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
								<span class="block h-[5px] overflow-hidden rounded-[3px] bg-shaded-paper">
									<span
										data-part="fill"
										class="block h-full rounded-[3px] bg-lantern-red"
										style:width="{b.pct}%"
									></span>
								</span>
								<span
									class="text-[12.5px] leading-[normal] font-semibold text-graphite tabular-nums"
									>{b.have}/{b.need}</span
								>
							</span>
						{/if}
					</span>
				</button>
			</li>
		{/each}
	</ul>
{/snippet}

<div>
	<div
		class="sticky top-0 z-10 -mx-[var(--gutter)] grid grid-cols-[44px_1fr_44px] items-center bg-notebook-paper px-3 py-2 lg:-mx-2 lg:px-0"
	>
		<a
			href={resolve('/(app)/(tabs)/me')}
			class="grid size-11 place-items-center rounded-full text-graphite"
			aria-label={m.chy51s1_back()}
		>
			<svg class="size-[22px] rotate-180 fill-current" aria-hidden="true"
				><use href="#i-regular-caret-right" /></svg
			>
		</a>
		<span class="text-center font-display text-title">{m.chy51s1_title()}</span>
		<span></span>
	</div>
	{#if view}
		<div class="pt-3 pb-5">
			<h1 class="font-display text-headline font-bold">
				{m.chy51s1_sum({ n: view.earned.length, total: view.total })}
			</h1>
			<p class="mt-1 text-[15px] leading-[1.45] text-graphite">{line}</p>
			<div
				role="img"
				aria-label="{view.earned.length}/{view.total}"
				class="mt-3 h-1.5 overflow-hidden rounded-[3px] bg-shaded-paper"
			>
				<span
					class="block h-full rounded-[3px] bg-lantern-red"
					style:width="{Math.round((view.earned.length / view.total) * 100)}%"
				></span>
			</div>
		</div>
		{#if view.earned.length}
			<Section>
				<h2 class="font-display text-[19px] leading-tight font-semibold">{m.chy51s1_earned()}</h2>
				<p class="mt-0.5 text-[13.5px] leading-[normal] text-pencil">{m.chy51s2_sub_earned()}</p>
				<div class="mt-4 grid grid-cols-3 gap-2">
					{#each view.earned as b (b.id)}
						<button
							type="button"
							data-id={b.id}
							class="block w-full cursor-pointer rounded-action bg-white px-1 py-3 text-center transition-transform motion-safe:active:scale-[.97]"
							onclick={() => (openId = b.id)}
						>
							<img
								src="/badges/{b.art}.webp"
								alt=""
								loading="lazy"
								class="mx-auto block size-[88px] rounded-full"
							/>
							<span class="mt-2 block px-1 text-[13.5px] leading-tight font-semibold"
								>{b.title}</span
							>
							<span class="mt-0.5 block text-[12.5px] leading-[normal] text-pencil"
								>{m.chy51s1_date({ date: b.date })}</span
							>
						</button>
					{/each}
				</div>
			</Section>
		{/if}
		{#if view.soon.length}
			<Section>
				<h2 class="font-display text-[19px] leading-tight font-semibold">
					{view.kind === 'none' ? m.chy51s1_try() : m.chy51s1_soon()}
				</h2>
				{#if view.kind === 'none'}
					<p class="mt-0.5 text-[13.5px] leading-[normal] text-pencil">{m.chy51s1_try_sub()}</p>
				{:else}
					<p class="mt-0.5 text-[13.5px] leading-[normal] text-pencil">{m.chy51s2_sub_soon()}</p>
				{/if}
				{@render lockedList(view.soon)}
			</Section>
		{/if}
		{#if view.rest.length}
			<Section>
				<h2 class="font-display text-[19px] leading-tight font-semibold">{m.chy51s1_rest()}</h2>
				<p class="mt-0.5 text-[13.5px] leading-[normal] text-pencil">{m.chy51s1_rest_sub()}</p>
				{@render lockedList(view.rest)}
			</Section>
		{/if}
	{/if}
</div>

<BadgeSheet
	badge={open}
	how={open ? how[open.id]() : ''}
	onclose={() => (openId = null)}
	onshare={share}
/>
<Toast
	open={toast.open}
	message={toast.message}
	nonce={toast.nonce}
	duration={2000}
	placement="top"
	onclose={() => (toast.open = false)}
/>
