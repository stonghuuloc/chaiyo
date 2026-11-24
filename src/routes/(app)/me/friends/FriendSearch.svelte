<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { searchLearners, setFollow, type FoundLearner } from '#lib/social/follow.js';
	import { supabase } from '#lib/supabase.js';
	import { copyText } from '#lib/ui/clipboard.js';
	import Toast from '#lib/ui/Toast.svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';

	let {
		client = supabase,
		onchange,
		handle
	}: {
		client?: Pick<SupabaseClient, 'rpc'>;
		onchange: () => Promise<void>;
		handle: string | null;
	} = $props();

	let q = $state('');
	let asked = $state('');
	let rows = $state<FoundLearner[] | null>(null);
	let failed = $state(false);
	let toast = $state({ open: false, message: '', nonce: 0 });
	const say = (message: string) => (toast = { open: true, message, nonce: toast.nonce + 1 });
	const pending = new SvelteSet<string>();
	const chosen = new SvelteMap<string, boolean>();
	let seq = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(timer));

	const invite = $derived(handle ? `${location.origin}/moi/${handle}` : null);

	async function copyInvite() {
		if (!invite) return;
		say((await copyText(invite)) ? m.chy52s4_copied() : m.chy51s2_copy_failed());
	}

	function oninput() {
		clearTimeout(timer);
		const term = q.trim();
		if (term.length < 2) {
			seq++;
			rows = null;
			failed = false;
			return;
		}
		timer = setTimeout(() => search(term), 250);
	}

	async function search(term: string) {
		const n = ++seq;
		try {
			const found = await searchLearners(client, term);
			if (n !== seq) return;
			asked = term;
			rows = found.map((f) =>
				chosen.has(f.handle) ? { ...f, following: chosen.get(f.handle)! } : f
			);
			failed = false;
		} catch {
			if (n !== seq) return;
			rows = null;
			failed = true;
		}
	}

	async function tap(r: FoundLearner) {
		if (pending.has(r.handle)) return;
		const on = !r.following;
		r.following = on;
		chosen.set(r.handle, on);
		pending.add(r.handle);
		let ok: boolean;
		try {
			ok = await setFollow(client, r.handle, on);
		} catch {
			ok = false;
		}
		pending.delete(r.handle);
		if (!ok) {
			chosen.delete(r.handle);
			const cur = rows?.find((x) => x.handle === r.handle);
			if (cur) cur.following = !on;
			r.following = !on;
			say(m.chy52s3_follow_failed());
			return;
		}
		say(on ? m.chy52s3_followed({ name: r.name }) : m.chy52s3_unfollowed({ name: r.name }));
		await Promise.resolve(onchange()).catch(() => {});
	}
</script>

<section class="mt-6 border-t border-ruled-line pt-5">
	<h2 class="font-display text-[19px] leading-[1.2] font-semibold text-ink">{m.chy52s3_title()}</h2>
	<p class="mt-0.5 text-[14px] leading-[normal] text-pencil">{m.chy52s3_sub()}</p>
	<label class="relative mt-3 block">
		<svg
			class="absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 fill-current text-pencil"
			aria-hidden="true"><use href="#i-fill-magnifer" /></svg
		>
		<input
			type="search"
			autocomplete="off"
			spellcheck="false"
			placeholder={m.chy52s3_search()}
			aria-label={m.chy52s3_search()}
			bind:value={q}
			{oninput}
			class="h-[46px] w-full rounded-full border border-ruled-line bg-white/60 pr-4 pl-[42px] text-[16px] font-medium text-ink outline-none focus:border-ink"
		/>
	</label>
	{#if failed || rows !== null}
		<ul
			class="mt-3 divide-y divide-ruled-line overflow-hidden rounded-[18px] border border-ruled-line bg-white/55"
		>
			{#if failed}
				<li class="grid">
					<span class="col-span-full px-4 py-5 text-[15px] text-pencil"
						>{m.chy52s3_search_failed()}</span
					>
				</li>
			{:else if rows?.length === 0}
				<li class="grid">
					<span class="col-span-full px-4 py-5 text-[15px] text-pencil"
						>{m.chy52s3_none({ q: asked })}</span
					>
				</li>
			{:else}
				{#each rows ?? [] as r (r.handle)}
					<li class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pr-3">
						<a
							href={resolve('/(app)/u/[handle]', { handle: r.handle })}
							class="grid min-h-[68px] grid-cols-[44px_minmax(0,1fr)] items-center gap-3 py-2 pl-4 leading-[normal]"
						>
							{#if r.photo}
								<img
									data-part="avatar"
									src={r.photo}
									alt=""
									class="size-11 rounded-full object-cover"
								/>
							{:else}
								<span
									data-part="avatar"
									class="grid size-11 place-items-center rounded-full bg-sunflower-wash font-display text-[17px] font-semibold text-ink"
									aria-hidden="true">{r.name.charAt(0)}</span
								>
							{/if}
							<span class="min-w-0">
								<b class="block truncate text-[16px] font-semibold text-ink">{r.name}</b>
								<small class="mt-px block truncate text-[13px] text-pencil"
									>{m.chy52s3_meta({ hsk: r.hsk, n: r.lesson })}</small
								>
							</span>
						</a>
						<button
							type="button"
							aria-pressed={r.following}
							aria-label={r.following
								? m.chy52s3_unfollow_label({ name: r.name })
								: m.chy52s3_follow_label({ name: r.name })}
							onclick={() => tap(r)}
							class="inline-flex min-h-11 min-w-28 cursor-pointer items-center justify-center gap-1 rounded-full border border-ink bg-ink px-3 text-[14px] font-semibold text-notebook-paper aria-pressed:border-faint-pencil aria-pressed:bg-transparent aria-pressed:text-graphite"
						>
							{#if r.following}
								<svg class="size-[15px] fill-current" aria-hidden="true"
									><use href="#i-bold-check" /></svg
								>{m.chy52s3_following()}
							{:else}
								{m.chy52s3_follow()}
							{/if}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
	{#if invite}
		<button
			type="button"
			data-part="invite"
			onclick={copyInvite}
			class="mt-4 grid min-h-16 w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-ruled-line bg-white/55 px-4 py-2 text-left leading-[normal]"
		>
			<span class="grid size-10 place-items-center rounded-[12px] bg-shaded-paper">
				<svg class="size-[22px] fill-current text-graphite" aria-hidden="true"
					><use href="#i-fill-link-round" /></svg
				>
			</span>
			<span class="min-w-0">
				<b class="block font-semibold text-ink">{m.chy52s4_invite()}</b>
				<small class="mt-px block truncate text-[13px] text-pencil"
					>{invite.replace(/^https?:\/\//, '')}</small
				>
			</span>
			<span data-part="go" class="text-[13.5px] font-semibold text-graphite"
				>{m.chy52s4_copy()}</span
			>
		</button>
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
