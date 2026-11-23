import { createClient } from '@supabase/supabase-js';
import { handleTelegramUpdate } from '#lib/notify/telegram-bot.js';
import { supabaseTelegram } from '#lib/notify/telegram-store.js';
import { telegramSend } from '#lib/notify/telegram.js';

const client = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const token = Deno.env.get('TELEGRAM_BOT_TOKEN');

Deno.serve((req) =>
	handleTelegramUpdate(req, {
		secret: Deno.env.get('TELEGRAM_WEBHOOK_SECRET'),
		claim: supabaseTelegram(client).claim,
		reply: token ? telegramSend(token) : async () => {}
	})
);
