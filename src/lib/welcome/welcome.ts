export const TIMES = [
	['07:00', 'Sáng'],
	['12:30', 'Trưa'],
	['21:00', 'Tối']
] as const;

export type Welcome = {
	step: number;
	name: string;
	photo: string | null;
	email: string;
	time: string;
	push: boolean;
	pushDenied: boolean;
	emailOn: boolean;
	telegram: boolean;
};

type Meta = Record<string, string | undefined>;

export function fromUser(
	user?: { email?: string | null; user_metadata?: Meta | null } | null
): Welcome {
	const meta = user?.user_metadata ?? {};
	return {
		step: 0,
		name: (meta.full_name || meta.name || '').trim().slice(0, 30),
		photo: meta.avatar_url || meta.picture || null,
		email: user?.email ?? '',
		time: '21:00',
		push: false,
		pushDenied: false,
		emailOn: true,
		telegram: false
	};
}

export const initials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w[0])
		.slice(-2)
		.join('')
		.toUpperCase() || '?';

export const canNext = (s: Pick<Welcome, 'step' | 'name'>) => s.step !== 0 || s.name.trim() !== '';

export const pickPreset = (s: Welcome, t: string): Welcome => ({ ...s, time: t });

export const pickCustom = (s: Welcome, t: string): Welcome => (t === '' ? s : { ...s, time: t });

export const pressed = (s: Pick<Welcome, 'time'>) =>
	TIMES.filter(([t]) => t === s.time).map(([t]) => t);

export const noChannel = (s: Pick<Welcome, 'push' | 'emailOn' | 'telegram'>) =>
	!s.push && !s.emailOn && !s.telegram;

export const pushBlocked = (env: { Notification?: { permission: string } }) =>
	env.Notification?.permission === 'denied';

export const askPush = async (env: {
	Notification?: { requestPermission: () => Promise<string> };
}) => {
	if (!env.Notification) return false;
	return env.Notification.requestPermission().then(
		(p) => p === 'granted',
		() => false
	);
};
