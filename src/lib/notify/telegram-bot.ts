const BOT_COPY = {
	linked: 'Đã kết nối Chaiyo. Lời nhắc học sẽ đến ở đây.',
	expired: 'Liên kết đã hết hạn hoặc đã dùng. Vào Cài đặt trong Chaiyo và bấm Kết nối Telegram lại.'
};

const START = /^\/start ([0-9a-f]{32})$/;

const sameSecret = (a: string, b: string) => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
};

const status = (code: number) => new Response(null, { status: code });

export async function handleTelegramUpdate(
	req: Request,
	o: {
		secret: string | undefined;
		claim(token: string, chatId: number): Promise<string | null>;
		reply(chatId: number, text: string): Promise<void>;
	}
): Promise<Response> {
	if (req.method !== 'POST') return status(405);
	const header = req.headers.get('x-telegram-bot-api-secret-token');
	if (!o.secret || header === null || !sameSecret(header, o.secret)) return status(401);
	const update = await req.json().then(
		(x) => x,
		() => null
	);
	const message = update?.message;
	const token = message?.chat?.type === 'private' ? START.exec(message.text ?? '')?.[1] : undefined;
	if (!token) return status(200);
	const chatId: number = message.chat.id;
	let user: string | null;
	try {
		user = await o.claim(token, chatId);
	} catch {
		return status(500);
	}
	await o.reply(chatId, user ? BOT_COPY.linked : BOT_COPY.expired).catch(() => {});
	return status(200);
}
