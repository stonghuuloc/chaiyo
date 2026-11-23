export type PushPermission = NotificationPermission | 'unsupported';

export function pushPermission(w: {
	Notification?: { permission: NotificationPermission };
	PushManager?: unknown;
}): PushPermission {
	if (!w.Notification || !w.PushManager) return 'unsupported';
	return w.Notification.permission;
}

export const pushBlocked = (p: PushPermission): boolean => p === 'denied' || p === 'unsupported';
