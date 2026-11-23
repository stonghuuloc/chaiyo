<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_TELEGRAM_BOT, PUBLIC_VAPID_PUBLIC_KEY } from '$app/env/public';
	import { disablePush, enablePush } from '#lib/notify/subscribe.js';
	import { telegramLink } from '#lib/notify/telegram-store.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import ReminderChannels, { type Deps } from './ReminderChannels.svelte';
	import { pushPermission } from './push-state';

	let deps = $state<Deps>();

	onMount(async () => {
		const { data } = await supabase.auth.getSession();
		const uid = data.session?.user.id;
		if (!uid) return;
		const link = telegramLink(supabase, uid);
		const [settings, linked] = await Promise.all([
			supabase.from('settings').select('remind_push').eq('learner_id', uid).maybeSingle(),
			link.isLinked()
		]);
		const registration = () => navigator.serviceWorker.ready;
		const here =
			'serviceWorker' in navigator
				? await Promise.race([
						registration().then((r) => r.pushManager?.getSubscription() ?? null),
						new Promise<null>((done) => setTimeout(() => done(null), 3000))
					]).catch(() => null)
				: null;
		deps = {
			bot: PUBLIC_TELEGRAM_BOT,
			permission: pushPermission(window),
			pushOn: settings.data?.remind_push === true && here !== null,
			linked,
			enablePush: async () =>
				enablePush({
					registration: await registration(),
					client: supabase,
					uid,
					key: PUBLIC_VAPID_PUBLIC_KEY ?? '',
					requestPermission: () => Notification.requestPermission()
				}),
			disablePush: async () =>
				disablePush({ registration: await registration(), client: supabase, uid }),
			issueToken: link.issueToken,
			isLinked: link.isLinked,
			testTelegram: () => supabase.functions.invoke('telegram-test'),
			unlink: link.unlink
		};
	});
</script>

<h1>{m.screen_settings()}</h1>
{#if deps}<ReminderChannels {deps} />{/if}
