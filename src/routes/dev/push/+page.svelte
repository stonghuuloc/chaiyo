<script lang="ts">
	import { PUBLIC_VAPID_PUBLIC_KEY } from '$app/env/public';
	import { disablePush, enablePush } from '#lib/notify/subscribe.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import { runPush, type PushDeps } from './run';

	let result = $state('');
	const key = PUBLIC_VAPID_PUBLIC_KEY;

	const deps = async (): Promise<PushDeps> => {
		const { data } = await supabase.auth.getSession();
		const uid = data.session?.user.id ?? '';
		const registration = await navigator.serviceWorker.ready;
		return {
			key,
			enable: () =>
				enablePush({
					registration,
					client: supabase,
					uid,
					key: key ?? '',
					requestPermission: () => Notification.requestPermission()
				}),
			disable: () => disablePush({ registration, client: supabase, uid }),
			invoke: () => supabase.functions.invoke('push-test')
		};
	};

	const run = async (action: 'on' | 'off' | 'test') => {
		try {
			result = await runPush(action, await deps());
		} catch (e) {
			result = m.chy48s1_state({ state: e instanceof Error ? e.message : String(e) });
		}
	};
</script>

<main>
	<h1>{m.chy48s1_title()}</h1>
	{#if !key}<p role="alert">{m.chy48s1_no_key()}</p>{/if}
	<p>
		{m.chy48s1_state({
			state: typeof Notification === 'undefined' ? '-' : Notification.permission
		})}
	</p>
	<button type="button" disabled={!key} onclick={() => run('on')}>{m.chy48s1_on()}</button>
	<button type="button" disabled={!key} onclick={() => run('off')}>{m.chy48s1_off()}</button>
	<button type="button" disabled={!key} onclick={() => run('test')}>{m.chy48s1_test()}</button>
	{#if result}<p>{result}</p>{/if}
</main>
