<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import Toast from '#lib/ui/Toast.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { admin }: { admin: boolean } = $props();

	type Row = {
		icon: string;
		title: string;
		sub: string;
		to?: '/(app)/me/friends' | '/(app)/settings';
	};

	const rows = $derived<Row[]>([
		{
			icon: 'fill-users',
			title: m.chy50s3_friends(),
			sub: m.chy50s3_friends_sub(),
			to: '/(app)/me/friends'
		},
		{
			icon: 'fill-settings',
			title: m.chy50s3_settings(),
			sub: m.chy50s3_settings_sub(),
			to: '/(app)/settings'
		},
		...(admin
			? [
					{ icon: 'fill-shield', title: m.chy50s3_reports(), sub: m.chy50s3_reports_sub() },
					{ icon: 'fill-chart', title: m.chy50s3_usage(), sub: m.chy50s3_usage_sub() }
				]
			: [])
	]);

	let busy = $state(false);
	let toast = $state({ open: false, message: '', nonce: 0 });
	const say = (message: string) => (toast = { open: true, message, nonce: toast.nonce + 1 });

	async function logout() {
		if (busy) return;
		busy = true;
		const { error } = await supabase.auth.signOut();
		if (error) {
			busy = false;
			return say(m.chy50s3_logout_failed());
		}
		await goto(resolve('/login'), { replace: true });
	}
</script>

<section data-part="me-menu" class="mt-6 border-t border-ruled-line pt-5">
	<ul
		class="mt-3 divide-y divide-ruled-line overflow-hidden rounded-[18px] border border-ruled-line bg-white/55"
	>
		{#each rows as r (r.title)}
			<li>
				{#if r.to}
					<a
						href={resolve(r.to)}
						class="grid min-h-16 w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left"
					>
						{@render body(r)}
						<svg class="size-4 fill-current text-faint-pencil" aria-hidden="true"
							><use href="#i-regular-caret-right" /></svg
						>
					</a>
				{:else}
					<div
						class="grid min-h-16 w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left"
					>
						{@render body(r)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	<button
		type="button"
		disabled={busy}
		class="mt-5 min-h-12 w-full text-[15px] font-semibold text-pencil"
		onclick={logout}>{m.chy50s3_logout()}</button
	>
	<p class="text-center text-[12px] text-faint-pencil">{m.chy50s3_ver()}</p>
</section>

{#snippet body(r: Row)}
	<span class="grid size-10 place-items-center rounded-[12px] bg-shaded-paper text-ink">
		<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-{r.icon}" /></svg>
	</span>
	<span class="min-w-0">
		<b class="block font-semibold">{r.title}</b>
		<small class="mt-px block truncate text-[13px] text-pencil">{r.sub}</small>
	</span>
{/snippet}

<Toast
	open={toast.open}
	message={toast.message}
	nonce={toast.nonce}
	duration={2000}
	placement="top"
	onclose={() => (toast.open = false)}
/>
