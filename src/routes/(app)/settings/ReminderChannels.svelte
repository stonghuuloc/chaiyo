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
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import Sheet from '#lib/ui/Sheet.svelte';
	import { pushBlocked } from './push-state';

	let { deps }: { deps: Deps } = $props();

	let permission = $state(untrack(() => deps.permission));
	let pushOn = $state(untrack(() => deps.pushOn));
	let linked = $state(untrack(() => deps.linked));
	let sheetOpen = $state(false);
	let token = $state('');
	let note = $state('');
	let pushError = $state('');
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
		} catch (e) {
			note = fail(e);
		}
	};
</script>

<section>
	<h2>{m.chy48s3_heading()}</h2>
	<ul>
		<li>
			<span>
				<b>{m.chy48s3_push()}</b>
				<small>{blocked ? m.chy48s3_push_blocked() : m.chy48s3_push_here()}</small>
			</span>
			<button
				type="button"
				role="switch"
				aria-checked={pushOn}
				aria-label={m.chy48s3_push()}
				disabled={blocked}
				onclick={togglePush}
				class="group bg-gray-300 aria-checked:bg-green-500 relative inline-block h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40"
			>
				<span
					class="absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform group-aria-checked:translate-x-5"
				></span>
			</button>
			{#if pushError}<p role="alert">{pushError}</p>{/if}
		</li>
		{#if deps.bot}
			<li>
				<span>
					<b>{m.chy48s3_tg()}</b>
					<small>
						{linked
							? m.chy48s3_tg_linked({ bot: deps.bot })
							: m.chy48s3_tg_unlinked({ bot: deps.bot })}
					</small>
				</span>
				{#if linked}
					<button type="button" onclick={test}>{m.chy48s3_tg_test()}</button>
					<button type="button" onclick={unlink}>{m.chy48s3_tg_unlink()}</button>
				{:else}
					<button type="button" onclick={connect}>{m.chy48s3_tg_connect()}</button>
				{/if}
				{#if note && !sheetOpen}<p role="status">{note}</p>{/if}
			</li>
		{/if}
	</ul>
</section>

{#if deps.bot}
	<Sheet open={sheetOpen} title={m.chy48s3_tg_connect()} onclose={later}>
		<p>{m.chy48s3_tg_intro()}</p>
		<ol>
			<li>{m.chy48s3_tg_step1()}</li>
			<li>{m.chy48s3_tg_step2({ bot: deps.bot })}</li>
			<li>{m.chy48s3_tg_step3()}</li>
		</ol>
		<a href="https://t.me/{deps.bot}?start={token}" target="_blank" rel="noopener"
			>{m.chy48s3_tg_open()}</a
		>
		<button type="button" onclick={done}>{m.chy48s3_tg_done()}</button>
		<button type="button" onclick={later}>{m.chy48s3_tg_later()}</button>
		{#if note}<p role="status">{note}</p>{/if}
	</Sheet>
{/if}
