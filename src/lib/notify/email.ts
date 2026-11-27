import { remindUrl, type Channel } from './channel';
import { REMINDER_PUSH } from './web-push';

const RESEND_URL = 'https://api.resend.com/emails';

export const REMINDER_EMAIL = {
	subject: 'Chaiyo! Hôm nay bạn chưa học',
	body: REMINDER_PUSH.body,
	url: 'https://chaiyo.vercel.app/today'
};

type EmailDeps = {
	addressOf(learnerId: string): Promise<string | null>;
	fetch?: typeof globalThis.fetch;
};

export function emailChannel(o: EmailDeps & { apiKey: string; from: string }): Channel {
	const { subject, body } = REMINDER_EMAIL;
	return {
		name: 'email',
		async send({ learnerId, open }) {
			const url = remindUrl(REMINDER_EMAIL.url, open);
			const text = `${body}\n\n${url}`;
			const html = `<p>${body}</p><p><a href="${url}">Học ngay</a></p>`;
			const address = await o.addressOf(learnerId);
			if (!address) throw new Error('email: no address');
			const res = await (o.fetch ?? fetch)(RESEND_URL, {
				method: 'POST',
				headers: { authorization: `Bearer ${o.apiKey}`, 'content-type': 'application/json' },
				body: JSON.stringify({ from: o.from, to: [address], subject, text, html }),
				signal: AbortSignal.timeout(10_000)
			});
			if (!res.ok) {
				const message = await res.json().then(
					(j) => j?.message ?? '',
					() => ''
				);
				throw new Error(`email: ${res.status}${message ? ` ${message}` : ''}`);
			}
		}
	};
}

export function emailFromEnv(env: (k: string) => string | undefined, d: EmailDeps): Channel | null {
	const apiKey = env('RESEND_API_KEY');
	const from = env('RESEND_FROM');
	if (!apiKey || !from) return null;
	return emailChannel({ apiKey, from, ...d });
}
