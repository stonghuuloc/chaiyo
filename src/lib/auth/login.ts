export const CALLBACK = '/auth/callback';

export const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function resendLabel(sentAt: number, now: number) {
	const left = 60 - Math.floor((now - sentAt) / 1000);
	return left > 0
		? { text: `Gửi lại sau ${left}s`, disabled: true }
		: { text: 'Gửi lại link', disabled: false };
}

export function callbackOutcome(href: string): 'ok' | 'error' {
	const u = new URL(href);
	const p = new URLSearchParams(u.hash.slice(1));
	for (const [k, v] of u.searchParams) p.set(k, v);
	return p.has('error') || p.has('error_code') ? 'error' : 'ok';
}

export const landing = (row: { onboarded_at: string | null } | null) =>
	row?.onboarded_at ? ('/(app)/(tabs)/today' as const) : ('/(onboard)/welcome' as const);
