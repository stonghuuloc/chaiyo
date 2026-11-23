import { REMINDER_PUSH } from '../lib/notify/web-push';

export function notificationFrom(text: string | null): {
	title: string;
	options: NotificationOptions;
} {
	let payload = REMINDER_PUSH;
	try {
		const parsed = text === null ? null : JSON.parse(text);
		if (parsed && typeof parsed === 'object') payload = { ...REMINDER_PUSH, ...parsed };
	} catch {
		payload = REMINDER_PUSH;
	}
	return {
		title: payload.title,
		options: { body: payload.body, icon: '/brand/icon-192.png', data: { url: payload.url } }
	};
}

export function clickTarget(clients: readonly WindowClient[]): WindowClient | null {
	return clients[0] ?? null;
}
