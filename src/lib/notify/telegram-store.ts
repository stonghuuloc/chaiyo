import type { SupabaseClient } from '@supabase/supabase-js';

const check = ({ error }: { error: { message: string } | null }) => {
	if (error) throw new Error(error.message);
};

export function supabaseTelegram(client: SupabaseClient) {
	return {
		async chatOf(id: string): Promise<number | null> {
			const { data, error } = await client
				.from('telegram_links')
				.select('chat_id')
				.eq('user_id', id)
				.maybeSingle();
			if (error) throw new Error(error.message);
			return data ? (data.chat_id as number) : null;
		},
		async claim(token: string, chatId: number): Promise<string | null> {
			const { data, error } = await client.rpc('claim_telegram_link', {
				p_token: token,
				p_chat_id: chatId
			});
			if (error) throw new Error(error.message);
			return (data as string | null) ?? null;
		}
	};
}

export function telegramLink(client: SupabaseClient, uid: string) {
	return {
		async issueToken(): Promise<string> {
			const { data, error } = await client.rpc('telegram_link_token');
			if (error) throw new Error(error.message);
			return data as string;
		},
		async isLinked(): Promise<boolean> {
			const { data, error } = await client
				.from('telegram_links')
				.select('chat_id')
				.eq('user_id', uid)
				.maybeSingle();
			if (error) throw new Error(error.message);
			return data !== null;
		},
		async unlink(): Promise<void> {
			check(
				await client
					.from('settings')
					.upsert({ learner_id: uid, remind_telegram: false }, { onConflict: 'learner_id' })
			);
			check(await client.from('telegram_links').delete().eq('user_id', uid));
		}
	};
}
