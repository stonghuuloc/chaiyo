export const CALLBACK = '/auth/callback';

export const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function resendLabel(sentAt: number, now: number) {
	const left = 60 - Math.floor((now - sentAt) / 1000);
	return left > 0
		? { text: `Gửi lại sau ${left}s`, disabled: true }
		: { text: 'Gửi lại link', disabled: false };
}

export const LAST_EMAIL = 'chaiyo.login.email';

export function callbackOutcome(href: string): 'ok' | 'error' | 'expired' {
	const u = new URL(href);
	const p = new URLSearchParams(u.hash.slice(1));
	for (const [k, v] of u.searchParams) p.set(k, v);
	if (p.get('error_code') === 'otp_expired') return 'expired';
	return p.has('error') || p.has('error_code') ? 'error' : 'ok';
}

export const daysLeft = (deleteAt: string, now: number) =>
	Math.ceil((Date.parse(deleteAt) - now) / 86_400_000);

type Row = { onboarded_at: string | null; delete_at: string | null } | null;

export const landing = (row: Row, now: number) => {
	if (row?.delete_at && Date.parse(row.delete_at) > now) return 'restore' as const;
	return row?.onboarded_at ? ('/(app)/(tabs)/today' as const) : ('/(onboard)/welcome' as const);
};
