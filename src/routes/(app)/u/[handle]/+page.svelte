<script lang="ts">
	import { afterNavigate, snapshot } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { setFollow } from '#lib/social/follow.js';
	import { BADGE_ART, BADGES } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase.js';
	import Button from '#lib/ui/Button.svelte';
	import Toast from '#lib/ui/Toast.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let inApp = false;
	afterNavigate(({ from, type }) => {
		inApp ||= from !== null && type !== 'popstate';
	});
	snapshot({
		capture: () => inApp,
		restore: (value) => {
			inApp = value;
		}
	});

	function back(e: MouseEvent) {
		if (!inApp) return;
		e.preventDefault();
		history.back();
	}

	const titles = new Map<string, string>(BADGES);
	let following = $derived(data.profile.status === 'visible' && data.profile.following);
	let pending = false;
	let toast = $state({ open: false, message: '', nonce: 0 });
	const say = (message: string) => (toast = { open: true, message, nonce: toast.nonce + 1 });
	let strip = $state<HTMLElement>();

	$effect(() => {
		if (!data.badge) return;
		strip
			?.querySelector('[aria-current="true"]')
			?.scrollIntoView({ inline: 'center', block: 'nearest' });
	});

	async function tap() {
		if (data.profile.status !== 'visible' || pending) return;
		const { handle, name } = data.profile;
		const on = !following;
		following = on;
		pending = true;
		let ok: boolean;
		try {
			ok = await setFollow(supabase, handle, on);
		} catch {
			ok = false;
		}
		pending = false;
		if (!ok) {
			following = !on;
			say(m.chy52s3_follow_failed());
			return;
		}
		say(on ? m.chy52s3_followed({ name }) : m.chy52s3_unfollowed({ name }));
	}
</script>

<div
	class="sticky top-0 -mx-(--gutter) grid grid-cols-[44px_1fr_44px] items-center bg-notebook-paper px-3 py-2"
>
	<a
		href={resolve('/(app)/(tabs)/me')}
		onclick={back}
		aria-label={m.chy52s1_back()}
		class="grid size-11 place-items-center rounded-full text-graphite"
	>
		<svg class="size-[22px] -scale-x-100 fill-current" aria-hidden="true">
			<use href="#i-regular-caret-right" />
		</svg>
	</a>
	<span class="text-center font-display text-title">{m.chy52s1_title()}</span>
	<span></span>
</div>

{#if data.profile.status === 'visible'}
	{@const p = data.profile}
	<div class="mt-4 text-center">
		{#if p.photo}
			<img
				data-part="avatar"
				src={p.photo}
				alt=""
				class="mx-auto block size-24 rounded-full object-cover"
			/>
		{:else}
			<div
				data-part="avatar"
				class="mx-auto grid size-24 place-items-center rounded-full bg-sunflower-wash font-display text-[38px] font-semibold text-ink"
				aria-hidden="true"
			>
				{p.name.charAt(0)}
			</div>
		{/if}
		<h1 class="mt-3 font-display text-[26px] leading-[1.15] font-semibold text-ink">{p.name}</h1>
		<span
			data-part="chip"
			class="mt-2 inline-block rounded-full bg-shaded-paper px-3 py-1 text-[13.5px] font-semibold text-graphite"
			>{m.chy52s4_hsk({ n: p.hsk })}</span
		>
	</div>
	<div
		data-part="stats"
		class="mt-5 grid grid-cols-3 divide-x divide-ruled-line rounded-[18px] border border-ruled-line bg-white"
	>
		<div class="px-2 py-4 text-center">
			<b
				class="inline-flex items-center justify-center gap-1 font-display text-[24px] leading-[1.1] font-semibold tabular-nums"
				>{m.chy52s4_lesson({ n: p.lesson })}</b
			>
			<span class="mt-1 block text-[13px] text-pencil">{m.chy52s4_learning()}</span>
		</div>
		<div class="px-2 py-4 text-center">
			<b
				class="inline-flex items-center justify-center gap-1 font-display text-[24px] leading-[1.1] font-semibold tabular-nums"
				><svg class="size-5 fill-current text-lantern-red" aria-hidden="true"
					><use href="#i-fill-fire" /></svg
				>{p.streak}</b
			>
			<span class="mt-1 block text-[13px] text-pencil">{m.chy52s2_streak()}</span>
		</div>
		<div class="px-2 py-4 text-center">
			<b
				class="inline-flex items-center justify-center gap-1 font-display text-[24px] leading-[1.1] font-semibold tabular-nums"
				>{p.wordsKnown}</b
			>
			<span class="mt-1 block text-[13px] text-pencil">{m.chy52s4_known()}</span>
		</div>
	</div>
	{#if !p.me}
		<div class="mt-4">
			<Button
				variant={following ? 'outline' : 'primary'}
				icon={following ? 'bold-check' : undefined}
				onclick={tap}
			>
				{following ? m.chy52s3_following() : m.chy52s3_follow_label({ name: p.name })}
			</Button>
		</div>
	{/if}
	<section class="mt-6 border-t border-ruled-line pt-5">
		<h2 class="font-display text-[19px] leading-[1.2] font-semibold text-ink">
			{m.chy52s4_badges()}
		</h2>
		<p class="mt-0.5 text-[14px] text-pencil">
			{p.badges.length > 0
				? m.chy52s4_badges_count({ name: p.name, n: p.badges.length })
				: m.chy52s4_badges_none({ name: p.name })}
		</p>
		{#if p.badges.length > 0}
			<div
				bind:this={strip}
				data-part="strip"
				class="-mx-(--gutter) mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-(--gutter)"
			>
				{#each p.badges as id (id)}
					<div
						data-part="badge"
						aria-current={id === data.badge ? 'true' : undefined}
						class="w-[116px] flex-none rounded-[18px] bg-white px-2 py-3 text-center aria-[current=true]:ring-[2.5px] aria-[current=true]:ring-lantern-red"
					>
						<img
							src="/badges/{BADGE_ART[id]}.webp"
							alt=""
							loading="lazy"
							class="mx-auto block size-21 rounded-full"
						/>
						<b class="mt-2 block text-[13.5px] leading-[1.25] font-semibold">{titles.get(id)}</b>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	<Toast
		open={toast.open}
		message={toast.message}
		nonce={toast.nonce}
		duration={2200}
		placement="top"
		onclose={() => (toast.open = false)}
	/>
{:else}
	<div class="mt-8 text-center">
		<div class="h-15">
			<svg class="mx-auto block size-14 fill-current text-faint-pencil" aria-hidden="true">
				<use href={data.profile.status === 'hidden' ? '#i-fill-user-block' : '#i-fill-magnifer'} />
			</svg>
		</div>
		<h1 class="mt-3 font-display text-headline">
			{data.profile.status === 'hidden' ? m.chy52s1_hidden_title() : m.chy52s1_missing_title()}
		</h1>
		<p class="mx-auto mt-2 max-w-[284px] text-[15px] leading-[normal] text-pencil">
			{data.profile.status === 'hidden' ? m.chy52s1_hidden_body() : m.chy52s1_missing_body()}
		</p>
	</div>
{/if}
