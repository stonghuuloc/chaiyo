import type { SupabaseClient } from '@supabase/supabase-js';

export function base64UrlToBytes(key: string): Uint8Array<ArrayBuffer> {
	const padded = key
		.replaceAll('-', '+')
		.replaceAll('_', '/')
		.padEnd(Math.ceil(key.length / 4) * 4, '=');
	return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const check = ({ error }: { error: { message: string } | null }) => {
	if (error) throw new Error(error.message);
};

const setFlag = async (client: SupabaseClient, uid: string, on: boolean) =>
	check(
		await client
			.from('settings')
			.upsert({ learner_id: uid, remind_push: on }, { onConflict: 'learner_id' })
	);

export async function enablePush(o: {
	registration: ServiceWorkerRegistration;
	client: SupabaseClient;
	uid: string;
	key: string;
	requestPermission: () => Promise<NotificationPermission>;
}): Promise<'unsupported' | 'denied' | 'on'> {
	if (!o.registration.pushManager || !o.key) return 'unsupported';
	if ((await o.requestPermission()) !== 'granted') return 'denied';
	const subscription = await o.registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: base64UrlToBytes(o.key)
	});
	const { endpoint, keys } = subscription.toJSON();
	check(
		await o.client
			.from('push_subscriptions')
			.upsert(
				{ learner_id: o.uid, endpoint, p256dh: keys?.p256dh, auth: keys?.auth },
				{ onConflict: 'learner_id,endpoint', ignoreDuplicates: true }
			)
	);
	await setFlag(o.client, o.uid, true);
	return 'on';
}

export async function disablePush(o: {
	registration: ServiceWorkerRegistration;
	client: SupabaseClient;
	uid: string;
}): Promise<void> {
	const subscription = await o.registration.pushManager.getSubscription();
	if (subscription) {
		await subscription.unsubscribe();
		check(
			await o.client
				.from('push_subscriptions')
				.delete()
				.eq('learner_id', o.uid)
				.eq('endpoint', subscription.endpoint)
		);
	}
	await setFlag(o.client, o.uid, false);
}
