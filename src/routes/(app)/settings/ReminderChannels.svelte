<script lang="ts" module>
	import type { PushPermission } from './push-state';

	export type Deps = {
		bot?: string;
		permission: PushPermission;
		pushOn: boolean;
		linked: boolean;
		enablePush(): Promise<'on' | 'denied' | 'unsupported'>;
		disablePush(): Promise<void>;
		issueToken(): Promise<string>;
		isLinked(): Promise<boolean>;
		testTelegram(): Promise<{ error: { message: string } | null }>;
		unlink(): Promise<void>;
		email: string;
		emailOn: boolean;
		saveEmail(on: boolean): Promise<void>;
		notify(message: string): void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import Sheet from '#lib/ui/Sheet.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import { serial } from './prefs';
	import { pushBlocked } from './push-state';

	let { deps }: { deps: Deps } = $props();

	let permission = $state(untrack(() => deps.permission));
	let pushOn = $state(untrack(() => deps.pushOn));
	let linked = $state(untrack(() => deps.linked));
	let sheetOpen = $state(false);
	let token = $state('');
	let note = $state('');
	let pushError = $state('');
	let emailOn = $state(untrack(() => deps.emailOn));
	let savedEmail = untrack(() => deps.emailOn);
	let inflight = 0;
	const run = serial();
	const blocked = $derived(pushBlocked(permission));

	const fail = (e: unknown) =>
		m.chy48s3_error({
			message: typeof e === 'object' && e !== null && 'message' in e ? String(e.message) : String(e)
		});

	const togglePush = async () => {
		pushError = '';
		try {
			if (pushOn) {
				await deps.disablePush();
				pushOn = false;
				return;
			}
			const result = await deps.enablePush();
			if (result === 'on') pushOn = true;
			else permission = result;
		} catch (e) {
			pushError = fail(e);
		}
	};

	const flipEmail = async () => {
		const next = !emailOn;
		emailOn = next;
		inflight++;
		try {
			await run(() => deps.saveEmail(next));
			savedEmail = next;
		} catch {
			if (inflight === 1) emailOn = savedEmail;
			deps.notify(m.welcome_save_error());
		} finally {
			inflight--;
		}
	};

	const connect = async () => {
		note = '';
		try {
			token = await deps.issueToken();
			sheetOpen = true;
		} catch (e) {
			note = fail(e);
		}
	};

	const done = async () => {
		try {
			if (await deps.isLinked()) {
				linked = true;
				sheetOpen = false;
				note = '';
				deps.notify(m.chy53s3_tg_on());
			} else {
				note = m.chy48s3_tg_not_yet();
			}
		} catch (e) {
			note = fail(e);
		}
	};

	const later = () => {
		sheetOpen = false;
		note = '';
	};

	const test = async () => {
		try {
			const { error } = await deps.testTelegram();
			note = error ? fail(error) : m.chy48s3_tg_sent();
		} catch (e) {
			note = fail(e);
		}
	};

	const unlink = async () => {
		try {
			await deps.unlink();
			linked = false;
			note = '';
			deps.notify(m.chy53s3_tg_off());
		} catch (e) {
			note = fail(e);
		}
	};

	const flipTelegram = () => (linked ? unlink() : connect());
</script>

<p class="mt-4 text-label leading-[normal] font-semibold text-pencil">{m.chy48s3_heading()}</p>
<ul
	class="mt-2 overflow-hidden rounded-[18px] border border-ruled-line bg-white/55 [&>li+li]:border-t [&>li+li]:border-ruled-line"
>
	<li class="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
		<span class="grid size-10 place-items-center rounded-cell bg-shaded-paper text-ink [--duo:.3]">
			<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-fill-bell" /></svg>
		</span>
		<span class="min-w-0">
			<b class="block text-[16px] leading-[normal] font-semibold">{m.chy48s3_push()}</b>
			{#if blocked}
				<small
					class="mt-px block text-[13px] leading-[normal] [overflow-wrap:anywhere] text-lantern-red-text"
					>{m.chy48s3_push_blocked()}</small
				>
			{:else}
				<small class="mt-px block text-[13px] leading-[normal] [overflow-wrap:anywhere] text-pencil"
					>{m.chy48s3_push_here()}</small
				>
			{/if}
			{#if pushError}<p role="alert" class="mt-1 text-[13px] text-graphite">{pushError}</p>{/if}
		</span>
		<Switch checked={pushOn} label={m.chy48s3_push()} onchange={togglePush} />
	</li>
	<li class="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
		<span class="grid size-10 place-items-center rounded-cell bg-shaded-paper text-ink [--duo:.3]">
			<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-fill-letter" /></svg>
		</span>
		<span class="min-w-0">
			<b class="block text-[16px] leading-[normal] font-semibold">{m.chy53s3_email()}</b>
			<small class="mt-px block text-[13px] leading-[normal] [overflow-wrap:anywhere] text-pencil"
				>{deps.email}</small
			>
		</span>
		<Switch checked={emailOn} label={m.chy53s3_email()} onchange={flipEmail} />
	</li>
	{#if deps.bot}
		<li class="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
			<span
				class="grid size-10 place-items-center rounded-cell bg-shaded-paper text-ink [--duo:.3]"
			>
				<svg class="size-[22px] fill-current" aria-hidden="true"><use href="#i-fill-plain" /></svg>
			</span>
			<span class="min-w-0">
				<b class="block text-[16px] leading-[normal] font-semibold">{m.chy48s3_tg()}</b>
				<small
					class="mt-px block text-[13px] leading-[normal] [overflow-wrap:anywhere] text-pencil"
				>
					{linked
						? m.chy48s3_tg_linked({ bot: deps.bot })
						: m.chy48s3_tg_unlinked({ bot: deps.bot })}
				</small>
				{#if linked}
					<button
						type="button"
						class="mt-1 min-h-11 text-[13px] font-semibold text-graphite"
						onclick={test}>{m.chy48s3_tg_test()}</button
					>
				{/if}
				{#if note && !sheetOpen}<p role="status" class="text-[13px] text-graphite">{note}</p>{/if}
			</span>
			<Switch checked={linked} label={m.chy48s3_tg()} onchange={flipTelegram} />
		</li>
	{/if}
</ul>
{#if !pushOn && !emailOn && !linked}
	<p class="mt-2 text-[13px] leading-[1.45] text-pencil">{m.chy53s3_none()}</p>
{/if}

{#if deps.bot}
	<Sheet open={sheetOpen} title={m.chy48s3_tg_connect()} onclose={later}>
		<p class="mt-2 text-[15px] leading-[1.45] text-graphite">{m.chy48s3_tg_intro()}</p>
		<ol class="mt-4 grid gap-3">
			{#each [m.chy48s3_tg_step1(), m.chy48s3_tg_step2( { bot: deps.bot } ), m.chy48s3_tg_step3()] as step, i (i)}
				<li class="grid grid-cols-[28px_1fr] items-start gap-3 leading-[1.45]">
					<span
						aria-hidden="true"
						class="grid size-7 place-items-center rounded-full bg-shaded-paper font-display text-[14px] font-semibold"
						>{i + 1}</span
					>
					<span>{step}</span>
				</li>
			{/each}
		</ol>
		<a
			href="https://t.me/{deps.bot}?start={token}"
			target="_blank"
			rel="noopener"
			class="mt-3 flex h-[52px] w-full items-center justify-center rounded-action bg-ink font-display text-[17px] font-semibold text-notebook-paper"
			>{m.chy48s3_tg_open()}</a
		>
		<button
			type="button"
			class="mt-3 flex h-[52px] w-full items-center justify-center rounded-action border border-ruled-line bg-white/50 font-display text-[17px] font-semibold text-ink"
			onclick={done}>{m.chy48s3_tg_done()}</button
		>
		<button
			type="button"
			class="mt-2 min-h-11 w-full text-[15px] font-semibold text-pencil"
			onclick={later}>{m.chy48s3_tg_later()}</button
		>
		{#if note}<p role="status" class="mt-2 text-[13px] leading-[1.45] text-graphite">{note}</p>{/if}
	</Sheet>
{/if}
