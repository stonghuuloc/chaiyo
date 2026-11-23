<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { PUBLIC_TELEGRAM_BOT, PUBLIC_VAPID_PUBLIC_KEY } from '$app/env/public';
	import { disablePush, enablePush } from '#lib/notify/subscribe.js';
	import { telegramLink } from '#lib/notify/telegram-store.js';
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import Toast from '#lib/ui/Toast.svelte';
	import { avatarDataUrl } from '#lib/welcome/photo.js';
	import PrivacySection, { type PrivacyDeps } from './PrivacySection.svelte';
	import ProfileSection, { type ProfileDeps } from './ProfileSection.svelte';
	import { loadProfile, saveProfile, type Profile } from './profile';
	import ReminderChannels, { type Deps } from './ReminderChannels.svelte';
	import { pushPermission } from './push-state';

	let deps = $state<Deps>();
	let profileDeps = $state<ProfileDeps>();
	let privacyDeps = $state<PrivacyDeps>();
	let toast = $state({ open: false, message: '', nonce: 0 });

	const notify = (message: string) => {
		toast = { open: true, message, nonce: toast.nonce + 1 };
	};

	onMount(async () => {
		const { data } = await supabase.auth.getSession();
		const uid = data.session?.user.id;
		if (!uid) return;
		const link = telegramLink(supabase, uid);
		const [settings, linked, profile] = await Promise.all([
			supabase.from('settings').select('remind_push').eq('learner_id', uid).maybeSingle(),
			link.isLinked(),
			loadProfile(supabase, uid)
		]);
		const save = (patch: Partial<Profile>) => saveProfile(supabase, uid, patch);
		profileDeps = {
			profile,
			email: data.session?.user.email ?? '',
			save,
			decode: avatarDataUrl,
			notify
		};
		privacyDeps = { hidden: profile.hidden, save, notify };
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

<header
	class="sticky top-0 z-10 grid -mx-(--gutter) grid-cols-[44px_1fr_44px] items-center bg-background px-[calc(var(--gutter)-8px)] pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2"
>
	<a
		href={resolve('/(app)/(tabs)/me')}
		aria-label={m.chy53s1_back()}
		class="grid size-11 place-items-center rounded-full text-graphite"
	>
		<svg class="size-[22px] -scale-x-100 fill-current" aria-hidden="true"
			><use href="#i-regular-caret-right" /></svg
		>
	</a>
	<h1 class="text-center font-display text-title">{m.screen_settings()}</h1>
</header>
<div class="pb-12">
	{#if profileDeps}<ProfileSection deps={profileDeps} />{/if}
	{#if deps}<ReminderChannels {deps} />{/if}
	{#if privacyDeps}<PrivacySection deps={privacyDeps} />{/if}
</div>
<Toast
	open={toast.open}
	message={toast.message}
	nonce={toast.nonce}
	placement="top"
	onclose={() => (toast.open = false)}
/>
