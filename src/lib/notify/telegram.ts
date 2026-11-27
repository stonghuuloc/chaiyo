import { remindUrl, type Channel } from './channel';
import { REMINDER_EMAIL } from './email';
import { REMINDER_PUSH } from './web-push';

const reminderTelegram = (open?: string) =>
	`${REMINDER_PUSH.body}\n${remindUrl(REMINDER_EMAIL.url, open)}`;

type TelegramDeps = {
	chatOf(learnerId: string): Promise<number | null>;
	fetch?: typeof globalThis.fetch;
	skipUnlinked?: boolean;
};

export function telegramSend(token: string, f: typeof globalThis.fetch = globalThis.fetch) {
	return async (chatId: number, text: string): Promise<void> => {
		let res: Response;
		try {
			res = await f(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ chat_id: chatId, text }),
				signal: AbortSignal.timeout(10_000)
			});
		} catch {
			throw new Error('telegram: network');
		}
		const j = await res.json().then(
			(x) => x,
			() => null
		);
		if (!res.ok || j?.ok !== true)
			throw new Error(`telegram: ${res.status}${j?.description ? ` ${j.description}` : ''}`);
	};
}

export function telegramChannel(o: TelegramDeps & { token: string }): Channel {
	const send = telegramSend(o.token, o.fetch);
	return {
		name: 'telegram',
		async send({ learnerId, open }) {
			const chat = await o.chatOf(learnerId);
			if (chat === null) {
				if (o.skipUnlinked) return 'skipped';
				throw new Error('telegram: not linked');
			}
			await send(chat, reminderTelegram(open));
		}
	};
}

export function telegramFromEnv(
	env: (k: string) => string | undefined,
	d: TelegramDeps
): Channel | null {
	const token = env('TELEGRAM_BOT_TOKEN');
	if (!token) return null;
	return telegramChannel({ token, ...d });
}
